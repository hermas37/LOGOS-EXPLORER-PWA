import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  FastForward,
  ExternalLink,
  BookOpen,
  Presentation,
  Music,
  HelpCircle,
  Layers,
  Network,
  Sparkles,
  Sheet,
  Image as ImageIcon,
  Compass,
  Copy,
  Check,
  Quote
} from 'lucide-react';
import { EpisodeManifest } from '../types';
import ScriptRenderer from './Renderers/ScriptRenderer';
import SlideRenderer from './Renderers/SlideRenderer';
import QuizRenderer from './Renderers/QuizRenderer';
import FlashcardRenderer from './Renderers/FlashcardRenderer';
import MindmapRenderer from './Renderers/MindmapRenderer';

const EPISODE_QUOTES: Record<string, Array<{ text: string; reference: string; category: string }>> = {
  'episode-1': [
    {
      category: 'Holy Scripture',
      text: 'In the beginning was the Logos, and the Logos was with God, and the Logos was God. He was in the beginning with God. All things came into being through Him, and without Him not even one thing came into being that has come into being. In Him was life, and the life was the light of men.',
      reference: 'John 1:1-4'
    },
    {
      category: 'Holy Scripture',
      text: 'And the Logos became flesh and dwelt among us, and we saw His glory, glory as of the only begotten from the Father, full of grace and truth.',
      reference: 'John 1:14'
    },
    {
      category: 'Boethian Philosophy',
      text: 'Eternity is the complete possession of endless life all at once. Since God lives in the eternal present, His knowledge transcending all movement of time, abides in the simplicity of its now, and encompassing all the infinite past and future, He views all things in His simple gaze.',
      reference: 'Boethius, The Consolation of Philosophy (Book V)'
    },
    {
      category: 'Patristic Exegesis',
      text: 'The Logos of God, who is before all things, wishes to save us through the mystery of His incarnation. He who created us according to His eternal Logos has also granted us the free mode (Tropos) by which we can align our lives with His divine melody.',
      reference: 'St. Maximus the Confessor'
    },
    {
      category: 'Sovereign Love',
      text: 'Love is structurally an active history of real, uncoerced choices. A forced love is a logical absurdity—like a square circle. Bypassing free progression would create a programmed machine, not a genuine companion capable of mutual love.',
      reference: 'Johannine Exegesis Study Guide'
    }
  ]
};

interface UserDashboardProps {
  manifests: EpisodeManifest[];
  selectedEpisodeId: string;
  setSelectedEpisodeId: (id: string) => void;
  selectedStudyId: string;
  setSelectedStudyId: (id: string) => void;
}

export default function UserDashboard({
  manifests,
  selectedEpisodeId,
  setSelectedEpisodeId,
  selectedStudyId,
  setSelectedStudyId,
}: UserDashboardProps) {
  const currentEpisode = manifests.find((m) => m.episodeId === selectedEpisodeId) || manifests[0];

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExploreMenuOpen, setIsExploreMenuOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('Simplified English (Default)');
  const [isPresentationSubMenuOpen, setIsPresentationSubMenuOpen] = useState(true);
  const [copiedQuoteId, setCopiedQuoteId] = useState<number | null>(null);

  // Custom Audio Player State (Simulated interactive audio player)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audioProgress, setAudioProgress] = useState(35); // Initialized to 35% for visual indicator
  const [currentTimeStr, setCurrentTimeStr] = useState('02:45');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update audio progress emulation when playing
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          const nextVal = prev + 0.5 * playbackSpeed;
          // Format time
          const totalSeconds = 480; // 8 minutes simulated length
          const elapsedSeconds = Math.floor((nextVal / 100) * totalSeconds);
          const mins = Math.floor(elapsedSeconds / 60);
          const secs = elapsedSeconds % 60;
          setCurrentTimeStr(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
          return nextVal;
        });
      }, 500);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  if (!currentEpisode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
        <p>No study guides have been staging in the database yet.</p>
      </div>
    );
  }

  const selectedStudy = currentEpisode.studySelector.find((s) => s.id === selectedStudyId) || currentEpisode.studySelector[0];

  // Fetch the audio URL based on selected study tab
  const getAudioUrl = () => {
    if (selectedStudyId === 'audio-deep') return currentEpisode.heavyMedia.fullAudioUrl;
    if (selectedStudyId === 'audio-love') return currentEpisode.heavyMedia.coercedLoveAudioUrl;
    return '';
  };

  const cleanTabLabel = (label: string) => {
    if (!label) return '';
    return label
      .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{25AA}\u{25AB}\u{25FE}\u{25FD}\u{2B05}\u{2B06}\u{2B07}\u{2194}-\u{2199}\u{21A9}\u{21AA}\u{2934}\u{2935}\u{25C0}\u{25B6}\u{23E9}-\u{23EC}\u{23F0}\u{23F3}]+\s*/gu, '')
      .replace(/^(Read|View|Listen|Play|Study|Map):\s*/i, '')
      .trim();
  };

  const getStudyIcon = (type: string, id?: string) => {
    if (id === 'quotes' || type === 'quotes') return <Quote className="w-3.5 h-3.5 shrink-0" />;
    switch (type) {
      case 'script':
        return <BookOpen className="w-3.5 h-3.5 shrink-0" />;
      case 'slides':
        return <Presentation className="w-3.5 h-3.5 shrink-0" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 shrink-0" />;
      case 'quiz':
        return <HelpCircle className="w-3.5 h-3.5 shrink-0" />;
      case 'flashcards':
        return <Layers className="w-3.5 h-3.5 shrink-0" />;
      case 'mindmap':
        return <Network className="w-3.5 h-3.5 shrink-0" />;
      case 'infographic':
        return <ImageIcon className="w-3.5 h-3.5 shrink-0" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  const getActiveExploreLabel = () => {
    if (selectedStudyId === 'script') return 'Master Script';
    if (selectedStudyId === 'quotes') return 'Quotes & Verses';
    if (selectedStudyId === 'infographic') return 'Infographic';
    if (selectedStudyId === 'slides') return 'Slide Deck';
    if (selectedStudyId === 'audio-deep') return 'Deep Dive Audio';
    if (selectedStudyId === 'audio-love') return 'Forced Love Audio';
    if (selectedStudyId === 'video') return 'Video Overview';
    if (selectedStudyId === 'reports') return 'Reports';
    if (selectedStudyId === 'quiz') return 'Interactive Quiz';
    if (selectedStudyId === 'flashcards') return 'Glossary Cards';
    if (selectedStudyId === 'mindmap') return 'Mind Map';
    return 'Explore';
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-100 font-sans select-none">
      
      {/* 1. Episode Selection Header */}
      <div className="px-6 py-4 bg-[#0f172a] border-b border-white/5 shrink-0 flex flex-col gap-3 relative z-50">
        
        {/* Study Mode Bar */}
        <div className="flex items-center justify-between gap-2 pb-0.5">
          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Johannine Study Portal</span>
          </span>
        </div>

        {/* Language Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
              setIsDropdownOpen(false); // Close other menu
              setIsExploreMenuOpen(false); // Close other menu
            }}
            className="w-full bg-slate-950 border border-[#d97706]/70 hover:bg-slate-900 hover:border-[#d97706] active:scale-[0.99] transition-all rounded-xl px-5 py-2.5 flex items-center justify-between shadow-md shadow-[#d97706]/10 cursor-pointer relative group"
          >
            <div className="flex flex-col text-left pr-4 overflow-hidden">
              <span className="font-extrabold text-[#d97706] text-[10px] tracking-widest uppercase">
                1. LANGUAGE SELECTOR
              </span>
              <span className="text-xs font-semibold text-slate-100 truncate">
                {selectedLanguage}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#d97706] shrink-0 transition-transform group-hover:translate-x-0.5" style={{ strokeWidth: 2.5 }} />
          </button>

          {/* Language Dropdown Container */}
          <AnimatePresence>
            {isLanguageDropdownOpen && (
              <>
                {/* Overlay backdrop to close dropdown when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsLanguageDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-900"
                >
                  {['Simplified English (Default)'].map((lang) => {
                    const isSelected = selectedLanguage === lang;
                    return (
                      <button
                        key={lang}
                        onClick={() => {
                          setSelectedLanguage(lang);
                          setIsLanguageDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between text-left text-xs transition-colors hover:bg-slate-900/60 cursor-pointer ${
                          isSelected ? 'text-amber-400 font-bold bg-[#d97706]/5' : 'text-slate-300 font-medium'
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-100">{lang}</span>
                        
                        {/* Circle selector */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected 
                            ? 'border-[#d97706] bg-[#d97706]/10' 
                            : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-[#d97706] shadow-sm shadow-[#d97706]/50" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Available Episode Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsLanguageDropdownOpen(false); // Close other menu
              setIsExploreMenuOpen(false); // Close other menu
            }}
            className="w-full bg-slate-950 border border-[#d97706]/70 hover:bg-slate-900 hover:border-[#d97706] active:scale-[0.99] transition-all rounded-xl px-5 py-2.5 flex items-center justify-between shadow-md shadow-[#d97706]/10 cursor-pointer relative group"
          >
            <div className="flex flex-col text-left pr-4 overflow-hidden">
              <span className="font-extrabold text-[#d97706] text-[10px] tracking-widest uppercase">
                2. AVAILABLE EPISODE SELECTOR
              </span>
              <span className="text-xs font-semibold text-slate-100 truncate">
                {currentEpisode?.title ? `Ep ${currentEpisode.episodeNumber || 1}: ${currentEpisode.title}` : 'Select Episode'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#d97706] shrink-0 transition-transform group-hover:translate-x-0.5" style={{ strokeWidth: 2.5 }} />
          </button>

          {/* Dropdown Container */}
          <AnimatePresence>
            {isDropdownOpen && (
              <>
                {/* Overlay backdrop to close dropdown when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-900"
                >
                  {manifests.map((manifest) => {
                    const isSelected = manifest.episodeId === selectedEpisodeId;
                    return (
                      <button
                        key={manifest.episodeId}
                        onClick={() => {
                          setSelectedEpisodeId(manifest.episodeId);
                          setSelectedStudyId('script'); // Reset study category on switch
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between text-left text-xs transition-colors hover:bg-slate-900/60 cursor-pointer ${
                          isSelected ? 'text-amber-400 font-bold bg-[#d97706]/5' : 'text-slate-300 font-medium'
                        }`}
                      >
                        <div className="flex flex-col gap-0.5 pr-4">
                          <span className="text-xs font-semibold text-slate-100">{manifest.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{manifest.subtitle}</span>
                        </div>
                        
                        {/* Circle selector */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected 
                            ? 'border-[#d97706] bg-[#d97706]/10' 
                            : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-[#d97706] shadow-sm shadow-[#d97706]/50" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Study Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setIsExploreMenuOpen(!isExploreMenuOpen);
              setIsDropdownOpen(false); // Close other menu
              setIsLanguageDropdownOpen(false); // Close other menu
            }}
            className="w-full bg-slate-950 border border-[#d97706]/70 hover:bg-slate-900 hover:border-[#d97706] active:scale-[0.99] transition-all rounded-xl px-5 py-2.5 flex items-center justify-between shadow-md shadow-[#d97706]/10 cursor-pointer relative group"
          >
            <div className="flex flex-col text-left pr-4 overflow-hidden">
              <span className="font-extrabold text-[#d97706] text-[10px] tracking-widest uppercase">
                3. STUDY & PRESENTATION SELECTOR
              </span>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-semibold text-slate-100 truncate">
                <span className="text-amber-400 shrink-0">
                  {getStudyIcon(
                    currentEpisode.studySelector?.find((s) => s.id === selectedStudyId)?.type || 'script',
                    selectedStudyId
                  )}
                </span>
                <span className="truncate">{getActiveExploreLabel()}</span>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 text-[#d97706] shrink-0 transition-transform ${isExploreMenuOpen ? 'rotate-90' : 'group-hover:translate-x-0.5'}`} style={{ strokeWidth: 2.5 }} />
          </button>

          {/* Explore Dropdown Container */}
          <AnimatePresence>
            {isExploreMenuOpen && (
              <>
                {/* Overlay backdrop to close dropdown when clicking outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsExploreMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-900 max-h-[380px] overflow-y-auto custom-scrollbar"
                >
                  {currentEpisode.studySelector.map((option) => {
                    const isSelected = selectedStudyId === option.id;
                    const displayLabel = cleanTabLabel(option.label);
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedStudyId(option.id);
                          setIsExploreMenuOpen(false);
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between text-left text-xs transition-colors hover:bg-slate-900/80 cursor-pointer ${
                          isSelected ? 'text-amber-400 font-bold bg-[#d97706]/10' : 'text-slate-300 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-3">
                          <span className={isSelected ? 'text-amber-400' : 'text-slate-400'}>
                            {getStudyIcon(option.type, option.id)}
                          </span>
                          <span className="text-xs font-semibold truncate">{displayLabel}</span>
                        </div>

                        {/* Dot indicator */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected 
                            ? 'border-[#d97706] bg-[#d97706]/20' 
                            : 'border-slate-700 bg-slate-900'
                        }`}>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-[#d97706] shadow-sm shadow-[#d97706]/50" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Main study material scroll container */}
      <div className="flex-grow overflow-y-auto px-4 py-5 custom-scrollbar relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStudyId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {/* SCRIPT RENDERER */}
            {selectedStudyId === 'script' && (
              <ScriptRenderer episodeId={selectedEpisodeId} />
            )}

            {/* SLIDES RENDERER */}
            {selectedStudyId === 'slides' && (
              <SlideRenderer episodeId={selectedEpisodeId} />
            )}

            {/* INTERACTIVE QUIZ RENDERER */}
            {selectedStudyId === 'quiz' && (
              <QuizRenderer quizData={currentEpisode.quizData} />
            )}

            {/* GLOSSARY FLASHCARD RENDERER */}
            {selectedStudyId === 'flashcards' && (
              <FlashcardRenderer flashcardData={currentEpisode.flashcardData} />
            )}

            {/* CONCEPT MIND MAP RENDERER */}
            {selectedStudyId === 'mindmap' && (
              <MindmapRenderer mindmapData={currentEpisode.mindmapData} />
            )}

            {/* AUDIO STUDY CENTER (RENDERER) */}
            {(selectedStudyId === 'audio-deep' || selectedStudyId === 'audio-love') && (
              <div className="space-y-6 flex flex-col justify-between h-full min-h-[400px]">
                {/* Header overview */}
                <div className="space-y-2 border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <Music className="w-5 h-5 animate-pulse" />
                    <h3 className="font-display font-semibold text-lg text-slate-100">
                      Theological Audio Center
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Listen to deep-dive audio breakdowns of Boethian eternity, quantum physics bridges, and the sovereign nature of free love. Produced using state-of-the-art educational studio generation.
                  </p>
                </div>

                {/* Styled Cassette/Audio Deck Mockup */}
                <div className="rounded-2xl border border-slate-800 bg-radial from-slate-900 to-slate-950 p-6 shadow-xl relative overflow-hidden flex flex-col items-center justify-center py-8">
                  {/* Glowing background halo */}
                  <div className="absolute w-44 h-44 bg-amber-500/5 blur-3xl rounded-full" />
                  
                  {/* Cassette spindles mock */}
                  <div className="flex items-center gap-10 mb-6 relative">
                    <div className={`w-12 h-12 rounded-full border-4 border-dashed border-slate-800 bg-slate-950 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
                      <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-800" />
                    </div>
                    <div className="text-[10px] font-mono text-slate-600 font-bold uppercase tracking-widest bg-slate-950 border border-slate-850 px-2.5 py-1 rounded">
                      SIDE A
                    </div>
                    <div className={`w-12 h-12 rounded-full border-4 border-dashed border-slate-800 bg-slate-950 flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
                      <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-800" />
                    </div>
                  </div>

                  {/* Audio metadata */}
                  <div className="text-center space-y-1 relative mb-6">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      {selectedStudyId === 'audio-deep' ? 'OVERVIEW STUDY' : 'EXEGESIS ANALYSIS'}
                    </span>
                    <h4 className="font-display font-bold text-base text-slate-100 mt-2">
                      {selectedStudyId === 'audio-deep' ? 'Deep Dive Audio' : 'Forced Love Analysis'}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono italic">
                      Length: ~08:00 minutes • Stereo CDN Source
                    </p>
                  </div>

                  {/* Dynamic Sound Waveforms */}
                  <div className="flex items-end justify-center gap-1 w-full max-w-[180px] h-10 mb-4 relative z-10">
                    {[6, 12, 22, 10, 18, 32, 28, 14, 24, 38, 20, 12, 30, 24, 16, 8].map((baseHeight, idx) => {
                      // Modulate height when playing to look interactive
                      const randomMod = isPlaying ? Math.sin(Date.now() / 150 + idx) * 8 + 4 : 0;
                      const finalHeight = Math.max(4, Math.min(40, baseHeight + randomMod));
                      return (
                        <div
                          key={idx}
                          className="w-1.5 rounded-full bg-[#d97706]/80 transition-all duration-150"
                          style={{ height: `${finalHeight}px` }}
                        />
                      );
                    })}
                  </div>

                  {/* Audio CDN Endpoint */}
                  <div className="w-full text-center mb-2">
                    <a
                      href={getAudioUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
                    >
                      <span>Direct CDN URL</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Player Progress Slider */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-800 h-1.5 rounded-full relative overflow-hidden cursor-pointer" onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = (clickX / rect.width) * 100;
                    setAudioProgress(percent);
                  }}>
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${audioProgress}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{currentTimeStr}</span>
                    <span>08:00</span>
                  </div>
                </div>

                {/* Main Player controls bar */}
                <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
                  {/* Volume icon */}
                  <div className="flex items-center gap-1 text-slate-400">
                    <Volume2 className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-mono uppercase font-semibold">HQ Audio</span>
                  </div>

                  {/* Play Center */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isPlaying
                        ? 'bg-rose-500 hover:bg-rose-400 text-slate-950'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    } active:scale-90`}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-slate-950" /> : <Play className="w-5 h-5 fill-slate-950 ml-0.5" />}
                  </button>

                  {/* Playback speed toggle */}
                  <button
                    onClick={() => {
                      setPlaybackSpeed((prev) => (prev === 1 ? 1.25 : prev === 1.25 ? 1.5 : 1));
                    }}
                    className="flex items-center gap-1 text-xs font-mono font-bold bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                    title="Change speed"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>{playbackSpeed}x</span>
                  </button>
                </div>
              </div>
            )}

            {/* INFOGRAPHIC VIEWER */}
            {selectedStudyId === 'infographic' && (
              <div className="space-y-5">
                <div className="space-y-2 border-b border-slate-800 pb-4">
                  <span className="text-[10px] font-bold text-[#d97706] uppercase tracking-widest block">Episode Visual Schema</span>
                  <h3 className="font-display font-bold text-lg text-slate-100">Theological Infographic</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    A comprehensive high-contrast vector infographic representing Boethius's mountaintop perspective and Maximus the Confessor's Logos/Tropos performance.
                  </p>
                </div>
                
                {/* Visual schematic panel */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4 shadow-xl">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-900 border border-slate-850 flex items-center justify-center">
                    {/* Simulated SVG Graphic for Infographic */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4">
                      {/* Mountaintop */}
                      <div className="flex justify-center">
                        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-mono rounded font-bold">
                          MOUNTAIN: ETERNAL TIMELINESS (BOETHIUS)
                        </div>
                      </div>
                      
                      {/* Connection Vectors */}
                      <div className="flex justify-between items-center px-4">
                        <div className="h-0.5 flex-grow border-t border-dashed border-slate-700 mx-2" />
                        <span className="text-[10px] font-mono text-slate-500 italic">Sovereign Gaze</span>
                        <div className="h-0.5 flex-grow border-t border-dashed border-slate-700 mx-2" />
                      </div>

                      {/* Road */}
                      <div className="flex justify-between">
                        <div className="px-2 py-1 bg-[#d97706]/10 border border-[#d97706]/30 text-amber-200 text-[8px] font-mono rounded">
                          LOGOS: SHEET MUSIC Blueprint
                        </div>
                        <div className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[8px] font-mono rounded">
                          TROPOS: ROAD PERFORMANCE
                        </div>
                      </div>
                    </div>
                    
                    {/* Focal graphics center */}
                    <Compass className="w-16 h-16 text-[#d97706]/40 animate-pulse" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">FORMAT: high-res PNG (Web preview)</span>
                    <a
                      href={currentEpisode.heavyMedia.infographicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-semibold"
                    >
                      <span>Open CDN Source</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* VIDEO OVERVIEW */}
            {selectedStudyId === 'video' && (
              <div className="space-y-5">
                <div className="space-y-2 border-b border-slate-800 pb-4">
                  <span className="text-[10px] font-bold text-[#d97706] uppercase tracking-widest block">Cinematic Brief Overview</span>
                  <h3 className="font-display font-bold text-lg text-slate-100">Brief Video Overview</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Watch a summary presentation on Boethius, the Block Universe paradoxes, and sovereign free love, engineered in professional video formatting.
                  </p>
                </div>
                
                {/* Styled Video Frame */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-4 shadow-xl">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-850 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex flex-col justify-end p-3.5 z-10">
                      <span className="text-[10px] font-mono text-slate-400">EPISODE STORYBOARD REEL</span>
                      <h4 className="text-xs font-bold text-slate-200 truncate mt-1">
                        Reconciling Eternity & Time: The 4D Perspective
                      </h4>
                    </div>

                    {/* Play button over simulated screen */}
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-14 h-14 rounded-full bg-[#d97706]/90 hover:bg-[#d97706] text-white flex items-center justify-center shadow-lg active:scale-95 transition-all z-20 cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-6 h-6 fill-white" /> : <Play className="w-6 h-6 fill-white ml-1" />}
                    </button>
                    
                    {/* Simulated progress overlay */}
                    {isPlaying && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#d97706]/40 z-20">
                        <motion.div 
                          className="h-full bg-[#d97706]" 
                          animate={{ width: ['0%', '100%'] }}
                          transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>LENGTH: 03:45 MINS</span>
                    <span>1080P HD • SECURE HOST</span>
                  </div>
                </div>
              </div>
            )}

            {/* REPORTS RENDERER */}
            {selectedStudyId === 'reports' && (
              <div className="space-y-5">
                <div className="space-y-2 border-b border-slate-800 pb-4">
                  <span className="text-[10px] font-bold text-[#d97706] uppercase tracking-widest block">Executive Summary & Analytics</span>
                  <h3 className="font-display font-bold text-lg text-slate-100">Academic Episode Report</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Review structural summaries, quantitative pipeline engagement, theological correlations, and study outline breakdowns.
                  </p>
                </div>

                {/* Report sheet details */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3 mb-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-black block mb-1">Outline Highlights</span>
                    <h4 className="text-sm font-semibold text-slate-200">Executive Summary • The Road and the Mountain</h4>
                  </div>

                  <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                    <div className="flex gap-2.5 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d97706] mt-1.5 shrink-0" />
                      <p>
                        <strong className="text-slate-200">The Gaze:</strong> Eternal wisdom is non-coercive. Viewing historical paths of free will from the timeless "now" does not impose necessity.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d97706] mt-1.5 shrink-0" />
                      <p>
                        <strong className="text-slate-200">The Composition:</strong> The *Logos* remains a perfect compositions map. The human *Tropos* is the active, sovereign performance of that melody across time.
                      </p>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d97706] mt-1.5 shrink-0" />
                      <p>
                        <strong className="text-slate-200">Scientific Bridges:</strong> Quantum wave-collapse irreversibility (George Ellis) and temporal flow theories (Joan Vaccaro) demonstrate compatibility with a 4D landscape.
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500">PAGES: 3 • VERSION: 1.0</span>
                    <span className="text-xs font-mono text-[#d97706] bg-[#d97706]/10 px-2 py-1 rounded border border-[#d97706]/20 font-bold uppercase tracking-wide">
                      Review Complete
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* INSPIRING QUOTES & BIBLE VERSES RENDERER */}
            {selectedStudyId === 'quotes' && (
              <div className="space-y-5">
                <div className="space-y-2 border-b border-slate-800 pb-4">
                  <span className="text-[10px] font-bold text-[#d97706] uppercase tracking-widest block">Scripture & Wisdom</span>
                  <h3 className="font-display font-bold text-lg text-slate-100">Inspiring Quotations & Bible Verses</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Meditate on the sacred scripture and philosophical thoughts detailing the timeless wisdom of the Logos.
                  </p>
                </div>

                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {(EPISODE_QUOTES[selectedEpisodeId] || EPISODE_QUOTES['episode-1']).map((q, qIdx) => {
                    const isCopied = copiedQuoteId === qIdx;
                    return (
                      <div 
                        key={qIdx} 
                        className="rounded-xl border border-slate-850 bg-slate-900/15 p-5 space-y-3.5 shadow-md relative hover:border-slate-800 transition-all duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono font-bold text-[#d97706] bg-[#d97706]/10 px-2 py-0.5 rounded border border-[#d97706]/20 uppercase tracking-widest">
                            {q.category}
                          </span>
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`"${q.text}" — ${q.reference}`);
                              setCopiedQuoteId(qIdx);
                              setTimeout(() => setCopiedQuoteId(null), 2000);
                            }}
                            className="p-1 rounded bg-slate-800/40 hover:bg-slate-850 border border-slate-700/40 text-slate-400 hover:text-slate-200 transition-all active:scale-95 cursor-pointer"
                            title="Copy Quote"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex gap-3 items-start">
                          <Quote className="w-5 h-5 text-amber-500/20 shrink-0 mt-0.5" />
                          <p className="text-xs md:text-sm text-slate-200 font-medium italic leading-relaxed">
                            {q.text}
                          </p>
                        </div>

                        <div className="text-right text-[10px] font-mono text-slate-500">
                          — {q.reference}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </div>
  );
}
