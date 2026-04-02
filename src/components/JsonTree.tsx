import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FileJson } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface JsonTreeProps {
  data: any;
  label?: string;
  depth?: number;
}

export const JsonTree: React.FC<JsonTreeProps> = ({ data, label, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);

  if (!isObject) {
    return (
      <div className="flex items-start gap-2 py-0.5 ml-6">
        {label && <span className="text-zinc-500 font-mono text-xs">{label}:</span>}
        <span className={cn(
          "font-mono text-xs break-all",
          typeof data === 'string' ? "text-emerald-400" : "text-amber-400"
        )}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    );
  }

  const keys = Object.keys(data);
  if (keys.length === 0) {
    return (
      <div className="flex items-center gap-2 py-0.5 ml-6">
        {label && <span className="text-zinc-500 font-mono text-xs">{label}:</span>}
        <span className="text-zinc-400 font-mono text-xs">{isArray ? '[]' : '{}'}</span>
      </div>
    );
  }

  return (
    <div className="ml-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 py-1 hover:bg-zinc-800/50 rounded px-1 transition-colors w-full text-left"
      >
        {isOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
        {isArray ? <Folder size={14} className="text-blue-400" /> : <FileJson size={14} className="text-purple-400" />}
        {label && <span className="text-zinc-300 font-mono text-xs font-medium">{label}:</span>}
        <span className="text-zinc-500 font-mono text-[10px]">
          {isArray ? `Array(${keys.length})` : `Object`}
        </span>
      </button>
      
      {isOpen && (
        <div className="border-l border-zinc-800 ml-2 pl-2">
          {keys.map((key) => (
            <JsonTree key={key} data={data[key]} label={key} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
