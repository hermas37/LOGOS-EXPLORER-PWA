import React, { useCallback, useMemo, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import {
  Upload,
  Github,
  Cloud,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Loader2,
  FileText,
  Plus,
  Trash2,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  Headphones,
  Film,
  Presentation,
  HelpCircle,
  BookOpen,
  Layers,
  CircleCheck,
  CircleDashed,
  RotateCw,
  Image as ImageIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { AssetDestination, AssetRole, Devotional, EpisodeAsset, EpisodeManifest } from '../types';

/* ============================================================================
   PUBLISHING CONSOLE
   One drop zone. Files sort themselves into two lanes on filename + extension:
   LIGHT (text/data -> committed to the GitHub repo) and
   HEAVY (audio/video/images/pdf -> streamed to Vercel Blob CDN).
   Tokens never touch this component — /api/blob-upload and /api/publish read
   them from server-side environment variables behind an admin password.
============================================================================ */

const HEAVY: AssetDestination = 'blob';
const LIGHT: AssetDestination = 'repo';

interface RoleDef {
  key: AssetRole;
  label: string;
  short: string;
  icon: LucideIcon;
  dest: AssetDestination;
  ext: string[];
  hints: string[];
  blurb: string;
}

const ROLES: Record<AssetRole, RoleDef> = {
  audioOverview: {
    key: 'audioOverview', label: 'Audio Overview', short: 'Audio',
    icon: Headphones, dest: HEAVY, ext: ['mp3', 'wav', 'm4a'],
    hints: ['audio', 'overview', 'deepdive', 'deep-dive', 'podcast', 'narration'],
    blurb: 'The NotebookLM two-host conversation.',
  },
  videoOverview: {
    key: 'videoOverview', label: 'Video Overview', short: 'Video',
    icon: Film, dest: HEAVY, ext: ['mp4', 'mov', 'webm'],
    hints: ['video', 'short', 'overview', 'clip'],
    blurb: 'The short visual summary.',
  },
  slideDeck: {
    key: 'slideDeck', label: 'Slide Deck', short: 'Slides',
    icon: Presentation, dest: HEAVY, ext: ['pdf'],
    hints: ['slide', 'deck', 'presentation'],
    blurb: 'Exported deck with presenter notes.',
  },
  infographic: {
    key: 'infographic', label: 'Infographic', short: 'Infographic',
    icon: ImageIcon, dest: HEAVY, ext: ['png', 'jpg', 'jpeg', 'webp'],
    hints: ['infographic', 'graphic', 'poster', 'diagram', 'chart'],
    blurb: 'One-page visual explainer.',
  },
  report: {
    key: 'report', label: 'Report', short: 'Report',
    icon: FileText, dest: LIGHT, ext: ['md', 'txt'],
    hints: ['report', 'briefing', 'brief', 'study', 'guide', 'faq', 'timeline'],
    blurb: 'Briefing doc, study guide, FAQ.',
  },
  transcript: {
    key: 'transcript', label: 'Master Script', short: 'Script',
    icon: BookOpen, dest: LIGHT, ext: ['md', 'txt'],
    hints: ['transcript', 'script', 'master', 'source', 'story'],
    blurb: 'The single source story the episode came from.',
  },
  flashcards: {
    key: 'flashcards', label: 'Flashcards', short: 'Cards',
    icon: Layers, dest: LIGHT, ext: ['json', 'csv'],
    hints: ['flashcard', 'card', 'term', 'glossary', 'vocab'],
    blurb: 'Greek terms and definitions.',
  },
  quiz: {
    key: 'quiz', label: 'Quiz', short: 'Quiz',
    icon: HelpCircle, dest: LIGHT, ext: ['json', 'csv'],
    hints: ['quiz', 'question', 'assessment', 'test', 'check'],
    blurb: 'Multiple-choice knowledge check.',
  },
};

const ROLE_LIST = Object.values(ROLES);

const EMPTY_DEVOTIONAL: Devotional = { quote: '', quoteSource: '', verse: '', verseRef: '', reflection: '' };

/** Guess the role from filename keywords first, extension second. */
function detectRole(fileName: string): { role: AssetRole | null; confident: boolean } {
  const lower = fileName.toLowerCase();
  const ext = lower.includes('.') ? lower.split('.').pop()! : '';
  const base = lower.replace(/\.[^.]+$/, '');

  let best: RoleDef | null = null;
  let bestScore = 0;
  for (const r of ROLE_LIST) {
    if (!r.ext.includes(ext)) continue;
    let score = 1; // extension alone is a weak match
    for (const h of r.hints) if (base.includes(h)) score += 4;
    if (score > bestScore) { bestScore = score; best = r; }
  }
  return best ? { role: best.key, confident: bestScore >= 5 } : { role: null, confident: false };
}

const fmtBytes = (n: number) => {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1048576).toFixed(1) + ' MB';
};

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** UTF-8 safe string -> base64, since btoa() only accepts latin1. */
const utf8ToB64 = (str: string) =>
  btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))));

const readAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

interface StagedFile {
  uid: string;
  file: File;
  name: string;
  size: number;
  role: AssetRole | null;
  confident: boolean;
}

type StepStatus = 'pending' | 'active' | 'done' | 'error';
interface PublishStep {
  id: string;
  label: string;
  status: StepStatus;
  detail?: string;
}
interface PublishState {
  steps: PublishStep[];
  done: boolean;
  error: string | null;
}

interface AdminDashboardProps {
  manifests: EpisodeManifest[];
  onManifestUpdate: (updatedManifests: EpisodeManifest[]) => void;
  selectedEpisodeId: string;
}

export default function AdminDashboard({ manifests, onManifestUpdate, selectedEpisodeId }: AdminDashboardProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [epId, setEpId] = useState<string>(selectedEpisodeId || manifests[0]?.episodeId || '');
  const ep = manifests.find((m) => m.episodeId === epId) || manifests[0];

  const [staged, setStaged] = useState<StagedFile[]>([]);
  const [publishing, setPublishing] = useState<PublishState | null>(null);
  const [showManifest, setShowManifest] = useState(false);

  const updateEp = useCallback((patch: Partial<EpisodeManifest>) => {
    if (!ep) return;
    onManifestUpdate(manifests.map((m) => (m.episodeId === ep.episodeId ? { ...m, ...patch } : m)));
  }, [ep, manifests, onManifestUpdate]);

  const addFiles = useCallback((fileList: FileList) => {
    const next: StagedFile[] = Array.from(fileList).map((f, i) => {
      const { role, confident } = detectRole(f.name);
      return { uid: `${Date.now()}-${i}-${f.name}`, file: f, name: f.name, size: f.size, role, confident };
    });
    setStaged((prev) => [...prev, ...next]);
  }, []);

  const setRole = (uid: string, role: AssetRole) =>
    setStaged((prev) => prev.map((s) => (s.uid === uid ? { ...s, role, confident: true } : s)));
  const removeStaged = (uid: string) => setStaged((prev) => prev.filter((s) => s.uid !== uid));

  const light = staged.filter((s): s is StagedFile & { role: AssetRole } => !!s.role && ROLES[s.role].dest === LIGHT);
  const heavy = staged.filter((s): s is StagedFile & { role: AssetRole } => !!s.role && ROLES[s.role].dest === HEAVY);
  const unknown = staged.filter((s) => !s.role);
  const isPublishing = !!publishing && !publishing.done && !publishing.error;
  const canPublish = staged.length > 0 && unknown.length === 0 && password.trim().length > 0 && !!ep && !isPublishing;

  const addEpisode = () => {
    const n = manifests.length + 1;
    const id = `episode-${n}`;
    const fresh: EpisodeManifest = {
      episodeId: id,
      episodeNumber: n,
      title: 'Untitled episode',
      subtitle: '',
      transcriptUrl: '',
      heavyMedia: { spreadsheetUrl: '', infographicUrl: '', fullAudioUrl: '', coercedLoveAudioUrl: '' },
      studySelector: [],
      quizData: [],
      flashcardData: [],
      mindmapData: { name: 'Logos Root', children: [] },
      slug: '',
      youtubeUrl: '',
      published: false,
      devotional: { ...EMPTY_DEVOTIONAL },
      assets: {},
    };
    onManifestUpdate([...manifests, fresh]);
    setEpId(id);
    setStaged([]);
    setPublishing(null);
  };

  const updateStep = (id: string, status: StepStatus, detail?: string) => {
    setPublishing((prev) => {
      if (!prev) return prev;
      return { ...prev, steps: prev.steps.map((s) => (s.id === id ? { ...s, status, detail: detail ?? s.detail } : s)) };
    });
  };

  const failPublish = (message: string) => {
    setPublishing((prev) => (prev ? { ...prev, error: message } : prev));
  };

  const publish = async () => {
    if (!ep || !canPublish) return;

    const slug = ep.slug || slugify(ep.title) || ep.episodeId;
    const steps: PublishStep[] = [
      { id: 'validate', label: 'Checking episode slug and roles', status: 'pending' },
      ...heavy.map((f) => ({ id: `heavy-${f.uid}`, label: `Uploading ${f.name} to Vercel Blob`, status: 'pending' as StepStatus })),
      { id: 'commit', label: `Committing ${light.length} light file${light.length === 1 ? '' : 's'} and manifest to GitHub`, status: 'pending' },
      { id: 'done', label: 'Published', status: 'pending' },
    ];
    setPublishing({ steps, done: false, error: null });
    updateStep('validate', 'active');

    try {
      const uploadedAssets: Partial<Record<AssetRole, EpisodeAsset>> = {};

      // Heavy files go to Blob first — the manifest needs their URLs.
      updateStep('validate', 'done');
      for (const f of heavy) {
        const stepId = `heavy-${f.uid}`;
        updateStep(stepId, 'active', '0%');
        const blob = await upload(`episodes/${slug}/${f.name}`, f.file, {
          access: 'public',
          handleUploadUrl: '/api/blob-upload',
          clientPayload: JSON.stringify({ password }),
          onUploadProgress: (evt) => updateStep(stepId, 'active', `${Math.round(evt.percentage)}%`),
        });
        uploadedAssets[f.role] = { name: f.name, size: f.size, url: blob.url, dest: HEAVY };
        updateStep(stepId, 'done', '100%');
      }

      updateStep('commit', 'active');

      const lightFiles = await Promise.all(
        light.map(async (f) => {
          const dataUrl = await readAsDataURL(f.file);
          const contentBase64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
          const path = `episodes/${slug}/${f.name}`;
          uploadedAssets[f.role] = { name: f.name, size: f.size, url: path, dest: LIGHT };
          return { path, contentBase64 };
        })
      );

      const updatedEpisode: EpisodeManifest = {
        ...ep,
        slug,
        published: true,
        assets: { ...(ep.assets || {}), ...uploadedAssets },
      };
      const updatedManifests = manifests.map((m) => (m.episodeId === ep.episodeId ? updatedEpisode : m));
      const manifestBase64 = utf8ToB64(JSON.stringify(updatedManifests, null, 2));

      const files = [
        ...lightFiles,
        { path: 'logos-explorer-manifest.json', contentBase64: manifestBase64 },
        { path: 'public/logos-explorer-manifest.json', contentBase64: manifestBase64 },
      ];

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ files, message: `Publish ${ep.title} (${slug})` }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Publish failed (${res.status})`);
      }

      updateStep('commit', 'done');
      updateStep('done', 'done');
      onManifestUpdate(updatedManifests);
      setStaged([]);
      setPublishing((prev) => (prev ? { ...prev, done: true } : prev));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failPublish(message);
    }
  };

  if (!ep) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4 text-center h-full">
        <p className="text-sm text-slate-400">No episodes yet.</p>
        <button
          onClick={addEpisode}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create first episode
        </button>
      </div>
    );
  }

  const slug = ep.slug || slugify(ep.title) || ep.episodeId;
  const devotional = ep.devotional ?? EMPTY_DEVOTIONAL;
  const liveAssets = ep.assets ?? {};
  const stagedRoles = new Set<AssetRole>(staged.map((s) => s.role).filter((r): r is AssetRole => !!r));

  return (
    <div className="p-4 sm:p-6 space-y-8 text-slate-100 overflow-y-auto h-full">
      <SecurityBanner />
      <PasswordField value={password} onChange={setPassword} show={showPassword} onToggleShow={() => setShowPassword((s) => !s)} />

      <Step n={1} title="Choose the episode" caption="Everything you drop below attaches to this episode.">
        <div className="flex gap-2 flex-wrap">
          {manifests.map((m) => {
            const on = m.episodeId === epId;
            return (
              <button
                key={m.episodeId}
                onClick={() => { setEpId(m.episodeId); setStaged([]); setPublishing(null); }}
                className={`px-3.5 py-2 rounded-lg font-mono text-xs transition-all cursor-pointer border ${
                  on ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                EP {String(m.episodeNumber ?? '?').padStart(2, '0')}
                {!m.published && <span className="opacity-70"> · draft</span>}
              </button>
            );
          })}
          <button
            onClick={addEpisode}
            className="px-3.5 py-2 rounded-lg font-mono text-xs flex items-center gap-1.5 border border-dashed border-slate-700 text-sky-400 hover:border-sky-500 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> NEW
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <Field label="Episode title" value={ep.title} onChange={(v) => updateEp({ title: v })} />
          <Field label="Subtitle" value={ep.subtitle} onChange={(v) => updateEp({ subtitle: v })} />
          <Field label="YouTube link" value={ep.youtubeUrl ?? ''} onChange={(v) => updateEp({ youtubeUrl: v })} mono />
          <div>
            <FieldLabel>Folder path (generated)</FieldLabel>
            <div className="font-mono text-xs px-3 py-2.5 rounded-lg truncate bg-slate-950 border border-slate-800 text-slate-500">
              episodes/{slug}/
            </div>
          </div>
        </div>
      </Step>

      <Step n={2} title="Drop the Studio exports" caption="Select everything at once. Files sort themselves — you only fix what's marked.">
        <DropZone onFiles={addFiles} />

        {unknown.length > 0 && (
          <div className="mt-4 rounded-xl p-4 flex gap-3 bg-rose-500/10 border border-rose-500/40">
            <AlertTriangle className="w-[17px] h-[17px] text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm text-slate-100">
                {unknown.length} file{unknown.length > 1 ? 's need' : ' needs'} a role
              </div>
              <div className="text-xs mt-1 text-slate-400">
                Pick one from the dropdown, or remove the file. Publishing stays locked until this is clear.
              </div>
            </div>
          </div>
        )}

        {staged.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <Lane title="Light — goes into the repo" sub="Text and data, versioned in git" icon={Github} accent="sky" rows={[...light, ...unknown]} onRole={setRole} onRemove={removeStaged} />
            <Lane title="Heavy — goes to the CDN" sub="Audio, video, images, PDFs" icon={Cloud} accent="amber" rows={heavy} onRole={setRole} onRemove={removeStaged} />
          </div>
        )}

        <Coverage liveAssets={liveAssets} stagedRoles={stagedRoles} />
      </Step>

      <Step n={3} title="Write the devotional" caption="The part no notebook can generate. Optional, but it's why people come back.">
        <Devo d={devotional} onChange={(d) => updateEp({ devotional: d })} />
      </Step>

      <Step n={4} title="Publish" caption="One action: upload, commit, update the manifest, deploy.">
        <button
          onClick={publish}
          disabled={!canPublish}
          className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-mono text-sm tracking-wider flex items-center justify-center gap-2.5 border transition-all ${
            canPublish
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-500 cursor-pointer'
              : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
        >
          {isPublishing
            ? <><Loader2 className="w-[15px] h-[15px] animate-spin" /> PUBLISHING…</>
            : <>PUBLISH EPISODE {String(ep.episodeNumber ?? '').padStart(2, '0')} <ArrowRight className="w-[15px] h-[15px]" /></>}
        </button>

        {!canPublish && !isPublishing && (
          <p className="text-xs mt-3 text-slate-500">
            {staged.length === 0
              ? 'Drop at least one file to publish.'
              : unknown.length > 0
                ? 'Resolve the flagged files first.'
                : 'Enter the admin password to publish.'}
          </p>
        )}

        {publishing && <PublishLog p={publishing} onReset={() => setPublishing(null)} />}

        <button
          onClick={() => setShowManifest((s) => !s)}
          className="mt-5 font-mono text-xs flex items-center gap-1.5 text-sky-400 cursor-pointer"
        >
          {showManifest ? <ChevronDown className="w-[13px] h-[13px]" /> : <ChevronRight className="w-[13px] h-[13px]" />}
          {showManifest ? 'HIDE' : 'SHOW'} MANIFEST ENTRY
        </button>
        {showManifest && <ManifestPreview ep={ep} staged={staged} slug={slug} />}
      </Step>
    </div>
  );
}

/* ------------------------------------------------------------ admin bits --- */

function SecurityBanner() {
  return (
    <div className="rounded-xl p-4 flex gap-3 bg-amber-500/10 border border-amber-500/30">
      <Lock className="w-[17px] h-[17px] text-amber-400 shrink-0 mt-0.5" />
      <div>
        <div className="text-sm text-slate-100">Tokens live on the server now</div>
        <div className="text-xs mt-1 leading-relaxed text-slate-400">
          This console never holds your GitHub or Blob token. It calls <span className="font-mono">/api/blob-upload</span> and{' '}
          <span className="font-mono">/api/publish</span>, which read them from Vercel environment variables behind a password gate.
        </div>
      </div>
    </div>
  );
}

function PasswordField({ value, onChange, show, onToggleShow }: {
  value: string; onChange: (v: string) => void; show: boolean; onToggleShow: () => void;
}) {
  return (
    <div className="rounded-xl p-4 bg-slate-900 border border-slate-800">
      <FieldLabel>Admin password</FieldLabel>
      <div className="relative mt-1.5">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Required to publish"
          autoComplete="off"
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-10 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500 placeholder-slate-600"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[10px] mt-1.5 text-slate-600">Held in memory for this session only — never saved to disk.</p>
    </div>
  );
}

function DropZone({ onFiles }: { onFiles: (files: FileList) => void }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={`rounded-xl py-12 px-6 text-center cursor-pointer transition-all border-2 border-dashed ${
        over ? 'border-amber-400 bg-amber-500/5' : 'border-slate-800 bg-slate-900'
      }`}
    >
      <input
        ref={inputRef} type="file" multiple className="hidden"
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ''; }}
      />
      <Upload className={`w-6 h-6 mx-auto ${over ? 'text-amber-400' : 'text-slate-500'}`} strokeWidth={1.4} />
      <div className="mt-4 text-lg text-slate-100">Drop your Studio exports here</div>
      <div className="text-sm mt-2 text-slate-400">
        Audio, video, slides, infographic, reports, flashcards, quiz — all in one go.
      </div>
      <div className="font-mono text-xs mt-4 tracking-wider text-slate-600">
        MP3 · WAV · M4A · MP4 · MOV · WEBM · PDF · PNG · JPG · WEBP · MD · TXT · JSON · CSV
      </div>
    </div>
  );
}

function Lane({ title, sub, icon: Icon, accent, rows, onRole, onRemove }: {
  title: string; sub: string; icon: LucideIcon; accent: 'sky' | 'amber';
  rows: StagedFile[]; onRole: (uid: string, role: AssetRole) => void; onRemove: (uid: string) => void;
}) {
  const accentText = accent === 'sky' ? 'text-sky-400' : 'text-amber-400';
  return (
    <div className="rounded-xl p-4 bg-slate-900 border border-slate-800">
      <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-slate-800">
        <Icon className={`w-4 h-4 ${accentText}`} />
        <div>
          <div className={`font-mono text-xs tracking-wider ${accentText}`}>{title.toUpperCase()}</div>
          <div className="text-xs mt-0.5 text-slate-500">{sub}</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-xs py-4 text-center text-slate-600">Nothing here yet</div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => <StagedRow key={r.uid} r={r} onRole={onRole} onRemove={onRemove} />)}
        </div>
      )}
    </div>
  );
}

function StagedRow({ r, onRole, onRemove }: {
  key?: React.Key; r: StagedFile; onRole: (uid: string, role: AssetRole) => void; onRemove: (uid: string) => void;
}) {
  const flagged = !r.role;
  const Icon = r.role ? ROLES[r.role].icon : AlertTriangle;
  return (
    <div className={`rounded-lg p-3 bg-slate-950 border ${flagged ? 'border-rose-500/50' : 'border-slate-800'}`}>
      <div className="flex items-start gap-2.5">
        <Icon className={`w-[15px] h-[15px] shrink-0 mt-0.5 ${flagged ? 'text-rose-400' : 'text-slate-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="text-xs truncate text-slate-100">{r.name}</div>
          <div className="font-mono mt-0.5 text-[10px] text-slate-500">
            {fmtBytes(r.size)}
            {r.role && !r.confident && <span className="text-amber-400"> · guessed from file type</span>}
          </div>
        </div>
        <button onClick={() => onRemove(r.uid)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <select
        value={r.role || ''}
        onChange={(e) => onRole(r.uid, e.target.value as AssetRole)}
        className={`w-full mt-2.5 px-2.5 py-1.5 rounded-md font-mono text-xs bg-slate-950 border cursor-pointer ${
          flagged ? 'border-rose-500/50 text-rose-400' : 'border-slate-800 text-slate-100'
        }`}
      >
        <option value="" disabled>Choose a role…</option>
        {ROLE_LIST.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
      </select>
    </div>
  );
}

function Coverage({ liveAssets, stagedRoles }: {
  liveAssets: Partial<Record<AssetRole, EpisodeAsset>>; stagedRoles: Set<AssetRole>;
}) {
  return (
    <div className="mt-5">
      <FieldLabel>Episode coverage</FieldLabel>
      <div className="flex flex-wrap gap-2 mt-2">
        {ROLE_LIST.map((r) => {
          const live = !!liveAssets[r.key];
          const inc = stagedRoles.has(r.key);
          const cls = inc
            ? 'text-amber-400 border-amber-400/40'
            : live
              ? 'text-emerald-400 border-emerald-400/40'
              : 'text-slate-600 border-slate-700';
          return (
            <div key={r.key} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-mono text-[10px] bg-slate-900 border ${cls}`}>
              {inc ? <RotateCw className="w-[11px] h-[11px]" /> : live ? <CircleCheck className="w-[11px] h-[11px]" /> : <CircleDashed className="w-[11px] h-[11px]" />}
              {r.short.toUpperCase()}
            </div>
          );
        })}
      </div>
      <div className="font-mono mt-2 text-[10px] text-slate-600">
        GREEN = LIVE · AMBER = IN THIS BATCH · GREY = MISSING
      </div>
    </div>
  );
}

function Devo({ d, onChange }: { d: Devotional; onChange: (d: Devotional) => void }) {
  const set = (k: keyof Devotional, v: string) => onChange({ ...d, [k]: v });
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Inspiring quotation" value={d.quote} onChange={(v) => set('quote', v)} area />
      <Field label="Quotation source" value={d.quoteSource} onChange={(v) => set('quoteSource', v)} />
      <Field label="Bible verse" value={d.verse} onChange={(v) => set('verse', v)} area />
      <Field label="Verse reference" value={d.verseRef} onChange={(v) => set('verseRef', v)} />
      <div className="sm:col-span-2">
        <Field label="Reflection" value={d.reflection} onChange={(v) => set('reflection', v)} area tall />
      </div>
    </div>
  );
}

function PublishLog({ p, onReset }: { p: PublishState; onReset: () => void }) {
  return (
    <div className="mt-5 rounded-xl p-4 bg-slate-900 border border-slate-800">
      <div className="flex flex-col gap-2.5">
        {p.steps.map((s) => (
          <div key={s.id} className="flex items-center gap-2.5">
            {s.status === 'done'
              ? <Check className="w-3.5 h-3.5 text-emerald-400" />
              : s.status === 'error'
                ? <X className="w-3.5 h-3.5 text-rose-400" />
                : s.status === 'active'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  : <CircleDashed className="w-3.5 h-3.5 text-slate-600" />}
            <span className={`font-mono text-xs ${
              s.status === 'done' ? 'text-slate-100' : s.status === 'error' ? 'text-rose-400' : s.status === 'active' ? 'text-amber-400' : 'text-slate-600'
            }`}>
              {s.label}
            </span>
            {s.detail && s.status === 'active' && <span className="font-mono text-[10px] text-slate-500">{s.detail}</span>}
          </div>
        ))}
      </div>
      {p.error && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-sm text-rose-400">{p.error}</p>
          <button onClick={onReset} className="mt-2 font-mono text-xs text-sky-400 cursor-pointer">DISMISS</button>
        </div>
      )}
      {p.done && (
        <div className="mt-4 pt-4 flex items-center justify-between border-t border-slate-800">
          <span className="text-sm text-emerald-400">Published.</span>
          <button onClick={onReset} className="font-mono text-xs text-sky-400 cursor-pointer">PUBLISH ANOTHER</button>
        </div>
      )}
    </div>
  );
}

function ManifestPreview({ ep, staged, slug }: { ep: EpisodeManifest; staged: StagedFile[]; slug: string }) {
  const json = useMemo(() => {
    const assets: Record<string, string> = {};
    for (const [key, asset] of Object.entries(ep.assets || {})) {
      if (!asset) continue;
      assets[key] = asset.dest === HEAVY ? asset.url : `episodes/${slug}/${asset.name}`;
    }
    for (const s of staged) {
      if (!s.role) continue;
      assets[s.role] = ROLES[s.role].dest === HEAVY
        ? `https://<blob-store>.public.blob.vercel-storage.com/episodes/${slug}/${s.name}`
        : `episodes/${slug}/${s.name}`;
    }
    const out = {
      episodeId: ep.episodeId,
      episodeNumber: ep.episodeNumber,
      title: ep.title,
      subtitle: ep.subtitle,
      youtubeUrl: ep.youtubeUrl || null,
      assets,
      devotional: ep.devotional ?? EMPTY_DEVOTIONAL,
    };
    return JSON.stringify(out, null, 2);
  }, [ep, staged, slug]);

  return (
    <pre className="mt-3 rounded-lg p-4 overflow-x-auto font-mono text-[11px] leading-relaxed bg-slate-950 border border-slate-800 text-sky-300">
      {json}
    </pre>
  );
}

/* ------------------------------------------------------------- primitives -- */

function Step({ n, title, caption, children }: { n: number; title: string; caption: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-start gap-3.5 mb-4">
        <div className="font-mono flex items-center justify-center shrink-0 w-[27px] h-[27px] rounded-md text-xs bg-slate-800 text-slate-100 border border-slate-700">
          {n}
        </div>
        <div>
          <h2 className="text-lg text-slate-100">{title}</h2>
          <p className="text-xs mt-1 text-slate-400">{caption}</p>
        </div>
      </div>
      <div>{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono mb-1.5 text-[10px] tracking-wider text-slate-500">
      {String(children).toUpperCase()}
    </div>
  );
}

function Field({ label, value, onChange, area, tall, mono }: {
  label: string; value: string; onChange: (v: string) => void; area?: boolean; tall?: boolean; mono?: boolean;
}) {
  const base = 'w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 outline-none focus:border-amber-500';
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {area ? (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)}
          rows={tall ? 5 : 3}
          className={`${base} leading-relaxed text-sm`}
        />
      ) : (
        <input
          value={value} onChange={(e) => onChange(e.target.value)}
          className={`${base} ${mono ? 'font-mono text-xs' : 'text-sm'}`}
        />
      )}
    </div>
  );
}
