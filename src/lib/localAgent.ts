import { PublicAPI } from '../data/registry';
import { extractQueryParams, KeyValueItem, parseCurlCommand } from './curlParser';

export interface LocalAgentPlan {
  method: string;
  baseUrl: string;
  queryParams: KeyValueItem[];
  headers: KeyValueItem[];
  body: string;
  explanation: string;
  nextSteps: string[];
  shouldAutoSend: boolean;
}

export interface CurrentIdeState {
  method: string;
  baseUrl: string;
  queryParams: KeyValueItem[];
  headers: KeyValueItem[];
  body: string;
}

/**
 * Deterministic, zero-key local API request planner so Nexus Agent works immediately
 * in the browser without requiring Gemini or OpenAI credentials.
 */
export function planLocalRequest(
  prompt: string,
  current: CurrentIdeState,
  catalog: PublicAPI[],
): LocalAgentPlan {
  const clean = prompt.trim();
  const lower = clean.toLowerCase();

  // 1. Direct cURL paste detection
  if (lower.startsWith('curl ') || lower.startsWith('curl\t')) {
    const parsed = parseCurlCommand(clean);
    return {
      method: parsed.method,
      baseUrl: parsed.baseUrl,
      queryParams: parsed.queryParams,
      headers: parsed.headers,
      body: parsed.body,
      explanation: `Imported ${parsed.method} ${parsed.baseUrl} from cURL with ${parsed.headers.length} header(s) and ${parsed.queryParams.length} query param(s).`,
      nextSteps: ['Inspect extracted headers and query parameters', 'Click Send to execute the imported request'],
      shouldAutoSend: false,
    };
  }

  // 2. Explicit URL in prompt
  const urlMatch = clean.match(/https?:\/\/[^\s'"]+/i);
  const methodMatch = clean.match(/\b(GET|POST|PUT|PATCH|DELETE|HEAD)\b/i);

  if (urlMatch) {
    const { baseUrl, params } = extractQueryParams(urlMatch[0]);
    const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';
    const headers = [...current.headers];
    if (!headers.some((h) => h.key.toLowerCase() === 'accept')) {
      headers.push({ id: `ag-h-${Date.now()}`, key: 'Accept', value: 'application/json', enabled: true });
    }
    return {
      method,
      baseUrl,
      queryParams: params,
      headers,
      body: method === 'GET' ? current.body : current.body || '{\n  "key": "value"\n}',
      explanation: `Configured ${method} request targeting ${baseUrl}.`,
      nextSteps: ['Review headers and payload', 'Run live or export cURL/fetch/Python'],
      shouldAutoSend: method === 'GET',
    };
  }

  // 3. Create-post / POST JSON template intent
  if (/post|create|submit|payload/.test(lower) && !/weather|github|cat|dog|joke/.test(lower)) {
    const targetUrl = current.baseUrl.includes('jsonplaceholder.typicode.com')
      ? 'https://jsonplaceholder.typicode.com/posts'
      : current.baseUrl || 'https://jsonplaceholder.typicode.com/posts';
    const headers: KeyValueItem[] = [
      { id: 'ag-ct', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: 'ag-ac', key: 'Accept', value: 'application/json', enabled: true },
    ];
    return {
      method: 'POST',
      baseUrl: targetUrl,
      queryParams: [],
      headers,
      body: JSON.stringify(
        {
          title: 'Created from Nexus IDE',
          body: 'Structured JSON test payload',
          userId: 1,
        },
        null,
        2,
      ),
      explanation: `Switched to POST ${targetUrl} with JSON headers and a valid sample payload.`,
      nextSteps: ['Customize payload keys in the Body tab', 'Click Send to verify the 201 Created response'],
      shouldAutoSend: false,
    };
  }

  // 4. Add Bearer auth / harden headers intent
  if (/auth|bearer|token|harden|header/.test(lower)) {
    const nextHeaders = [...current.headers];
    if (!nextHeaders.some((h) => h.key.toLowerCase() === 'authorization')) {
      nextHeaders.push({
        id: `ag-auth-${Date.now()}`,
        key: 'Authorization',
        value: 'Bearer YOUR_API_TOKEN',
        enabled: true,
      });
    }
    if (!nextHeaders.some((h) => h.key.toLowerCase() === 'accept')) {
      nextHeaders.push({
        id: `ag-accept-${Date.now()}`,
        key: 'Accept',
        value: 'application/json',
        enabled: true,
      });
    }
    return {
      method: current.method,
      baseUrl: current.baseUrl,
      queryParams: current.queryParams,
      headers: nextHeaders,
      body: current.body,
      explanation: 'Added standard Accept and Bearer Authorization headers. Replace YOUR_API_TOKEN before sending.',
      nextSteps: ['Replace YOUR_API_TOKEN in the Headers tab', 'Export as cURL or Python requests'],
      shouldAutoSend: false,
    };
  }

  // 5. GitHub user lookup intent
  const ghMatch = clean.match(/github(?:\s+user)?\s+([a-z0-9-]+)/i);
  if (ghMatch && ghMatch[1] && !['api', 'user', 'users', 'profile'].includes(ghMatch[1].toLowerCase())) {
    const handle = ghMatch[1];
    return {
      method: 'GET',
      baseUrl: `https://api.github.com/users/${handle}`,
      queryParams: [],
      headers: [{ id: 'ag-gh', key: 'Accept', value: 'application/vnd.github+json', enabled: true }],
      body: '',
      explanation: `Configured public GitHub profile lookup for @${handle}.`,
      nextSteps: ['Inspect public_repos and followers in JSON Tree', 'Chain into /repos using Workflow Chains'],
      shouldAutoSend: true,
    };
  }

  // 6. Match against the 224-entry public API catalog
  const stopWords = new Set(['get', 'fetch', 'test', 'run', 'call', 'api', 'for', 'the', 'a', 'an', 'me', 'show', 'open']);
  const keywords = lower
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  let bestMatch: PublicAPI | null = null;
  let bestScore = 0;

  for (const entry of catalog) {
    const haystack = `${entry.API} ${entry.Description} ${entry.Category} ${entry.Link}`.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (entry.API.toLowerCase().includes(kw)) score += 3;
      else if (entry.Category.toLowerCase().includes(kw)) score += 2;
      else if (haystack.includes(kw)) score += 1;
    }
    if (entry.Cors.toLowerCase() === 'yes') score += 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore >= 2) {
    const { baseUrl, params } = extractQueryParams(bestMatch.Link);
    return {
      method: 'GET',
      baseUrl,
      queryParams: params,
      headers: [{ id: `ag-cat-${Date.now()}`, key: 'Accept', value: 'application/json', enabled: true }],
      body: '',
      explanation: `Matched catalog API "${bestMatch.API}" (${bestMatch.Category}): ${bestMatch.Description}.`,
      nextSteps: ['Run live in Direct CORS mode or Offline Mock preview', 'Copy generated cURL, JS fetch, or Python code'],
      shouldAutoSend: bestMatch.Cors.toLowerCase() === 'yes',
    };
  }

  return {
    method: 'GET',
    baseUrl: 'https://httpbin.org/get',
    queryParams: [{ id: 'ag-hb', key: 'source', value: 'nexus-ide', enabled: true }],
    headers: [{ id: 'ag-hb-h', key: 'Accept', value: 'application/json', enabled: true }],
    body: '',
    explanation: 'Loaded Httpbin echo endpoint so you can test headers, query params, and timing safely. Paste any URL or cURL command to target another service.',
    nextSteps: ['Paste a cURL command or public API URL', 'Or browse 224 endpoints in the API Catalog tab'],
    shouldAutoSend: false,
  };
}
