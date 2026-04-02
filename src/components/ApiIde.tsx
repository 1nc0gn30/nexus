import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Terminal,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Globe,
  Shield,
  Settings,
  BrainCircuit,
  Code2,
  Send,
  Bot,
  Play,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

interface RequestHistory {
  id: string;
  method: string;
  url: string;
  timestamp: number;
}

interface ApiIdeProps {
  initialUrl?: string;
  initialMethod?: string;
}

interface AgentPlan {
  method?: string;
  url?: string;
  headers?: string | Record<string, string>;
  body?: string | Record<string, unknown>;
  explanation?: string;
  next_steps?: string[];
  auto_send?: boolean;
}

const GEMINI_KEY_STORAGE = 'nexus_gemini_api_key';
const OPENAI_KEY_STORAGE = 'nexus_openai_api_key';

export const ApiIde: React.FC<ApiIdeProps> = ({ initialUrl, initialMethod }) => {
  const [method, setMethod] = useState(initialMethod || 'GET');
  const [url, setUrl] = useState(initialUrl || 'https://jsonplaceholder.typicode.com/todos/1');
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [response, setResponse] = useState<any>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [copied, setCopied] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'headers' | 'body' | 'response'>('headers');

  const RATE_LIMIT = 5;
  const TIME_WINDOW = 60000;

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
    if (initialMethod) setMethod(initialMethod);
  }, [initialUrl, initialMethod]);

  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiNextSteps, setAiNextSteps] = useState<string[]>([]);
  const [autoRan, setAutoRan] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [openAiApiKey, setOpenAiApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileAgentPanel, setShowMobileAgentPanel] = useState(false);

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCustomApiKey(localStorage.getItem(GEMINI_KEY_STORAGE) || '');
    setOpenAiApiKey(localStorage.getItem(OPENAI_KEY_STORAGE) || '');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (customApiKey) {
      localStorage.setItem(GEMINI_KEY_STORAGE, customApiKey);
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
  }, [customApiKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (openAiApiKey) {
      localStorage.setItem(OPENAI_KEY_STORAGE, openAiApiKey);
    } else {
      localStorage.removeItem(OPENAI_KEY_STORAGE);
    }
  }, [openAiApiKey]);

  const normalizeJsonInput = (value: unknown, fallback: string) => {
    if (!value) return fallback;
    if (typeof value === 'string') return value;
    return JSON.stringify(value, null, 2);
  };

  const sendRequest = async (override?: {
    method?: string;
    url?: string;
    headers?: string;
    body?: string;
  }) => {
    if (requestCount >= RATE_LIMIT) {
      setShowWaitlist(true);
      return;
    }

    const nextMethod = override?.method || method;
    const nextUrl = override?.url || url;
    const nextHeaders = override?.headers ?? headers;
    const nextBody = override?.body ?? body;

    setLoading(true);
    setError(null);
    setResponse(null);
    setStatusCode(null);

    try {
      const parsedHeaders = JSON.parse(nextHeaders);
      const parsedBody = nextMethod !== 'GET' ? JSON.parse(nextBody) : undefined;
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(nextUrl)}`;

      const res = await axios({
        method: nextMethod,
        url: proxyUrl,
        headers: parsedHeaders,
        data: parsedBody,
      });

      setStatusCode(res.status);
      setResponse(res.data);
      setMobileWorkspaceTab('response');
      setRequestCount((prev) => prev + 1);

      setTimeout(() => {
        setRequestCount((prev) => Math.max(0, prev - 1));
      }, TIME_WINDOW);

      const newHistory: RequestHistory = {
        id: Math.random().toString(36).slice(2, 11),
        method: nextMethod,
        url: nextUrl,
        timestamp: Date.now(),
      };
      setHistory((prev) => [newHistory, ...prev].slice(0, 10));
    } catch (err: any) {
      setStatusCode(err.response?.status || null);
      setError(err.response?.data?.details || err.message || 'Request failed');
      if (err.response?.data) setResponse(err.response.data);
      setMobileWorkspaceTab('response');
    } finally {
      setLoading(false);
    }
  };

  const buildAgentPrompt = () => {
    return `You are Nexus Agent, an execution-oriented API copilot.

You MUST return only valid JSON with these fields:
{
  "method": "GET | POST | PUT | PATCH | DELETE",
  "url": "full url",
  "headers": "JSON string",
  "body": "JSON string",
  "explanation": "What you changed and why in under 80 words",
  "next_steps": ["step 1", "step 2"],
  "auto_send": true or false
}

Rules:
- Make concrete updates, not generic advice.
- If user intent is clear, set auto_send=true.
- If user asks for risky or unclear changes, set auto_send=false.
- Keep headers/body as valid JSON strings.
- Never return markdown.

User request:
"${aiPrompt}"

Current request state:
Method: ${method}
URL: ${url}
Headers: ${headers}
Body: ${body}`;
  };

  const handleAiPrompt = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    setAiNextSteps([]);
    setAutoRan(false);

    try {
      if (!customApiKey && !openAiApiKey) {
        throw new Error('Add a Gemini or OpenAI key in settings to run the AI Agent.');
      }

      let data: AgentPlan = {};

      if (customApiKey) {
        const ai = new GoogleGenAI({ apiKey: customApiKey });
        const model = 'gemini-3-flash-preview';
        const result = await ai.models.generateContent({
          model,
          contents: buildAgentPrompt(),
          config: { responseMimeType: 'application/json' },
        });
        data = JSON.parse(result.text || '{}');
      } else if (openAiApiKey) {
        const openAiRes = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an execution-oriented API agent. Return only a JSON object with method,url,headers,body,explanation,next_steps,auto_send.',
              },
              {
                role: 'user',
                content: buildAgentPrompt(),
              },
            ],
            response_format: { type: 'json_object' },
          },
          {
            headers: {
              Authorization: `Bearer ${openAiApiKey}`,
              'Content-Type': 'application/json',
            },
          },
        );

        const content = openAiRes.data.choices[0]?.message?.content;
        data = typeof content === 'string' ? JSON.parse(content) : {};
      }

      const nextMethod = data.method || method;
      const nextUrl = data.url || url;
      const nextHeaders = normalizeJsonInput(data.headers, headers);
      const nextBody = normalizeJsonInput(data.body, body);

      if (data.method) setMethod(data.method);
      if (data.url) setUrl(data.url);
      if (data.headers) setHeaders(nextHeaders);
      if (data.body) setBody(nextBody);

      if (Array.isArray(data.next_steps)) {
        setAiNextSteps(data.next_steps.filter(Boolean).slice(0, 4));
      }

      if (data.explanation) setAiResponse(data.explanation);

      const shouldAutoSend = Boolean(data.auto_send);
      if (shouldAutoSend) {
        await sendRequest({
          method: nextMethod,
          url: nextUrl,
          headers: nextHeaders,
          body: nextBody,
        });
        setAutoRan(true);
      }

      setAiPrompt('');
    } catch (err: any) {
      setAiResponse(`AI Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const aiPanelBody = (
    <>
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3 pb-5 border-b border-zinc-800"
            >
              <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-widest">Configuration</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-600 font-mono">Gemini API Key</label>
                  <input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="Enter Gemini Key"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-zinc-600 font-mono">OpenAI API Key</label>
                  <input
                    type="password"
                    value={openAiApiKey}
                    onChange={(e) => setOpenAiApiKey(e.target.value)}
                    placeholder="Enter OpenAI Key"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  />
                </div>
                <p className="text-[10px] text-zinc-600 leading-tight">
                  Keys stay in your browser storage and are used client-side during this phase.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono uppercase tracking-widest">
            <Bot size={12} />
            <span>Agent Mode</span>
          </div>
          <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
            <li>Builds and edits request config</li>
            <li>Can auto-run when intent is clear</li>
            <li>Returns immediate next actions</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-widest">Quick Tasks</p>
          <div className="grid grid-cols-1 gap-2">
            {[
              'Create an authenticated GET request for this endpoint',
              'Turn this into a POST create-user request with valid JSON body',
              'Harden headers and explain any required auth format',
            ].map((quick) => (
              <button
                key={quick}
                onClick={() => setAiPrompt(quick)}
                className="text-left text-xs px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/60 text-zinc-300 transition-colors"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-widest">Instruction</p>
          <div className="relative">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Tell the agent what to do, e.g. Build a Stripe customer create request and run it."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-700 min-h-[170px] resize-none transition-all"
            />
            <button
              onClick={handleAiPrompt}
              disabled={aiLoading || !aiPrompt.trim()}
              className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-zinc-100 disabled:text-zinc-700 rounded-lg text-xs font-semibold transition-all"
            >
              {aiLoading ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} />}
              <span>Run Agent</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {aiResponse && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3"
            >
              <div className="flex items-center gap-2 text-[11px] text-amber-500 font-mono uppercase tracking-widest">
                <Sparkles size={12} />
                <span>Agent Update</span>
                {autoRan && <span className="text-emerald-500">Auto-Ran</span>}
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{aiResponse}</p>
              {aiNextSteps.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {aiNextSteps.map((step, idx) => (
                    <p key={`${step}-${idx}`} className="text-xs text-zinc-400">
                      {idx + 1}. {step}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3 pt-4 border-t border-zinc-800">
          <p className="text-[11px] text-zinc-500 font-mono uppercase tracking-widest">Recent History</p>
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setMethod(item.method);
                    setUrl(item.url);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 bg-zinc-900/50 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-all text-left group"
                >
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter',
                      item.method === 'GET'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : item.method === 'POST'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-zinc-700 text-zinc-400',
                    )}
                  >
                    {item.method}
                  </span>
                  <span className="flex-1 text-[11px] text-zinc-400 truncate font-mono group-hover:text-zinc-200 transition-colors">
                    {item.url}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-zinc-700 italic">No history yet</p>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
        <div className="flex items-center gap-2 text-[11px] text-zinc-600 font-mono">
          <Settings size={12} />
          <span>Proxy Enabled</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950">
      <AnimatePresence>
        {showWaitlist && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-amber-500" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-zinc-100">Rate Limit Reached</h2>
                <p className="text-zinc-400 text-sm">
                  You&apos;ve reached the free tier limit. Join the Nexus waitlist for unlimited access and{' '}
                  <span className="text-amber-500 font-bold">included AI Assistant</span>.
                </p>
              </div>

              <form name="waitlist" method="POST" data-netlify="true" className="space-y-4">
                <input type="hidden" name="form-name" value="waitlist" />
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="dev@example.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-950 py-3 rounded-xl font-bold transition-all shadow-lg shadow-white/5"
                >
                  Join Waitlist
                </button>
                <button
                  type="button"
                  onClick={() => setShowWaitlist(false)}
                  className="w-full text-zinc-500 hover:text-zinc-300 text-xs font-medium transition-colors"
                >
                  Maybe Later
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col xl:flex-row min-h-0">
        <div className="flex-1 flex flex-col min-w-0 xl:border-r border-zinc-800">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/20">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 flex gap-2">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all"
                >
                  {methods.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <div className="flex-1 relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-2 sm:w-auto">
                <button
                  onClick={() => {
                    setUrl('');
                    setHeaders('{\n  "Content-Type": "application/json"\n}');
                    setBody('{}');
                    setResponse(null);
                    setError(null);
                    setStatusCode(null);
                  }}
                  className="flex-1 sm:flex-none p-2.5 text-zinc-600 hover:text-red-400 transition-colors border border-zinc-800 rounded-xl"
                  title="Clear All"
                >
                  <Trash2 size={16} className="mx-auto" />
                </button>
                <button
                  onClick={() => sendRequest()}
                  disabled={loading}
                  className="flex-1 sm:flex-none bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5"
                >
                  {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="md:hidden px-3 py-2 border-b border-zinc-800 bg-zinc-900/30">
              <div className="grid grid-cols-3 gap-2">
                {(['headers', 'body', 'response'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMobileWorkspaceTab(tab)}
                    className={cn(
                      'py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wide transition-all',
                      mobileWorkspaceTab === tab ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900 text-zinc-400 border border-zinc-800',
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:hidden flex-1 min-h-0">
              {mobileWorkspaceTab === 'headers' && (
                <div className="h-full flex flex-col min-h-0">
                  <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Headers (JSON)</span>
                    <Shield size={12} className="text-zinc-700" />
                  </div>
                  <textarea
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    className="flex-1 bg-zinc-950 p-4 text-xs text-emerald-400 font-mono resize-none focus:outline-none custom-scrollbar"
                    spellCheck={false}
                  />
                </div>
              )}

              {mobileWorkspaceTab === 'body' && (
                <div className="h-full flex flex-col min-h-0">
                  <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Body (JSON)</span>
                    <Code2 size={12} className="text-zinc-700" />
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={method === 'GET'}
                    className={cn(
                      'flex-1 bg-zinc-950 p-4 text-xs text-blue-400 font-mono resize-none focus:outline-none custom-scrollbar',
                      method === 'GET' && 'opacity-50 cursor-not-allowed',
                    )}
                    spellCheck={false}
                  />
                </div>
              )}

              {mobileWorkspaceTab === 'response' && (
                <div className="h-full flex flex-col min-h-0 relative">
                  <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Response</span>
                      {statusCode && (
                        <span
                          className={cn(
                            'text-[10px] font-mono',
                            statusCode >= 200 && statusCode < 300 ? 'text-emerald-500' : 'text-amber-500',
                          )}
                        >
                          {statusCode}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={copyToClipboard} className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors">
                        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                      <button
                        onClick={() => {
                          setResponse(null);
                          setStatusCode(null);
                        }}
                        className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 bg-zinc-950 overflow-auto p-4 custom-scrollbar">
                    {loading ? (
                      <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-700">
                        <Loader2 className="animate-spin" size={24} />
                        <span className="text-[10px] font-mono uppercase tracking-widest">Waiting for response...</span>
                      </div>
                    ) : error ? (
                      <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-3">
                        <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-red-400 font-mono uppercase">Request Error</p>
                          <p className="text-xs text-zinc-400 font-mono leading-relaxed">{error}</p>
                        </div>
                      </div>
                    ) : response ? (
                      <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-800 gap-2">
                        <Terminal size={32} strokeWidth={1} />
                        <p className="text-[10px] font-mono uppercase tracking-widest">No request sent yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:grid flex-1 grid-rows-2 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 border-b border-zinc-800 min-h-0">
                <div className="flex flex-col border-r border-zinc-800 min-h-0">
                  <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Headers (JSON)</span>
                    <Shield size={12} className="text-zinc-700" />
                  </div>
                  <textarea
                    value={headers}
                    onChange={(e) => setHeaders(e.target.value)}
                    className="flex-1 bg-zinc-950 p-4 text-xs text-emerald-400 font-mono resize-none focus:outline-none custom-scrollbar"
                    spellCheck={false}
                  />
                </div>
                <div className="flex flex-col min-h-0">
                  <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Body (JSON)</span>
                    <Code2 size={12} className="text-zinc-700" />
                  </div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={method === 'GET'}
                    className={cn(
                      'flex-1 bg-zinc-950 p-4 text-xs text-blue-400 font-mono resize-none focus:outline-none custom-scrollbar',
                      method === 'GET' && 'opacity-50 cursor-not-allowed',
                    )}
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className="flex flex-col min-h-0 relative">
                <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-900/40 flex items-center justify-between sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Response</span>
                    {statusCode && (
                      <span
                        className={cn(
                          'text-[10px] font-mono',
                          statusCode >= 200 && statusCode < 300 ? 'text-emerald-500' : 'text-amber-500',
                        )}
                      >
                        {statusCode}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={copyToClipboard} className="p-1.5 text-zinc-600 hover:text-zinc-400 transition-colors">
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        setResponse(null);
                        setStatusCode(null);
                      }}
                      className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-zinc-950 overflow-auto p-4 custom-scrollbar">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-zinc-700">
                      <Loader2 className="animate-spin" size={24} />
                      <span className="text-[10px] font-mono uppercase tracking-widest">Waiting for response...</span>
                    </div>
                  ) : error ? (
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-3">
                      <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-red-400 font-mono uppercase">Request Error</p>
                        <p className="text-xs text-zinc-400 font-mono leading-relaxed">{error}</p>
                      </div>
                    </div>
                  ) : response ? (
                    <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-800 gap-2">
                      <Terminal size={32} strokeWidth={1} />
                      <p className="text-[10px] font-mono uppercase tracking-widest">No request sent yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden xl:flex xl:w-[420px] 2xl:w-[460px] shrink-0 flex-col bg-zinc-900/30 backdrop-blur-xl border-l border-zinc-800">
          <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
                <BrainCircuit size={16} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 tracking-tight">AI Agent</h3>
                <p className="text-[11px] text-zinc-500">Plans and can run requests for you</p>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                'p-2 rounded-lg transition-all',
                showSettings ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-600 hover:text-zinc-400',
              )}
            >
              <Settings size={15} />
            </button>
          </div>
          {aiPanelBody}
        </div>
      </div>

      <button
        onClick={() => setShowMobileAgentPanel(true)}
        className="xl:hidden fixed bottom-4 right-4 z-40 bg-zinc-100 text-zinc-950 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-black/30"
      >
        Open AI Agent
      </button>

      <AnimatePresence>
        {showMobileAgentPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="xl:hidden fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setShowMobileAgentPanel(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 260 }}
              className="absolute inset-x-0 bottom-0 h-[86vh] bg-zinc-900 border-t border-zinc-800 rounded-t-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/20 flex items-center justify-center">
                    <BrainCircuit size={16} className="text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 tracking-tight">AI Agent</h3>
                    <p className="text-[11px] text-zinc-500">Mobile agent workspace</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      showSettings ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-600 hover:text-zinc-400',
                    )}
                  >
                    <Settings size={15} />
                  </button>
                  <button
                    onClick={() => setShowMobileAgentPanel(false)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
              {aiPanelBody}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
