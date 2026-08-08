import React, { useState } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { DigDeeperEntry } from '../../types';
import MarkdownRenderer from './MarkdownRenderer';

interface DigDeeperRendererProps {
  entries: DigDeeperEntry[];
}

/** A list of further-reading documents. Tapping one opens it in MarkdownRenderer; its close control returns here. */
export default function DigDeeperRenderer({ entries }: DigDeeperRendererProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (openIndex !== null && entries[openIndex]) {
    const entry = entries[openIndex];
    return <MarkdownRenderer url={entry.url} title={entry.title} onClose={() => setOpenIndex(null)} />;
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <BookOpen className="w-5 h-5 text-amber-500 shrink-0" />
        <h3 className="font-display text-lg font-semibold text-slate-100">Dig Deeper</h3>
      </div>

      <div className="flex flex-col gap-2">
        {entries.map((entry, i) => (
          <button
            key={`${entry.url}-${i}`}
            onClick={() => setOpenIndex(i)}
            className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900 transition-colors p-4 flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-100 truncate">{entry.title}</div>
              {entry.description && (
                <div className="text-xs text-slate-400 mt-1 leading-relaxed">{entry.description}</div>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
