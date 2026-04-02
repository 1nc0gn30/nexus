import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(express.json());

  // Proxy endpoint for browser CORS/ETP consistency.
  app.all("/api/proxy", async (req, res) => {
    const url = (req.query.url || req.body?.url) as string | undefined;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      const response = await axios({
        method: req.method as any,
        url,
        timeout: 15000,
        responseType: "arraybuffer",
        data: ["GET", "HEAD"].includes(req.method.toUpperCase()) ? undefined : req.body,
        headers: {
          "User-Agent": "Nexus-API-Explorer/1.0",
          "Accept": "*/*",
          // Forward caller content type for JSON and form payloads.
          ...(req.headers["content-type"] ? { "Content-Type": req.headers["content-type"] } : {}),
        },
        validateStatus: () => true, // Handle any status code
      });

      const contentType = response.headers["content-type"];
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      res.status(response.status).send(response.data);
    } catch (error: any) {
      console.error("Proxy Error:", error.message);
      res.status(500).json({
        error: "Failed to fetch from proxy",
        details: error.message,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
