import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';

interface CategoryScreenerProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export const CategoryScreener: React.FC<CategoryScreenerProps> = ({ categories, activeCategory, onSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-3 mb-1 md:hidden">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest hover:text-zinc-300 transition-colors"
        >
          <Filter size={10} />
          <span>{isExpanded ? 'Hide Categories' : 'Show Categories'}</span>
          {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {activeCategory !== 'All' && (
          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded uppercase font-mono">
            {activeCategory}
          </span>
        )}
      </div>

      <AnimatePresence>
        {isExpanded || window.innerWidth >= 768 ? (
          <motion.div 
            initial={window.innerWidth < 768 ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex flex-col gap-1 overflow-hidden",
              !isExpanded && "hidden md:flex"
            )}
          >
            <button
              onClick={() => {
                onSelect('All');
                if (window.innerWidth < 768) setIsExpanded(false);
              }}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left",
                activeCategory === 'All' 
                  ? "bg-zinc-100 text-zinc-950 font-semibold shadow-lg shadow-zinc-950/20" 
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <span>All APIs</span>
              {activeCategory === 'All' && (
                <motion.div layoutId="active-indicator" className="w-1 h-4 bg-zinc-950 rounded-full" />
              )}
            </button>
            
            <div className="h-px bg-zinc-800 my-2 mx-3" />
            
            <div className="space-y-0.5 overflow-y-auto max-h-[300px] md:max-h-[calc(100vh-250px)] pr-2 custom-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    onSelect(category);
                    if (window.innerWidth < 768) setIsExpanded(false);
                  }}
                  className={cn(
                    "group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all duration-200 text-left w-full",
                    activeCategory === category 
                      ? "bg-zinc-800 text-zinc-100 font-medium" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                  )}
                >
                  <span className="truncate">{category}</span>
                  {activeCategory === category && (
                    <motion.div layoutId="active-indicator" className="w-1 h-3 bg-zinc-100 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
