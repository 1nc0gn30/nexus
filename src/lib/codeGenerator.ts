import { buildUrlWithParams, KeyValueItem } from './curlParser';

export type CodeLanguage = 'curl' | 'fetch' | 'python' | 'httpie';

export interface CodeGenRequest {
  method: string;
  baseUrl: string;
  queryParams: KeyValueItem[];
  headers: KeyValueItem[];
  body: string;
}

function escapeSingleQuote(str: string): string {
  return str.replace(/'/g, "'\\''");
}

function escapeJsString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapePythonString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function hasBody(method: string, body: string): boolean {
  const upper = method.toUpperCase();
  return !['GET', 'HEAD'].includes(upper) && body.trim().length > 0;
}

function parseJsonSafe(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

export function generateCodeSnippet(req: CodeGenRequest, lang: CodeLanguage): string {
  const method = (req.method || 'GET').toUpperCase();
  const fullUrl = buildUrlWithParams(req.baseUrl, req.queryParams) || 'https://api.example.com/endpoint';
  const activeHeaders = req.headers.filter((h) => h.enabled && h.key.trim() !== '');
  const includeBody = hasBody(method, req.body);

  switch (lang) {
    case 'curl': {
      const lines: string[] = [`curl -X ${method} '${escapeSingleQuote(fullUrl)}'`];
      for (const h of activeHeaders) {
        lines.push(`  -H '${escapeSingleQuote(`${h.key.trim()}: ${h.value}`)}'`);
      }
      if (includeBody) {
        const parsed = parseJsonSafe(req.body);
        const compact = parsed.ok ? JSON.stringify(parsed.value) : req.body.trim();
        lines.push(`  -d '${escapeSingleQuote(compact)}'`);
      }
      return lines.join(' \\\n');
    }

    case 'fetch': {
      const headerEntries = activeHeaders
        .map((h) => `    '${escapeJsString(h.key.trim())}': '${escapeJsString(h.value)}'`)
        .join(',\n');

      const opts: string[] = [`  method: '${method}'`];
      if (activeHeaders.length > 0) {
        opts.push(`  headers: {\n${headerEntries}\n  }`);
      }
      if (includeBody) {
        const parsed = parseJsonSafe(req.body);
        if (parsed.ok) {
          const formatted = JSON.stringify(parsed.value, null, 2)
            .split('\n')
            .map((line, i) => (i === 0 ? line : `  ${line}`))
            .join('\n');
          opts.push(`  body: JSON.stringify(${formatted})`);
        } else {
          opts.push(`  body: '${escapeJsString(req.body.trim())}'`);
        }
      }

      return `const response = await fetch('${escapeJsString(fullUrl)}', {\n${opts.join(',\n')}\n});\n\nif (!response.ok) {\n  throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);\n}\n\nconst data = await response.json();\nconsole.log(data);`;
    }

    case 'python': {
      const activeParams = req.queryParams.filter((p) => p.enabled && p.key.trim() !== '');
      const cleanBase = req.baseUrl.trim() || 'https://api.example.com/endpoint';
      const lines: string[] = ['import requests', '', `url = "${escapePythonString(cleanBase)}"`];

      if (activeParams.length > 0) {
        lines.push('params = {');
        for (const p of activeParams) {
          lines.push(`    "${escapePythonString(p.key.trim())}": "${escapePythonString(p.value)}",`);
        }
        lines.push('}');
      }

      if (activeHeaders.length > 0) {
        lines.push('headers = {');
        for (const h of activeHeaders) {
          lines.push(`    "${escapePythonString(h.key.trim())}": "${escapePythonString(h.value)}",`);
        }
        lines.push('}');
      }

      let bodyArg = '';
      if (includeBody) {
        const parsed = parseJsonSafe(req.body);
        if (parsed.ok) {
          const pyJson = JSON.stringify(parsed.value, null, 4)
            .replace(/\btrue\b/g, 'True')
            .replace(/\bfalse\b/g, 'False')
            .replace(/\bnull\b/g, 'None');
          lines.push(`payload = ${pyJson}`);
          bodyArg = 'json=payload';
        } else {
          lines.push(`payload = "${escapePythonString(req.body.trim())}"`);
          bodyArg = 'data=payload';
        }
      }

      const callArgs = [`"${method}"`, 'url'];
      if (activeParams.length > 0) callArgs.push('params=params');
      if (activeHeaders.length > 0) callArgs.push('headers=headers');
      if (bodyArg) callArgs.push(bodyArg);
      callArgs.push('timeout=15');

      lines.push('');
      lines.push(`response = requests.request(${callArgs.join(', ')})`);
      lines.push('response.raise_for_status()');
      lines.push('print(response.json())');
      return lines.join('\n');
    }

    case 'httpie': {
      const headerParts = activeHeaders.map(
        (h) => `  '${escapeSingleQuote(`${h.key.trim()}:${h.value}`)}'`,
      );
      if (includeBody) {
        const parsed = parseJsonSafe(req.body);
        const compact = parsed.ok ? JSON.stringify(parsed.value) : req.body.trim();
        const cmd = [`echo '${escapeSingleQuote(compact)}' | http ${method} '${escapeSingleQuote(fullUrl)}'`];
        return [...cmd, ...headerParts].join(' \\\n');
      }
      const cmd = [`http ${method} '${escapeSingleQuote(fullUrl)}'`];
      return [...cmd, ...headerParts].join(' \\\n');
    }
  }
}
