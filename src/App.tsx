import React, { useState, useEffect } from 'react';
import { initialRegistry, PublicAPI } from './data/registry';
import { ApiIde } from './components/ApiIde';
import { CatalogView } from './components/CatalogView';
import { WorkflowBuilder } from './components/WorkflowBuilder';
import { extractQueryParams, KeyValueItem } from './lib/curlParser';
import {
  loadCollections,
  saveCollections,
  loadWorkflows,
  saveWorkflows,
  loadHistory,
  saveHistory,
  exportWorkspaceJson,
  importWorkspaceJson,
  SavedCollection,
  SavedRequest,
  RequestHistoryItem,
} from './lib/collections';
import { WorkflowDefinition } from './lib/workflowEngine';
import {
  Terminal,
  LayoutGrid,
  GitBranch,
  Coffee,
  Github,
  Copy,
  Check,
  Database,
} from 'lucide-react';
import { cn } from './lib/utils';

type WorkspaceView = 'ide' | 'catalog' | 'workflows';

const STRIPE_COFFEE_URL = 'https://buy.stripe.com/3cIfZg27PdKo2D64Ocfw40X';
const SOLANA_TIP_ADDRESS = 'GG2eQbVh8ut1BK6j1A2tz7pSySdLpD38BgyEhGcxdXoK';

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('ide');

  // Shared IDE Request State
  const [method, setMethod] = useState('GET');
  const [baseUrl, setBaseUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [queryParams, setQueryParams] = useState<KeyValueItem[]>([]);
  const [headers, setHeaders] = useState<KeyValueItem[]>([
    { id: 'init-accept', key: 'Accept', value: 'application/json', enabled: true },
  ]);
  const [body, setBody] = useState(
    JSON.stringify({ title: 'Nexus API Test', body: 'In-browser payload', userId: 1 }, null, 2),
  );

  // Persisted Collections, Workflows, History
  const [collections, setCollections] = useState<SavedCollection[]>(() => loadCollections());
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>(() => loadWorkflows());
  const [history, setHistory] = useState<RequestHistoryItem[]>(() => loadHistory());
  const [copiedSolana, setCopiedSolana] = useState(false);

  useEffect(() => {
    saveCollections(collections);
  }, [collections]);

  useEffect(() => {
    saveWorkflows(workflows);
  }, [workflows]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const handleOpenInIde = (api: PublicAPI) => {
    const { baseUrl: nextBase, params } = extractQueryParams(api.Link);
    setMethod('GET');
    setBaseUrl(nextBase);
    setQueryParams(params);
    setHeaders([{ id: `h-${Date.now()}`, key: 'Accept', value: 'application/json', enabled: true }]);
    setActiveView('ide');
  };

  const handleAddToWorkflow = (api: PublicAPI) => {
    setWorkflows((prev) => {
      if (prev.length === 0) return prev;
      const target = prev[0];
      const nextIdx = target.steps.length + 1;
      const updatedFirst: WorkflowDefinition = {
        ...target,
        steps: [
          ...target.steps,
          {
            id: `wf-add-${Date.now()}`,
            alias: `step${nextIdx}`,
            name: api.API,
            method: 'GET',
            url: api.Link,
            headers: [{ id: `wh-${Date.now()}`, key: 'Accept', value: 'application/json', enabled: true }],
            body: '',
          },
        ],
      };
      return [updatedFirst, ...prev.slice(1)];
    });
    setActiveView('workflows');
  };

  const handleSaveRequest = (collectionId: string, req: SavedRequest) => {
    setCollections((prev) =>
      prev.map((col) =>
        col.id === collectionId ? { ...col, requests: [req, ...col.requests] } : col,
      ),
    );
  };

  const handleDeleteSavedRequest = (collectionId: string, reqId: string) => {
    setCollections((prev) =>
      prev.map((col) =>
        col.id === collectionId
          ? { ...col, requests: col.requests.filter((r) => r.id !== reqId) }
          : col,
      ),
    );
  };

  const handleLoadSavedRequest = (req: SavedRequest) => {
    setMethod(req.method);
    setBaseUrl(req.baseUrl);
    setQueryParams(req.queryParams);
    setHeaders(req.headers);
    setBody(req.body);
  };

  const handleExportWorkspace = () => {
    const json = exportWorkspaceJson(collections, workflows);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nexus-api-workspace.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportWorkspace = (rawJson: string): { ok: boolean; message: string } => {
    try {
      const imported = importWorkspaceJson(rawJson);
      if (imported.collections.length > 0) setCollections(imported.collections);
      if (imported.workflows.length > 0) setWorkflows(imported.workflows);
      return {
        ok: true,
        message: `Imported ${imported.collections.length} collection(s) and ${imported.workflows.length} workflow(s).`,
      };
    } catch (err: unknown) {
      return {
        ok: false,
        message: err instanceof Error ? err.message : 'Failed to import JSON workspace.',
      };
    }
  };

  const handleCopySolana = () => {
    navigator.clipboard.writeText(SOLANA_TIP_ADDRESS).catch(() => {});
    setCopiedSolana(true);
    setTimeout(() => setCopiedSolana(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Workspace Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-800/90 bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0">
              <Database size={18} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-display font-bold tracking-tight text-zinc-100">
                  Nexus API IDE
                </h1>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-amber-400">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-500 hidden sm:block">
                Discover, test & chain public APIs directly in your browser
              </p>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav
            aria-label="Primary workspace navigation"
            className="grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 w-full sm:w-auto"
          >
            {(
              [
                { id: 'ide', label: 'Request IDE', shortLabel: 'IDE', icon: Terminal },
                { id: 'catalog', label: `Catalog (${initialRegistry.length})`, shortLabel: `Catalog (${initialRegistry.length})`, icon: LayoutGrid },
                { id: 'workflows', label: 'Workflow Chains', shortLabel: 'Chains', icon: GitBranch },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveView(item.id)}
                  className={cn(
                    'min-h-[38px] px-2 sm:px-4 rounded-lg text-[11px] sm:text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap',
                    activeView === item.id
                      ? 'bg-zinc-100 text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100',
                  )}
                >
                  <Icon size={13} className="shrink-0" />
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Header Utility Links */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href="https://github.com/1nc0gn30/nexus"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[38px] px-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 text-xs text-zinc-300 hover:text-zinc-100 flex items-center gap-1.5 transition-colors"
            >
              <Github size={14} />
              <span>Source</span>
            </a>
            <a
              href={STRIPE_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[38px] px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-medium text-amber-300 flex items-center gap-1.5 transition-colors"
            >
              <Coffee size={14} />
              <span>Buy Us a Coffee</span>
            </a>
          </div>
        </div>
      </header>

      {/* Active Workspace */}
      <main className="flex-1 flex flex-col">
        {activeView === 'ide' && (
          <ApiIde
            catalog={initialRegistry}
            method={method}
            baseUrl={baseUrl}
            queryParams={queryParams}
            headers={headers}
            body={body}
            onChangeMethod={setMethod}
            onChangeBaseUrl={setBaseUrl}
            onChangeQueryParams={setQueryParams}
            onChangeHeaders={setHeaders}
            onChangeBody={setBody}
            collections={collections}
            onSaveRequest={handleSaveRequest}
            onDeleteSavedRequest={handleDeleteSavedRequest}
            onLoadSavedRequest={handleLoadSavedRequest}
            onExportWorkspace={handleExportWorkspace}
            onImportWorkspace={handleImportWorkspace}
            history={history}
            onPushHistory={(item) => setHistory((prev) => [item, ...prev].slice(0, 25))}
            onClearHistory={() => setHistory([])}
          />
        )}

        {activeView === 'catalog' && (
          <CatalogView
            catalog={initialRegistry}
            onOpenInIde={handleOpenInIde}
            onAddToWorkflow={handleAddToWorkflow}
          />
        )}

        {activeView === 'workflows' && (
          <WorkflowBuilder
            workflows={workflows}
            onChangeWorkflows={setWorkflows}
            onExportWorkspace={handleExportWorkspace}
          />
        )}
      </main>

      {/* Open-Access Attribution & Support Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/90 mt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="space-y-1">
            <p className="text-zinc-300 font-medium">
              Engineered by{' '}
              <a
                href="https://nullai.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-100 hover:text-amber-400 underline underline-offset-4"
              >
                Neal Frazier Tech (@1nc0gn30)
              </a>{' '}
              •{' '}
              <a
                href="https://nullai.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-400"
              >
                NullAI Platform
              </a>
            </p>
            <p className="text-[11px] font-mono text-zinc-500">
              100% open-access developer tool · zero paywalls ·{' '}
              <a
                href="https://github.com/1nc0gn30/nexus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2"
              >
                github.com/1nc0gn30/nexus
              </a>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={STRIPE_COFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[38px] px-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Coffee size={13} />
              <span>Buy Us a Coffee</span>
            </a>

            <button
              type="button"
              onClick={handleCopySolana}
              title={`Copy Solana tip address: ${SOLANA_TIP_ADDRESS}`}
              className="min-h-[38px] px-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors"
            >
              <span>SOL: {SOLANA_TIP_ADDRESS.slice(0, 6)}…{SOLANA_TIP_ADDRESS.slice(-4)}</span>
              {copiedSolana ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} className="text-zinc-500" />
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
