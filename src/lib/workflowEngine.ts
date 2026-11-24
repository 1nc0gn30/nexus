import { KeyValueItem } from './curlParser';

export interface WorkflowStep {
  id: string;
  alias: string;
  name: string;
  method: string;
  url: string;
  headers: KeyValueItem[];
  body: string;
  extractHint?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
}

export interface StepExecutionResult {
  stepId: string;
  alias: string;
  status: 'pending' | 'running' | 'success' | 'error';
  resolvedUrl: string;
  statusCode: number | null;
  durationMs: number | null;
  sizeBytes: number | null;
  data: unknown;
  error?: string;
  missingVars: string[];
  modeUsed?: 'direct' | 'proxy' | 'mock';
}

export interface WorkflowContext {
  steps: Record<string, { status: number | null; data: unknown }>;
  env: Record<string, string>;
}

/**
 * Resolves dotted + indexed paths such as:
 *   "data.id"
 *   "data.results[0].name.first"
 *   "data[0].title"
 *   "status"
 */
export function resolvePath(root: unknown, rawPath: string): unknown {
  if (root === null || root === undefined || !rawPath.trim()) {
    return undefined;
  }

  // Convert bracket notation [0] or ['key'] or ["key"] into path segments
  const segments: string[] = [];
  const regex = /([^.[\]]+)|\[(?:'([^']*)'|"([^"]*)"|(\d+))\]/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawPath.trim())) !== null) {
    const seg = match[1] ?? match[2] ?? match[3] ?? match[4];
    if (seg !== undefined && seg !== '') {
      segments.push(seg);
    }
  }

  let current: unknown = root;
  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

/**
 * Interpolates {{step1.data.field}} and {{env.VAR}} tokens in a string.
 */
export function interpolateTemplate(
  template: string,
  context: WorkflowContext,
): { value: string; missing: string[] } {
  const missing: string[] = [];
  const value = template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (fullMatch, expr: string) => {
    const cleanExpr = expr.trim();
    const firstDotOrBracket = cleanExpr.search(/[.[]/);
    const rootKey = firstDotOrBracket === -1 ? cleanExpr : cleanExpr.slice(0, firstDotOrBracket);
    const remainder =
      firstDotOrBracket === -1
        ? ''
        : cleanExpr[firstDotOrBracket] === '.'
          ? cleanExpr.slice(firstDotOrBracket + 1)
          : cleanExpr.slice(firstDotOrBracket);

    let resolved: unknown;
    if (rootKey === 'env') {
      resolved = remainder ? resolvePath(context.env, remainder) : context.env;
    } else if (rootKey in context.steps) {
      const stepObj = context.steps[rootKey];
      resolved = remainder ? resolvePath(stepObj, remainder) : stepObj;
    }

    if (resolved === undefined || resolved === null) {
      missing.push(cleanExpr);
      return fullMatch;
    }

    if (typeof resolved === 'object') {
      return JSON.stringify(resolved);
    }

    return String(resolved);
  });

  return { value, missing };
}

/**
 * Extracts a quick list of copyable {{alias.data.field}} variable paths from a JSON payload.
 */
export function extractSuggestedVariables(alias: string, data: unknown, maxItems = 8): string[] {
  const out: string[] = [];

  function walk(node: unknown, prefix: string, depth: number) {
    if (out.length >= maxItems || depth > 3) return;
    if (node === null || node === undefined) return;

    if (Array.isArray(node)) {
      if (node.length > 0) {
        const first = node[0];
        if (first !== null && typeof first === 'object') {
          walk(first, `${prefix}[0]`, depth + 1);
        } else {
          out.push(`{{${prefix}[0]}}`);
        }
      }
      return;
    }

    if (typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (out.length >= maxItems) break;
        const nextPath = `${prefix}.${k}`;
        if (v === null || typeof v !== 'object') {
          out.push(`{{${nextPath}}}`);
        } else {
          walk(v, nextPath, depth + 1);
        }
      }
    }
  }

  walk(data, `${alias}.data`, 0);
  return out;
}

export const DEFAULT_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'wf-jsonplaceholder-chain',
    name: 'User -> Posts -> Comments Chain',
    description: 'Fetches a user profile, chains userId into posts, then fetches comments for the first post.',
    steps: [
      {
        id: 'wf1-s1',
        alias: 'step1',
        name: 'Fetch User Profile',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users/1',
        headers: [{ id: 'w1h1', key: 'Accept', value: 'application/json', enabled: true }],
        body: '',
        extractHint: '{{step1.data.id}}, {{step1.data.username}}',
      },
      {
        id: 'wf1-s2',
        alias: 'step2',
        name: 'Fetch User Posts',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts?userId={{step1.data.id}}',
        headers: [{ id: 'w1h2', key: 'Accept', value: 'application/json', enabled: true }],
        body: '',
        extractHint: '{{step2.data[0].id}}, {{step2.data[0].title}}',
      },
      {
        id: 'wf1-s3',
        alias: 'step3',
        name: 'Fetch Top Post Comments',
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/comments?postId={{step2.data[0].id}}',
        headers: [{ id: 'w1h3', key: 'Accept', value: 'application/json', enabled: true }],
        body: '',
        extractHint: '{{step3.data[0].email}}',
      },
    ],
  },
  {
    id: 'wf-github-audit',
    name: 'GitHub Maintainer -> Repo Audit',
    description: 'Resolves a public GitHub profile and chains the login handle into their latest repositories.',
    steps: [
      {
        id: 'wf2-s1',
        alias: 'step1',
        name: 'Lookup GitHub Profile',
        method: 'GET',
        url: 'https://api.github.com/users/octocat',
        headers: [{ id: 'w2h1', key: 'Accept', value: 'application/vnd.github+json', enabled: true }],
        body: '',
        extractHint: '{{step1.data.login}}, {{step1.data.public_repos}}',
      },
      {
        id: 'wf2-s2',
        alias: 'step2',
        name: 'List Recent Repositories',
        method: 'GET',
        url: 'https://api.github.com/users/{{step1.data.login}}/repos?sort=updated&per_page=3',
        headers: [{ id: 'w2h2', key: 'Accept', value: 'application/vnd.github+json', enabled: true }],
        body: '',
        extractHint: '{{step2.data[0].full_name}}',
      },
    ],
  },
  {
    id: 'wf-identity-enrichment',
    name: 'Random Identity -> Age & Gender Enrichment',
    description: 'Generates a random profile, extracts the first name, and enriches it via Agify + Genderize.',
    steps: [
      {
        id: 'wf3-s1',
        alias: 'step1',
        name: 'Generate Random User',
        method: 'GET',
        url: 'https://randomuser.me/api/',
        headers: [{ id: 'w3h1', key: 'Accept', value: 'application/json', enabled: true }],
        body: '',
        extractHint: '{{step1.data.results[0].name.first}}',
      },
      {
        id: 'wf3-s2',
        alias: 'step2',
        name: 'Estimate Age via Agify',
        method: 'GET',
        url: 'https://api.agify.io/?name={{step1.data.results[0].name.first}}',
        headers: [{ id: 'w3h2', key: 'Accept', value: 'application/json', enabled: true }],
        body: '',
        extractHint: '{{step2.data.age}}',
      },
      {
        id: 'wf3-s3',
        alias: 'step3',
        name: 'Predict Gender via Genderize',
        method: 'GET',
        url: 'https://api.genderize.io/?name={{step1.data.results[0].name.first}}',
        headers: [{ id: 'w3h3', key: 'Accept', value: 'application/json', enabled: true }],
        body: '',
        extractHint: '{{step3.data.gender}}, {{step3.data.probability}}',
      },
    ],
  },
];
