import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  BookOpen, ShieldCheck, Headphones, Film, Presentation, Layers, HelpCircle,
  Quote, Upload, Github, Cloud, Check, X, ChevronRight, ChevronDown, AlertTriangle,
  Loader2, FileText, Play, Sparkles, Plus, Trash2, ArrowRight, Lock, ExternalLink,
  Image as ImageIcon, CircleCheck, CircleDashed, Feather, Wand2, RotateCw,
} from "lucide-react";

/* ============================================================================
   LOGOS EXPLORER — redesign prototype
   Two ideas carry this design:
   1. STUDY side: machine-made study assets live in dark "instrument" panels.
      The hand-written devotional lives on cream paper. You can feel which is
      which without reading a word.
   2. ADMIN side: one drop zone. Files visibly sort themselves into two lanes —
      LIGHT (text/data -> GitHub repo) and HEAVY (audio/video/images -> Blob CDN).
      No role dropdowns to fill in before you can drop anything.
============================================================================ */

const C = {
  ink:      "#060A12",
  panel:    "#0D1422",
  raised:   "#141D30",
  line:     "#23314C",
  lineSoft: "#1A2438",
  navy:     "#1B3A6B",
  amber:    "#C88A14",
  amberLit: "#E9A82F",
  blue:     "#4A8FAB",
  cream:    "#F3EAD8",
  paper:    "#EFE4CE",
  muted:    "#8496B4",
  dim:      "#5B6C8A",
  green:    "#5B9E7A",
  red:      "#B4586A",
};

/* ---------------------------------------------------------------- roles ---- */

const HEAVY = "blob";
const LIGHT = "repo";

const ROLES = {
  audioOverview: {
    key: "audioOverview", label: "Audio Overview", short: "Audio",
    icon: Headphones, dest: HEAVY, ext: ["mp3", "wav", "m4a", "aac", "ogg"],
    hints: ["audio", "overview", "deepdive", "deep-dive", "podcast", "narration"],
    blurb: "The NotebookLM two-host conversation.",
  },
  videoOverview: {
    key: "videoOverview", label: "Video Overview", short: "Video",
    icon: Film, dest: HEAVY, ext: ["mp4", "mov", "webm", "m4v"],
    hints: ["video", "short", "overview", "clip"],
    blurb: "The short visual summary.",
  },
  slideDeck: {
    key: "slideDeck", label: "Slide Deck", short: "Slides",
    icon: Presentation, dest: HEAVY, ext: ["pdf", "pptx", "ppt", "key"],
    hints: ["slide", "deck", "presentation", "pptx"],
    blurb: "Exported deck with presenter notes.",
  },
  infographic: {
    key: "infographic", label: "Infographic", short: "Infographic",
    icon: ImageIcon, dest: HEAVY, ext: ["png", "jpg", "jpeg", "webp", "gif"],
    hints: ["infographic", "graphic", "poster", "diagram", "chart"],
    blurb: "One-page visual explainer.",
  },
  report: {
    key: "report", label: "Report", short: "Report",
    icon: FileText, dest: LIGHT, ext: ["md", "txt", "markdown"],
    hints: ["report", "briefing", "brief", "study", "guide", "faq", "timeline"],
    blurb: "Briefing doc, study guide, FAQ.",
  },
  transcript: {
    key: "transcript", label: "Master Script", short: "Script",
    icon: BookOpen, dest: LIGHT, ext: ["md", "txt", "markdown"],
    hints: ["transcript", "script", "master", "source", "story"],
    blurb: "The single source story the episode came from.",
  },
  flashcards: {
    key: "flashcards", label: "Flashcards", short: "Cards",
    icon: Layers, dest: LIGHT, ext: ["json", "csv", "md", "tsv"],
    hints: ["flashcard", "card", "term", "glossary", "vocab"],
    blurb: "Greek terms and definitions.",
  },
  quiz: {
    key: "quiz", label: "Quiz", short: "Quiz",
    icon: HelpCircle, dest: LIGHT, ext: ["json", "csv", "md"],
    hints: ["quiz", "question", "assessment", "test", "check"],
    blurb: "Multiple-choice knowledge check.",
  },
};

const ROLE_LIST = Object.values(ROLES);

/** Guess the role from filename keywords first, extension second. */
function detectRole(fileName) {
  const lower = fileName.toLowerCase();
  const ext = lower.includes(".") ? lower.split(".").pop() : "";
  const base = lower.replace(/\.[^.]+$/, "");

  let best = null;
  let bestScore = 0;
  for (const r of ROLE_LIST) {
    if (!r.ext.includes(ext)) continue;
    let score = 1; // extension alone is a weak match
    for (const h of r.hints) if (base.includes(h)) score += 4;
    if (score > bestScore) { bestScore = score; best = r; }
  }
  return best ? { role: best.key, confident: bestScore >= 5 } : { role: null, confident: false };
}

const fmtBytes = (n) => {
  if (n < 1024) return n + " B";
  if (n < 1048576) return (n / 1024).toFixed(0) + " KB";
  return (n / 1048576).toFixed(1) + " MB";
};

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* ------------------------------------------------------------ seed data ---- */

const SEED = [
  {
    id: "ep-01", n: 1,
    title: "Two Windows, One God",
    subtitle: "Part 1 — Why physics and scripture are not rivals",
    youtube: "https://youtube.com/@logosatlas",
    published: true,
    assets: {
      audioOverview: { name: "ep01_audio_overview.mp3", size: 24117248, dest: HEAVY },
      videoOverview: { name: "ep01_video_overview.mp4", size: 61865984, dest: HEAVY },
      slideDeck:     { name: "ep01_slides.pdf", size: 4194304, dest: HEAVY },
      infographic:   { name: "ep01_infographic.png", size: 2306867, dest: HEAVY },
      report:        { name: "ep01_briefing_report.md", size: 18432, dest: LIGHT },
      transcript:    { name: "ep01_master_script.md", size: 42598, dest: LIGHT },
      flashcards:    { name: "ep01_flashcards.json", size: 9216, dest: LIGHT },
      quiz:          { name: "ep01_quiz.json", size: 7168, dest: LIGHT },
    },
    devotional: {
      quote: "The Word became flesh and lived among us — and we have seen his glory.",
      quoteSource: "John 1:14",
      verse:
        "In the beginning was the Word, and the Word was with God, and the Word was God. All things came into being through him, and without him not one thing came into being.",
      verseRef: "John 1:1–3",
      reflection:
        "Two windows look onto the same courtyard. One is cut for measurement, the other for meaning. A physicist and a theologian can both be honest and both be right, because they are describing one world under different questions. The mistake is not looking through both. The mistake is claiming one window is the whole house.",
    },
  },
  {
    id: "ep-02", n: 2,
    title: "Two Windows, One God",
    subtitle: "Part 2 — Kenotic code and quantum information",
    youtube: "https://youtube.com/@logosatlas",
    published: true,
    assets: {
      audioOverview: { name: "ep02_audio_overview.mp3", size: 21495808, dest: HEAVY },
      report:        { name: "ep02_briefing_report.md", size: 16384, dest: LIGHT },
      transcript:    { name: "ep02_master_script.md", size: 39321, dest: LIGHT },
      flashcards:    { name: "ep02_flashcards.json", size: 8192, dest: LIGHT },
    },
    devotional: {
      quote: "He emptied himself, taking the form of a servant.",
      quoteSource: "Philippians 2:7",
      verse: "",
      verseRef: "",
      reflection:
        "Information is not lost, physics says. Love is not lost, the gospel says. Neither claim proves the other. Holding them side by side is not proof — it is attention.",
    },
  },
  {
    id: "ep-03", n: 3,
    title: "No Lonely Pieces",
    subtitle: "Divine presence in an entangled universe",
    youtube: "",
    published: false,
    assets: {},
    devotional: { quote: "", quoteSource: "", verse: "", verseRef: "", reflection: "" },
  },
];

/* ================================================================== APP ==== */

export default function LogosExplorer() {
  const [tab, setTab] = useState("study");
  const [episodes, setEpisodes] = useState(SEED);

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: C.ink, color: C.cream }}>
      <Masthead tab={tab} />
      <div className="flex-1 pb-24">
        {tab === "study"
          ? <StudyView episodes={episodes.filter((e) => e.published)} />
          : <AdminView episodes={episodes} setEpisodes={setEpisodes} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

/* ------------------------------------------------------------- masthead ---- */

function Masthead({ tab }) {
  return (
    <header
      className="px-5 pt-6 pb-5 border-b sticky top-0 z-20"
      style={{ borderColor: C.lineSoft, background: C.ink }}
    >
      <div className="max-w-5xl mx-auto flex items-baseline justify-between gap-4">
        <div>
          <div
            className="font-serif tracking-widest"
            style={{ color: C.amberLit, fontSize: 21, letterSpacing: "0.28em" }}
          >
            LOGOS ATLAS
          </div>
          <div className="font-mono text-xs mt-1" style={{ color: C.muted, letterSpacing: "0.12em" }}>
            {tab === "study" ? "COMPANION · GO DEEPER THAN THE VIDEO" : "PUBLISHING CONSOLE"}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 font-mono text-xs" style={{ color: C.blue }}>
          <span style={{ width: 7, height: 7, borderRadius: 9, background: C.green, display: "inline-block" }} />
          explorerlogos.online
        </div>
      </div>
    </header>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { id: "study", label: "Study", icon: BookOpen },
    { id: "admin", label: "Publish", icon: ShieldCheck },
  ];
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t"
      style={{ background: C.panel, borderColor: C.line }}
    >
      <div className="max-w-5xl mx-auto grid grid-cols-2">
        {items.map((it) => {
          const on = tab === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className="py-3 flex flex-col items-center gap-1 transition-colors"
              style={{ color: on ? C.amberLit : C.muted }}
            >
              <Icon size={20} strokeWidth={on ? 2 : 1.5} />
              <span className="font-mono text-xs tracking-widest">{it.label.toUpperCase()}</span>
              <span
                style={{
                  height: 2, width: on ? 26 : 0, background: C.amberLit,
                  transition: "width 200ms ease", borderRadius: 2,
                }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ============================================================ STUDY VIEW === */

function StudyView({ episodes }) {
  const [epId, setEpId] = useState(episodes[0]?.id);
  const ep = episodes.find((e) => e.id === epId) || episodes[0];
  const [open, setOpen] = useState(null);

  if (!ep) return <Empty text="No episodes published yet." />;

  const available = ROLE_LIST.filter((r) => ep.assets[r.key]);
  const missing = ROLE_LIST.filter((r) => !ep.assets[r.key]);

  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      {/* episode rail */}
      <SectionLabel>Episodes</SectionLabel>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {episodes.map((e) => {
          const on = e.id === ep.id;
          return (
            <button
              key={e.id}
              onClick={() => { setEpId(e.id); setOpen(null); }}
              className="flex-shrink-0 text-left rounded-lg p-4 transition-all"
              style={{
                width: 230,
                background: on ? C.raised : C.panel,
                border: `1px solid ${on ? C.amber : C.lineSoft}`,
                boxShadow: on ? `0 0 0 1px ${C.amber}22, 0 6px 22px -12px ${C.amber}` : "none",
              }}
            >
              <div className="font-mono text-xs mb-2" style={{ color: on ? C.amberLit : C.dim }}>
                EPISODE {String(e.n).padStart(2, "0")}
              </div>
              <div className="font-serif leading-snug" style={{ fontSize: 17, color: C.cream }}>
                {e.title}
              </div>
              <div className="text-xs mt-1.5 leading-relaxed" style={{ color: C.muted }}>
                {e.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* hero */}
      <div className="mt-8 pb-6 border-b" style={{ borderColor: C.lineSoft }}>
        <h1 className="font-serif leading-tight" style={{ fontSize: 32, color: C.cream }}>
          {ep.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted, maxWidth: 560 }}>
          {ep.subtitle}
        </p>
        {ep.youtube && (
          <a
            href={ep.youtube} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded font-mono text-xs tracking-wider"
            style={{ background: C.amber, color: C.ink }}
          >
            <Play size={13} fill={C.ink} /> WATCH THE EPISODE
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* devotional — cream paper, deliberately unlike everything else */}
      {(ep.devotional.quote || ep.devotional.reflection) && (
        <Devotional d={ep.devotional} />
      )}

      {/* study modes */}
      <div className="mt-8">
        <SectionLabel>Study this episode</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          {available.map((r) => {
            const Icon = r.icon;
            const on = open === r.key;
            return (
              <button
                key={r.key}
                onClick={() => setOpen(on ? null : r.key)}
                className="rounded-lg p-4 text-left transition-all"
                style={{
                  background: on ? C.raised : C.panel,
                  border: `1px solid ${on ? C.blue : C.lineSoft}`,
                }}
              >
                <Icon size={19} style={{ color: r.dest === HEAVY ? C.amberLit : C.blue }} strokeWidth={1.6} />
                <div className="font-serif mt-3" style={{ fontSize: 15, color: C.cream }}>{r.label}</div>
                <div className="font-mono mt-1" style={{ fontSize: 10, color: C.dim, letterSpacing: "0.08em" }}>
                  {r.dest === HEAVY ? "STREAMED" : "IN-APP"}
                </div>
              </button>
            );
          })}
        </div>

        {open && <ModulePanel role={ROLES[open]} asset={ep.assets[open]} onClose={() => setOpen(null)} />}

        {missing.length > 0 && (
          <p className="font-mono text-xs mt-5" style={{ color: C.dim }}>
            NOT YET ADDED: {missing.map((m) => m.short).join(" · ")}
          </p>
        )}
      </div>

      <p className="font-serif text-center mt-12 mb-4" style={{ color: C.amber, fontSize: 15 }}>
        Glory to Logos
      </p>
    </div>
  );
}

function Devotional({ d }) {
  return (
    <div
      className="mt-8 rounded-lg px-6 py-7 sm:px-9 sm:py-9"
      style={{
        background: `linear-gradient(160deg, ${C.cream} 0%, ${C.paper} 100%)`,
        color: "#2A2418",
        boxShadow: `0 18px 40px -24px #000`,
      }}
    >
      <div className="flex items-center gap-2 font-mono text-xs mb-5" style={{ color: "#8A6D2F", letterSpacing: "0.16em" }}>
        <Feather size={13} /> WRITTEN BY HAND
      </div>

      {d.quote && (
        <blockquote className="font-serif leading-snug" style={{ fontSize: 22 }}>
          <Quote size={18} style={{ color: "#B08A2E", display: "inline", marginRight: 6, verticalAlign: "top" }} />
          {d.quote}
          {d.quoteSource && (
            <footer className="font-mono mt-3" style={{ fontSize: 11, color: "#7A6338", letterSpacing: "0.1em" }}>
              — {d.quoteSource.toUpperCase()}
            </footer>
          )}
        </blockquote>
      )}

      {d.verse && (
        <div className="mt-6 pt-6" style={{ borderTop: "1px solid #D6C6A4" }}>
          <p className="leading-relaxed" style={{ fontSize: 15 }}>{d.verse}</p>
          <div className="font-mono mt-2" style={{ fontSize: 11, color: "#7A6338" }}>{d.verseRef}</div>
        </div>
      )}

      {d.reflection && (
        <div className="mt-6 pt-6" style={{ borderTop: "1px solid #D6C6A4" }}>
          <div className="font-mono mb-2" style={{ fontSize: 11, color: "#8A6D2F", letterSpacing: "0.16em" }}>
            REFLECTION
          </div>
          <p className="leading-relaxed" style={{ fontSize: 15 }}>{d.reflection}</p>
        </div>
      )}
    </div>
  );
}

function ModulePanel({ role, asset, onClose }) {
  const Icon = role.icon;
  return (
    <div className="mt-4 rounded-lg p-5" style={{ background: C.raised, border: `1px solid ${C.line}` }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Icon size={18} style={{ color: C.amberLit }} />
          <div>
            <div className="font-serif" style={{ fontSize: 16 }}>{role.label}</div>
            <div className="text-xs mt-0.5" style={{ color: C.muted }}>{role.blurb}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ color: C.muted }}><X size={17} /></button>
      </div>

      {role.key === "audioOverview" && (
        <div className="mt-5 rounded p-4" style={{ background: C.panel, border: `1px solid ${C.lineSoft}` }}>
          <div className="flex items-center gap-3">
            <div
              className="rounded-full flex items-center justify-center flex-shrink-0"
              style={{ width: 40, height: 40, background: C.amber }}
            >
              <Play size={16} fill={C.ink} style={{ color: C.ink, marginLeft: 2 }} />
            </div>
            <div className="flex-1">
              <div style={{ height: 4, background: C.lineSoft, borderRadius: 3 }}>
                <div style={{ height: 4, width: "34%", background: C.blue, borderRadius: 3 }} />
              </div>
              <div className="flex justify-between font-mono mt-2" style={{ fontSize: 10, color: C.dim }}>
                <span>06:12</span><span>18:04</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="font-mono text-xs mt-4 flex flex-wrap items-center gap-x-4 gap-y-1" style={{ color: C.dim }}>
        <span>{asset?.name}</span>
        <span>{asset ? fmtBytes(asset.size) : ""}</span>
        <span className="flex items-center gap-1.5" style={{ color: role.dest === HEAVY ? C.amber : C.blue }}>
          {role.dest === HEAVY ? <Cloud size={12} /> : <Github size={12} />}
          {role.dest === HEAVY ? "BLOB CDN" : "REPO"}
        </span>
      </div>
    </div>
  );
}

/* ============================================================ ADMIN VIEW === */

function AdminView({ episodes, setEpisodes }) {
  const [epId, setEpId] = useState(episodes[episodes.length - 1].id);
  const ep = episodes.find((e) => e.id === epId);
  const [staged, setStaged] = useState([]);
  const [publishing, setPublishing] = useState(null);
  const [showManifest, setShowManifest] = useState(false);

  const updateEp = useCallback((patch) => {
    setEpisodes((prev) => prev.map((e) => (e.id === epId ? { ...e, ...patch } : e)));
  }, [epId, setEpisodes]);

  const addFiles = useCallback((fileList) => {
    const next = Array.from(fileList).map((f, i) => {
      const { role, confident } = detectRole(f.name);
      return {
        uid: `${Date.now()}-${i}-${f.name}`,
        name: f.name,
        size: f.size,
        role,
        confident,
      };
    });
    setStaged((prev) => [...prev, ...next]);
  }, []);

  const setRole = (uid, role) =>
    setStaged((prev) => prev.map((s) => (s.uid === uid ? { ...s, role, confident: true } : s)));
  const removeStaged = (uid) => setStaged((prev) => prev.filter((s) => s.uid !== uid));

  const light = staged.filter((s) => s.role && ROLES[s.role].dest === LIGHT);
  const heavy = staged.filter((s) => s.role && ROLES[s.role].dest === HEAVY);
  const unknown = staged.filter((s) => !s.role);
  const canPublish = staged.length > 0 && unknown.length === 0 && !publishing;

  const publish = () => {
    const steps = [
      { label: "Checking episode slug and roles", ms: 500 },
      ...(heavy.length ? [{ label: `Uploading ${heavy.length} heavy file${heavy.length > 1 ? "s" : ""} to Vercel Blob`, ms: 1400 }] : []),
      ...(light.length ? [{ label: `Committing ${light.length} light file${light.length > 1 ? "s" : ""} to GitHub`, ms: 900 }] : []),
      { label: "Writing logos-explorer-manifest.json", ms: 600 },
      { label: "Vercel build triggered", ms: 1100 },
      { label: "Live at explorerlogos.online", ms: 300 },
    ];
    setPublishing({ steps, at: 0, done: false });
    let i = 0;
    const run = () => {
      if (i >= steps.length) {
        const merged = { ...ep.assets };
        staged.forEach((s) => {
          merged[s.role] = { name: s.name, size: s.size, dest: ROLES[s.role].dest };
        });
        updateEp({ assets: merged, published: true });
        setStaged([]);
        setPublishing((p) => ({ ...p, done: true }));
        return;
      }
      setPublishing((p) => ({ ...p, at: i }));
      setTimeout(() => { i += 1; run(); }, steps[i].ms);
    };
    run();
  };

  const addEpisode = () => {
    const n = episodes.length + 1;
    const id = `ep-${String(n).padStart(2, "0")}`;
    setEpisodes((prev) => [...prev, {
      id, n, title: "Untitled episode", subtitle: "", youtube: "", published: false,
      assets: {}, devotional: { quote: "", quoteSource: "", verse: "", verseRef: "", reflection: "" },
    }]);
    setEpId(id);
    setStaged([]);
  };

  return (
    <div className="max-w-5xl mx-auto px-5 py-6">
      <SecurityBanner />

      {/* STEP 1 */}
      <Step n={1} title="Choose the episode" caption="Everything you drop below attaches to this episode.">
        <div className="flex gap-2 flex-wrap">
          {episodes.map((e) => {
            const on = e.id === epId;
            return (
              <button
                key={e.id}
                onClick={() => { setEpId(e.id); setStaged([]); setPublishing(null); }}
                className="px-3.5 py-2 rounded font-mono text-xs transition-all"
                style={{
                  background: on ? C.amber : C.panel,
                  color: on ? C.ink : C.muted,
                  border: `1px solid ${on ? C.amber : C.lineSoft}`,
                }}
              >
                EP {String(e.n).padStart(2, "0")}
                {!e.published && <span style={{ opacity: 0.7 }}> · draft</span>}
              </button>
            );
          })}
          <button
            onClick={addEpisode}
            className="px-3.5 py-2 rounded font-mono text-xs flex items-center gap-1.5"
            style={{ background: "transparent", color: C.blue, border: `1px dashed ${C.line}` }}
          >
            <Plus size={13} /> NEW
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-5">
          <Field label="Episode title" value={ep.title} onChange={(v) => updateEp({ title: v })} />
          <Field label="Subtitle" value={ep.subtitle} onChange={(v) => updateEp({ subtitle: v })} />
          <Field label="YouTube link" value={ep.youtube} onChange={(v) => updateEp({ youtube: v })} mono />
          <div>
            <FieldLabel>Folder path (generated)</FieldLabel>
            <div
              className="font-mono text-xs px-3 py-2.5 rounded truncate"
              style={{ background: C.ink, border: `1px solid ${C.lineSoft}`, color: C.dim }}
            >
              episodes/{slugify(ep.title) || ep.id}/
            </div>
          </div>
        </div>
      </Step>

      {/* STEP 2 */}
      <Step
        n={2}
        title="Drop the Notebook exports"
        caption="Select everything at once. Files sort themselves — you only fix what's marked."
      >
        <DropZone onFiles={addFiles} />

        {unknown.length > 0 && (
          <div
            className="mt-4 rounded p-4 flex gap-3"
            style={{ background: `${C.red}14`, border: `1px solid ${C.red}55` }}
          >
            <AlertTriangle size={17} style={{ color: C.red, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div className="text-sm" style={{ color: C.cream }}>
                {unknown.length} file{unknown.length > 1 ? "s need" : " needs"} a role
              </div>
              <div className="text-xs mt-1" style={{ color: C.muted }}>
                Pick one from the dropdown, or remove the file. Publishing stays locked until this is clear.
              </div>
            </div>
          </div>
        )}

        {staged.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <Lane
              title="Light — goes into the repo"
              sub="Text and data, versioned in git"
              icon={Github} accent={C.blue} rows={[...light, ...unknown]}
              onRole={setRole} onRemove={removeStaged}
            />
            <Lane
              title="Heavy — goes to the CDN"
              sub="Audio, video, images, PDFs"
              icon={Cloud} accent={C.amber} rows={heavy}
              onRole={setRole} onRemove={removeStaged}
            />
          </div>
        )}

        <Coverage ep={ep} staged={staged} />
      </Step>

      {/* STEP 3 */}
      <Step n={3} title="Write the devotional" caption="The part no notebook can generate. Optional, but it's why people come back.">
        <Devo d={ep.devotional} onChange={(d) => updateEp({ devotional: d })} />
      </Step>

      {/* STEP 4 */}
      <Step n={4} title="Publish" caption="One action: upload, commit, update the manifest, deploy.">
        <button
          onClick={publish}
          disabled={!canPublish}
          className="w-full sm:w-auto px-6 py-3.5 rounded font-mono text-sm tracking-wider flex items-center justify-center gap-2.5"
          style={{
            background: canPublish ? C.amber : C.panel,
            color: canPublish ? C.ink : C.dim,
            border: `1px solid ${canPublish ? C.amber : C.lineSoft}`,
            cursor: canPublish ? "pointer" : "not-allowed",
          }}
        >
          {publishing && !publishing.done
            ? <><Loader2 size={15} className="animate-spin" /> PUBLISHING…</>
            : <>PUBLISH EPISODE {String(ep.n).padStart(2, "0")} <ArrowRight size={15} /></>}
        </button>

        {!canPublish && !publishing && (
          <p className="text-xs mt-3" style={{ color: C.dim }}>
            {staged.length === 0 ? "Drop at least one file to publish." : "Resolve the flagged files first."}
          </p>
        )}

        {publishing && <PublishLog p={publishing} onReset={() => setPublishing(null)} />}

        <button
          onClick={() => setShowManifest((s) => !s)}
          className="mt-5 font-mono text-xs flex items-center gap-1.5"
          style={{ color: C.blue }}
        >
          {showManifest ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {showManifest ? "HIDE" : "SHOW"} MANIFEST ENTRY
        </button>
        {showManifest && <ManifestPreview ep={ep} staged={staged} />}
      </Step>
    </div>
  );
}

/* ------------------------------------------------------------ admin bits --- */

function SecurityBanner() {
  return (
    <div
      className="rounded-lg p-4 mb-7 flex gap-3"
      style={{ background: `${C.amber}12`, border: `1px solid ${C.amber}44` }}
    >
      <Lock size={17} style={{ color: C.amberLit, flexShrink: 0, marginTop: 2 }} />
      <div>
        <div className="text-sm" style={{ color: C.cream }}>Tokens live on the server now</div>
        <div className="text-xs mt-1 leading-relaxed" style={{ color: C.muted }}>
          This console never holds your GitHub or Blob token. It calls <span className="font-mono">/api/publish</span>,
          which reads them from Vercel environment variables behind a password gate.
        </div>
      </div>
    </div>
  );
}

function DropZone({ onFiles }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className="rounded-lg py-12 px-6 text-center cursor-pointer transition-all"
      style={{
        border: `2px dashed ${over ? C.amberLit : C.line}`,
        background: over ? `${C.amber}0E` : C.panel,
      }}
    >
      <input
        ref={inputRef} type="file" multiple className="hidden"
        onChange={(e) => { if (e.target.files?.length) onFiles(e.target.files); e.target.value = ""; }}
      />
      <Upload size={26} style={{ color: over ? C.amberLit : C.muted, margin: "0 auto" }} strokeWidth={1.4} />
      <div className="font-serif mt-4" style={{ fontSize: 19, color: C.cream }}>
        Drop your Studio exports here
      </div>
      <div className="text-sm mt-2" style={{ color: C.muted }}>
        Audio, video, slides, infographic, reports, flashcards, quiz — all in one go.
      </div>
      <div className="font-mono text-xs mt-4" style={{ color: C.dim, letterSpacing: "0.08em" }}>
        MP3 · MP4 · PDF · PNG · MD · JSON · CSV
      </div>
    </div>
  );
}

function Lane({ title, sub, icon: Icon, accent, rows, onRole, onRemove }) {
  return (
    <div className="rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.lineSoft}` }}>
      <div className="flex items-center gap-2.5 pb-3 mb-3" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
        <Icon size={16} style={{ color: accent }} />
        <div>
          <div className="font-mono text-xs tracking-wider" style={{ color: accent }}>{title.toUpperCase()}</div>
          <div className="text-xs mt-0.5" style={{ color: C.dim }}>{sub}</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-xs py-4 text-center" style={{ color: C.dim }}>Nothing here yet</div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r) => <StagedRow key={r.uid} r={r} onRole={onRole} onRemove={onRemove} />)}
        </div>
      )}
    </div>
  );
}

function StagedRow({ r, onRole, onRemove }) {
  const flagged = !r.role;
  const Icon = r.role ? ROLES[r.role].icon : AlertTriangle;
  return (
    <div
      className="rounded p-3"
      style={{
        background: C.raised,
        border: `1px solid ${flagged ? C.red + "77" : C.lineSoft}`,
      }}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={15} style={{ color: flagged ? C.red : C.muted, flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1 min-w-0">
          <div className="text-xs truncate" style={{ color: C.cream }}>{r.name}</div>
          <div className="font-mono mt-0.5" style={{ fontSize: 10, color: C.dim }}>
            {fmtBytes(r.size)}
            {r.role && !r.confident && <span style={{ color: C.amber }}> · guessed from file type</span>}
          </div>
        </div>
        <button onClick={() => onRemove(r.uid)} style={{ color: C.dim }}><Trash2 size={14} /></button>
      </div>

      <select
        value={r.role || ""}
        onChange={(e) => onRole(r.uid, e.target.value)}
        className="w-full mt-2.5 px-2.5 py-1.5 rounded font-mono text-xs"
        style={{
          background: C.ink,
          color: r.role ? C.cream : C.red,
          border: `1px solid ${flagged ? C.red + "77" : C.lineSoft}`,
        }}
      >
        <option value="" disabled>Choose a role…</option>
        {ROLE_LIST.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
      </select>
    </div>
  );
}

function Coverage({ ep, staged }) {
  const stagedRoles = new Set(staged.map((s) => s.role));
  return (
    <div className="mt-5">
      <FieldLabel>Episode coverage</FieldLabel>
      <div className="flex flex-wrap gap-2 mt-2">
        {ROLE_LIST.map((r) => {
          const live = !!ep.assets[r.key];
          const inc = stagedRoles.has(r.key);
          const color = inc ? C.amberLit : live ? C.green : C.dim;
          return (
            <div
              key={r.key}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded font-mono"
              style={{ fontSize: 10, color, border: `1px solid ${color}44`, background: C.panel }}
            >
              {inc ? <RotateCw size={11} /> : live ? <CircleCheck size={11} /> : <CircleDashed size={11} />}
              {r.short.toUpperCase()}
            </div>
          );
        })}
      </div>
      <div className="font-mono mt-2" style={{ fontSize: 10, color: C.dim }}>
        GREEN = LIVE · AMBER = IN THIS BATCH · GREY = MISSING
      </div>
    </div>
  );
}

function Devo({ d, onChange }) {
  const set = (k, v) => onChange({ ...d, [k]: v });
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <Field label="Inspiring quotation" value={d.quote} onChange={(v) => set("quote", v)} area />
      <Field label="Quotation source" value={d.quoteSource} onChange={(v) => set("quoteSource", v)} />
      <Field label="Bible verse" value={d.verse} onChange={(v) => set("verse", v)} area />
      <Field label="Verse reference" value={d.verseRef} onChange={(v) => set("verseRef", v)} />
      <div className="sm:col-span-2">
        <Field label="Reflection" value={d.reflection} onChange={(v) => set("reflection", v)} area tall />
      </div>
    </div>
  );
}

function PublishLog({ p, onReset }) {
  return (
    <div className="mt-5 rounded-lg p-4" style={{ background: C.panel, border: `1px solid ${C.lineSoft}` }}>
      <div className="flex flex-col gap-2.5">
        {p.steps.map((s, i) => {
          const done = p.done || i < p.at;
          const active = !p.done && i === p.at;
          return (
            <div key={s.label} className="flex items-center gap-2.5">
              {done
                ? <Check size={14} style={{ color: C.green }} />
                : active
                  ? <Loader2 size={14} className="animate-spin" style={{ color: C.amberLit }} />
                  : <CircleDashed size={14} style={{ color: C.dim }} />}
              <span
                className="font-mono text-xs"
                style={{ color: done ? C.cream : active ? C.amberLit : C.dim }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      {p.done && (
        <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          <span className="text-sm" style={{ color: C.green }}>Published.</span>
          <button onClick={onReset} className="font-mono text-xs" style={{ color: C.blue }}>
            PUBLISH ANOTHER
          </button>
        </div>
      )}
    </div>
  );
}

function ManifestPreview({ ep, staged }) {
  const json = useMemo(() => {
    const folder = `episodes/${slugify(ep.title) || ep.id}`;
    const assets = { ...ep.assets };
    staged.forEach((s) => { if (s.role) assets[s.role] = { name: s.name, size: s.size, dest: ROLES[s.role].dest }; });
    const out = {
      id: ep.id,
      sequence: ep.n,
      title: ep.title,
      subtitle: ep.subtitle,
      youtubeUrl: ep.youtube || null,
      assets: Object.fromEntries(Object.entries(assets).map(([k, v]) => [
        k,
        v.dest === HEAVY
          ? `https://<blob-store>.public.blob.vercel-storage.com/${folder}/${v.name}`
          : `${folder}/${v.name}`,
      ])),
      devotional: ep.devotional,
    };
    return JSON.stringify(out, null, 2);
  }, [ep, staged]);

  return (
    <pre
      className="mt-3 rounded p-4 overflow-x-auto font-mono"
      style={{ background: C.ink, border: `1px solid ${C.lineSoft}`, color: C.blue, fontSize: 11, lineHeight: 1.65 }}
    >
      {json}
    </pre>
  );
}

/* ------------------------------------------------------------- primitives -- */

function Step({ n, title, caption, children }) {
  return (
    <section className="mb-9">
      <div className="flex items-start gap-3.5 mb-4">
        <div
          className="font-mono flex items-center justify-center flex-shrink-0"
          style={{
            width: 27, height: 27, borderRadius: 4, fontSize: 12,
            background: C.navy, color: C.cream, border: `1px solid ${C.line}`,
          }}
        >
          {n}
        </div>
        <div>
          <h2 className="font-serif" style={{ fontSize: 20, color: C.cream }}>{title}</h2>
          <p className="text-xs mt-1" style={{ color: C.muted }}>{caption}</p>
        </div>
      </div>
      <div style={{ marginLeft: 0 }}>{children}</div>
    </section>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="font-mono text-xs mb-2" style={{ color: C.dim, letterSpacing: "0.16em" }}>
      {String(children).toUpperCase()}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <div className="font-mono mb-1.5" style={{ fontSize: 10, color: C.dim, letterSpacing: "0.12em" }}>
      {String(children).toUpperCase()}
    </div>
  );
}

function Field({ label, value, onChange, area, tall, mono }) {
  const style = {
    background: C.ink,
    border: `1px solid ${C.lineSoft}`,
    color: C.cream,
    fontSize: 13,
    outline: "none",
  };
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      {area ? (
        <textarea
          value={value} onChange={(e) => onChange(e.target.value)}
          rows={tall ? 5 : 3}
          className="w-full px-3 py-2.5 rounded leading-relaxed"
          style={style}
        />
      ) : (
        <input
          value={value} onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2.5 rounded ${mono ? "font-mono" : ""}`}
          style={{ ...style, fontSize: mono ? 12 : 13 }}
        />
      )}
    </div>
  );
}

function Empty({ text }) {
  return <div className="text-center py-20 text-sm" style={{ color: C.muted }}>{text}</div>;
}
