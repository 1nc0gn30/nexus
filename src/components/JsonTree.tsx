import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface JsonTreeProps {
  data: unknown;
  label?: string;
  depth?: number;
  path?: string;
  onCopyPath?: (path: string) => void;
}

export const JsonTree: React.FC<JsonTreeProps> = ({
  data,
  label,
  depth = 0,
  path = 'data',
  onCopyPath,
}) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const [copiedPath, setCopiedPath] = useState(false);

  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    const expr = `{{step1.${path}}}`;
    if (onCopyPath) {
      onCopyPath(expr);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(expr).catch(() => {});
    }
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 1500);
  };

  if (!isObject) {
    const valueColor =
      typeof data === 'string'
        ? 'text-emerald-400'
        : typeof data === 'number'
          ? 'text-sky-400'
          : typeof data === 'boolean'
            ? 'text-amber-400'
            : 'text-zinc-500';

    return (
      <div className="group flex items-start gap-2 py-0.5 pl-5 pr-2 rounded hover:bg-zinc-900/70">
        {label !== undefined && (
          <span className="text-zinc-400 font-mono text-xs shrink-0">{label}:</span>
        )}
        <span className={cn('font-mono text-xs break-all flex-1', valueColor)}>
          {typeof data === 'string' ? `"${data}"` : data === null ? 'null' : String(data)}
        </span>
        {depth > 0 && (
          <button
            type="button"
            onClick={handleCopyPath}
            title={`Copy template path {{step1.${path}}}`}
            aria-label={`Copy path ${path}`}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-500 hover:text-amber-400 transition-opacity shrink-0 p-0.5"
          >
            {copiedPath ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        )}
      </div>
    );
  }

  const entries = Object.entries(data as Record<string, unknown>);
  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2 py-0.5 pl-5">
        {label !== undefined && <span className="text-zinc-400 font-mono text-xs">{label}:</span>}
        <span className="text-zinc-500 font-mono text-xs">{isArray ? '[]' : '{}'}</span>
      </div>
    );
  }

  return (
    <div className={cn(depth > 0 && 'ml-2')}>
      <div className="group flex items-center gap-1 py-0.5 px-1 rounded hover:bg-zinc-900/70">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-1.5 text-left flex-1 min-w-0"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <ChevronDown size={13} className="text-zinc-500 shrink-0" />
          ) : (
            <ChevronRight size={13} className="text-zinc-500 shrink-0" />
          )}
          {label !== undefined && (
            <span className="text-zinc-200 font-mono text-xs font-medium truncate">{label}:</span>
          )}
          <span className="text-zinc-500 font-mono text-[11px] shrink-0">
            {isArray ? `[${entries.length}]` : `{${entries.length}}`}
          </span>
        </button>
      </div>

      {isOpen && (
        <div className="border-l border-zinc-800/90 ml-2.5 pl-2">
          {entries.slice(0, 100).map(([key, val]) => {
            const childPath = isArray ? `${path}[${key}]` : `${path}.${key}`;
            return (
              <JsonTree
                key={key}
                data={val}
                label={key}
                depth={depth + 1}
                path={childPath}
                onCopyPath={onCopyPath}
              />
            );
          })}
          {entries.length > 100 && (
            <div className="pl-5 py-1 text-[11px] font-mono text-zinc-500">
              … {entries.length - 100} more items (switch to Raw JSON to view all)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
