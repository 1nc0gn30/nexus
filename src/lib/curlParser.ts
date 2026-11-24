export interface KeyValueItem {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ParsedCurlRequest {
  method: string;
  url: string;
  baseUrl: string;
  queryParams: KeyValueItem[];
  headers: KeyValueItem[];
  body: string;
  warnings: string[];
}

function makeId(prefix: string, idx: number): string {
  return `${prefix}-${idx}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Tokenizes a shell command string (supporting single quotes, double quotes,
 * ANSI-C $'...' quotes, backslash escapes, and multiline `\` continuations).
 */
export function tokenizeShell(input: string): string[] {
  // Normalize line continuations (backslash followed by newline)
  const normalized = input.replace(/\\\r?\n/g, ' ').trim();
  const tokens: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let hasToken = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    if (inSingle) {
      if (ch === "'") {
        inSingle = false;
      } else {
        current += ch;
      }
      continue;
    }

    if (inDouble) {
      if (ch === '"') {
        inDouble = false;
      } else if (ch === '\\' && i + 1 < normalized.length) {
        const next = normalized[i + 1];
        if (next === '"' || next === '\\' || next === '$' || next === '`') {
          current += next;
          i++;
        } else if (next === 'n') {
          current += '\n';
          i++;
        } else {
          current += ch;
        }
      } else {
        current += ch;
      }
      continue;
    }

    // Outside quotes
    if (/\s/.test(ch)) {
      if (hasToken) {
        tokens.push(current);
        current = '';
        hasToken = false;
      }
      continue;
    }

    // ANSI-C quoting $'...'
    if (ch === '$' && normalized[i + 1] === "'") {
      hasToken = true;
      i += 2;
      while (i < normalized.length && normalized[i] !== "'") {
        if (normalized[i] === '\\' && i + 1 < normalized.length) {
          const esc = normalized[i + 1];
          if (esc === 'n') current += '\n';
          else if (esc === 't') current += '\t';
          else if (esc === 'r') current += '\r';
          else current += esc;
          i += 2;
        } else {
          current += normalized[i];
          i++;
        }
      }
      continue;
    }

    if (ch === "'") {
      inSingle = true;
      hasToken = true;
      continue;
    }

    if (ch === '"') {
      inDouble = true;
      hasToken = true;
      continue;
    }

    if (ch === '\\' && i + 1 < normalized.length) {
      current += normalized[i + 1];
      hasToken = true;
      i++;
      continue;
    }

    current += ch;
    hasToken = true;
  }

  if (hasToken) {
    tokens.push(current);
  }

  return tokens;
}

export function extractQueryParams(rawUrl: string): {
  baseUrl: string;
  params: KeyValueItem[];
} {
  if (!rawUrl.trim()) {
    return { baseUrl: '', params: [] };
  }

  try {
    const parsed = new URL(rawUrl);
    const params: KeyValueItem[] = [];
    let idx = 0;
    parsed.searchParams.forEach((value, key) => {
      params.push({
        id: makeId('qp', idx++),
        key,
        value,
        enabled: true,
      });
    });
    const baseUrl = `${parsed.origin}${parsed.pathname}`;
    return { baseUrl, params };
  } catch {
    // Handle URLs containing template placeholders like {{step1.data.id}}
    const qIndex = rawUrl.indexOf('?');
    if (qIndex === -1) {
      return { baseUrl: rawUrl, params: [] };
    }
    const baseUrl = rawUrl.slice(0, qIndex);
    const queryStr = rawUrl.slice(qIndex + 1);
    const params: KeyValueItem[] = [];
    queryStr.split('&').forEach((pair, idx) => {
      if (!pair) return;
      const eq = pair.indexOf('=');
      const rawKey = eq === -1 ? pair : pair.slice(0, eq);
      const rawVal = eq === -1 ? '' : pair.slice(eq + 1);
      const safeDecode = (s: string) => {
        try {
          return decodeURIComponent(s.replace(/\+/g, ' '));
        } catch {
          return s;
        }
      };
      params.push({
        id: makeId('qp', idx),
        key: safeDecode(rawKey),
        value: safeDecode(rawVal),
        enabled: true,
      });
    });
    return { baseUrl, params };
  }
}

export function buildUrlWithParams(baseUrl: string, params: KeyValueItem[]): string {
  const cleanBase = baseUrl.trim();
  if (!cleanBase) return '';

  const active = params.filter((p) => p.enabled && p.key.trim() !== '');
  if (active.length === 0) return cleanBase;

  const query = active
    .map((p) => {
      const k = encodeURIComponent(p.key.trim());
      // Preserve {{template}} variables unencoded so workflow interpolation reads cleanly
      const v = p.value.includes('{{')
        ? p.value.replace(/[^a-zA-Z0-9\-_.~{}[\]]/g, (m) => encodeURIComponent(m))
        : encodeURIComponent(p.value);
      return `${k}=${v}`;
    })
    .join('&');

  return cleanBase.includes('?') ? `${cleanBase}&${query}` : `${cleanBase}?${query}`;
}

function encodeBase64(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(str)));
  }
  return Buffer.from(str, 'utf8').toString('base64');
}

const VALID_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

export function parseCurlCommand(input: string): ParsedCurlRequest {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Paste a cURL command to import.');
  }

  const tokens = tokenizeShell(trimmed);
  if (tokens.length === 0) {
    throw new Error('Could not parse cURL command.');
  }

  let idx = 0;
  if (tokens[0].toLowerCase() === 'curl') {
    idx = 1;
  }

  let method = '';
  let url = '';
  let forceGet = false;
  const headers: KeyValueItem[] = [];
  const dataParts: string[] = [];
  const warnings: string[] = [];

  for (; idx < tokens.length; idx++) {
    const token = tokens[idx];

    if (token === '-X' || token === '--request') {
      const next = tokens[++idx];
      if (next) {
        const upper = next.toUpperCase();
        method = VALID_METHODS.has(upper) ? upper : upper;
      }
      continue;
    }

    if (token.startsWith('-X') && token.length > 2) {
      method = token.slice(2).toUpperCase();
      continue;
    }

    if (token === '-H' || token === '--header') {
      const headerStr = tokens[++idx];
      if (headerStr) {
        const colonIdx = headerStr.indexOf(':');
        if (colonIdx > 0) {
          headers.push({
            id: makeId('hdr', headers.length),
            key: headerStr.slice(0, colonIdx).trim(),
            value: headerStr.slice(colonIdx + 1).trim(),
            enabled: true,
          });
        }
      }
      continue;
    }

    if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--data-ascii' ||
      token === '--data-urlencode'
    ) {
      const dataVal = tokens[++idx];
      if (dataVal !== undefined) {
        dataParts.push(dataVal);
      }
      continue;
    }

    if (token === '-u' || token === '--user') {
      const creds = tokens[++idx];
      if (creds) {
        headers.push({
          id: makeId('hdr', headers.length),
          key: 'Authorization',
          value: `Basic ${encodeBase64(creds)}`,
          enabled: true,
        });
      }
      continue;
    }

    if (token === '-A' || token === '--user-agent') {
      const ua = tokens[++idx];
      if (ua) {
        headers.push({
          id: makeId('hdr', headers.length),
          key: 'User-Agent',
          value: ua,
          enabled: true,
        });
      }
      continue;
    }

    if (token === '-e' || token === '--referer') {
      const ref = tokens[++idx];
      if (ref) {
        headers.push({
          id: makeId('hdr', headers.length),
          key: 'Referer',
          value: ref,
          enabled: true,
        });
      }
      continue;
    }

    if (token === '-G' || token === '--get') {
      forceGet = true;
      continue;
    }

    if (token === '--url') {
      const next = tokens[++idx];
      if (next) url = next;
      continue;
    }

    if (token === '-I' || token === '--head') {
      method = 'HEAD';
      continue;
    }

    if (token === '-b' || token === '--cookie') {
      const cookie = tokens[++idx];
      if (cookie) {
        headers.push({
          id: makeId('hdr', headers.length),
          key: 'Cookie',
          value: cookie,
          enabled: true,
        });
      }
      continue;
    }

    // Flags that take a value we ignore cleanly
    if (
      token === '-o' ||
      token === '--output' ||
      token === '-m' ||
      token === '--max-time' ||
      token === '--connect-timeout' ||
      token === '-x' ||
      token === '--proxy'
    ) {
      idx++;
      continue;
    }

    // Boolean flags to skip silently
    if (token.startsWith('-')) {
      continue;
    }

    if (!url) {
      url = token;
    }
  }

  if (!url) {
    throw new Error('No URL found in cURL command.');
  }

  if (!/^https?:\/\//i.test(url) && !url.startsWith('{{')) {
    url = `https://${url}`;
  }

  let body = dataParts.join('&');
  const { baseUrl, params: queryParams } = extractQueryParams(url);

  if (forceGet && body) {
    body.split('&').forEach((pair) => {
      const eq = pair.indexOf('=');
      if (eq > -1) {
        queryParams.push({
          id: makeId('qp', queryParams.length),
          key: decodeURIComponent(pair.slice(0, eq)),
          value: decodeURIComponent(pair.slice(eq + 1)),
          enabled: true,
        });
      }
    });
    body = '';
  }

  if (!method) {
    method = body && !forceGet ? 'POST' : 'GET';
  }

  // Pretty-print JSON body if valid
  if (body.trim()) {
    try {
      const parsedJson = JSON.parse(body);
      body = JSON.stringify(parsedJson, null, 2);
    } catch {
      // Keep raw string body
    }
  }

  if (headers.length === 0 && body.trim().startsWith('{')) {
    headers.push({
      id: makeId('hdr', 0),
      key: 'Content-Type',
      value: 'application/json',
      enabled: true,
    });
    warnings.push('Inferred Content-Type: application/json from JSON payload.');
  }

  const finalUrl = buildUrlWithParams(baseUrl, queryParams);

  return {
    method,
    url: finalUrl,
    baseUrl,
    queryParams,
    headers,
    body,
    warnings,
  };
}
