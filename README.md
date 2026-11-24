# Nexus API IDE

Open-access browser IDE to discover public APIs, test HTTP requests, import/export `cURL` snippets, and run multi-step chained API workflows without paywalls or mandatory API keys.

- **Live Deployment**: [https://nexus.757tech.pro](https://nexus.757tech.pro)
- **Repository**: [github.com/1nc0gn30/nexus](https://github.com/1nc0gn30/nexus)

## Capabilities

- **HTTP Request Builder (`src/components/ApiIde.tsx`)**: Configure `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, and `HEAD` requests with live URL ↔ Query Parameter sync, key/value headers (with Bearer, JSON, and `X-API-Key` presets), formatted JSON body editor with syntax checks, status/latency/payload-size telemetry, collapsible JSON Tree inspector (with click-to-copy template paths), Raw JSON view, and Response Headers table.
- **3 Transparent Transport Modes (`src/lib/httpClient.ts`)**:
  - `Direct (CORS)`: Native browser `fetch()` for CORS-enabled public APIs.
  - `Server Proxy`: Routes through `/api/proxy` (Netlify Functions or local Express server) with SSRF/loopback host protection.
  - `Offline Mock`: Deterministic schema & sample JSON previews for testing requests and workflow chains offline.
- **cURL Importer (`src/lib/curlParser.ts`)**: Paste single-line or multiline `curl` commands (`-X`, `-H`, `-d`/`--data-raw`, `-G`, `-u`, `-A`, quoted arguments) to populate method, URL, query params, headers, and formatted JSON body.
- **Code Generator (`src/lib/codeGenerator.ts`)**: Generates copy-ready **cURL**, **JavaScript `fetch`**, **Python `requests`**, and **HTTPie** snippets directly from the active request state.
- **Multi-Step Workflow Chain Builder (`src/components/WorkflowBuilder.tsx`, `src/lib/workflowEngine.ts`)**: Run sequential API pipelines with `{{step1.data.field}}`, `{{step1.data.results[0].name}}`, and `{{env.VAR}}` template extraction, clickable output variable chips, and 3 starter chains (JSONPlaceholder, GitHub, RandomUser → Agify/Genderize).
- **223-Endpoint Public API Catalog (`src/components/CatalogView.tsx`)**: Search and filter by category or CORS-direct compatibility, inspect offline schema previews immediately (zero background network storm on load), test live on demand, open in IDE, or append to a workflow chain.
- **Local Persistence & Portability (`src/lib/collections.ts`)**: Saved collections, workflow chains, and request history persist in `localStorage` with full JSON workspace Export and Import.
- **Zero-Key Local Request Planner (`src/lib/localAgent.ts`)**: Deterministic in-browser planner converts natural-language prompts, URLs, catalog matches, or pasted cURL commands into configured requests with zero API keys required (optional browser-local BYOK Gemini key supported).

## Development & Verification

```bash
npm install
npm run lint     # TypeScript type-check (tsc --noEmit)
npm test         # Unit + SEO/AEO/open-access guardrail tests
npm run build    # Production Vite bundle -> dist/
npm run dev      # Local Express + Vite dev server with /api/proxy on :3001
```

## License & Attribution

Engineered by **Neal Frazier Tech (@1nc0gn30)** • [NullAI Platform](https://nullai.tech).
100% open-access developer tool. Optional support via [Buy Us a Coffee](https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X).
