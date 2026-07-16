import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Grid,
  Activity,
  Music,
  HeartOff,
  Flame,
  MessageSquareText,
  Eye,
  Sparkles
} from 'lucide-react';
import { EPISODE_SLIDES, Slide } from '../../data/slides';

interface SlideRendererProps {
  episodeId: string;
}

// Icon helper to dynamically map icon names
const iconMap: Record<string, any> = {
  Compass: Compass,
  Grid: Grid,
  Activity: Activity,
  Music: Music,
  HeartOff: HeartOff,
  Flame: Flame,
};

export default function SlideRenderer({ episodeId }: SlideRendererProps) {
  const slides = EPISODE_SLIDES[episodeId] || [];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const [showNotes, setShowNotes] = useState(false);

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
        <p>No presentation slides available for this episode.</p>
      </div>
    );
  }

  const slide = slides[currentIdx];
  const IconComponent = iconMap[slide.visualLayout.icon] || Compass;

  const handleNext = () => {
    if (currentIdx < slides.length - 1) {
      setDirection(1);
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setDirection(-1);
      setCurrentIdx((prev) => prev - 1);
    }
  };

  // Variants for slide slide transitions
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div id="slide-renderer-container" className="flex flex-col min-h-[500px] justify-between pb-24">
      {/* Slide Navigation Top bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="text-xs font-mono font-semibold tracking-wider text-slate-400">
            SLIDE {currentIdx + 1} OF {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className={`p-1.5 rounded-lg border transition-all ${
              currentIdx === 0
                ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 active:scale-95'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={currentIdx === slides.length - 1}
            className={`p-1.5 rounded-lg border transition-all ${
              currentIdx === slides.length - 1
                ? 'opacity-30 border-slate-800 text-slate-600 cursor-not-allowed'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 active:scale-95'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Deck Area */}
      <div className="relative overflow-hidden w-full flex-grow flex items-center justify-center py-2">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-5 md:p-6 shadow-xl relative flex flex-col justify-between"
          >
            {/* Title & Accent Header */}
            <div className="mb-4">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-mono font-medium tracking-wide mb-2 ${slide.visualLayout.accentColor}`}>
                <IconComponent className="w-3.5 h-3.5" />
                {slide.subtitle}
              </span>
              <h3 className="font-display text-lg md:text-xl font-bold text-slate-50 tracking-tight leading-snug">
                {slide.title}
              </h3>
            </div>

            {/* Interactive Visual Graphic Box */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-4 mb-4 flex flex-col items-center justify-center relative min-h-[120px] overflow-hidden group">
              <div className="absolute top-2 left-2 flex items-center gap-1.5 text-slate-500 font-mono text-[9px] uppercase tracking-wider">
                <Eye className="w-3 h-3 text-slate-400" />
                <span>Structural Blueprint</span>
              </div>

              {/* Graphical renderings built procedurally with Tailwind based on current slide */}
              <div className="w-full flex items-center justify-center py-4">
                {slide.id === 1 && (
                  <div className="relative w-full max-w-[200px] h-12 flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400" title="The Mountain (Timeless Present)">
                      <div className="text-[10px] font-mono font-bold">NOW</div>
                    </div>
                    <div className="h-0.5 flex-grow border-t-2 border-dashed border-slate-800 relative">
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-slate-400" title="The Road (Linear Travel)">
                      <div className="text-[8px] font-mono leading-none">T₁ → T₂</div>
                    </div>
                  </div>
                )}
                {slide.id === 2 && (
                  <div className="flex gap-1.5 items-center justify-center w-full max-w-[200px]">
                    <div className="w-8 h-8 rounded bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-[9px] font-mono text-cyan-400">Past</div>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <div className="w-12 h-8 rounded border-2 border-dashed border-cyan-500/40 flex items-center justify-center text-[10px] font-mono text-cyan-300 font-bold bg-cyan-500/10">Now</div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-mono text-slate-500">Future</div>
                  </div>
                )}
                {slide.id === 3 && (
                  <div className="relative w-full max-w-[180px] h-14 flex items-center justify-center">
                    <div className="absolute w-full h-0.5 bg-slate-800" />
                    {/* Sine wave or quantum nodes representation */}
                    <div className="flex justify-between w-full z-10">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 animate-ping absolute" />
                      <div className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-400/80 flex items-center justify-center text-[8px] text-emerald-300 font-mono">Q₁</div>
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-600/50 flex items-center justify-center text-[8px] text-emerald-500 font-mono">Q₂</div>
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-600/50 flex items-center justify-center text-[8px] text-emerald-500 font-mono">Q₃</div>
                    </div>
                  </div>
                )}
                {slide.id === 4 && (
                  <div className="flex flex-col gap-1 w-full max-w-[180px]">
                    <div className="h-4 bg-indigo-500/20 border border-indigo-500/30 rounded flex items-center px-2 justify-between">
                      <span className="text-[8px] font-mono text-indigo-300 uppercase">LOGOS (Blueprint)</span>
                      <div className="w-10 h-1.5 bg-indigo-400 rounded-full" />
                    </div>
                    <div className="text-center text-slate-600 text-[8px]">⚡ interacting with ⚡</div>
                    <div className="h-4 bg-amber-500/20 border border-amber-500/30 rounded flex items-center px-2 justify-between">
                      <span className="text-[8px] font-mono text-amber-300 uppercase">TROPOS (Performance)</span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      </div>
                    </div>
                  </div>
                )}
                {slide.id === 5 && (
                  <div className="flex items-center gap-4 justify-center w-full max-w-[180px]">
                    <div className="relative w-12 h-12 flex items-center justify-center border-2 border-rose-500/50 rounded-lg" title="Square (Force)">
                      <span className="text-[8px] font-mono text-rose-400 font-bold uppercase">FORCE</span>
                    </div>
                    <span className="text-slate-500 font-mono text-xs">+</span>
                    <div className="relative w-12 h-12 flex items-center justify-center border-2 border-amber-500/50 rounded-full" title="Circle (Love)">
                      <span className="text-[8px] font-mono text-amber-300 font-bold uppercase">LOVE</span>
                    </div>
                    <span className="text-slate-400 font-mono text-xs">=</span>
                    <div className="text-rose-500 text-xs font-mono font-bold line-through">ERROR</div>
                  </div>
                )}
                {slide.id === 6 && (
                  <div className="flex flex-col items-center justify-center w-full">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/30 text-[8px] font-mono text-violet-300">PRAYER</span>
                      <span className="text-slate-500 font-mono text-[8px]">→</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[8px] font-mono text-amber-300">ETERNAL NOW</span>
                    </div>
                    <div className="mt-1.5 text-[9px] text-slate-400 italic text-center px-3 font-serif">
                      "Real inputs sculpting the masterpiece."
                    </div>
                  </div>
                )}
              </div>

              {/* Graphic description caption */}
              <p className="text-[10px] text-slate-400 font-sans italic text-center px-2 line-clamp-2">
                "{slide.visualLayout.description}"
              </p>
            </div>

            {/* Bullets List */}
            <ul className="space-y-2 mb-4">
              {slide.bullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-2 text-xs md:text-sm text-slate-300">
                  <span className="text-amber-500 mt-1 shrink-0 font-bold">✦</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Speaker Notes Toggle Tray */}
      <div className="mt-4">
        <button
          onClick={() => setShowNotes((prev) => !prev)}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 text-slate-300 hover:bg-slate-900/60 transition-all font-mono text-xs font-semibold"
        >
          <div className="flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-[#d97706]" />
            <span>EXEGESIS & SPEAKER NOTES</span>
          </div>
          <span className="text-[10px] uppercase text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
            {showNotes ? 'Hide' : 'Show'}
          </span>
        </button>

        <AnimatePresence>
          {showNotes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 p-4 rounded-xl border-[#d97706]/25 bg-amber-950/15 text-slate-300 text-xs leading-relaxed font-sans italic border-l-4 border-l-[#d97706]">
                {slide.speakerNotes}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Slide Indicators dot bar */}
      <div className="flex justify-center gap-1.5 mt-5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDirection(idx > currentIdx ? 1 : -1);
              setCurrentIdx(idx);
            }}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentIdx ? 'w-6 bg-amber-500' : 'w-2 bg-slate-700 hover:bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
