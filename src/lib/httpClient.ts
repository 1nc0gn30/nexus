import { buildUrlWithParams, KeyValueItem } from './curlParser';
import { getOfflineMockPayload } from './samplePreviews';

export type TransportMode = 'direct' | 'proxy' | 'mock';

export interface ExecuteRequestInput {
  method: string;
  baseUrl: string;
  queryParams: KeyValueItem[];
  headers: KeyValueItem[];
  body: string;
  transport: TransportMode;
  timeoutMs?: number;
}

export interface ExecutionResult {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  sizeBytes: number;
  url: string;
  transportUsed: TransportMode;
  responseHeaders: Record<string, string>;
  data: unknown;
  rawText: string;
  error?: string;
}

function headersToObject(items: KeyValueItem[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const h of items) {
    if (h.enabled && h.key.trim()) {
      out[h.key.trim()] = h.value;
    }
  }
  return out;
}

function byteLength(text: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text).length;
  }
  return Buffer.byteLength(text, 'utf8');
}

function parseBodyText(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function looksLikeSpaFallbackHtml(text: string, contentType: string): boolean {
  return (
    contentType.includes('text/html') &&
    (text.trimStart().toLowerCase().startsWith('<!doctype html') || text.includes('<div id="root">'))
  );
}

export async function executeHttpRequest(input: ExecuteRequestInput): Promise<ExecutionResult> {
  const method = (input.method || 'GET').toUpperCase();
  const resolvedUrl = buildUrlWithParams(input.baseUrl, input.queryParams);
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (!resolvedUrl) {
    return {
      ok: false,
      status: 0,
      statusText: 'Invalid URL',
      durationMs: 0,
      sizeBytes: 0,
      url: '',
      transportUsed: input.transport,
      responseHeaders: {},
      data: null,
      rawText: '',
      error: 'Enter a valid HTTP/HTTPS endpoint URL before sending.',
    };
  }

  if (input.transport === 'mock') {
    const payload = getOfflineMockPayload(resolvedUrl);
    const rawText = JSON.stringify(payload, null, 2);
    const elapsed = Math.max(1, Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start));
    return {
      ok: true,
      status: 200,
      statusText: 'OK (Offline Preview)',
      durationMs: elapsed,
      sizeBytes: byteLength(rawText),
      url: resolvedUrl,
      transportUsed: 'mock',
      responseHeaders: {
        'content-type': 'application/json; charset=utf-8',
        'x-nexus-mode': 'offline-mock',
      },
      data: payload,
      rawText,
    };
  }

  const headerMap = headersToObject(input.headers);
  const canSendBody = !['GET', 'HEAD'].includes(method) && input.body.trim().length > 0;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 15000);

  const runFetch = async (mode: 'direct' | 'proxy'): Promise<ExecutionResult> => {
    const targetUrl =
      mode === 'proxy' ? `/api/proxy?url=${encodeURIComponent(resolvedUrl)}` : resolvedUrl;

    const init: RequestInit = {
      method,
      headers: headerMap,
      signal: controller.signal,
    };

    if (canSendBody) {
      init.body = input.body;
    }

    const res = await fetch(targetUrl, init);
    const rawText = await res.text();
    const contentType = res.headers.get('content-type') || '';

    if (mode === 'proxy' && looksLikeSpaFallbackHtml(rawText, contentType)) {
      throw new Error(
        'The /api/proxy route is unavailable in static preview mode. Switch transport to Direct (CORS) or Offline Mock, or deploy with Netlify Functions.',
      );
    }

    const responseHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      responseHeaders[k] = v;
    });

    const elapsed = Math.max(1, Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start));
    const parsedData = parseBodyText(rawText);

    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
      durationMs: elapsed,
      sizeBytes: byteLength(rawText),
      url: resolvedUrl,
      transportUsed: mode,
      responseHeaders,
      data: parsedData,
      rawText,
      error: res.ok ? undefined : `Upstream returned HTTP ${res.status} ${res.statusText || ''}`.trim(),
    };
  };

  try {
    return await runFetch(input.transport);
  } catch (err: unknown) {
    const elapsed = Math.max(1, Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - start));
    const message =
      err instanceof Error
        ? err.name === 'AbortError'
          ? 'Request timed out after 15s.'
          : err.message
        : 'Request failed.';

    const corsHint =
      input.transport === 'direct' && /failed to fetch|networkerror|load failed/i.test(message)
        ? ' Browser CORS or network restriction blocked direct access. Switch transport to Proxy (on Netlify/dev server) or Offline Mock.'
        : '';

    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      durationMs: elapsed,
      sizeBytes: 0,
      url: resolvedUrl,
      transportUsed: input.transport,
      responseHeaders: {},
      data: null,
      rawText: '',
      error: `${message}${corsHint}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}
