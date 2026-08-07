import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronRight,
  Sparkles,
  Music,
  Presentation,
  Image as ImageIcon,
  Network,
  BookOpen,
  FileText,
  Layers,
  Feather,
  Languages,
} from 'lucide-react';
import { AssetRole, Devotional, EpisodeManifest } from '../types';
import MarkdownRenderer from './Renderers/MarkdownRenderer';
import SlideRenderer from './Renderers/SlideRenderer';
import FlashcardRenderer from './Renderers/FlashcardRenderer';
import AudioRenderer from './Renderers/AudioRenderer';

interface UserDashboardProps {
  manifests: EpisodeManifest[];
  selectedEpisodeId: string;
  setSelectedEpisodeId: (id: string) => void;
  selectedStudyId: string;
  setSelectedStudyId: (id: string) => void;
}

type SelectionKey = AssetRole | 'devotional';

interface Selection {
  key: SelectionKey;
  lang: string;
}

interface ResolvedAsset {
  url: string;
  lang: string;
  fallback: boolean;
}

interface ResolvedDevotional {
  devotional: Devotional;
  lang: string;
  fallback: boolean;
}

const ASSET_ROWS: { key: AssetRole; label: string; icon: LucideIcon }[] = [
  { key: 'audioOverview', label: 'Audio Overview', icon: Music },
  { key: 'slideDeck', label: 'Slide Deck', icon: Presentation },
  { key: 'infographic', label: 'Infographic', icon: ImageIcon },
  { key: 'mindmap', label: 'Mindmap', icon: Network },
  { key: 'masterScript', label: 'Master Script', icon: BookOpen },
  { key: 'report', label: 'Report', icon: FileText },
  { key: 'flashcards', label: 'Flashcards', icon: Layers },
];

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
  es: 'Español',
};

const languageLabel = (code: string) => LANGUAGE_LABELS[code] ?? code.toUpperCase();

/** Step 1: this language. Step 2: fall back to the default language. Step 3: render nothing. */
function resolveAsset(ep: EpisodeManifest, key: AssetRole, lang: string): ResolvedAsset | null {
  const own = ep.languages[lang]?.assets[key];
  if (own) return { url: own, lang, fallback: false };
  const fallbackUrl = ep.languages[ep.defaultLanguage]?.assets[key];
  if (fallbackUrl) return { url: fallbackUrl, lang: ep.defaultLanguage, fallback: true };
  return null;
}

function resolveDevotional(ep: EpisodeManifest, lang: string): ResolvedDevotional | null {
  const own = ep.languages[lang]?.devotional;
  if (own) return { devotional: own, lang, fallback: false };
  const fallback = ep.languages[ep.defaultLanguage]?.devotional;
  if (fallback) return { devotional: fallback, lang: ep.defaultLanguage, fallback: true };
  return null;
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
  const [selection, setSelection] = useState<Selection | null>(null);

  useEffect(() => {
    setSelection(null);
    setSelectedStudyId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEpisodeId]);

  if (!currentEpisode) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
        <p>No study guides have been staged in the database yet.</p>
      </div>
    );
  }

  const languageColumns = Object.keys(currentEpisode.languages)
    .filter((lang) => !!currentEpisode.languages[lang]?.assets.audioOverview)
    .sort((a, b) => {
      if (a === currentEpisode.defaultLanguage) return -1;
      if (b === currentEpisode.defaultLanguage) return 1;
      return a.localeCompare(b);
    });

  const openCell = (key: SelectionKey, lang: string) => {
    setSelection({ key, lang });
    setSelectedStudyId(key);
  };

  const isActiveCell = (key: SelectionKey, lang: string) => selection?.key === key && selection?.lang === lang;

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-100 font-sans select-none">
      {/* Header */}
      <div className="px-6 py-4 bg-[#0f172a] border-b border-white/5 shrink-0 flex flex-col gap-3 relative z-50">
        <div className="flex items-center justify-between gap-2 pb-0.5">
          <span className="text-xs sm:text-sm font-extrabold text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>STUDY PORTAL</span>
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen((v) => !v)}
            className="w-full bg-slate-950 border border-[#d97706]/70 hover:bg-slate-900 hover:border-[#d97706] active:scale-[0.99] transition-all rounded-xl px-5 py-2.5 flex items-center justify-between shadow-md shadow-[#d97706]/10 cursor-pointer relative group"
          >
            <div className="flex flex-col text-left pr-4 overflow-hidden">
              <span className="font-extrabold text-[#d97706] text-[10px] tracking-widest uppercase">Episode</span>
              <span className="text-xs font-semibold text-slate-100 truncate">
                Ep {String(currentEpisode.sequence).padStart(2, '0')}: {currentEpisode.title}
              </span>
            </div>
            <ChevronRight
              className="w-4 h-4 text-[#d97706] shrink-0 transition-transform group-hover:translate-x-0.5"
              style={{ strokeWidth: 2.5 }}
            />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-900"
                >
                  {manifests
                    .slice()
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((manifest) => {
                      const isSelected = manifest.episodeId === selectedEpisodeId;
                      return (
                        <button
                          key={manifest.episodeId}
                          onClick={() => {
                            setSelectedEpisodeId(manifest.episodeId);
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
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? 'border-[#d97706] bg-[#d97706]/10' : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#d97706] shadow-sm shadow-[#d97706]/50" />}
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

      {/* Availability table + detail panel */}
      <div className="flex-grow overflow-y-auto px-4 py-5 custom-scrollbar relative space-y-3">
        {ASSET_ROWS.map((row) => (
          <AvailabilityRow
            key={row.key}
            label={row.label}
            icon={row.icon}
            languages={languageColumns}
            resolveCell={(lang) => resolveAsset(currentEpisode, row.key, lang)}
            isActive={(lang) => isActiveCell(row.key, lang)}
            onOpen={(lang) => openCell(row.key, lang)}
          />
        ))}

        <AvailabilityRow
          label="Devotional"
          icon={Feather}
          languages={languageColumns}
          accent="cream"
          resolveCell={(lang) => {
            const resolved = resolveDevotional(currentEpisode, lang);
            return resolved ? { fallback: resolved.fallback } : null;
          }}
          isActive={(lang) => isActiveCell('devotional', lang)}
          onOpen={(lang) => openCell('devotional', lang)}
        />

        <div className="pt-3">
          <AnimatePresence mode="wait">
            {selection ? (
              <motion.div
                key={`${selection.key}-${selection.lang}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >
                <DetailPanel episode={currentEpisode} selection={selection} />
              </motion.div>
            ) : (
              <div className="text-center text-xs text-slate-500 py-10 border border-dashed border-slate-800 rounded-xl">
                Tap a language chip above to open that asset.
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ availability row --- */

interface AvailabilityRowProps {
  label: string;
  icon: LucideIcon;
  languages: string[];
  accent?: 'default' | 'cream';
  resolveCell: (lang: string) => { fallback: boolean } | null;
  isActive: (lang: string) => boolean;
  onOpen: (lang: string) => void;
}

function AvailabilityRow({ label, icon: Icon, languages, accent = 'default', resolveCell, isActive, onOpen }: AvailabilityRowProps) {
  const chips = languages
    .map((lang) => ({ lang, resolved: resolveCell(lang) }))
    .filter((c): c is { lang: string; resolved: { fallback: boolean } } => !!c.resolved);

  if (chips.length === 0) return null;

  return (
    <div
      className={`rounded-xl border p-3.5 space-y-2.5 ${
        accent === 'cream' ? 'border-amber-900/30 bg-amber-950/10' : 'border-slate-800 bg-slate-900/30'
      }`}
    >
      <div className="flex items-center gap-2 text-slate-200">
        <Icon className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map(({ lang, resolved }) => {
          const active = isActive(lang);
          return (
            <button
              key={lang}
              onClick={() => onOpen(lang)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                active
                  ? 'border-amber-500 bg-amber-500/15 text-amber-300'
                  : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600 hover:bg-slate-900'
              }`}
            >
              {languageLabel(lang)}
              {resolved.fallback && <span className="ml-1 text-slate-500">(EN)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- detail panel --- */

function DetailPanel({ episode, selection }: { episode: EpisodeManifest; selection: Selection }) {
  const { key, lang } = selection;

  if (key === 'devotional') {
    const resolved = resolveDevotional(episode, lang);
    if (!resolved) return null;
    return (
      <div className="space-y-3">
        <FallbackBanner tappedLang={lang} resolved={resolved} />
        <DevotionalCard devotional={resolved.devotional} />
      </div>
    );
  }

  const resolved = resolveAsset(episode, key, lang);
  if (!resolved) return null;

  return (
    <div className="space-y-3">
      <FallbackBanner tappedLang={lang} resolved={resolved} />
      {key === 'audioOverview' && <AudioRenderer url={resolved.url} />}
      {key === 'slideDeck' && <SlideRenderer url={resolved.url} />}
      {key === 'infographic' && (
        <div className="space-y-4 pb-24">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ImageIcon className="w-5 h-5 text-amber-500 shrink-0" />
            <h3 className="font-display text-lg font-semibold text-slate-100">Infographic</h3>
          </div>
          <img src={resolved.url} alt="Episode infographic" className="w-full rounded-xl border border-slate-800" loading="lazy" />
        </div>
      )}
      {key === 'mindmap' && <MarkdownRenderer url={resolved.url} title="Mindmap" />}
      {key === 'masterScript' && <MarkdownRenderer url={resolved.url} title="Master Script" />}
      {key === 'report' && <MarkdownRenderer url={resolved.url} title="Report" />}
      {key === 'flashcards' && <FlashcardRenderer url={resolved.url} />}
    </div>
  );
}

function FallbackBanner({ tappedLang, resolved }: { tappedLang: string; resolved: { lang: string; fallback: boolean } }) {
  if (!resolved.fallback) return null;
  return (
    <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
      <Languages className="w-3.5 h-3.5 shrink-0" />
      <span>
        Not yet available in {languageLabel(tappedLang)} — showing {languageLabel(resolved.lang)}.
      </span>
    </div>
  );
}

function DevotionalCard({ devotional }: { devotional: Devotional }) {
  const hasContent = devotional.quote || devotional.verse || devotional.reflection;
  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Feather className="w-5 h-5 text-amber-500 shrink-0" />
        <h3 className="font-display text-lg font-semibold text-slate-100">Devotional</h3>
      </div>
      <div className="rounded-2xl border border-amber-900/30 bg-[#f3ead8] text-slate-900 p-6 space-y-4 shadow-xl font-serif">
        {!hasContent && <p className="text-sm italic text-slate-600">This devotional hasn't been written yet.</p>}

        {devotional.quote && (
          <div className="space-y-1">
            <p className="italic text-base leading-relaxed">&ldquo;{devotional.quote}&rdquo;</p>
            {devotional.quoteSource && <p className="text-xs text-slate-600 text-right">— {devotional.quoteSource}</p>}
          </div>
        )}

        {devotional.verse && (
          <div className="border-t border-amber-900/20 pt-4 space-y-1">
            <p className="italic text-sm leading-relaxed">{devotional.verse}</p>
            {devotional.verseRef && <p className="text-xs text-slate-600 text-right">— {devotional.verseRef}</p>}
          </div>
        )}

        {devotional.reflection && (
          <div className="border-t border-amber-900/20 pt-4">
            <p className="text-sm leading-relaxed">{devotional.reflection}</p>
          </div>
        )}
      </div>
    </div>
  );
}
