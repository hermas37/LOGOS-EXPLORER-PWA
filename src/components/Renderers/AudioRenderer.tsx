import React from 'react';
import { Music } from 'lucide-react';

interface AudioRendererProps {
  url: string;
}

export default function AudioRenderer({ url }: AudioRendererProps) {
  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Music className="w-5 h-5 text-amber-500 shrink-0" />
        <h3 className="font-display text-lg font-semibold text-slate-100">Audio Overview</h3>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-radial from-slate-900 to-slate-950 p-6 flex flex-col items-center gap-5 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
          <Music className="w-7 h-7 text-amber-400" />
        </div>
        <audio controls preload="none" src={url} className="w-full">
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}
