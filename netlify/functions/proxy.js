const TEXTUAL_CONTENT_TYPE_REGEX = /^(application\/(json|.*\+json|xml|javascript)|text\/|image\/svg\+xml)/i;

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

exports.handler = async (event) => {
  const targetUrl = extractUrl(event);
  if (!targetUrl) {
    return {
      statusCode: 400,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'URL is required' }),
    };
  }

  const method = (event.httpMethod || 'GET').toUpperCase();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const headers = {
      'User-Agent': 'Nexus-API-Explorer/1.0',
      Accept: '*/*',
    };

    const incomingContentType = event.headers?.['content-type'] || event.headers?.['Content-Type'];
    if (incomingContentType && !['GET', 'HEAD'].includes(method)) {
      headers['Content-Type'] = incomingContentType;
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
