import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, CheckCircle2, AlertCircle, RefreshCw, Trophy, ArrowRight, Award } from 'lucide-react';
import { QuizQuestion } from '../../types';

interface QuizRendererProps {
  quizData: QuizQuestion[];
}

export default function QuizRenderer({ quizData }: QuizRendererProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (!quizData || quizData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
        <p>No quiz questions available for this episode.</p>
      </div>
    );
  }

  const question = quizData[currentIdx];

  const handleOptionSelect = (optionIdx: number) => {
    if (hasSubmitted) return;
    setSelectedAnswer(optionIdx);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || hasSubmitted) return;
    setHasSubmitted(true);
    if (selectedAnswer === question.answer) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < quizData.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedAnswer(null);
      setHasSubmitted(false);
    } else {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setHasSubmitted(false);
    setScore(0);
    setShowResults(false);
  };

  // Helper to determine score tier badge
  const getScoreBadge = () => {
    const percentage = (score / quizData.length) * 100;
    if (percentage === 100) return { title: "Arch-Theologian & Cosmologist", desc: "You have completely reconciled temporal passage and Boethian eternity!", color: "text-amber-400 border-amber-500/40 bg-amber-500/5" };
    if (percentage >= 80) return { title: "Eternity Scholar", desc: "Outstanding understanding of Maximus the Confessor's Logos and Tropos.", color: "text-amber-400 border-[#d97706]/40 bg-[#d97706]/5" };
    if (percentage >= 50) return { title: "Road Traveler", desc: "A solid beginning on the road of understanding divine sovereignty and physics.", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/5" };
    return { title: "Catechumen Novice", desc: "Don't worry, even Augustine struggled with the mysteries of eternity and time!", color: "text-slate-400 border-slate-700 bg-slate-800/10" };
  };

  const badge = getScoreBadge();

  return (
    <div id="quiz-renderer-container" className="space-y-6 pb-24">
      {/* Quiz Title Banner */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-amber-500" />
          <h3 className="font-display text-lg font-semibold text-slate-100">
            Interactive Quiz
          </h3>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-700">
          Score: {score} / {quizData.length}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* Progress indicator */}
            <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
              <span>QUESTION {currentIdx + 1} OF {quizData.length}</span>
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${((currentIdx + 1) / quizData.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Question Text Box */}
            <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 shadow-md">
              <h4 className="font-sans text-sm md:text-base font-semibold text-slate-100 leading-relaxed">
                {question.question}
              </h4>
            </div>

            {/* MCQ Options */}
            <div className="space-y-2.5">
              {question.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrect = question.answer === idx;
                
                let optionStyle = 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900/95';
                
                if (hasSubmitted) {
                  if (isCorrect) {
                    optionStyle = 'border-emerald-500 bg-emerald-950/20 text-emerald-300 font-medium';
                  } else if (isSelected) {
                    optionStyle = 'border-rose-500 bg-rose-950/20 text-rose-300 font-medium';
                  } else {
                    optionStyle = 'border-slate-800 bg-slate-900/20 text-slate-500 cursor-not-allowed';
                  }
                } else if (isSelected) {
                  optionStyle = 'border-amber-500 bg-amber-500/10 text-amber-300 font-medium shadow-md shadow-amber-500/5';
                }

                return (
                  <button
                    key={idx}
                    disabled={hasSubmitted}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full p-4 rounded-xl border text-left text-xs md:text-sm transition-all duration-150 flex items-start gap-3 ${optionStyle}`}
                  >
                    <span className={`w-5 h-5 rounded-full border shrink-0 flex items-center justify-center text-[10px] font-mono font-bold ${
                      isSelected ? 'border-amber-500 bg-amber-500 text-slate-950' : 'border-slate-700 bg-slate-950 text-slate-400'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-grow">{option}</span>

                    {/* Submit Icons */}
                    {hasSubmitted && isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 self-center" />
                    )}
                    {hasSubmitted && isSelected && !isCorrect && (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 self-center" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Check/Submit & Next controls */}
            <div className="pt-2">
              {!hasSubmitted ? (
                <button
                  disabled={selectedAnswer === null}
                  onClick={handleSubmit}
                  className={`w-full py-3.5 rounded-xl text-xs font-mono uppercase tracking-widest font-bold transition-all ${
                    selectedAnswer === null
                      ? 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
                      : 'bg-amber-600 text-slate-950 hover:bg-amber-500 active:scale-98 cursor-pointer'
                  }`}
                >
                  Verify Answer
                </button>
              ) : (
                <div className="space-y-4">
                  {/* Detailed Scrollable Explanation Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl border border-[#d97706]/20 bg-amber-950/10 max-h-[160px] overflow-y-auto custom-scrollbar border-l-4 border-l-[#d97706]"
                  >
                    <div className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase mb-1">
                      EXEGESIS & SCIENCE EXPLANATION
                    </div>
                    <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
                      {question.explanation}
                    </p>
                  </motion.div>

                  <button
                    onClick={handleNext}
                    className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
                  >
                    <span>
                      {currentIdx === quizData.length - 1 ? 'Show Final Results' : 'Next Question'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-amber-500" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl border border-slate-800 bg-slate-900/40 text-center space-y-5"
          >
            <div className="inline-flex p-4 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
              <Trophy className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h4 className="font-display text-2xl font-bold text-slate-100">
                Quiz Complete!
              </h4>
              <p className="text-sm text-slate-400">
                You scored <span className="text-amber-400 font-bold">{score}</span> out of{' '}
                <span className="text-slate-200">{quizData.length}</span> questions.
              </p>
            </div>

            {/* Badge Showcase */}
            <div className={`p-4 rounded-xl border ${badge.color} space-y-1.5 max-w-sm mx-auto`}>
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold tracking-widest uppercase">
                <Award className="w-4 h-4" />
                <span>ACHIEVEMENT UNLOCKED</span>
              </div>
              <h5 className="font-display font-bold text-base text-slate-50">
                {badge.title}
              </h5>
              <p className="text-[11px] text-slate-300 font-sans italic leading-relaxed">
                "{badge.desc}"
              </p>
            </div>

            <div className="border-t border-slate-800 pt-5 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                <span>Try Again</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
