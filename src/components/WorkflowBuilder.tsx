import React, { useState } from 'react';
import {
  WorkflowDefinition,
  WorkflowStep,
  StepExecutionResult,
  interpolateTemplate,
  extractSuggestedVariables,
  WorkflowContext,
} from '../lib/workflowEngine';
import { executeHttpRequest, TransportMode } from '../lib/httpClient';
import { extractQueryParams } from '../lib/curlParser';
import { JsonTree } from './JsonTree';
import {
  Play,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowDown,
  SlidersHorizontal,
  GitBranch,
  Download,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface WorkflowBuilderProps {
  workflows: WorkflowDefinition[];
  onChangeWorkflows: (next: WorkflowDefinition[]) => void;
  onExportWorkspace: () => void;
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflows,
  onChangeWorkflows,
  onExportWorkspace,
}) => {
  const [activeId, setActiveId] = useState<string>(workflows[0]?.id || '');
  const [transport, setTransport] = useState<TransportMode>('direct');
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, StepExecutionResult>>({});
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [envPairs, setEnvPairs] = useState<Array<{ key: string; value: string }>>([
    { key: 'GITHUB_USER', value: 'octocat' },
  ]);
  const [showEnv, setShowEnv] = useState(false);

  const activeWorkflow = workflows.find((w) => w.id === activeId) || workflows[0];

  const updateActiveWorkflow = (updater: (wf: WorkflowDefinition) => WorkflowDefinition) => {
    if (!activeWorkflow) return;
    onChangeWorkflows(workflows.map((w) => (w.id === activeWorkflow.id ? updater(w) : w)));
  };

  const addWorkflow = () => {
    const newWf: WorkflowDefinition = {
      id: `wf-${Date.now()}`,
      name: `Custom Chain ${workflows.length + 1}`,
      description: 'Multi-step API workflow with {{step1.data.field}} variable chaining.',
      steps: [
        {
          id: `st-${Date.now()}-1`,
          alias: 'step1',
          name: 'Step 1 — Fetch Resource',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/users/1',
          headers: [{ id: `h-${Date.now()}`, key: 'Accept', value: 'application/json', enabled: true }],
          body: '',
        },
        {
          id: `st-${Date.now()}-2`,
          alias: 'step2',
          name: 'Step 2 — Chain Result',
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/posts?userId={{step1.data.id}}',
          headers: [{ id: `h-${Date.now()}-2`, key: 'Accept', value: 'application/json', enabled: true }],
          body: '',
        },
      ],
    };
    onChangeWorkflows([...workflows, newWf]);
    setActiveId(newWf.id);
    setResults({});
  };

  const addStep = () => {
    if (!activeWorkflow) return;
    const nextIdx = activeWorkflow.steps.length + 1;
    const prevAlias = activeWorkflow.steps[activeWorkflow.steps.length - 1]?.alias || 'step1';
    const nextStep: WorkflowStep = {
      id: `st-${Date.now()}`,
      alias: `step${nextIdx}`,
      name: `Step ${nextIdx}`,
      method: 'GET',
      url: `https://httpbin.org/get?from={{${prevAlias}.data.id}}`,
      headers: [{ id: `sh-${Date.now()}`, key: 'Accept', value: 'application/json', enabled: true }],
      body: '',
    };
    updateActiveWorkflow((wf) => ({ ...wf, steps: [...wf.steps, nextStep] }));
  };

  const updateStep = (stepId: string, patch: Partial<WorkflowStep>) => {
    updateActiveWorkflow((wf) => ({
      ...wf,
      steps: wf.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
    }));
  };

  const removeStep = (stepId: string) => {
    updateActiveWorkflow((wf) => ({
      ...wf,
      steps: wf.steps.filter((s) => s.id !== stepId),
    }));
  };

  const copyToken = (token: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(token).catch(() => {});
    }
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  const runChain = async () => {
    if (!activeWorkflow || running) return;
    setRunning(true);
    setResults({});

    const envRecord: Record<string, string> = {};
    for (const pair of envPairs) {
      if (pair.key.trim()) envRecord[pair.key.trim()] = pair.value;
    }

    const ctx: WorkflowContext = { steps: {}, env: envRecord };

    for (let i = 0; i < activeWorkflow.steps.length; i++) {
      const step = activeWorkflow.steps[i];
      const urlInterp = interpolateTemplate(step.url, ctx);
      const bodyInterp = interpolateTemplate(step.body || '', ctx);
      const missingVars = [...urlInterp.missing, ...bodyInterp.missing];

      const resolvedHeaders = step.headers.map((h) => ({
        ...h,
        value: interpolateTemplate(h.value, ctx).value,
      }));

      setResults((prev) => ({
        ...prev,
        [step.id]: {
          stepId: step.id,
          alias: step.alias,
          status: 'running',
          resolvedUrl: urlInterp.value,
          statusCode: null,
          durationMs: null,
          sizeBytes: null,
          data: null,
          missingVars,
        },
      }));

      const { baseUrl, params } = extractQueryParams(urlInterp.value);
      const exec = await executeHttpRequest({
        method: step.method,
        baseUrl,
        queryParams: params,
        headers: resolvedHeaders,
        body: bodyInterp.value,
        transport,
      });

      const stepResult: StepExecutionResult = {
        stepId: step.id,
        alias: step.alias,
        status: exec.ok ? 'success' : 'error',
        resolvedUrl: urlInterp.value,
        statusCode: exec.status,
        durationMs: exec.durationMs,
        sizeBytes: exec.sizeBytes,
        data: exec.data,
        error: exec.error,
        missingVars,
        modeUsed: exec.transportUsed,
      };

      setResults((prev) => ({ ...prev, [step.id]: stepResult }));

      // Register under both custom alias and canonical step{N}
      const ctxEntry = { status: exec.status, data: exec.data };
      ctx.steps[step.alias] = ctxEntry;
      ctx.steps[`step${i + 1}`] = ctxEntry;

      if (!exec.ok) {
        break;
      }
    }

    setRunning(false);
  };

  if (!activeWorkflow) {
    return null;
  }

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Saved Workflows */}
        <aside className="lg:col-span-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-zinc-400">
              Workflow Chains
            </span>
            <button
              type="button"
              onClick={addWorkflow}
              className="min-h-[34px] px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium flex items-center gap-1"
            >
              <Plus size={13} />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {workflows.map((wf) => (
              <button
                key={wf.id}
                type="button"
                onClick={() => {
                  setActiveId(wf.id);
                  setResults({});
                }}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-colors space-y-1',
                  wf.id === activeWorkflow.id
                    ? 'bg-amber-500/10 border-amber-500/40 text-zinc-100'
                    : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold truncate">{wf.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                    {wf.steps.length} steps
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 line-clamp-2">{wf.description}</p>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <p className="text-[11px] font-mono text-zinc-500 leading-relaxed">
              Reference upstream outputs anywhere in URL, headers, or body with{' '}
              <code className="text-amber-400">{'{{step1.data.field}}'}</code> or{' '}
              <code className="text-amber-400">{'{{env.VAR}}'}</code>.
            </p>
            <button
              type="button"
              onClick={onExportWorkspace}
              className="w-full min-h-[38px] rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <Download size={13} />
              <span>Export Chains JSON</span>
            </button>
          </div>
        </aside>

        {/* Right Canvas: Chain Execution & Step Editor */}
        <div className="lg:col-span-9 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400">
                <GitBranch size={12} />
                <span>Sequential Pipeline</span>
              </div>
              <input
                type="text"
                value={activeWorkflow.name}
                onChange={(e) =>
                  updateActiveWorkflow((wf) => ({ ...wf, name: e.target.value }))
                }
                aria-label="Workflow name"
                className="w-full bg-transparent text-lg sm:text-xl font-display font-semibold text-zinc-100 focus:outline-none focus:underline"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={transport}
                onChange={(e) => setTransport(e.target.value as TransportMode)}
                aria-label="Workflow transport mode"
                className="min-h-[42px] bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500/60"
              >
                <option value="direct">Direct (CORS)</option>
                <option value="proxy">Server Proxy</option>
                <option value="mock">Offline Mock</option>
              </select>

              <button
                type="button"
                onClick={() => setShowEnv((v) => !v)}
                className={cn(
                  'min-h-[42px] px-3.5 rounded-xl border text-xs font-medium flex items-center gap-1.5',
                  showEnv
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700',
                )}
              >
                <SlidersHorizontal size={13} />
                <span>Env ({envPairs.length})</span>
              </button>

              <button
                type="button"
                onClick={runChain}
                disabled={running || activeWorkflow.steps.length === 0}
                className="min-h-[42px] px-5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                <span>{running ? 'Running Chain...' : 'Run All Steps'}</span>
              </button>
            </div>
          </div>

          {showEnv && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Environment Variables ({'{{env.KEY}}'})
                </span>
                <button
                  type="button"
                  onClick={() => setEnvPairs((prev) => [...prev, { key: '', value: '' }])}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  + Add Variable
                </button>
              </div>
              <div className="space-y-2">
                {envPairs.map((pair, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={pair.key}
                      onChange={(e) =>
                        setEnvPairs((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, key: e.target.value } : p)),
                        )
                      }
                      placeholder="KEY"
                      className="w-40 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100"
                    />
                    <input
                      type="text"
                      value={pair.value}
                      onChange={(e) =>
                        setEnvPairs((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, value: e.target.value } : p)),
                        )
                      }
                      placeholder="value"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-300"
                    />
                    <button
                      type="button"
                      onClick={() => setEnvPairs((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label="Delete env variable"
                      className="p-2 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps Stack */}
          <div className="space-y-3">
            {activeWorkflow.steps.map((step, index) => {
              const res = results[step.id];
              const suggestedVars =
                res?.status === 'success' && res.data
                  ? extractSuggestedVariables(step.alias, res.data, 6)
                  : [];

              return (
                <React.Fragment key={step.id}>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="px-2 py-1 rounded-md bg-zinc-800 text-amber-400 font-mono text-[11px] font-semibold">
                          {step.alias}
                        </span>
                        <input
                          type="text"
                          value={step.name}
                          onChange={(e) => updateStep(step.id, { name: e.target.value })}
                          aria-label={`Step ${index + 1} name`}
                          className="bg-transparent text-sm font-semibold text-zinc-100 focus:outline-none focus:underline min-w-[160px]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        {res && (
                          <span
                            className={cn(
                              'text-[11px] font-mono px-2.5 py-1 rounded-lg border flex items-center gap-1.5',
                              res.status === 'running' &&
                                'bg-sky-500/10 border-sky-500/30 text-sky-300',
                              res.status === 'success' &&
                                'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
                              res.status === 'error' &&
                                'bg-rose-500/10 border-rose-500/30 text-rose-300',
                            )}
                          >
                            {res.status === 'running' && <Loader2 size={12} className="animate-spin" />}
                            {res.status === 'success' && <CheckCircle2 size={12} />}
                            {res.status === 'error' && <AlertCircle size={12} />}
                            <span>
                              {res.status === 'running'
                                ? 'Running...'
                                : `${res.statusCode || 'ERR'} · ${res.durationMs ?? 0}ms`}
                            </span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeStep(step.id)}
                          disabled={activeWorkflow.steps.length <= 1}
                          aria-label={`Remove ${step.name}`}
                          className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 disabled:opacity-30"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={step.method}
                        onChange={(e) => updateStep(step.id, { method: e.target.value })}
                        aria-label={`Step ${index + 1} HTTP method`}
                        className="min-h-[42px] bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-xs font-mono font-semibold text-zinc-100 sm:w-28"
                      >
                        {METHODS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={step.url}
                        onChange={(e) => updateStep(step.id, { url: e.target.value })}
                        placeholder="https://api.example.com/items/{{step1.data.id}}"
                        aria-label={`Step ${index + 1} URL`}
                        className="flex-1 min-h-[42px] bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-amber-500/60"
                      />
                    </div>

                    {!['GET', 'HEAD'].includes(step.method) && (
                      <textarea
                        value={step.body}
                        onChange={(e) => updateStep(step.id, { body: e.target.value })}
                        placeholder='{"userId": "{{step1.data.id}}"}'
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-sky-300 focus:outline-none focus:border-amber-500/60"
                      />
                    )}

                    {/* Execution Result Panel */}
                    {res && res.status !== 'running' && (
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2.5">
                        <div className="text-[11px] font-mono text-zinc-500 truncate">
                          Resolved: <span className="text-zinc-300">{res.resolvedUrl}</span>
                        </div>

                        {res.missingVars.length > 0 && (
                          <div className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5">
                            Unresolved placeholders: {res.missingVars.join(', ')}
                          </div>
                        )}

                        {res.error ? (
                          <p className="text-xs font-mono text-rose-300">{res.error}</p>
                        ) : (
                          <>
                            {suggestedVars.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-mono uppercase text-zinc-500 mr-1">
                                  Extract:
                                </span>
                                {suggestedVars.map((token) => (
                                  <button
                                    key={token}
                                    type="button"
                                    onClick={() => copyToken(token)}
                                    className="px-2 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-amber-300 flex items-center gap-1"
                                  >
                                    <span>{token}</span>
                                    {copiedToken === token ? (
                                      <Check size={11} className="text-emerald-400" />
                                    ) : (
                                      <Copy size={11} className="text-zinc-500" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className="max-h-48 overflow-auto custom-scrollbar">
                              <JsonTree data={res.data} depth={0} />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {index < activeWorkflow.steps.length - 1 && (
                    <div className="flex justify-center">
                      <div className="w-7 h-7 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-500">
                        <ArrowDown size={13} />
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            <button
              type="button"
              onClick={addStep}
              className="w-full min-h-[46px] rounded-2xl border border-dashed border-zinc-700 hover:border-amber-500/60 bg-zinc-900/20 hover:bg-zinc-900/40 text-zinc-300 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={15} />
              <span>Add Chained Step</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
