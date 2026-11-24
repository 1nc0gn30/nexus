const TEXTUAL_CONTENT_TYPE_REGEX = /^(application\/(json|.*\+json|xml|javascript)|text\/|image\/svg\+xml)/i;
const BLOCKED_HOSTS = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[?::1\]?)/i;
const HOP_BY_HOP_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'keep-alive',
  'upgrade',
  'cookie',
  'origin',
  'referer',
]);

function extractUrl(event) {
  const queryUrl = event.queryStringParameters?.url;
  if (queryUrl) return queryUrl;

  if (!event.body) return null;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    const parsed = JSON.parse(raw);
    return typeof parsed?.url === 'string' ? parsed.url : null;
  } catch {
    return null;
  }
}

function validateTargetUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return 'Invalid URL format';
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return 'Only HTTP and HTTPS protocols are permitted';
  }
  if (BLOCKED_HOSTS.test(parsed.hostname)) {
    return 'Private or loopback network hosts are blocked';
  }
  return null;
}

exports.handler = async (event) => {
  const targetUrl = extractUrl(event);
  if (!targetUrl) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'URL is required' }),
    };
  }

  const validationError = validateTargetUrl(targetUrl);
  if (validationError) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: validationError }),
    };
  }

  const method = (event.httpMethod || 'GET').toUpperCase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const headers = {
      'User-Agent': 'Nexus-API-IDE/2.0',
      Accept: '*/*',
    };

    for (const [k, v] of Object.entries(event.headers || {})) {
      const lower = k.toLowerCase();
      if (!v || HOP_BY_HOP_HEADERS.has(lower) || lower.startsWith('x-nf-') || lower.startsWith('x-forwarded-')) {
        continue;
      }
      if (lower === 'content-type' && ['GET', 'HEAD'].includes(method)) continue;
      headers[k] = v;
    }

    const body = ['GET', 'HEAD'].includes(method)
      ? undefined
      : event.isBase64Encoded
        ? Buffer.from(event.body || '', 'base64')
        : event.body;

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await upstream.arrayBuffer());

    const responseHeaders = {
      'content-type': contentType,
      'cache-control': 'no-store',
    };

    if (TEXTUAL_CONTENT_TYPE_REGEX.test(contentType)) {
      return {
        statusCode: upstream.status,
        headers: responseHeaders,
        body: buffer.toString('utf8'),
      };
    }

    return {
      statusCode: upstream.status,
      headers: responseHeaders,
      isBase64Encoded: true,
      body: buffer.toString('base64'),
    };
  } catch (error) {
    const details = error?.name === 'AbortError' ? 'Upstream request timed out' : (error?.message || 'Proxy request failed');
    return {
      statusCode: 502,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to fetch from proxy', details }),
    };
  } finally {
    clearTimeout(timeout);
  }
};
