import React, { useState, useMemo } from 'react';
import { initialRegistry, PublicAPI } from './data/registry';
import { CategoryScreener } from './components/CategoryScreener';
import { UniversalFetcher } from './components/UniversalFetcher';
import { ApiIde } from './components/ApiIde';
import { VoiceSearch } from './components/VoiceSearch';
import { Search, LayoutGrid, Code2, Database, Zap, Info, Github, Sparkles, Terminal } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'card' | 'dev'>('card');
  const [currentView, setCurrentView] = useState<'discovery' | 'ide'>('discovery');
  const [ideConfig, setIdeConfig] = useState<{ url?: string; method?: string }>({});

  const handleOpenInIde = (api: PublicAPI) => {
    setIdeConfig({ url: api.Link, method: 'GET' });
    setCurrentView('ide');
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(initialRegistry.map(api => api.Category)));
    return cats.sort();
  }, []);

  const filteredAPIs = useMemo(() => {
    return initialRegistry.filter(api => {
      const matchesSearch = api.API.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          api.Description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || api.Category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-zinc-800 p-4 md:p-6 flex flex-col gap-4 md:gap-8 bg-zinc-950/50 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shadow-lg shadow-zinc-100/10">
            <Database className="text-zinc-950" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter text-zinc-100 uppercase">Nexus</h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">API Explorer</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest px-3">Mode</h2>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => setCurrentView('discovery')}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  currentView === 'discovery' ? "bg-zinc-100 text-zinc-950 font-bold shadow-lg shadow-zinc-100/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                )}
              >
                <LayoutGrid size={16} />
                <span>Discovery</span>
              </button>
              <button 
                onClick={() => setCurrentView('ide')}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  currentView === 'ide' ? "bg-zinc-100 text-zinc-950 font-bold shadow-lg shadow-zinc-100/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                )}
              >
                <Terminal size={16} />
                <span>API IDE</span>
              </button>
            </div>
          </div>

          {currentView === 'discovery' && (
            <>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-300 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Search APIs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-12 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
                />
                <VoiceSearch 
                  onTranscript={(text) => setSearchQuery(text)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                />
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest px-3 hidden md:block">Categories</h2>
                <CategoryScreener 
                  categories={categories} 
                  activeCategory={activeCategory} 
                  onSelect={setActiveCategory} 
                />
              </div>
            </>
          )}
        </div>

        <div className="pt-6 border-t border-zinc-800 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
            <Zap size={12} className="text-amber-500" />
            <span>{initialRegistry.length} APIs Loaded</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <Github size={18} />
            </button>
            <button className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <Info size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/50 via-zinc-950 to-zinc-950">
        {currentView === 'discovery' ? (
          <>
            {/* Header */}
            <header className="h-16 md:h-20 border-b border-zinc-800 px-4 md:px-8 flex items-center justify-between bg-zinc-950/30 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <h2 className="text-sm md:text-xl font-bold text-zinc-100 tracking-tight">
                  {activeCategory === 'All' ? 'Nexus Discovery' : activeCategory}
                </h2>
                <span className="text-[10px] md:text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md border border-zinc-800">
                  {filteredAPIs.length} Results
                </span>
              </div>

              <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setViewMode('card')}
                  className={cn(
                    "flex items-center gap-2 px-2 md:px-4 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium transition-all",
                    viewMode === 'card' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <LayoutGrid size={12} className="md:w-3.5 md:h-3.5" />
                  <span className="hidden xs:inline">Card View</span>
                </button>
                <button
                  onClick={() => setViewMode('dev')}
                  className={cn(
                    "flex items-center gap-2 px-2 md:px-4 py-1 md:py-1.5 rounded-lg text-[10px] md:text-xs font-medium transition-all",
                    viewMode === 'dev' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  <Code2 size={12} className="md:w-3.5 md:h-3.5" />
                  <span className="hidden xs:inline">Developer View</span>
                </button>
              </div>
            </header>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredAPIs.map((api, index) => (
                    <motion.div
                      key={`${api.API}-${api.Link}-${index}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="group relative bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 h-[320px] flex flex-col transition-all hover:shadow-2xl hover:shadow-zinc-950/50"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      
                      <UniversalFetcher 
                        api={api}
                        viewMode={viewMode}
                        onOpenInIde={handleOpenInIde}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredAPIs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4 py-20">
                  <Search size={48} strokeWidth={1} />
                  <div className="text-center">
                    <p className="text-lg font-medium text-zinc-400">No APIs found</p>
                    <p className="text-sm">Try adjusting your search or category filters</p>
                  </div>
                  <button 
                    onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                    className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-sm transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <ApiIde 
            initialUrl={ideConfig.url} 
            initialMethod={ideConfig.method} 
          />
        )}
      </main>
    </div>
  );
}
