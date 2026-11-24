import React, { useMemo, useState } from 'react';
import { PublicAPI } from '../data/registry';
import { getOfflineMockPayload } from '../lib/samplePreviews';
import { executeHttpRequest, ExecutionResult } from '../lib/httpClient';
import { JsonTree } from './JsonTree';
import {
  Search,
  Terminal,
  Play,
  GitBranch,
  ExternalLink,
  Loader2,
  Eye,
  X,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Filter,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CatalogViewProps {
  catalog: PublicAPI[];
  onOpenInIde: (api: PublicAPI) => void;
  onAddToWorkflow: (api: PublicAPI) => void;
}

const PAGE_SIZE = 24;

export const CatalogView: React.FC<CatalogViewProps> = ({
  catalog,
  onOpenInIde,
  onAddToWorkflow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [corsOnly, setCorsOnly] = useState(false);
  const [page, setPage] = useState(1);

  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [liveResults, setLiveResults] = useState<Record<string, ExecutionResult>>({});

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const api of catalog) {
      counts.set(api.Category, (counts.get(api.Category) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return catalog.filter((api) => {
      if (corsOnly && api.Cors.toLowerCase() !== 'yes') return false;
      if (activeCategory !== 'All' && api.Category !== activeCategory) return false;
      if (!q) return true;
      return (
        api.API.toLowerCase().includes(q) ||
        api.Description.toLowerCase().includes(q) ||
        api.Category.toLowerCase().includes(q) ||
        api.Link.toLowerCase().includes(q)
      );
    });
  }, [catalog, searchQuery, activeCategory, corsOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const corsCount = useMemo(
    () => catalog.filter((a) => a.Cors.toLowerCase() === 'yes').length,
    [catalog],
  );

  const handleTestLive = async (key: string, api: PublicAPI) => {
    setTestingKey(key);
    setPreviewKey(key);
    const transport = api.Cors.toLowerCase() === 'yes' ? 'direct' : 'proxy';
    const result = await executeHttpRequest({
      method: 'GET',
      baseUrl: api.Link,
      queryParams: [],
      headers: [{ id: 'cat-accept', key: 'Accept', value: 'application/json', enabled: true }],
      body: '',
      transport,
    });
    setLiveResults((prev) => ({ ...prev, [key]: result }));
    setTestingKey(null);
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Filter Bar */}
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-400">
                Public API Registry
              </span>
              <span className="text-xs font-mono text-zinc-500">
                {catalog.length} endpoints · {corsCount} CORS-direct
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-zinc-100">
              Discover & inspect public endpoints
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 sm:w-80">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, category, or URL..."
                aria-label="Search public APIs"
                className="w-full min-h-[44px] bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-500/60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setCorsOnly((v) => !v);
                setPage(1);
              }}
              aria-pressed={corsOnly}
              className={cn(
                'min-h-[44px] px-4 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap',
                corsOnly
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700',
              )}
            >
              <Globe size={14} />
              <span>CORS-Direct Only</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1 shrink-0 mr-1">
            <Filter size={11} />
            Category
          </span>
          <button
            type="button"
            onClick={() => {
              setActiveCategory('All');
              setPage(1);
            }}
            className={cn(
              'shrink-0 min-h-[34px] px-3 rounded-lg text-xs font-medium transition-colors',
              activeCategory === 'All'
                ? 'bg-amber-500 text-zinc-950 font-semibold'
                : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700',
            )}
          >
            All ({catalog.length})
          </button>
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setPage(1);
              }}
              className={cn(
                'shrink-0 min-h-[34px] px-3 rounded-lg text-xs font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700',
              )}
            >
              {cat} ({count})
            </button>
          ))}
        </div>
      </section>

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <p className="font-mono">
          Showing <span className="text-zinc-100">{visibleItems.length}</span> of{' '}
          <span className="text-zinc-100">{filtered.length}</span> matching endpoints — zero
          background polling; inspect offline schemas or click Test Live.
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-[36px] px-3 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 disabled:opacity-40 hover:border-zinc-700"
            >
              Prev
            </button>
            <span className="font-mono text-zinc-400">
              Page {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="min-h-[36px] px-3 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 disabled:opacity-40 hover:border-zinc-700"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Cards Grid */}
      {visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 py-16 px-6 text-center space-y-3">
          <p className="text-base font-medium text-zinc-200">No endpoints match those filters</p>
          <p className="text-sm text-zinc-500">
            Clear the search query or turn off CORS-Direct Only to view all {catalog.length} APIs.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('All');
              setCorsOnly(false);
              setPage(1);
            }}
            className="min-h-[44px] px-5 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleItems.map((api, idx) => {
            const key = `${api.API}-${api.Link}-${idx}`;
            const isCorsDirect = api.Cors.toLowerCase() === 'yes';
            const live = liveResults[key];
            const isExpanded = previewKey === key;
            const isTesting = testingKey === key;

            return (
              <article
                key={key}
                className="rounded-2xl border border-zinc-800/90 bg-zinc-900/40 hover:border-zinc-700 transition-colors p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2.5 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-zinc-100 truncate">{api.API}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{api.Description}</p>
                    </div>
                    <a
                      href={api.Link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${api.API} URL in new tab`}
                      aria-label={`Open ${api.API} URL`}
                      className="shrink-0 p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      GET
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {api.Category}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-mono px-2 py-0.5 rounded border',
                        isCorsDirect
                          ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/20',
                      )}
                    >
                      {isCorsDirect ? 'CORS Direct' : 'Proxy / Mock'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                      {api.Auth ? api.Auth : 'No Auth'}
                    </span>
                  </div>

                  <p className="text-[11px] font-mono text-zinc-500 bg-zinc-950/80 border border-zinc-800/70 rounded-lg px-2.5 py-1.5 truncate">
                    {api.Link}
                  </p>
                </div>

                {/* Expandable Schema / Live Preview Drawer */}
                {isExpanded && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      {live ? (
                        <span
                          className={cn(
                            'flex items-center gap-1.5',
                            live.ok ? 'text-emerald-400' : 'text-amber-400',
                          )}
                        >
                          {live.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {live.status ? `HTTP ${live.status}` : 'Network'} · {live.durationMs}ms ·{' '}
                          {live.transportUsed}
                        </span>
                      ) : (
                        <span className="text-amber-400">Offline Schema Preview</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewKey(null)}
                        aria-label="Close preview"
                        className="text-zinc-500 hover:text-zinc-200"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    {live?.error ? (
                      <p className="text-xs font-mono text-rose-300 leading-relaxed">{live.error}</p>
                    ) : (
                      <div className="max-h-48 overflow-auto custom-scrollbar">
                        <JsonTree
                          data={live ? live.data : getOfflineMockPayload(api.Link, api)}
                          depth={0}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Action Row */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpenInIde(api)}
                    className="min-h-[40px] px-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Terminal size={13} />
                    <span>Open IDE</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestLive(key, api)}
                    disabled={isTesting}
                    className="min-h-[40px] px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isTesting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                    <span>Test Live</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      isExpanded && !live
                        ? onAddToWorkflow(api)
                        : setPreviewKey(isExpanded ? null : key)
                    }
                    className="min-h-[40px] px-2.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:border-zinc-700 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Eye size={13} />
                    <span>{isExpanded ? 'Hide' : 'Schema'}</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onAddToWorkflow(api)}
                  className="w-full min-h-[34px] rounded-lg border border-zinc-800/70 hover:border-amber-500/40 bg-zinc-950/60 text-zinc-400 hover:text-amber-300 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-colors"
                >
                  <GitBranch size={12} />
                  <span>Append to Workflow Chain</span>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
