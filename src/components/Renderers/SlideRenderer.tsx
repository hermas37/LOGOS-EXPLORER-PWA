import React from 'react';
import { Presentation, ExternalLink } from 'lucide-react';

interface SlideRendererProps {
  url: string;
}

export default function SlideRenderer({ url }: SlideRendererProps) {
  return (
    <div className="flex flex-col h-full pb-24 space-y-4 min-h-[70vh]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Presentation className="w-5 h-5 text-amber-500 shrink-0" />
          <h3 className="font-display text-lg font-semibold text-slate-100">Slide Deck</h3>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors font-semibold shrink-0"
        >
          <span>Open in new tab</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <iframe
        src={url}
        title="Slide deck"
        className="w-full flex-grow min-h-[60vh] rounded-xl border border-slate-800 bg-slate-950"
      />
    </div>
  );
}
