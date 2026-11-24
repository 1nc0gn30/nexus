import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';

const BLOCKED_HOSTS = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[?::1\]?)/i;
const HOP_BY_HOP = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'cookie', 'origin', 'referer']);

function validateProxyUrl(rawUrl: string): string | null {
  let parsed: URL;
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

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3001;

  app.use(express.json({ limit: '2mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'nexus-api-ide' });
  });

  app.all('/api/proxy', async (req, res) => {
    const url = (req.query.url || req.body?.url) as string | undefined;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    const validationError = validateProxyUrl(url);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    try {
      const forwardHeaders: Record<string, string> = {
        'User-Agent': 'Nexus-API-IDE/2.0',
        Accept: '*/*',
      };

      for (const [k, v] of Object.entries(req.headers)) {
        const lower = k.toLowerCase();
        if (!v || HOP_BY_HOP.has(lower)) continue;
        if (lower === 'content-type' && ['GET', 'HEAD'].includes(req.method.toUpperCase())) continue;
        forwardHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
      }

      const response = await axios({
        method: req.method as any,
        url,
        timeout: 15000,
        responseType: 'arraybuffer',
        data: ['GET', 'HEAD'].includes(req.method.toUpperCase()) ? undefined : req.body,
        headers: forwardHeaders,
        validateStatus: () => true,
      });

      const contentType = response.headers['content-type'];
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }

      res.status(response.status).send(response.data);
    } catch (error: any) {
      res.status(502).json({
        error: 'Failed to fetch from proxy',
        details: error.message,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexus API IDE server running on http://localhost:${PORT}`);
  });
}

startServer();
