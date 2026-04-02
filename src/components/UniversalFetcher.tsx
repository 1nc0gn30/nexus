import React, { useEffect, useState, useCallback } from 'react';
import { apiHandler } from '@/src/lib/apiHandler';
import { JsonTree } from './JsonTree';
import { Loader2, AlertCircle, ExternalLink, Code, Layout, BookOpen, Sparkles, RefreshCw, Terminal, ChevronRight, Database } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { PublicAPI } from '../data/registry';

interface UniversalFetcherProps {
  api: PublicAPI;
  viewMode: 'card' | 'dev';
  onOpenInIde?: (api: PublicAPI) => void;
}

type Tab = 'data' | 'knowledge' | 'feature';

export const UniversalFetcher: React.FC<UniversalFetcherProps> = ({ api, viewMode, onOpenInIde }) => {
  const { Link: url, Description: description, API: name, PythonExample, JSExample, Feature } = api;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('data');
  const [featureResult, setFeatureResult] = useState<any>(null);
  const [featureLoading, setFeatureLoading] = useState(false);

  const fetchData = useCallback(async (customUrl?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiHandler.fetch(customUrl || url);
      setData(result);
    } catch (err: any) {
      const statusCode = err.response?.status;
      const errorMessage =
        statusCode === 429
          ? 'Rate limited by upstream API (429). Try again later or use your own API key where supported.'
          : err.response?.data?.details || err.message || 'Failed to fetch data';
      setError(errorMessage);
      setData({
        status: "error",
        message: errorMessage,
        code: statusCode || 'NETWORK_ERROR',
        url: customUrl || url,
        timestamp: new Date().toISOString(),
        suggestion: "Could be upstream rate limiting, endpoint downtime, or temporary proxy/network issues."
      });
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const runFeature = async () => {
    if (!Feature) return;
    setFeatureLoading(true);
    try {
      if (Feature.type === 'action' || Feature.type === 'transform') {
        // For now, just re-fetch or simulate
        await fetchData();
        setFeatureResult("Action completed successfully!");
      } else if (Feature.type === 'filter' && Feature.params) {
        const query = new URLSearchParams(Feature.params).toString();
        const filteredUrl = url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
        await fetchData(filteredUrl);
        setFeatureResult(`Filtered by: ${JSON.stringify(Feature.params)}`);
      }
    } catch (err: any) {
      setFeatureResult(`Error: ${err.message}`);
    } finally {
      setFeatureLoading(false);
    }
  };

  const fetchCode = `// Fetching ${name}
const response = await fetch('/api/proxy?url=${encodeURIComponent(url)}');
const data = await response.json();
console.log(data);`;

  const pythonCode = PythonExample || `# Python Example for ${name}
import requests

url = "${url}"
response = requests.get(url)
data = response.json()
print(data)`;

  const jsCode = JSExample || `// JS Example for ${name}
fetch("${url}")
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2 truncate">
              {name}
              <span className="shrink-0 text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded uppercase tracking-wider">
                Proxy
              </span>
            </h3>
            {onOpenInIde && (
              <button 
                onClick={() => onOpenInIde(api)}
                className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                title="Open in API IDE"
              >
                <Terminal size={14} />
              </button>
            )}
          </div>
          <p className="text-[11px] text-zinc-500 truncate">{description}</p>
        </div>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 rounded-lg transition-all"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-2 p-1 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
        <button
          onClick={() => setActiveTab('data')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md text-[10px] font-medium transition-all",
            activeTab === 'data' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <Database size={12} />
          Data
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md text-[10px] font-medium transition-all",
            activeTab === 'knowledge' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          <BookOpen size={12} />
          Knowledge
        </button>
        {Feature && (
          <button
            onClick={() => setActiveTab('feature')}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md text-[10px] font-medium transition-all",
              activeTab === 'feature' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Sparkles size={12} />
            Feature
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-zinc-950/50 rounded-xl border border-zinc-800/50 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'data' ? (
            <motion.div 
              key="data-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full relative"
            >
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-[10px] font-mono uppercase tracking-widest">Fetching...</span>
                </div>
              ) : (
                <div className="h-full overflow-auto p-3 custom-scrollbar">
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                      <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[10px] text-red-400 font-mono uppercase font-bold tracking-wider">Request Issue</p>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{error}</p>
                        <button 
                          onClick={() => fetchData()}
                          className="text-[10px] text-zinc-300 underline hover:text-white transition-colors"
                        >
                          Retry Connection
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {viewMode === 'dev' ? (
                    <JsonTree data={data} />
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(data || {}).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1">
                          <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-wider">{key}</span>
                          <span className="text-xs text-zinc-300 break-words font-medium">
                            {typeof value === 'object' ? JSON.stringify(value).slice(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '') : String(value)}
                          </span>
                        </div>
                      ))}
                      {Object.keys(data || {}).length > 8 && (
                        <p className="text-[10px] text-zinc-600 italic border-t border-zinc-800/50 pt-2">
                          + {Object.keys(data || {}).length - 8} more fields available in Dev View
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'knowledge' ? (
            <motion.div 
              key="knowledge-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full overflow-auto p-4 custom-scrollbar space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                  <Terminal size={12} />
                  <span>Fetch Logic</span>
                </div>
                <pre className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-[10px] text-emerald-400 font-mono overflow-x-auto whitespace-pre-wrap">
                  {fetchCode}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                  <ChevronRight size={12} />
                  <span>Python Usage</span>
                </div>
                <pre className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-[10px] text-blue-400 font-mono overflow-x-auto whitespace-pre-wrap">
                  {pythonCode}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                  <ChevronRight size={12} />
                  <span>JS Usage</span>
                </div>
                <pre className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-[10px] text-amber-400 font-mono overflow-x-auto whitespace-pre-wrap">
                  {jsCode}
                </pre>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="feature-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="h-full overflow-auto p-6 flex flex-col items-center gap-4 custom-scrollbar"
            >
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 text-amber-500 shrink-0">
                <Sparkles size={24} />
              </div>
              <div className="space-y-1 text-center">
                <h4 className="text-sm font-bold text-zinc-100">{Feature?.name}</h4>
                <p className="text-xs text-zinc-500">{Feature?.description}</p>
              </div>
              
              <button
                onClick={runFeature}
                disabled={featureLoading}
                className="w-full shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-600 rounded-xl text-xs font-bold transition-all shadow-lg shadow-white/5"
              >
                {featureLoading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                {Feature?.type === 'action' ? 'Execute Action' : 'Apply Transform'}
              </button>

              {featureResult && (
                <div className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-left overflow-auto max-h-48 custom-scrollbar">
                  <p className="text-[10px] text-zinc-500 font-mono uppercase mb-1 sticky top-0 bg-zinc-900 pb-1">Result</p>
                  <p className="text-[11px] text-zinc-300 font-mono break-words whitespace-pre-wrap">{featureResult}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
