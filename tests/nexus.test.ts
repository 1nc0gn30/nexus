import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { parseCurlCommand, extractQueryParams, buildUrlWithParams } from '../src/lib/curlParser';
import { generateCodeSnippet } from '../src/lib/codeGenerator';
import {
  resolvePath,
  interpolateTemplate,
  extractSuggestedVariables,
  DEFAULT_WORKFLOWS,
} from '../src/lib/workflowEngine';
import { executeHttpRequest } from '../src/lib/httpClient';
import {
  DEFAULT_COLLECTIONS,
  exportWorkspaceJson,
  importWorkspaceJson,
} from '../src/lib/collections';
import { planLocalRequest } from '../src/lib/localAgent';
import { initialRegistry } from '../src/data/registry';

const ROOT = process.cwd();

describe('cURL Importer', () => {
  it('parses multiline POST with headers, JSON body, and query params', () => {
    const cmd = `curl -X POST 'https://api.example.com/v1/items?limit=10&sort=asc' \\
      -H 'Content-Type: application/json' \\
      -H 'Authorization: Bearer secret123' \\
      -d '{"name":"nexus","active":true}'`;

    const parsed = parseCurlCommand(cmd);
    assert.equal(parsed.method, 'POST');
    assert.equal(parsed.baseUrl, 'https://api.example.com/v1/items');
    assert.equal(parsed.queryParams.length, 2);
    assert.equal(parsed.queryParams[0].key, 'limit');
    assert.equal(parsed.queryParams[0].value, '10');
    assert.equal(parsed.headers.length, 2);
    assert.equal(parsed.headers[1].key, 'Authorization');
    assert.equal(parsed.headers[1].value, 'Bearer secret123');
    assert.deepEqual(JSON.parse(parsed.body), { name: 'nexus', active: true });
  });

  it('infers POST when -d is provided without -X and supports -G for GET query encoding', () => {
    const postParsed = parseCurlCommand(`curl https://jsonplaceholder.typicode.com/posts -d '{"a":1}'`);
    assert.equal(postParsed.method, 'POST');
    assert.equal(postParsed.headers.some((h) => h.key === 'Content-Type'), true);

    const getParsed = parseCurlCommand(`curl -G 'https://api.open-meteo.com/v1/forecast' -d 'latitude=52.52' -d 'longitude=13.41'`);
    assert.equal(getParsed.method, 'GET');
    assert.equal(getParsed.body, '');
    assert.equal(getParsed.queryParams.length, 2);
  });

  it('encodes -u credentials as Basic Auth header', () => {
    const parsed = parseCurlCommand(`curl -u alice:wonderland https://httpbin.org/basic-auth/alice/wonderland`);
    const auth = parsed.headers.find((h) => h.key === 'Authorization');
    assert.ok(auth);
    assert.equal(auth.value, `Basic ${Buffer.from('alice:wonderland').toString('base64')}`);
  });

  it('rejects empty or URL-less input', () => {
    assert.throws(() => parseCurlCommand(''), /Paste a cURL command/);
    assert.throws(() => parseCurlCommand('curl -X GET'), /No URL found/);
  });
});

describe('Code Generator (cURL, JS fetch, Python requests, HTTPie)', () => {
  const sampleReq = {
    method: 'POST',
    baseUrl: 'https://jsonplaceholder.typicode.com/posts',
    queryParams: [{ id: 'q1', key: 'source', value: 'nexus', enabled: true }],
    headers: [
      { id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true },
      { id: 'h2', key: 'X-Disabled', value: 'skip', enabled: false },
    ],
    body: JSON.stringify({ title: 'Test', active: true, empty: null }, null, 2),
  };

  it('generates valid cURL snippet excluding disabled headers', () => {
    const out = generateCodeSnippet(sampleReq, 'curl');
    assert.match(out, /curl -X POST 'https:\/\/jsonplaceholder\.typicode\.com\/posts\?source=nexus'/);
    assert.match(out, /-H 'Content-Type: application\/json'/);
    assert.doesNotMatch(out, /X-Disabled/);
    assert.match(out, /-d '\{"title":"Test","active":true,"empty":null\}'/);
  });

  it('generates valid JavaScript fetch snippet', () => {
    const out = generateCodeSnippet(sampleReq, 'fetch');
    assert.match(out, /await fetch\('https:\/\/jsonplaceholder\.typicode\.com\/posts\?source=nexus'/);
    assert.match(out, /method: 'POST'/);
    assert.match(out, /body: JSON\.stringify\(/);
  });

  it('generates valid Python requests snippet with Python booleans/None', () => {
    const out = generateCodeSnippet(sampleReq, 'python');
    assert.match(out, /import requests/);
    assert.match(out, /"source": "nexus"/);
    assert.match(out, /True/);
    assert.match(out, /None/);
    assert.match(out, /requests\.request\("POST", url, params=params, headers=headers, json=payload, timeout=15\)/);
  });

  it('generates valid HTTPie snippet', () => {
    const out = generateCodeSnippet(sampleReq, 'httpie');
    assert.match(out, /http POST 'https:\/\/jsonplaceholder\.typicode\.com\/posts\?source=nexus'/);
    assert.match(out, /Content-Type:application\/json/);
  });
});

describe('Workflow Chain Engine & Variable Extraction', () => {
  it('resolves nested object properties and array bracket indices', () => {
    const obj = {
      status: 200,
      data: {
        results: [{ name: { first: 'Elena', last: 'Vance' }, id: 42 }],
      },
    };
    assert.equal(resolvePath(obj, 'data.results[0].name.first'), 'Elena');
    assert.equal(resolvePath(obj, 'data.results[0].id'), 42);
    assert.equal(resolvePath(obj, 'status'), 200);
    assert.equal(resolvePath(obj, 'data.missing.field'), undefined);
  });

  it('interpolates {{step1.data.field}} and {{env.KEY}} and reports missing paths', () => {
    const ctx = {
      steps: {
        step1: { status: 200, data: { id: 7, user: { login: '1nc0gn30' } } },
      },
      env: { TOKEN: 'abc-123' },
    };

    const ok = interpolateTemplate(
      'https://api.github.com/users/{{step1.data.user.login}}/repos?id={{step1.data.id}}&token={{env.TOKEN}}',
      ctx,
    );
    assert.equal(ok.value, 'https://api.github.com/users/1nc0gn30/repos?id=7&token=abc-123');
    assert.deepEqual(ok.missing, []);

    const partial = interpolateTemplate('https://example.com/{{step1.data.nope}}', ctx);
    assert.equal(partial.value, 'https://example.com/{{step1.data.nope}}');
    assert.deepEqual(partial.missing, ['step1.data.nope']);
  });

  it('extracts copyable variable tokens from responses', () => {
    const vars = extractSuggestedVariables('step1', { id: 1, user: { name: 'Ada' } });
    assert.ok(vars.includes('{{step1.data.id}}'));
    assert.ok(vars.includes('{{step1.data.user.name}}'));
  });

  it('ships with multi-step starter workflows', () => {
    assert.ok(DEFAULT_WORKFLOWS.length >= 3);
    assert.ok(DEFAULT_WORKFLOWS[0].steps.length >= 2);
  });
});

describe('HTTP Client, Collections, Local Planner & Registry', () => {
  it('executes Offline Mock transport deterministically with timing and size', async () => {
    const res = await executeHttpRequest({
      method: 'GET',
      baseUrl: 'https://jsonplaceholder.typicode.com/users/1',
      queryParams: [],
      headers: [],
      body: '',
      transport: 'mock',
    });
    assert.equal(res.ok, true);
    assert.equal(res.status, 200);
    assert.equal(res.transportUsed, 'mock');
    assert.ok(res.sizeBytes > 10);
    assert.equal((res.data as { id: number }).id, 1);
  });

  it('preserves {{template}} variables in buildUrlWithParams and extractQueryParams', () => {
    const url = 'https://jsonplaceholder.typicode.com/posts?userId={{step1.data.id}}';
    const { baseUrl, params } = extractQueryParams(url);
    assert.equal(baseUrl, 'https://jsonplaceholder.typicode.com/posts');
    assert.equal(params[0].value, '{{step1.data.id}}');
    assert.equal(buildUrlWithParams(baseUrl, params), url);
  });

  it('exports and re-imports workspace JSON collections and workflows', () => {
    const raw = exportWorkspaceJson(DEFAULT_COLLECTIONS, DEFAULT_WORKFLOWS);
    const parsed = importWorkspaceJson(raw);
    assert.equal(parsed.collections.length, DEFAULT_COLLECTIONS.length);
    assert.equal(parsed.workflows.length, DEFAULT_WORKFLOWS.length);
    assert.throws(() => importWorkspaceJson('{}'), /No valid collections or workflows/);
  });

  it('plans local zero-key requests from cURL, GitHub handles, and catalog terms', () => {
    const baseState = { method: 'GET', baseUrl: '', queryParams: [], headers: [], body: '' };
    const gh = planLocalRequest('GET github user 1nc0gn30', baseState, initialRegistry);
    assert.equal(gh.baseUrl, 'https://api.github.com/users/1nc0gn30');

    const weather = planLocalRequest('weather forecast open-meteo', baseState, initialRegistry);
    assert.match(weather.baseUrl, /open-meteo/i);

    const curlPlan = planLocalRequest(`curl -X DELETE https://jsonplaceholder.typicode.com/posts/1`, baseState, initialRegistry);
    assert.equal(curlPlan.method, 'DELETE');
    assert.equal(curlPlan.baseUrl, 'https://jsonplaceholder.typicode.com/posts/1');
  });

  it('contains valid public API registry entries', () => {
    assert.ok(initialRegistry.length >= 200);
    for (const api of initialRegistry) {
      assert.ok(api.API.length > 0);
      assert.match(api.Link, /^https?:\/\//);
      assert.ok(api.Category.length > 0);
    }
  });
});

describe('Production SEO, AEO, Netlify & Open-Access Guardrails', () => {
  it('validates index.html JSON-LD @graph (WebApplication + FAQPage) and social meta tags', () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1\.0"/);
    assert.match(html, /property="og:image" content="https:\/\/nexus\.757tech\.pro\/og-image\.png"/);
    assert.match(html, /name="twitter:site" content="@1nc0gn30"/);
    assert.match(html, /name="twitter:creator" content="@1nc0gn30"/);
    assert.doesNotMatch(html, /name="waitlist"/i);

    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(ldMatch, 'JSON-LD script tag must exist');
    const jsonLd = JSON.parse(ldMatch[1]);
    assert.ok(Array.isArray(jsonLd['@graph']));
    const types = jsonLd['@graph'].map((node: { '@type': string }) => node['@type']);
    assert.ok(types.includes('WebApplication'));
    assert.ok(types.includes('FAQPage'));
  });

  it('validates robots.txt, sitemap.xml, netlify.toml, and local og-image.png', () => {
    const robots = fs.readFileSync(path.join(ROOT, 'public/robots.txt'), 'utf8');
    for (const bot of ['Googlebot', 'GPTBot', 'ClaudeBot', 'PerplexityBot', 'Applebot']) {
      assert.match(robots, new RegExp(`User-agent:\\s*${bot}`));
    }
    assert.match(robots, /Sitemap:\s*https:\/\/nexus\.757tech\.pro\/sitemap\.xml/);

    const sitemap = fs.readFileSync(path.join(ROOT, 'public/sitemap.xml'), 'utf8');
    assert.match(sitemap, /<loc>https:\/\/nexus\.757tech\.pro\/<\/loc>/);
    assert.match(sitemap, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);

    const netlify = fs.readFileSync(path.join(ROOT, 'netlify.toml'), 'utf8');
    assert.match(netlify, /publish = "dist"/);
    assert.match(netlify, /X-Frame-Options = "SAMEORIGIN"/);
    assert.match(netlify, /X-Content-Type-Options = "nosniff"/);
    assert.match(netlify, /Referrer-Policy = "strict-origin-when-cross-origin"/);
    assert.match(netlify, /to = "\/index\.html"/);

    assert.equal(fs.existsSync(path.join(ROOT, 'public/og-image.png')), true);
  });

  it('enforces 100% open-access (zero paywalls, waitlist gates, or DePay) and includes attribution + support links', () => {
    const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf8');
    const ideSrc = fs.readFileSync(path.join(ROOT, 'src/components/ApiIde.tsx'), 'utf8');
    const combined = appSrc + '\n' + ideSrc;

    assert.doesNotMatch(combined, /depay|waitlist|RATE_LIMIT|Free Citizen Tier/i);
    assert.match(appSrc, /Neal Frazier Tech/);
    assert.match(appSrc, /https:\/\/buy\.stripe\.com\/3cIfZg27PdKo2D64Ocfw40X/);
    assert.match(appSrc, /GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK/);
  });
});
