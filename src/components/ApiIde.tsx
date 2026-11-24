import React, { useState, useMemo, useRef } from 'react';
import {
  Send,
  Loader2,
  Copy,
  Check,
  Trash2,
  Plus,
  Terminal,
  Code2,
  Bookmark,
  FolderOpen,
  Download,
  Upload,
  Sparkles,
  Settings,
  X,
  AlertCircle,
  Clock,
  FileCode2,
  Wand2,
  History,
  Menu,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PublicAPI } from '../data/registry';
import {
  KeyValueItem,
  buildUrlWithParams,
  extractQueryParams,
  parseCurlCommand,
} from '../lib/curlParser';
import { CodeLanguage, generateCodeSnippet } from '../lib/codeGenerator';
import { executeHttpRequest, ExecutionResult, TransportMode } from '../lib/httpClient';
import {
  RequestHistoryItem,
  SavedCollection,
  SavedRequest,
} from '../lib/collections';
import { planLocalRequest } from '../lib/localAgent';
import { JsonTree } from './JsonTree';

interface ApiIdeProps {
  catalog: PublicAPI[];
  method: string;
  baseUrl: string;
  queryParams: KeyValueItem[];
  headers: KeyValueItem[];
  body: string;
  onChangeMethod: (m: string) => void;
  onChangeBaseUrl: (u: string) => void;
  onChangeQueryParams: (p: KeyValueItem[]) => void;
  onChangeHeaders: (h: KeyValueItem[]) => void;
  onChangeBody: (b: string) => void;
  collections: SavedCollection[];
  onSaveRequest: (collectionId: string, req: SavedRequest) => void;
  onDeleteSavedRequest: (collectionId: string, reqId: string) => void;
  onLoadSavedRequest: (req: SavedRequest) => void;
  onExportWorkspace: () => void;
  onImportWorkspace: (rawJson: string) => { ok: boolean; message: string };
  history: RequestHistoryItem[];
  onPushHistory: (item: RequestHistoryItem) => void;
  onClearHistory: () => void;
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
const GEMINI_KEY_STORAGE = 'nexus_gemini_api_key';

const METHOD_COLORS: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-sky-400',
  PUT: 'text-amber-400',
  PATCH: 'text-violet-400',
  DELETE: 'text-rose-400',
  HEAD: 'text-zinc-300',
};

const SAMPLE_CURL_PRESETS = [
  {
    label: 'POST JSONPlaceholder',
    cmd: `curl -X POST 'https://jsonplaceholder.typicode.com/posts' \\\n  -H 'Content-Type: application/json' \\\n  -H 'Accept: application/json' \\\n  -d '{"title":"Nexus cURL Import","body":"Parsed client-side","userId":1}'`,
  },
  {
    label: 'GET GitHub User',
    cmd: `curl -H 'Accept: application/vnd.github+json' 'https://api.github.com/users/1nc0gn30'`,
  },
  {
    label: 'GET Open-Meteo Forecast',
    cmd: `curl -G 'https://api.open-meteo.com/v1/forecast' -d 'latitude=52.52' -d 'longitude=13.41' -d 'current_weather=true'`,
  },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export const ApiIde: React.FC<ApiIdeProps> = ({
  catalog,
  method,
  baseUrl,
  queryParams,
  headers,
  body,
  onChangeMethod,
  onChangeBaseUrl,
  onChangeQueryParams,
  onChangeHeaders,
  onChangeBody,
  collections,
  onSaveRequest,
  onDeleteSavedRequest,
  onLoadSavedRequest,
  onExportWorkspace,
  onImportWorkspace,
  history,
  onPushHistory,
  onClearHistory,
}) => {
  const [transport, setTransport] = useState<TransportMode>('direct');
  const [reqTab, setReqTab] = useState<'params' | 'headers' | 'body' | 'code' | 'assistant'>('params');
  const [resTab, setResTab] = useState<'tree' | 'raw' | 'headers'>('tree');
  const [codeLang, setCodeLang] = useState<CodeLanguage>('curl');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedRes, setCopiedRes] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sidebars & Modals
  const [sidebarTab, setSidebarTab] = useState<'collections' | 'history'>('collections');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [curlModalOpen, setCurlModalOpen] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  const [curlError, setCurlError] = useState<string | null>(null);

  // Assistant state (zero-key local planner + optional BYOK Gemini)
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentOutput, setAgentOutput] = useState<{ explanation: string; nextSteps: string[] } | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [showByokSettings, setShowByokSettings] = useState(false);
  const [geminiKey, setGeminiKey] = useState(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(GEMINI_KEY_STORAGE) || '' : '',
  );

  const importFileRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2400);
  };

  const fullUrl = useMemo(
    () => buildUrlWithParams(baseUrl, queryParams),
    [baseUrl, queryParams],
  );

  const codeSnippet = useMemo(
    () => generateCodeSnippet({ method, baseUrl, queryParams, headers, body }, codeLang),
    [method, baseUrl, queryParams, headers, body, codeLang],
  );

  const bodyJsonError = useMemo(() => {
    if (['GET', 'HEAD'].includes(method) || !body.trim()) return null;
    try {
      JSON.parse(body);
      return null;
    } catch (e: unknown) {
      return e instanceof Error ? e.message : 'Invalid JSON';
    }
  }, [method, body]);

  const handleUrlInputChange = (nextRaw: string) => {
    const { baseUrl: nextBase, params: nextParams } = extractQueryParams(nextRaw);
    onChangeBaseUrl(nextBase);
    onChangeQueryParams(nextParams);
  };

  const handleSend = async (override?: {
    method?: string;
    baseUrl?: string;
    queryParams?: KeyValueItem[];
    headers?: KeyValueItem[];
    body?: string;
  }) => {
    const m = override?.method ?? method;
    const bUrl = override?.baseUrl ?? baseUrl;
    const qParams = override?.queryParams ?? queryParams;
    const hdrs = override?.headers ?? headers;
    const bdy = override?.body ?? body;

    setLoading(true);
    const exec = await executeHttpRequest({
      method: m,
      baseUrl: bUrl,
      queryParams: qParams,
      headers: hdrs,
      body: bdy,
      transport,
    });
    setResult(exec);
    setLoading(false);

    if (exec.url) {
      onPushHistory({
        id: `hist-${Date.now()}`,
        method: m,
        url: exec.url,
        status: exec.status || null,
        durationMs: exec.durationMs,
        timestamp: Date.now(),
      });
    }
  };

  const handleImportCurl = () => {
    setCurlError(null);
    try {
      const parsed = parseCurlCommand(curlInput);
      onChangeMethod(parsed.method);
      onChangeBaseUrl(parsed.baseUrl);
      onChangeQueryParams(parsed.queryParams);
      onChangeHeaders(
        parsed.headers.length > 0
          ? parsed.headers
          : [{ id: `h-${Date.now()}`, key: 'Accept', value: 'application/json', enabled: true }],
      );
      onChangeBody(parsed.body);
      setCurlModalOpen(false);
      setCurlInput('');
      showToast(`Imported ${parsed.method} ${parsed.baseUrl}`);
    } catch (err: unknown) {
      setCurlError(err instanceof Error ? err.message : 'Failed to parse cURL');
    }
  };

  const handleSaveCurrent = () => {
    const col = collections[0];
    if (!col) return;
    let shortName = baseUrl || 'Untitled Request';
    try {
      const u = new URL(baseUrl);
      shortName = `${u.hostname}${u.pathname === '/' ? '' : u.pathname}`;
    } catch {
      // keep raw
    }
    onSaveRequest(col.id, {
      id: `req-${Date.now()}`,
      name: `${method} ${shortName}`.slice(0, 48),
      method,
      baseUrl,
      queryParams,
      headers,
      body,
      updatedAt: Date.now(),
    });
    showToast(`Saved to "${col.name}"`);
  };

  const handleRunAssistant = async () => {
    if (!agentPrompt.trim() || agentLoading) return;
    setAgentLoading(true);
    setAgentOutput(null);

    try {
      if (geminiKey.trim()) {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
        const aiRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: `Return ONLY valid JSON: {"method":"GET|POST|PUT|PATCH|DELETE","url":"https://...","headers":{"Accept":"application/json"},"body":"","explanation":"<60 words","nextSteps":["..."],"autoSend":false}\nUser task: ${agentPrompt}\nCurrent: ${method} ${fullUrl}`,
          config: { responseMimeType: 'application/json' },
        });
        const parsed = JSON.parse(aiRes.text || '{}');
        const nextMethod = parsed.method || method;
        const { baseUrl: nextBase, params: nextParams } = extractQueryParams(parsed.url || fullUrl);
        const nextHeaders: KeyValueItem[] =
          parsed.headers && typeof parsed.headers === 'object'
            ? Object.entries(parsed.headers).map(([k, v], i) => ({
                id: `ai-h-${i}-${Date.now()}`,
                key: k,
                value: String(v),
                enabled: true,
              }))
            : headers;
        const nextBody =
          typeof parsed.body === 'string'
            ? parsed.body
            : parsed.body
              ? JSON.stringify(parsed.body, null, 2)
              : body;

        onChangeMethod(nextMethod);
        onChangeBaseUrl(nextBase);
        onChangeQueryParams(nextParams);
        onChangeHeaders(nextHeaders);
        onChangeBody(nextBody);
        setAgentOutput({
          explanation: parsed.explanation || 'Updated request configuration.',
          nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
        });
        if (parsed.autoSend) {
          await handleSend({
            method: nextMethod,
            baseUrl: nextBase,
            queryParams: nextParams,
            headers: nextHeaders,
            body: nextBody,
          });
        }
      } else {
        const plan = planLocalRequest(
          agentPrompt,
          { method, baseUrl, queryParams, headers, body },
          catalog,
        );
        onChangeMethod(plan.method);
        onChangeBaseUrl(plan.baseUrl);
        onChangeQueryParams(plan.queryParams);
        onChangeHeaders(plan.headers);
        onChangeBody(plan.body);
        setAgentOutput({ explanation: plan.explanation, nextSteps: plan.nextSteps });
        if (plan.shouldAutoSend) {
          await handleSend({
            method: plan.method,
            baseUrl: plan.baseUrl,
            queryParams: plan.queryParams,
            headers: plan.headers,
            body: plan.body,
          });
        }
      }
      setAgentPrompt('');
    } catch (err: unknown) {
      setAgentOutput({
        explanation: err instanceof Error ? err.message : 'Assistant could not parse task.',
        nextSteps: ['Try pasting a URL, cURL command, or API name from the catalog.'],
      });
    } finally {
      setAgentLoading(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const outcome = onImportWorkspace(String(reader.result || ''));
      showToast(outcome.message);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const addHeaderPreset = (type: 'bearer' | 'json' | 'apikey') => {
    if (type === 'bearer') {
      onChangeHeaders([
        ...headers,
        { id: `h-${Date.now()}`, key: 'Authorization', value: 'Bearer YOUR_TOKEN', enabled: true },
      ]);
    } else if (type === 'json') {
      onChangeHeaders([
        ...headers,
        { id: `h-${Date.now()}`, key: 'Content-Type', value: 'application/json', enabled: true },
      ]);
    } else {
      onChangeHeaders([
        ...headers,
        { id: `h-${Date.now()}`, key: 'X-API-Key', value: 'YOUR_API_KEY', enabled: true },
      ]);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="p-3 border-b border-zinc-800 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSidebarTab('collections')}
          className={cn(
            'flex-1 min-h-[36px] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
            sidebarTab === 'collections'
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200',
          )}
        >
          <FolderOpen size={13} />
          <span>Collections</span>
        </button>
        <button
          type="button"
          onClick={() => setSidebarTab('history')}
          className={cn(
            'flex-1 min-h-[36px] rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
            sidebarTab === 'history'
              ? 'bg-zinc-800 text-zinc-100'
              : 'text-zinc-400 hover:text-zinc-200',
          )}
        >
          <History size={13} />
          <span>History ({history.length})</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {sidebarTab === 'collections' ? (
          collections.map((col) => (
            <div key={col.id} className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 truncate">
                  {col.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-600">{col.requests.length}</span>
              </div>
              {col.requests.map((req) => (
                <div
                  key={req.id}
                  className="group flex items-center gap-1 rounded-xl border border-zinc-800/70 bg-zinc-950/60 hover:border-zinc-700 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onLoadSavedRequest(req);
                      setMobileDrawerOpen(false);
                    }}
                    className="flex-1 min-w-0 flex items-center gap-2 px-2.5 py-2 text-left"
                  >
                    <span
                      className={cn(
                        'text-[10px] font-mono font-bold w-10 shrink-0',
                        METHOD_COLORS[req.method] || 'text-zinc-400',
                      )}
                    >
                      {req.method}
                    </span>
                    <span className="text-xs text-zinc-300 group-hover:text-zinc-100 truncate">
                      {req.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSavedRequest(col.id, req.id)}
                    aria-label={`Delete ${req.name}`}
                    className="p-2 text-zinc-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          ))
        ) : history.length === 0 ? (
          <div className="py-10 text-center space-y-2 text-zinc-500">
            <Clock size={20} className="mx-auto opacity-50" />
            <p className="text-xs">Sent requests appear here.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClearHistory}
                className="text-[11px] font-mono text-zinc-500 hover:text-rose-400"
              >
                Clear history
              </button>
            </div>
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onChangeMethod(item.method);
                  handleUrlInputChange(item.url);
                  setMobileDrawerOpen(false);
                }}
                className="w-full text-left p-2.5 rounded-xl border border-zinc-800/70 bg-zinc-950/60 hover:border-zinc-700 space-y-1"
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className={cn('font-bold', METHOD_COLORS[item.method] || 'text-zinc-400')}>
                    {item.method}
                  </span>
                  <span className="text-zinc-500">
                    {item.status ? `${item.status}` : 'ERR'} · {item.durationMs ?? 0}ms
                  </span>
                </div>
                <p className="text-[11px] font-mono text-zinc-400 truncate">{item.url}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-800 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onExportWorkspace}
          className="min-h-[38px] rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5"
        >
          <Download size={13} />
          <span>Export</span>
        </button>
        <button
          type="button"
          onClick={() => importFileRef.current?.click()}
          className="min-h-[38px] rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5"
        >
          <Upload size={13} />
          <span>Import</span>
        </button>
        <input
          ref={importFileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileImport}
          className="hidden"
          aria-label="Import workspace JSON"
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 space-y-4">
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-xs font-mono text-amber-300 shadow-2xl"
        >
          {toast}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Desktop Collections & History Rail */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 min-h-[640px] max-h-[780px] overflow-hidden">
          {sidebarContent}
        </aside>

        {/* Main Request + Response Workstation */}
        <div className="lg:col-span-9 space-y-4 min-w-0">
          {/* Request Action Bar */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="lg:hidden min-h-[38px] px-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200 text-xs font-medium flex items-center gap-1.5"
                >
                  <Menu size={14} />
                  <span>Collections</span>
                </button>
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400">
                  HTTP Request Builder
                </span>
              </div>

              <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={transport}
                  onChange={(e) => setTransport(e.target.value as TransportMode)}
                  aria-label="Transport mode"
                  className="min-h-[38px] bg-zinc-950 border border-zinc-800 rounded-xl px-2 sm:px-2.5 text-[11px] sm:text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500/60 truncate"
                >
                  <option value="direct">Direct (CORS)</option>
                  <option value="proxy">Server Proxy</option>
                  <option value="mock">Offline Mock</option>
                </select>

                <button
                  type="button"
                  onClick={() => setCurlModalOpen(true)}
                  className="min-h-[38px] px-2.5 sm:px-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-amber-500/50 text-zinc-200 hover:text-amber-300 text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Terminal size={13} className="shrink-0" />
                  <span>Import cURL</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCurrent}
                  className="min-h-[38px] px-2.5 sm:px-3 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-200 text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Bookmark size={13} className="shrink-0" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2 flex-1 min-w-0">
                <select
                  value={method}
                  onChange={(e) => onChangeMethod(e.target.value)}
                  aria-label="HTTP Method"
                  className={cn(
                    'min-h-[44px] bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs font-mono font-bold focus:outline-none focus:border-amber-500/60 shrink-0',
                    METHOD_COLORS[method] || 'text-zinc-100',
                  )}
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m} className="text-zinc-100 bg-zinc-950">
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={fullUrl}
                  onChange={(e) => handleUrlInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="https://api.github.com/users/octocat"
                  aria-label="Request URL"
                  className="flex-1 min-w-0 min-h-[44px] bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 text-xs sm:text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading}
                className="min-h-[44px] px-6 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shrink-0"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                <span>Send Request</span>
              </button>
            </div>
          </section>

          {/* Request Configuration Tabs */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="flex items-center gap-1 overflow-x-auto px-3 pt-2.5 border-b border-zinc-800 custom-scrollbar">
              {(
                [
                  { id: 'params', label: `Query Params (${queryParams.filter((p) => p.enabled && p.key).length})` },
                  { id: 'headers', label: `Headers (${headers.filter((h) => h.enabled && h.key).length})` },
                  { id: 'body', label: 'JSON Body' },
                  { id: 'code', label: 'Code Generator' },
                  { id: 'assistant', label: 'Agent Planner' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReqTab(tab.id)}
                  className={cn(
                    'shrink-0 px-3.5 pb-2.5 pt-1 text-xs font-medium border-b-2 transition-colors whitespace-nowrap',
                    reqTab === tab.id
                      ? 'border-amber-500 text-zinc-100'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4 min-h-[220px]">
              {/* Query Params Tab */}
              {reqTab === 'params' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-zinc-400">
                      Synced live with the URL query string above.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeQueryParams([
                          ...queryParams,
                          { id: `qp-${Date.now()}`, key: '', value: '', enabled: true },
                        ])
                      }
                      className="min-h-[36px] px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <Plus size={13} />
                      <span>Add Param</span>
                    </button>
                  </div>

                  {queryParams.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-800 py-8 text-center text-xs text-zinc-500">
                      No query parameters. Click &ldquo;Add Param&rdquo; or append <code className="text-zinc-300">?key=value</code> to the URL.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {queryParams.map((param) => (
                        <div key={param.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                          <input
                            type="checkbox"
                            checked={param.enabled}
                            onChange={(e) =>
                              onChangeQueryParams(
                                queryParams.map((p) =>
                                  p.id === param.id ? { ...p, enabled: e.target.checked } : p,
                                ),
                              )
                            }
                            aria-label="Enable parameter"
                            className="w-4 h-4 accent-amber-500 shrink-0"
                          />
                          <input
                            type="text"
                            value={param.key}
                            onChange={(e) =>
                              onChangeQueryParams(
                                queryParams.map((p) =>
                                  p.id === param.id ? { ...p, key: e.target.value } : p,
                                ),
                              )
                            }
                            placeholder="key"
                            className="flex-1 min-w-[120px] min-h-[38px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs font-mono text-zinc-100"
                          />
                          <input
                            type="text"
                            value={param.value}
                            onChange={(e) =>
                              onChangeQueryParams(
                                queryParams.map((p) =>
                                  p.id === param.id ? { ...p, value: e.target.value } : p,
                                ),
                              )
                            }
                            placeholder="value"
                            className="flex-1 min-w-[120px] min-h-[38px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs font-mono text-emerald-300"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              onChangeQueryParams(queryParams.filter((p) => p.id !== param.id))
                            }
                            aria-label="Remove query parameter"
                            className="p-2 text-zinc-500 hover:text-rose-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Headers Tab */}
              {reqTab === 'headers' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => addHeaderPreset('json')}
                        className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-[11px] font-mono text-zinc-300"
                      >
                        + JSON Content-Type
                      </button>
                      <button
                        type="button"
                        onClick={() => addHeaderPreset('bearer')}
                        className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-[11px] font-mono text-zinc-300"
                      >
                        + Bearer Auth
                      </button>
                      <button
                        type="button"
                        onClick={() => addHeaderPreset('apikey')}
                        className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-[11px] font-mono text-zinc-300"
                      >
                        + X-API-Key
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onChangeHeaders([
                          ...headers,
                          { id: `h-${Date.now()}`, key: '', value: '', enabled: true },
                        ])
                      }
                      className="min-h-[34px] px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium flex items-center gap-1"
                    >
                      <Plus size={13} />
                      <span>Add Header</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {headers.map((hdr) => (
                      <div key={hdr.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <input
                          type="checkbox"
                          checked={hdr.enabled}
                          onChange={(e) =>
                            onChangeHeaders(
                              headers.map((h) =>
                                h.id === hdr.id ? { ...h, enabled: e.target.checked } : h,
                              ),
                            )
                          }
                          aria-label="Enable header"
                          className="w-4 h-4 accent-amber-500 shrink-0"
                        />
                        <input
                          type="text"
                          value={hdr.key}
                          onChange={(e) =>
                            onChangeHeaders(
                              headers.map((h) =>
                                h.id === hdr.id ? { ...h, key: e.target.value } : h,
                              ),
                            )
                          }
                          placeholder="Header-Name"
                          className="flex-1 min-w-[120px] min-h-[38px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs font-mono text-zinc-100"
                        />
                        <input
                          type="text"
                          value={hdr.value}
                          onChange={(e) =>
                            onChangeHeaders(
                              headers.map((h) =>
                                h.id === hdr.id ? { ...h, value: e.target.value } : h,
                              ),
                            )
                          }
                          placeholder="value"
                          className="flex-1 min-w-[120px] min-h-[38px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 text-xs font-mono text-emerald-300"
                        />
                        <button
                          type="button"
                          onClick={() => onChangeHeaders(headers.filter((h) => h.id !== hdr.id))}
                          aria-label="Remove header"
                          className="p-2 text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Body Tab */}
              {reqTab === 'body' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-zinc-400">
                      {['GET', 'HEAD'].includes(method)
                        ? `${method} requests do not transmit a body. Switch method to POST/PUT/PATCH to send JSON.`
                        : 'JSON request payload'}
                    </span>
                    <button
                      type="button"
                      disabled={!body.trim()}
                      onClick={() => {
                        try {
                          onChangeBody(JSON.stringify(JSON.parse(body), null, 2));
                          showToast('Formatted JSON body');
                        } catch {
                          showToast('Cannot format: invalid JSON');
                        }
                      }}
                      className="min-h-[32px] px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-100 text-xs font-medium"
                    >
                      Format JSON
                    </button>
                  </div>

                  <textarea
                    value={body}
                    onChange={(e) => onChangeBody(e.target.value)}
                    disabled={['GET', 'HEAD'].includes(method)}
                    rows={7}
                    spellCheck={false}
                    placeholder='{\n  "title": "Hello Nexus",\n  "userId": 1\n}'
                    className={cn(
                      'w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-sky-300 focus:outline-none focus:border-amber-500/60',
                      ['GET', 'HEAD'].includes(method) && 'opacity-50 cursor-not-allowed',
                    )}
                  />
                  {bodyJsonError && (
                    <p className="text-xs font-mono text-amber-400">JSON Warning: {bodyJsonError}</p>
                  )}
                </div>
              )}

              {/* Code Generator Tab */}
              {reqTab === 'code' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(
                        [
                          { id: 'curl', label: 'cURL' },
                          { id: 'fetch', label: 'JavaScript fetch' },
                          { id: 'python', label: 'Python requests' },
                          { id: 'httpie', label: 'HTTPie' },
                        ] as const
                      ).map((lang) => (
                        <button
                          key={lang.id}
                          type="button"
                          onClick={() => setCodeLang(lang.id)}
                          className={cn(
                            'min-h-[34px] px-3 rounded-lg text-xs font-mono font-medium transition-colors',
                            codeLang === lang.id
                              ? 'bg-amber-500 text-zinc-950 font-bold'
                              : 'bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-zinc-700',
                          )}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(codeSnippet).catch(() => {});
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 1800);
                      }}
                      className="min-h-[34px] px-3.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium flex items-center gap-1.5"
                    >
                      {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{copiedCode ? 'Copied' : 'Copy Snippet'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
                    {codeSnippet}
                  </pre>
                </div>
              )}

              {/* Agent Planner Tab */}
              {reqTab === 'assistant' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <Wand2 size={14} className="text-amber-400" />
                      <span>
                        {geminiKey.trim()
                          ? 'BYOK Gemini Planner active (browser-local key)'
                          : 'Zero-Key Local Planner active — works 100% offline'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowByokSettings((v) => !v)}
                      className="min-h-[32px] px-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5"
                    >
                      <Settings size={12} />
                      <span>Optional API Key</span>
                    </button>
                  </div>

                  {showByokSettings && (
                    <div className="p-3 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
                      <label className="block text-[11px] font-mono text-zinc-400">
                        Optional Gemini API Key (stored only in your browser localStorage)
                      </label>
                      <input
                        type="password"
                        value={geminiKey}
                        onChange={(e) => {
                          setGeminiKey(e.target.value);
                          if (e.target.value) {
                            window.localStorage.setItem(GEMINI_KEY_STORAGE, e.target.value);
                          } else {
                            window.localStorage.removeItem(GEMINI_KEY_STORAGE);
                          }
                        }}
                        placeholder="Leave blank to use the free local planner"
                        className="w-full min-h-[38px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-xs font-mono text-zinc-200"
                      />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'GET github user 1nc0gn30',
                      'Create a POST jsonplaceholder request with JSON body',
                      'Add Bearer auth and Accept headers',
                      'Fetch weather forecast from Open-Meteo',
                    ].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        onClick={() => setAgentPrompt(quick)}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-amber-500/40 text-[11px] text-zinc-300 transition-colors"
                      >
                        {quick}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={agentPrompt}
                      onChange={(e) => setAgentPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRunAssistant();
                      }}
                      placeholder="Describe a request, paste a URL, or paste a cURL command..."
                      className="flex-1 min-h-[42px] bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60"
                    />
                    <button
                      type="button"
                      onClick={handleRunAssistant}
                      disabled={agentLoading || !agentPrompt.trim()}
                      className="min-h-[42px] px-4 rounded-xl bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      {agentLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      <span>Build Request</span>
                    </button>
                  </div>

                  {agentOutput && (
                    <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                      <p className="text-xs text-zinc-200">{agentOutput.explanation}</p>
                      {agentOutput.nextSteps.length > 0 && (
                        <ul className="text-[11px] text-zinc-400 list-disc pl-4 space-y-0.5">
                          {agentOutput.nextSteps.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Response Inspector */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-400">
                  Response
                </span>
                {result && (
                  <>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-md text-xs font-mono font-semibold border',
                        result.ok
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300',
                      )}
                    >
                      {result.status || 'ERR'} {result.statusText}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">{result.durationMs} ms</span>
                    <span className="text-xs font-mono text-zinc-500">
                      {formatBytes(result.sizeBytes)}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {result.transportUsed}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {(['tree', 'raw', 'headers'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setResTab(tab)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors',
                      resTab === tab
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:text-zinc-200',
                    )}
                  >
                    {tab === 'tree' ? 'JSON Tree' : tab === 'raw' ? 'Raw' : 'Headers'}
                  </button>
                ))}
                {result && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const text =
                          typeof result.data === 'string'
                            ? result.data
                            : JSON.stringify(result.data, null, 2);
                        navigator.clipboard.writeText(text).catch(() => {});
                        setCopiedRes(true);
                        setTimeout(() => setCopiedRes(false), 1800);
                      }}
                      aria-label="Copy response body"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    >
                      {copiedRes ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResult(null)}
                      aria-label="Clear response"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 min-h-[260px] max-h-[420px] overflow-auto bg-zinc-950/70 custom-scrollbar">
              {loading ? (
                <div className="h-56 flex flex-col items-center justify-center gap-2 text-zinc-500">
                  <Loader2 size={22} className="animate-spin text-amber-400" />
                  <span className="text-xs font-mono">Executing {method} request…</span>
                </div>
              ) : !result ? (
                <div className="h-56 flex flex-col items-center justify-center gap-3 text-center px-4">
                  <FileCode2 size={28} strokeWidth={1.3} className="text-zinc-600" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-zinc-300">Ready to inspect live JSON</p>
                    <p className="text-xs text-zinc-500 max-w-md">
                      Click <strong className="text-zinc-300">Send Request</strong> for a live CORS call,
                      switch to <strong className="text-zinc-300">Offline Mock</strong> for instant schema
                      testing, or paste a command via <strong className="text-zinc-300">Import cURL</strong>.
                    </p>
                  </div>
                </div>
              ) : result.error && result.data === null ? (
                <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 flex items-start gap-3">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-mono font-semibold text-rose-300 uppercase">
                      Request Failed
                    </p>
                    <p className="text-xs font-mono text-zinc-300 leading-relaxed">{result.error}</p>
                  </div>
                </div>
              ) : resTab === 'headers' ? (
                <div className="space-y-1.5">
                  {Object.keys(result.responseHeaders).length === 0 ? (
                    <p className="text-xs font-mono text-zinc-500">
                      No response headers exposed by browser CORS policy.
                    </p>
                  ) : (
                    Object.entries(result.responseHeaders).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-1.5 border-b border-zinc-900 text-xs font-mono"
                      >
                        <span className="text-amber-300 sm:w-52 shrink-0">{k}</span>
                        <span className="text-zinc-300 break-all">{v}</span>
                      </div>
                    ))
                  )}
                </div>
              ) : resTab === 'raw' ? (
                <pre className="text-xs font-mono text-zinc-200 whitespace-pre-wrap break-words leading-relaxed">
                  {typeof result.data === 'string'
                    ? result.data
                    : JSON.stringify(result.data, null, 2)}
                </pre>
              ) : typeof result.data === 'object' && result.data !== null ? (
                <JsonTree
                  data={result.data}
                  onCopyPath={(expr) => {
                    navigator.clipboard.writeText(expr).catch(() => {});
                    showToast(`Copied ${expr}`);
                  }}
                />
              ) : (
                <pre className="text-xs font-mono text-zinc-200 whitespace-pre-wrap break-words">
                  {String(result.data ?? '')}
                </pre>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Mobile Collections Drawer */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-80 max-w-[88vw] bg-zinc-900 border-r border-zinc-800 h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">
                Workspace
              </span>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                aria-label="Close workspace drawer"
                className="p-1.5 text-zinc-400 hover:text-zinc-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 min-h-0">{sidebarContent}</div>
          </div>
        </div>
      )}

      {/* Import cURL Modal */}
      {curlModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setCurlModalOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 size={16} className="text-amber-400" />
                <h3 className="text-base font-display font-semibold text-zinc-100">
                  Import cURL Command
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCurlModalOpen(false)}
                aria-label="Close cURL modal"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_CURL_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCurlInput(preset.cmd);
                    setCurlError(null);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-amber-500/40 text-[11px] font-mono text-zinc-300"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <textarea
              value={curlInput}
              onChange={(e) => setCurlInput(e.target.value)}
              rows={6}
              spellCheck={false}
              placeholder={`curl -X POST 'https://jsonplaceholder.typicode.com/posts' \\\n  -H 'Content-Type: application/json' \\\n  -d '{"title":"hello"}'`}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-emerald-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/60"
            />

            {curlError && <p className="text-xs font-mono text-rose-400">{curlError}</p>}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCurlModalOpen(false)}
                className="min-h-[40px] px-4 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-zinc-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportCurl}
                className="min-h-[40px] px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold"
              >
                Parse & Populate IDE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
