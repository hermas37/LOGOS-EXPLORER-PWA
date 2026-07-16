import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, CornerDownRight, Quote } from 'lucide-react';
import { EPISODE_SCRIPTS, ScriptCard } from '../../data/script';

interface ScriptRendererProps {
  episodeId: string;
}

export default function ScriptRenderer({ episodeId }: ScriptRendererProps) {
  const cards = EPISODE_SCRIPTS[episodeId] || [];
  const [activeCitation, setActiveCitation] = useState<{
    phrase: string;
    source: string;
    detail: string;
  } | null>(null);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
        <p>No script material available for this episode.</p>
      </div>
    );
  }

  // Helpler to render text and insert citation trigger highlights
  const renderTextWithHighlights = (card: ScriptCard) => {
    let text = card.text;
    const sortedCitations = [...card.citations].sort(
      (a, b) => b.phrase.length - a.phrase.length
    );

    // Build parts by finding citation occurrences
    let parts: { text: string; isCitation: boolean; citationIndex: number }[] = [];
    let currentIndex = 0;

    // A simple parser to split by citation phrases
    while (currentIndex < text.length) {
      let foundIndex = -1;
      let matchedCitationIndex = -1;

      for (let i = 0; i < sortedCitations.length; i++) {
        const citation = sortedCitations[i];
        const index = text.toLowerCase().indexOf(citation.phrase.toLowerCase(), currentIndex);
        if (index !== -1 && (foundIndex === -1 || index < foundIndex)) {
          foundIndex = index;
          matchedCitationIndex = i;
        }
      }

      if (foundIndex !== -1 && matchedCitationIndex !== -1) {
        // Add preceding text
        if (foundIndex > currentIndex) {
          parts.push({
            text: text.substring(currentIndex, foundIndex),
            isCitation: false,
            citationIndex: -1,
          });
        }

        // Add citation phrase
        const phraseLength = sortedCitations[matchedCitationIndex].phrase.length;
        parts.push({
          text: text.substring(foundIndex, foundIndex + phraseLength),
          isCitation: true,
          citationIndex: matchedCitationIndex,
        });

        currentIndex = foundIndex + phraseLength;
      } else {
        // Add remaining text
        parts.push({
          text: text.substring(currentIndex),
          isCitation: false,
          citationIndex: -1,
        });
        break;
      }
    }

    return (
      <p className="text-slate-300 leading-relaxed text-sm md:text-base">
        {parts.map((part, idx) => {
          if (part.isCitation) {
            const cit = sortedCitations[part.citationIndex];
            const isCurrent = activeCitation?.phrase === cit.phrase;
            return (
              <button
                key={idx}
                onClick={() => setActiveCitation(cit)}
                className={`inline-block font-medium px-1.5 py-0.5 rounded transition-all text-left ${
                  isCurrent
                    ? 'bg-[#d97706]/30 text-amber-200 border border-[#d97706]/50'
                    : 'bg-[#d97706]/10 text-amber-300 border border-[#d97706]/20 hover:bg-[#d97706]/20 hover:text-amber-100'
                }`}
                title={`Click to view citation: ${cit.source}`}
              >
                {part.text}
              </button>
            );
          }
          return <span key={idx}>{part.text}</span>;
        })}
      </p>
    );
  };

  return (
    <div id="script-renderer-container" className="space-y-6 pb-24">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
        <BookOpen className="w-5 h-5 text-amber-500" />
        <h3 className="font-display text-lg font-semibold text-slate-100">
          Master Script Guide
        </h3>
        <span className="text-xs text-slate-400 font-mono ml-auto">
          {cards.length} Core Insights
        </span>
      </div>

      <p className="text-xs text-slate-400 font-mono border-l-2 border-[#d97706]/50 pl-3 py-1">
        💡 <span className="text-amber-300 font-medium">Tip:</span> Tap any highlighted terms to view deep academic source materials, scriptural citations, and physical theories.
      </p>

      {/* Script Cards Container */}
      <div className="space-y-4">
        {cards.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md relative overflow-hidden group hover:border-slate-700/80 transition-all shadow-lg"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 group-hover:bg-amber-500 transition-colors" />
            
            <h4 className="font-display font-medium text-amber-100 text-sm md:text-base mb-3 flex items-center gap-2">
              <span>{card.title}</span>
            </h4>

            {renderTextWithHighlights(card)}
          </motion.div>
        ))}
      </div>

      {/* Dynamic Bottom Citation Drawer */}
      <AnimatePresence>
        {activeCitation && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCitation(null)}
              className="absolute inset-0 bg-slate-950/70 z-40 cursor-pointer backdrop-blur-xs"
            />

            {/* Bottom Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 max-h-[80%] rounded-t-2xl border-t border-slate-700 bg-slate-900/95 shadow-2xl z-50 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2 text-cyan-400">
                  <CornerDownRight className="w-4 h-4" />
                  <span className="text-xs font-mono uppercase tracking-widest font-semibold">
                    Theological & Scientific Citation
                  </span>
                </div>
                <button
                  onClick={() => setActiveCitation(null)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-4 pr-1">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 mt-1 shrink-0">
                    <Quote className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-slate-400 text-xs font-mono">TERM / CONCEPT:</h5>
                    <p className="text-slate-100 font-display font-semibold text-lg capitalize mb-1">
                      "{activeCitation.phrase}"
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-800/60 pt-3">
                  <h5 className="text-slate-400 text-xs font-mono">ACADEMIC / THEOLOGICAL SOURCE:</h5>
                  <p className="text-amber-400 font-medium text-sm mt-0.5">
                    {activeCitation.source}
                  </p>
                </div>

                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800/80">
                  <h5 className="text-slate-400 text-xs font-mono mb-1">EXEGESIS & PHYSICS BACKGROUND:</h5>
                  <p className="text-slate-300 text-sm leading-relaxed font-sans">
                    {activeCitation.detail}
                  </p>
                </div>
              </div>

              <div className="mt-5 text-center">
                <button
                  onClick={() => setActiveCitation(null)}
                  className="px-6 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-slate-100 transition-all"
                >
                  Close Citation
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
