import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Layers, CheckCircle2, AlertTriangle, ArrowRight, EyeOff } from 'lucide-react';
import { Flashcard } from '../../types';

interface FlashcardRendererProps {
  flashcardData: Flashcard[];
}

export default function FlashcardRenderer({ flashcardData }: FlashcardRendererProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [scores, setScores] = useState<Record<number, string>>({}); // Records difficulty chosen
  const [isCompleted, setIsCompleted] = useState(false);

  if (!flashcardData || flashcardData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
        <p>No glossary flashcards available for this episode.</p>
      </div>
    );
  }

  const card = flashcardData[currentIdx];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleRate = (rating: 'review' | 'hard' | 'easy') => {
    setScores((prev) => ({ ...prev, [currentIdx]: rating }));
    setSwipeDirection(rating === 'easy' ? 'right' : rating === 'hard' ? 'left' : 'up');

    setTimeout(() => {
      setIsFlipped(false);
      setSwipeDirection(null);
      if (currentIdx < flashcardData.length - 1) {
        setCurrentIdx((prev) => prev + 1);
      } else {
        setIsCompleted(true);
      }
    }, 300);
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setIsFlipped(false);
    setScores({});
    setIsCompleted(false);
  };

  // Compute stats
  const getStats = () => {
    const values = Object.values(scores);
    const easyCount = values.filter((v) => v === 'easy').length;
    const hardCount = values.filter((v) => v === 'hard').length;
    const reviewCount = values.filter((v) => v === 'review').length;
    return { easyCount, hardCount, reviewCount };
  };

  const stats = getStats();

  return (
    <div id="flashcard-renderer-container" className="space-y-6 pb-24">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-500" />
          <h3 className="font-display text-lg font-semibold text-slate-100">
            Glossary Study Deck
          </h3>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Card {currentIdx + 1} of {flashcardData.length}
        </div>
      </div>

      <p className="text-xs text-slate-400 font-mono border-l-2 border-[#d97706]/50 pl-3 py-1">
        👆 <span className="text-amber-300 font-medium">Tip:</span> Tap the card to flip between the term and its theological/scientific definition.
      </p>

      <AnimatePresence mode="wait">
        {!isCompleted ? (
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{
              opacity: 0,
              x: swipeDirection === 'right' ? 250 : swipeDirection === 'left' ? -250 : 0,
              y: swipeDirection === 'up' ? -250 : 0,
              scale: 0.9,
            }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center justify-between h-[360px]"
          >
            {/* 3D Flip Card */}
            <div
              onClick={handleFlip}
              className="w-full h-[250px] cursor-pointer perspective-1000 group select-none relative"
            >
              <div
                className={`w-full h-full rounded-2xl border border-slate-800 transition-transform duration-500 transform-style-3d relative flex items-center justify-center ${
                  isFlipped ? 'rotate-y-180 bg-slate-900/90' : 'bg-slate-900/40 hover:border-slate-700/80 shadow-lg'
                }`}
              >
                {/* CARD FRONT: Term */}
                <div className="absolute inset-0 backface-hidden p-6 flex flex-col justify-between rounded-2xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-radial from-amber-500/5 to-transparent rounded-full -translate-y-8 translate-x-8" />
                  
                  <div className="flex items-center justify-between w-full text-slate-500 text-[10px] font-mono tracking-widest uppercase">
                    <span>THEOLOGICAL GLOSSARY</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500/40 group-hover:rotate-12 transition-transform" />
                  </div>

                  <div className="text-center my-auto px-4">
                    <h4 className="font-display text-2xl font-bold text-slate-100 tracking-tight leading-none">
                      {card.term}
                    </h4>
                    <p className="text-[10px] text-amber-500/70 font-mono mt-3 uppercase tracking-wider">
                      Click to reveal definition
                    </p>
                  </div>

                  <div className="flex justify-center text-slate-500 text-[11px] font-mono">
                    ✦ LOGOS-EXPLORER SYSTEM ✦
                  </div>
                </div>

                {/* CARD BACK: Definition */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 p-6 flex flex-col justify-between rounded-2xl bg-slate-950/95 overflow-hidden">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-radial from-amber-500/5 to-transparent rounded-full -translate-y-8 -translate-x-8" />
                  
                  <div className="flex items-center justify-between w-full text-amber-400 text-[10px] font-mono tracking-widest uppercase border-b border-slate-800/60 pb-2">
                    <span>EXEGESIS & DEFINITION</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-[#d97706]/20 font-mono">
                      Back
                    </span>
                  </div>

                  <div className="my-auto px-2 text-center overflow-y-auto max-h-[140px] custom-scrollbar">
                    <h5 className="text-amber-400 font-display font-semibold text-sm mb-2">{card.term}</h5>
                    <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-sans font-light">
                      {card.definition}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[10px] font-mono border-t border-slate-900 pt-2">
                    <EyeOff className="w-3 h-3 text-slate-400/60" />
                    <span>Tap to hide definition</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Buttons */}
            <div className="w-full grid grid-cols-3 gap-2.5 pt-4">
              <button
                onClick={() => handleRate('review')}
                className="py-3 rounded-xl border border-rose-500/30 bg-rose-950/10 hover:bg-rose-950/30 text-rose-300 font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4 text-rose-400" />
                <span>Review Again</span>
              </button>

              <button
                onClick={() => handleRate('hard')}
                className="py-3 rounded-xl border border-amber-500/30 bg-amber-950/10 hover:bg-amber-950/30 text-amber-300 font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Hard</span>
              </button>

              <button
                onClick={() => handleRate('easy')}
                className="py-3 rounded-xl border border-emerald-500/30 bg-emerald-950/10 hover:bg-emerald-950/30 text-emerald-300 font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Easy / Got It!</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-5"
          >
            <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h4 className="font-display text-xl font-bold text-slate-100">
                Glossary Deck Complete!
              </h4>
              <p className="text-xs text-slate-400">
                You have successfully reviewed all theological & scientific terms in this episode.
              </p>
            </div>

            {/* Deck Summary Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto text-center border-t border-b border-slate-800/80 py-4 font-mono">
              <div>
                <div className="text-rose-400 font-bold text-lg">{stats.reviewCount}</div>
                <div className="text-[9px] text-slate-400 uppercase">Review</div>
              </div>
              <div>
                <div className="text-amber-400 font-bold text-lg">{stats.hardCount}</div>
                <div className="text-[9px] text-slate-400 uppercase">Hard</div>
              </div>
              <div>
                <div className="text-emerald-400 font-bold text-lg">{stats.easyCount}</div>
                <div className="text-[9px] text-slate-400 uppercase">Easy</div>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-3.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
              <span>Review Deck Again</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
