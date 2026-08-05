import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  Link as LinkIcon,
  Check,
  Copy,
  Github,
  Key,
  FolderUp,
  FileText,
  Database,
  Terminal,
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sheet,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  BookOpen,
  X,
  Layers,
  ListOrdered,
  Sparkles,
  FilePlus,
  Info,
  ExternalLink,
  Loader2,
  AlertCircle,
  Settings,
  Code,
  FileCode,
  Save,
  Radio,
  Plus,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Volume2,
  GitBranch,
  Play,
  Pause,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Cpu
} from 'lucide-react';
import { EpisodeManifest, HeavyMedia } from '../types';
// @ts-ignore
import rawAppCode from '../App.tsx?raw';
// @ts-ignore
import rawUserDashboardCode from './UserDashboard.tsx?raw';
// @ts-ignore
import rawAdminDashboardCode from './AdminDashboard.tsx?raw';
// @ts-ignore
import rawTypesCode from '../types.ts?raw';
// @ts-ignore
import rawPythonCode from '../../pipeline_generator.py?raw';
// @ts-ignore
import rawIndexHtmlCode from '../../index.html?raw';

function AudioStreamPlayer({ src, label }: { src: string; label?: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />
      <div className="flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-2 truncate pr-2">
          <button
            type="button"
            onClick={togglePlay}
            className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
            title={isPlaying ? 'Pause Audio' : 'Play Audio'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <span className="text-emerald-400 font-bold truncate text-xs flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span>{label || 'Audio Verification Stream'}</span>
          </span>
        </div>
        <div className="text-slate-400 text-[10px] font-mono shrink-0 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span className="text-emerald-300 font-bold">{formatTime(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Interactive Seek Bar & Visual Progress Indicator */}
      <div className="space-y-1 pt-0.5">
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none border border-slate-800"
          />
        </div>
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-300 transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface AdminDashboardProps {
  manifests: EpisodeManifest[];
  onManifestUpdate: (updatedManifests: EpisodeManifest[]) => void;
  selectedEpisodeId: string;
}

export default function AdminDashboard({
  manifests,
  onManifestUpdate,
  selectedEpisodeId,
}: AdminDashboardProps) {
  // Authentication State
  const [authToken, setAuthToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Top-Level Workspace Tabs: 'episodes' | 'credentials' | 'media' | 'notebook' | 'deployment'
  const [activeMainTab, setActiveMainTab] = useState<'episodes' | 'credentials' | 'media' | 'notebook' | 'deployment'>('episodes');

  // View Mode: Accordion or Tabbed view for episode lists
  const [viewMode, setViewMode] = useState<'accordion' | 'tabbed'>('accordion');

  // Accordion State: Track which episode IDs are expanded
  const [expandedEpisodeIds, setExpandedEpisodeIds] = useState<string[]>([
    selectedEpisodeId || manifests[0]?.episodeId || 'episode-1'
  ]);

  // Tabbed View Active Episode
  const [activeEpId, setActiveEpId] = useState<string>(
    selectedEpisodeId || manifests[0]?.episodeId || 'episode-1'
  );

  // Workflow Info Panel State
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(true);

  // Operations Guide Modal State
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<'episodes' | 'orders' | 'blob' | 'sync'>('episodes');

  // Delete Episode Confirmation Modal
  const [deleteConfirmEpId, setDeleteConfirmEpId] = useState<string | null>(null);

  // Create Episode Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEpData, setNewEpData] = useState({
    episodeId: `episode-${manifests.length + 1}`,
    title: '',
    subtitle: '',
    episodeNumber: manifests.length + 1,
  });

  // Integration credentials with localStorage persistence
  const [githubPat, setGithubPat] = useState(() => localStorage.getItem('logos_admin_gh_pat') || '');
  const [vercelBlobToken, setVercelBlobToken] = useState(() => localStorage.getItem('logos_admin_vercel_token') || '');
  const [githubRepo, setGithubRepo] = useState(() => localStorage.getItem('logos_admin_gh_repo') || 'hermas37/LOGOS-EXPLORER-PWA');
  const [gitBranch, setGitBranch] = useState(() => localStorage.getItem('logos_admin_gh_branch') || 'main');
  const [showPat, setShowPat] = useState(false);
  const [showBlobToken, setShowBlobToken] = useState(false);
  const [lastVercelBuildTime, setLastVercelBuildTime] = useState<string>('2026-07-22 00:20:15 UTC');
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [notebookPromptCopied, setNotebookPromptCopied] = useState(false);

  // Save tokens to localStorage automatically
  React.useEffect(() => {
    localStorage.setItem('logos_admin_gh_pat', githubPat);
  }, [githubPat]);
  React.useEffect(() => {
    localStorage.setItem('logos_admin_vercel_token', vercelBlobToken);
  }, [vercelBlobToken]);
  React.useEffect(() => {
    localStorage.setItem('logos_admin_gh_repo', githubRepo);
  }, [githubRepo]);
  React.useEffect(() => {
    localStorage.setItem('logos_admin_gh_branch', gitBranch);
  }, [gitBranch]);

  // Episode Field Edit States (keyed by episodeId)
  const [editingMetadata, setEditingMetadata] = useState<Record<string, {
    title: string;
    subtitle: string;
    episodeNumber: number;
    transcriptUrl: string;
    fullAudioUrl: string;
    coercedLoveAudioUrl: string;
    infographicUrl: string;
    spreadsheetUrl: string;
  }>>({});

  // 1. HEAVY MEDIA UPLOAD STATE (Vercel Blob CDN)
  const [heavyAssetType, setHeavyAssetType] = useState<'fullAudioUrl' | 'coercedLoveAudioUrl' | 'infographicUrl' | 'spreadsheetUrl'>('fullAudioUrl');
  const [heavyFile, setHeavyFile] = useState<File | null>(null);
  const [heavyDragActive, setHeavyDragActive] = useState(false);
  const [isUploadingHeavy, setIsUploadingHeavy] = useState(false);
  const [heavyProgress, setHeavyProgress] = useState(0);
  const [heavyStatus, setHeavyStatus] = useState<string | null>(null);
  const [heavyError, setHeavyError] = useState<string | null>(null);
  const [heavyGeneratedUrl, setHeavyGeneratedUrl] = useState('');
  const [heavyCopied, setHeavyCopied] = useState(false);

  // 2. LIGHT ASSETS UPLOAD STATE (GitHub Repo)
  const [lightAssetType, setLightAssetType] = useState<'transcriptUrl' | 'notes'>('transcriptUrl');
  const [lightFile, setLightFile] = useState<File | null>(null);
  const [lightDragActive, setLightDragActive] = useState(false);
  const [isUploadingLight, setIsUploadingLight] = useState(false);
  const [lightProgress, setLightProgress] = useState(0);
  const [lightStatus, setLightStatus] = useState<string | null>(null);
  const [lightError, setLightError] = useState<string | null>(null);
  const [lightGeneratedUrl, setLightGeneratedUrl] = useState('');
  const [lightCopied, setLightCopied] = useState(false);
  const [customRepoPath, setCustomRepoPath] = useState('');

  // Feedback State
  const [copiedItemUrl, setCopiedItemUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Registry History
  const [registryHistory, setRegistryHistory] = useState<Array<{
    id: string;
    episodeId: string;
    fileName: string;
    url: string;
    assetType: string;
    storageType: 'Vercel Blob CDN' | 'GitHub Repository';
    size: string;
    timestamp: string;
  }>>([
    {
      id: 'reg-1',
      episodeId: 'episode-1',
      fileName: 'boethius_4d_audio_track.mp3',
      url: 'https://logos-explorer-cdn.vercel-blob.com/boethius_4d_audio_track.mp3',
      assetType: 'fullAudioUrl (Heavy)',
      storageType: 'Vercel Blob CDN',
      size: '18.4 MB',
      timestamp: '2 hours ago'
    },
    {
      id: 'reg-2',
      episodeId: 'episode-1',
      fileName: 'sovereign_love_diagram.png',
      url: 'https://logos-explorer-cdn.vercel-blob.com/sovereign_love_diagram.png',
      assetType: 'infographicUrl (Heavy)',
      storageType: 'Vercel Blob CDN',
      size: '3.2 MB',
      timestamp: 'Yesterday'
    },
    {
      id: 'reg-3',
      episodeId: 'episode-1',
      fileName: 'boethius_block_universe_transcript.md',
      url: 'https://raw.githubusercontent.com/hermas37/LOGOS-EXPLORER-PWA/main/episodes/episode-1/boethius_block_universe_transcript.md',
      assetType: 'transcriptUrl (Light)',
      storageType: 'GitHub Repository',
      size: '42 KB',
      timestamp: 'Yesterday'
    }
  ]);

  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'System: Mountaintop oversight console initialized.',
    'System: Episode selection compartmentalization active.'
  ]);

  const heavyFileInputRef = useRef<HTMLInputElement>(null);
  const lightFileInputRef = useRef<HTMLInputElement>(null);

  const logMessage = (msg: string) => {
    setConsoleLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Auth handler
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authToken === 'logos2026' || authToken === 'logos_secret') {
      setIsAuthenticated(true);
      setAuthError('');
      logMessage('Auth: Administrator session authenticated successfully.');
    } else {
      setAuthError('Invalid Admin Access Token. Please verify your credentials.');
      logMessage('Auth: Failed credential challenge.');
    }
  };

  // Accordion toggle helper
  const toggleAccordion = (epId: string) => {
    setExpandedEpisodeIds((prev) =>
      prev.includes(epId) ? prev.filter((id) => id !== epId) : [...prev, epId]
    );
  };

  // Helper: UTF-8 to Base64
  const utf8ToB64 = (str: string) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  };

  // Commit manifest and full project source code updates to GitHub
  const syncWithGithubDirectly = async (updatedManifests: EpisodeManifest[], syncAllFiles: boolean = true) => {
    if (!githubPat || !githubRepo) {
      logMessage(`GitHub API Skip: PAT or Repository not supplied. Manifest updated in active application state.`);
      return false;
    }
    
    logMessage(`GitHub API: Contacting api.github.com for repository ${githubRepo}...`);
    try {
      const manifestString = JSON.stringify(updatedManifests, null, 2);

      const commitSingleFile = async (path: string, contentStr: string) => {
        const fileUrl = `https://api.github.com/repos/${githubRepo}/contents/${path}`;
        let sha: string | undefined = undefined;

        try {
          const getResponse = await fetch(fileUrl, {
            headers: {
              'Authorization': `Bearer ${githubPat}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });

          if (getResponse.ok) {
            const getData = await getResponse.json();
            sha = getData.sha;
          }
        } catch (err) {
          // File does not exist yet on repo
        }

        const base64Content = utf8ToB64(contentStr);

        const putResponse = await fetch(fileUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubPat}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `feat(ui): update ${path} to Mountaintop Oversight Console layout`,
            content: base64Content,
            ...(sha ? { sha } : {}),
          }),
        });

        if (!putResponse.ok) {
          const errorText = await putResponse.text();
          throw new Error(`Commit failed for ${path}: ${errorText || putResponse.statusText}`);
        }
        logMessage(`GitHub API: Synced ${path} successfully.`);
      };

      if (syncAllFiles) {
        logMessage(`GitHub API: Starting multi-file sync for full project source code & JSON manifests...`);
        const filesToSync: Array<{ path: string; content: string }> = [
          { path: 'logos-explorer-manifest.json', content: manifestString },
          { path: 'public/logos-explorer-manifest.json', content: manifestString },
          { path: 'src/App.tsx', content: rawAppCode || '' },
          { path: 'src/components/UserDashboard.tsx', content: rawUserDashboardCode || '' },
          { path: 'src/components/AdminDashboard.tsx', content: rawAdminDashboardCode || '' },
          { path: 'src/types.ts', content: rawTypesCode || '' },
          { path: 'pipeline_generator.py', content: rawPythonCode || '' },
          { path: 'index.html', content: rawIndexHtmlCode || '' },
        ];

        for (const fileItem of filesToSync) {
          if (fileItem.content) {
            logMessage(`GitHub API: Syncing ${fileItem.path}...`);
            await commitSingleFile(fileItem.path, fileItem.content);
          }
        }
      } else {
        await commitSingleFile('logos-explorer-manifest.json', manifestString);
        await commitSingleFile('public/logos-explorer-manifest.json', manifestString);
      }

      const nowFormatted = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      setLastVercelBuildTime(nowFormatted);
      logMessage(`GitHub API: All target files committed! GitHub Repo [${gitBranch} branch] updated & Vercel deployment triggered at ${nowFormatted}.`);
      return true;
    } catch (err: any) {
      logMessage(`Error: GitHub direct commit failed: ${err.message}`);
      return false;
    }
  };

  // Create New Episode Entry Handler
  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEpData.episodeId || !newEpData.title) return;

    const formattedId = newEpData.episodeId.trim().toLowerCase().replace(/\s+/g, '-');
    
    const newEp: EpisodeManifest = {
      episodeId: formattedId,
      title: newEpData.title.trim(),
      subtitle: newEpData.subtitle.trim() || 'Logos Explorer Study Episode',
      episodeNumber: newEpData.episodeNumber || (manifests.length + 1),
      transcriptUrl: '',
      heavyMedia: {
        fullAudioUrl: '',
        coercedLoveAudioUrl: '',
        infographicUrl: '',
        spreadsheetUrl: '',
      },
      studySelector: [
        { id: 'script', label: '1. Script Exegesis', type: 'script' },
        { id: 'deep-dive-audio', label: '2. Deep Dive Audio', type: 'audio' },
        { id: 'coerced-love-audio', label: '3. Forced Love Analysis', type: 'audio' },
        { id: 'visual-infographic', label: '4. Visual Infographic', type: 'slides' },
        { id: 'excel-worksheet', label: '5. Excel Worksheet', type: 'script' },
      ],
      quizData: [],
      flashcardData: [],
      mindmapData: { name: 'Logos Root', children: [] },
    };

    const updated = [...manifests, newEp];
    onManifestUpdate(updated);
    setExpandedEpisodeIds((prev) => [...prev, newEp.episodeId]);
    setActiveEpId(newEp.episodeId);
    setIsCreateModalOpen(false);

    // Reset form
    setNewEpData({
      episodeId: `episode-${updated.length + 1}`,
      title: '',
      subtitle: '',
      episodeNumber: updated.length + 1,
    });

    logMessage(`Episode Created: Added "${newEp.title}" (${newEp.episodeId}).`);
    await syncWithGithubDirectly(updated);
    setSyncSuccessMessage(`Episode "${newEp.title}" created & synced to manifest!`);
    setTimeout(() => setSyncSuccessMessage(null), 3500);
  };

  // Reorder Episode Handler (Move Up or Move Down)
  const handleMoveEpisode = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= manifests.length) return;

    const reordered = [...manifests];
    const [movedItem] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, movedItem);

    // Recalculate episode numbers
    const updated = reordered.map((m, idx) => ({
      ...m,
      episodeNumber: idx + 1,
    }));

    onManifestUpdate(updated);
    logMessage(`Episode Order: Moved "${movedItem.title}" ${direction}. Sequence updated.`);
    await syncWithGithubDirectly(updated);
    setSyncSuccessMessage(`Reordered "${movedItem.title}" and updated manifest!`);
    setTimeout(() => setSyncSuccessMessage(null), 3000);
  };

  // Delete Episode Handler
  const handleDeleteEpisode = async (epId: string) => {
    const epToDelete = manifests.find((m) => m.episodeId === epId);
    if (!epToDelete) return;

    const filtered = manifests.filter((m) => m.episodeId !== epId);
    // Recalculate episode sequence numbers
    const updated = filtered.map((m, idx) => ({
      ...m,
      episodeNumber: idx + 1,
    }));

    onManifestUpdate(updated);
    setDeleteConfirmEpId(null);

    if (activeEpId === epId) {
      setActiveEpId(updated[0]?.episodeId || '');
    }

    logMessage(`Episode Deleted: Removed "${epToDelete.title}" (${epId}). Sequence recalculated.`);
    await syncWithGithubDirectly(updated);
    setSyncSuccessMessage(`Episode "${epToDelete.title}" deleted & manifest updated on GitHub!`);
    setTimeout(() => setSyncSuccessMessage(null), 3500);
  };

  // Save full metadata & media links for an episode
  const handleSaveEpisode = async (epId: string) => {
    const ep = manifests.find((m) => m.episodeId === epId);
    if (!ep) return;

    const edit = editingMetadata[epId] || {
      title: ep.title,
      subtitle: ep.subtitle,
      episodeNumber: ep.episodeNumber || 1,
      transcriptUrl: ep.transcriptUrl || '',
      fullAudioUrl: ep.heavyMedia?.fullAudioUrl || '',
      coercedLoveAudioUrl: ep.heavyMedia?.coercedLoveAudioUrl || '',
      infographicUrl: ep.heavyMedia?.infographicUrl || '',
      spreadsheetUrl: ep.heavyMedia?.spreadsheetUrl || '',
    };

    setIsSyncing(true);
    logMessage(`Episode Edit: Saving updates for "${edit.title}" (${epId})...`);

    const updatedManifests: EpisodeManifest[] = manifests.map((m) => {
      if (m.episodeId === epId) {
        return {
          ...m,
          title: edit.title,
          subtitle: edit.subtitle,
          episodeNumber: edit.episodeNumber,
          transcriptUrl: edit.transcriptUrl,
          heavyMedia: {
            fullAudioUrl: edit.fullAudioUrl,
            coercedLoveAudioUrl: edit.coercedLoveAudioUrl,
            infographicUrl: edit.infographicUrl,
            spreadsheetUrl: edit.spreadsheetUrl,
          },
        };
      }
      return m;
    });

    onManifestUpdate(updatedManifests);
    await syncWithGithubDirectly(updatedManifests);
    setIsSyncing(false);
    setSyncSuccessMessage(`Episode "${edit.title}" updated and synced to GitHub!`);
    setTimeout(() => setSyncSuccessMessage(null), 3500);
  };

  // Sync / Upload all changes to target GitHub Repository
  const handleSyncAllToGithub = async () => {
    if (!githubPat) {
      setShowConfigPanel(true);
      setSyncSuccessMessage(`GitHub PAT required to upload directly. Please enter your Personal Access Token for ${githubRepo} below.`);
      return;
    }
    setIsSyncing(true);
    logMessage(`GitHub Sync: Initiating full manifest upload to ${githubRepo}...`);
    const success = await syncWithGithubDirectly(manifests);
    setIsSyncing(false);
    if (success) {
      setSyncSuccessMessage(`Successfully updated & uploaded changes to GitHub Repo ${githubRepo}!`);
    } else {
      setSyncSuccessMessage(`Sync attempted for ${githubRepo}. Verify GitHub PAT permissions.`);
    }
    setTimeout(() => setSyncSuccessMessage(null), 4000);
  };

  // Download Gemini Notebook (.ipynb) Template
  const handleDownloadNotebook = () => {
    const notebookContent = {
      nbformat: 4,
      nbformat_minor: 2,
      metadata: {
        language_info: { name: "python" },
        orig_nbformat: 4,
        title: "Logos Explorer - Gemini 2.5 & NotebookLM Audio/Transcript Pipeline"
      },
      cells: [
        {
          cell_type: "markdown",
          metadata: {},
          source: [
            "# 🏛️ Logos Explorer PWA - Gemini 2.5 & NotebookLM Exegesis Generator\n",
            "Automate deep dive scripture exegesis, audio generation, and transcript exporting for **Logos Explorer**.\n",
            "\n",
            "### Features:\n",
            "- **Johannine & Boethian Cosmogony Exegesis**\n",
            "- **Deep Dive Audio Track Creation**\n",
            "- **Markdown Transcript Output** for GitHub Repo\n",
            "- **Vercel Blob Heavy Asset Storage**\n"
          ]
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: [
            "# Step 1: Install Dependencies\n",
            "!pip install -q google-genai request\n",
            "import google.genai as genai\n",
            "import json\n",
            "\n",
            "print('✅ Ready for Logos Explorer Episode Generation')"
          ]
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: [
            "# Step 2: Define Episode System Prompt\n",
            "SYSTEM_PROMPT = \"\"\"You are the chief theologian and exegete for Logos Explorer.\n",
            "Generate a multi-perspective study on Johannine Logos, Boethian Block Universe 4D Omnipresence,\n",
            "and Sovereign Love vs Forced Love.\"\"\"\n",
            "\n",
            "print('Prompt ready for Gemini Studio')"
          ]
        }
      ]
    };

    const blob = new Blob([JSON.stringify(notebookContent, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Logos_Explorer_NotebookLM_Studio.ipynb';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logMessage('Gemini Studio: Downloaded Logos_Explorer_NotebookLM_Studio.ipynb');
  };

  // Copy Gemini System Prompt
  const handleCopyNotebookPrompt = () => {
    const promptText = `SYSTEM INSTRUCTIONS FOR LOGOS EXPLORER EXEGESIS:
Act as the principal scholar for the Logos Explorer PWA project.
Task: For the given Scripture passage, produce:
1. Scriptural & Linguistic Exegesis (Greek/Hebrew root analysis)
2. Boethian Timelessness vs Temporal Flow Framework
3. Deep Dive Audio Script (Conversational dialogue for 2 hosts)
4. Forced vs Free Will Sovereign Love Analysis
5. Structural Markdown Transcript with timestamps
6. Visual Infographic Diagram Concept Specification

Output format: Standard Markdown ready for deployment to GitHub Repo and Vercel Blob CDN.`;

    navigator.clipboard.writeText(promptText);
    setNotebookPromptCopied(true);
    setTimeout(() => setNotebookPromptCopied(false), 2500);
  };

  // 1. HEAVY MEDIA UPLOAD HANDLER -> VERCEL BLOB CDN
  const handleHeavyUploadAndSync = async (targetEpId: string) => {
    if (!heavyFile) return;
    setIsUploadingHeavy(true);
    setHeavyError(null);
    setHeavyStatus(`Preparing ${heavyFile.name} for Vercel Blob CDN transmission...`);
    setHeavyProgress(15);
    setHeavyGeneratedUrl('');

    const timer = setInterval(() => {
      setHeavyProgress((prev) => (prev >= 90 ? 90 : prev + 15));
    }, 200);

    try {
      let finalUrl = '';

      if (vercelBlobToken) {
        setHeavyStatus(`Direct browser uploading to Vercel Blob CDN...`);
        logMessage(`Vercel Blob: Direct client upload initiated for episode ${targetEpId}...`);
        const cleanName = heavyFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const uploadUrl = `https://blob.vercel-storage.com/logos-explorer/${cleanName}`;

        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${vercelBlobToken}`,
            'x-api-version': '2024-01-08',
            'x-add-random-suffix': '1',
          },
          body: heavyFile,
        });

        clearInterval(timer);
        setHeavyProgress(100);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Vercel Blob Upload failed: ${errText || response.statusText}`);
        }

        const blobResult = await response.json();
        finalUrl = blobResult.url;
      } else {
        setHeavyStatus(`Server streaming ${heavyFile.name} to Vercel Blob CDN...`);
        logMessage(`System: Routing heavy upload through /api/upload...`);
        const formData = new FormData();
        formData.append('file', heavyFile);
        formData.append('assetType', heavyAssetType);
        formData.append('episodeId', targetEpId);
        formData.append('githubPat', githubPat);
        formData.append('vercelBlobToken', vercelBlobToken);
        formData.append('githubRepo', githubRepo);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        clearInterval(timer);
        setHeavyProgress(100);

        if (response.ok) {
          const data = await response.json();
          finalUrl = data.cdnUrl;
          if (data.updatedManifests) {
            onManifestUpdate(data.updatedManifests);
          }
        } else {
          const errText = await response.text();
          throw new Error(`Server upload API failed: ${errText || response.statusText}`);
        }
      }

      setHeavyGeneratedUrl(finalUrl);
      setHeavyStatus(`Heavy media deployed to Vercel Blob CDN!`);
      logMessage(`Vercel Blob: Heavy asset complete! CDN URL: ${finalUrl}`);

      // Registry entry
      setRegistryHistory((prev) => [
        {
          id: `reg-${Date.now()}`,
          episodeId: targetEpId,
          fileName: heavyFile.name,
          url: finalUrl,
          assetType: `${heavyAssetType} (Heavy)`,
          storageType: 'Vercel Blob CDN',
          size: `${(heavyFile.size / 1024 / 1024).toFixed(2)} MB`,
          timestamp: 'Just now',
        },
        ...prev,
      ]);

      // Update active manifest state
      const updatedManifests: EpisodeManifest[] = manifests.map((m) => {
        if (m.episodeId === targetEpId) {
          const heavyMedia: HeavyMedia = {
            spreadsheetUrl: m.heavyMedia?.spreadsheetUrl || '',
            infographicUrl: m.heavyMedia?.infographicUrl || '',
            fullAudioUrl: m.heavyMedia?.fullAudioUrl || '',
            coercedLoveAudioUrl: m.heavyMedia?.coercedLoveAudioUrl || '',
            ...m.heavyMedia,
            [heavyAssetType]: finalUrl,
          };
          return { ...m, heavyMedia };
        }
        return m;
      });

      onManifestUpdate(updatedManifests);
      await syncWithGithubDirectly(updatedManifests);
      setSyncSuccessMessage(`Heavy media for Episode ${targetEpId} deployed and hot-injected!`);
      setTimeout(() => setSyncSuccessMessage(null), 3000);
    } catch (err: any) {
      const errMsg = err?.message || 'Heavy media upload failed';
      setHeavyError(errMsg);
      setHeavyStatus(null);
      logMessage(`Error: Heavy media upload failed: ${errMsg}`);
    } finally {
      setIsUploadingHeavy(false);
    }
  };

  // 2. LIGHT ASSETS UPLOAD HANDLER -> GITHUB REPOSITORY
  const handleLightUploadAndSync = async (targetEpId: string) => {
    if (!lightFile) return;
    setIsUploadingLight(true);
    setLightError(null);
    setLightStatus(`Preparing light asset ${lightFile.name} for GitHub repo sync...`);
    setLightProgress(15);
    setLightGeneratedUrl('');

    const timer = setInterval(() => {
      setLightProgress((prev) => (prev >= 90 ? 90 : prev + 15));
    }, 200);

    try {
      let rawGithubUrl = '';
      const cleanName = lightFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const targetRepoPath = customRepoPath.trim() || `episodes/${targetEpId}/${cleanName}`;

      if (githubPat) {
        setLightStatus(`Committing light asset directly to GitHub repository (${githubRepo})...`);
        logMessage(`GitHub Client: Committing ${cleanName} to repo path ${targetRepoPath}...`);

        const fileBuffer = await lightFile.arrayBuffer();
        const base64Content = btoa(
          new Uint8Array(fileBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const ghUrl = `https://api.github.com/repos/${githubRepo}/contents/${targetRepoPath}`;

        let sha = undefined;
        const getRes = await fetch(ghUrl, {
          headers: {
            'Authorization': `Bearer ${githubPat}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });
        if (getRes.ok) {
          const existingData = await getRes.json();
          sha = existingData.sha;
        }

        const putRes = await fetch(ghUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubPat}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            message: `feat(notebooklm): sync light asset ${cleanName} for episode ${targetEpId}`,
            content: base64Content,
            sha: sha,
          }),
        });

        clearInterval(timer);
        setLightProgress(100);

        if (!putRes.ok) {
          const errText = await putRes.text();
          throw new Error(`GitHub Commit API failed: ${errText || putRes.statusText}`);
        }

        const putData = await putRes.json();
        rawGithubUrl = putData.content?.download_url || `https://raw.githubusercontent.com/${githubRepo}/main/${targetRepoPath}`;
      } else {
        setLightStatus(`Uploading ${lightFile.name} through server GitHub API...`);
        logMessage(`System: Routing light upload through /api/upload-github...`);
        const formData = new FormData();
        formData.append('file', lightFile);
        formData.append('episodeId', targetEpId);
        formData.append('githubPat', githubPat);
        formData.append('githubRepo', githubRepo);
        formData.append('pathInRepo', targetRepoPath);

        const response = await fetch('/api/upload-github', {
          method: 'POST',
          body: formData,
        });

        clearInterval(timer);
        setLightProgress(100);

        if (response.ok) {
          const data = await response.json();
          rawGithubUrl = data.githubUrl;
          if (data.updatedManifests) {
            onManifestUpdate(data.updatedManifests);
          }
        } else {
          const errText = await response.text();
          throw new Error(`Server light upload API failed: ${errText || response.statusText}`);
        }
      }

      setLightGeneratedUrl(rawGithubUrl);
      setLightStatus(`Light asset committed to GitHub Repo!`);
      logMessage(`GitHub Repo: Light asset commit complete! URL: ${rawGithubUrl}`);

      // Registry
      setRegistryHistory((prev) => [
        {
          id: `reg-${Date.now()}`,
          episodeId: targetEpId,
          fileName: lightFile.name,
          url: rawGithubUrl,
          assetType: `${lightAssetType} (Light)`,
          storageType: 'GitHub Repository',
          size: `${(lightFile.size / 1024).toFixed(1)} KB`,
          timestamp: 'Just now',
        },
        ...prev,
      ]);

      // Update manifest transcriptUrl if applicable
      const updatedManifests: EpisodeManifest[] = manifests.map((m) => {
        if (m.episodeId === targetEpId && (lightAssetType === 'transcriptUrl' || cleanName.endsWith('.md'))) {
          return { ...m, transcriptUrl: rawGithubUrl };
        }
        return m;
      });

      onManifestUpdate(updatedManifests);
      await syncWithGithubDirectly(updatedManifests);
      setSyncSuccessMessage(`Light asset committed to GitHub and linked to Episode ${targetEpId}!`);
      setTimeout(() => setSyncSuccessMessage(null), 3000);
    } catch (err: any) {
      const errMsg = err?.message || 'Light asset upload failed';
      setLightError(errMsg);
      setLightStatus(null);
      logMessage(`Error: Light asset upload failed: ${errMsg}`);
    } finally {
      setIsUploadingLight(false);
    }
  };

  // Hot inject helper
  const handleHotInjectField = async (epId: string, field: string, value: string) => {
    if (!value) return;
    setIsSyncing(true);
    logMessage(`Manifest: Hot-injecting ${field} into episode ${epId}...`);

    const updatedManifests: EpisodeManifest[] = manifests.map((m) => {
      if (m.episodeId === epId) {
        if (field === 'transcriptUrl') {
          return { ...m, transcriptUrl: value };
        } else {
          const heavyMedia: HeavyMedia = {
            spreadsheetUrl: m.heavyMedia?.spreadsheetUrl || '',
            infographicUrl: m.heavyMedia?.infographicUrl || '',
            fullAudioUrl: m.heavyMedia?.fullAudioUrl || '',
            coercedLoveAudioUrl: m.heavyMedia?.coercedLoveAudioUrl || '',
            ...m.heavyMedia,
            [field]: value,
          };
          return { ...m, heavyMedia };
        }
      }
      return m;
    });

    onManifestUpdate(updatedManifests);
    await syncWithGithubDirectly(updatedManifests);
    setIsSyncing(false);
    setSyncSuccessMessage(`Field ${field} hot-injected into Episode ${epId}!`);
    setTimeout(() => setSyncSuccessMessage(null), 3000);
  };

  // Auth Screen
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-slate-100 bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 text-center shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-radial from-amber-500/5 to-transparent rounded-2xl pointer-events-none" />
          <div className="mx-auto p-4 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 w-14 h-14 flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-lg text-slate-100">
              Mountaintop Gatekeeper
            </h3>
            <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
              Access administrative oversight console. Sync heavy media to Vercel Blob and light assets to GitHub.
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase text-left block">
                ADMIN ACCESS TOKEN
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="Enter token (e.g. logos2026)"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500 placeholder-slate-600"
                  required
                />
                <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {authError && (
                <p className="text-[11px] text-rose-400 font-medium text-left mt-1">
                  ⚠️ {authError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
            >
              Unlock Console
            </button>
          </form>

          <div className="border-t border-slate-800/80 pt-4 text-[10px] font-mono text-slate-500">
            Secure sandbox active. Token: <code className="text-amber-500/70 font-bold">logos2026</code>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Episode Compartment (contains Light Metadata, Heavy Media & Action controls)
  const renderEpisodeCompartment = (ep: EpisodeManifest, epIndex: number) => {
    const epNum = ep.episodeNumber || (epIndex + 1);
    const edit = editingMetadata[ep.episodeId] || {
      title: ep.title,
      subtitle: ep.subtitle,
      episodeNumber: ep.episodeNumber || (epIndex + 1),
      transcriptUrl: ep.transcriptUrl || '',
      fullAudioUrl: ep.heavyMedia?.fullAudioUrl || '',
      coercedLoveAudioUrl: ep.heavyMedia?.coercedLoveAudioUrl || '',
      infographicUrl: ep.heavyMedia?.infographicUrl || '',
      spreadsheetUrl: ep.heavyMedia?.spreadsheetUrl || '',
    };

    return (
      <div className="space-y-6 pt-2">
        {/* TOP ACTION BAR: SAVE & DELETE CONTROL */}
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              EP {epNum}
            </span>
            <span className="text-xs font-mono text-slate-400">ID: <code className="text-slate-200">{ep.episodeId}</code></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveEpisode(ep.episodeId)}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-950/40"
            >
              {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Episode Changes</span>
            </button>

            <button
              onClick={() => setDeleteConfirmEpId(ep.episodeId)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Episode</span>
            </button>
          </div>
        </div>

        {/* SECTION 1: LIGHT METADATA (GitHub-based JSON & Transcript updates) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-slate-900/50 space-y-4 shadow-xl relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-amber-300 uppercase font-mono tracking-wider">
                    Light Metadata & Exegesis Config
                  </h4>
                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                    GitHub JSON Repo Sync
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Manage title, subtitle, sequence number, and markdown transcript links
                </p>
              </div>
            </div>
          </div>

          {/* Light Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Episode Title</label>
              <input
                type="text"
                value={edit.title}
                onChange={(e) =>
                  setEditingMetadata((prev) => ({
                    ...prev,
                    [ep.episodeId]: { ...edit, title: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Subtitle / Exegesis Tag</label>
              <input
                type="text"
                value={edit.subtitle}
                onChange={(e) =>
                  setEditingMetadata((prev) => ({
                    ...prev,
                    [ep.episodeId]: { ...edit, subtitle: e.target.value },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Sequence Number</label>
              <input
                type="number"
                value={edit.episodeNumber}
                onChange={(e) =>
                  setEditingMetadata((prev) => ({
                    ...prev,
                    [ep.episodeId]: { ...edit, episodeNumber: parseInt(e.target.value) || 1 },
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
                <span>Markdown Transcript Raw URL (transcriptUrl)</span>
                {ep.transcriptUrl && (
                  <a
                    href={ep.transcriptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 text-[10px]"
                  >
                    <span>View Raw File</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={edit.transcriptUrl}
                  placeholder="https://raw.githubusercontent.com/.../transcript.md"
                  onChange={(e) =>
                    setEditingMetadata((prev) => ({
                      ...prev,
                      [ep.episodeId]: { ...edit, transcriptUrl: e.target.value },
                    }))
                  }
                  className="flex-grow bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => handleHotInjectField(ep.episodeId, 'transcriptUrl', edit.transcriptUrl)}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 font-mono text-[11px] font-bold shrink-0 border border-slate-700 cursor-pointer"
                >
                  Hot-Inject URL
                </button>
              </div>
            </div>
          </div>

          {/* Light Asset Uploader for NotebookLM Transcripts & JSON */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-300 font-bold uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                Upload Light Text / Transcript Asset to GitHub Repo
              </span>
              <span className="text-[10px] text-slate-500">.md, .json, .txt</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Role / Target Field</label>
                <select
                  value={lightAssetType}
                  onChange={(e) => setLightAssetType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="transcriptUrl">📜 Transcript File (transcriptUrl)</option>
                  <option value="notes">📝 Study Notes / Exegesis (.md)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Custom Repo Path</label>
                <input
                  type="text"
                  placeholder={`episodes/${ep.episodeId}/transcript.md`}
                  value={customRepoPath}
                  onChange={(e) => setCustomRepoPath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-600"
                />
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragEnter={(e) => { e.preventDefault(); setLightDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); setLightDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setLightDragActive(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setLightDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setLightFile(e.dataTransfer.files[0]);
                  logMessage(`Light Drop: Selected "${e.dataTransfer.files[0].name}" for ${ep.episodeId}`);
                }
              }}
              onClick={() => document.getElementById(`light-file-input-${ep.episodeId}`)?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                lightDragActive
                  ? 'border-amber-400 bg-amber-500/10'
                  : lightFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <input
                id={`light-file-input-${ep.episodeId}`}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setLightFile(e.target.files[0]);
                    logMessage(`Light File: Selected "${e.target.files[0].name}" for ${ep.episodeId}`);
                  }
                }}
                accept=".md,.txt,.json"
              />
              <FileText className={`w-6 h-6 mx-auto mb-1 ${lightFile ? 'text-emerald-400' : 'text-slate-500'}`} />
              {lightFile ? (
                <div>
                  <p className="text-xs font-semibold text-emerald-300 truncate px-2">{lightFile.name}</p>
                  <p className="text-[10px] text-slate-400">{(lightFile.size / 1024).toFixed(1)} KB • Ready for GitHub commit</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-slate-300">Click or drag Markdown / JSON files here</p>
                  <p className="text-[10px] text-slate-500">Gemini Notebook Studio Transcripts & Manifest Schemas</p>
                </div>
              )}
            </div>

            {/* Upload Action Button */}
            {isUploadingLight ? (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Committing to GitHub...
                  </span>
                  <span className="text-amber-300 font-bold">{lightProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${lightProgress}%` }} />
                </div>
                <p className="text-[10px] font-mono text-slate-400 truncate">{lightStatus}</p>
              </div>
            ) : (
              <button
                onClick={() => handleLightUploadAndSync(ep.episodeId)}
                disabled={!lightFile}
                className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  lightFile
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer shadow-md shadow-amber-950/40'
                    : 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
              >
                <Github className="w-4 h-4" />
                <span>Upload & Commit Light Asset to GitHub ({ep.episodeId})</span>
              </button>
            )}

            {lightError && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono">
                ⚠️ {lightError}
              </div>
            )}

            {lightGeneratedUrl && (
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 space-y-2 text-xs">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                  GitHub Raw URL Generated
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={lightGeneratedUrl}
                    className="w-full bg-slate-950 border border-slate-800 text-emerald-300 text-[11px] font-mono p-2 rounded focus:outline-none truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(lightGeneratedUrl);
                      setLightCopied(true);
                      setTimeout(() => setLightCopied(false), 2000);
                    }}
                    className="px-3 py-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-mono text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    {lightCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: HEAVY MEDIA (Vercel Blob Upload Area) */}
        <div className="p-4 sm:p-5 rounded-2xl border border-cyan-500/30 bg-slate-900/50 space-y-4 shadow-xl relative">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-cyan-300 uppercase font-mono tracking-wider">
                    Heavy Media Section
                  </h4>
                  <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                    Vercel Blob CDN Area
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Deploy deep dive MP3 audio, forced love exegesis, infographics, and excel worksheets
                </p>
              </div>
            </div>
          </div>

          {/* Current Heavy Media Status Grid for Active Episode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">🎧 Deep Dive Audio (fullAudioUrl)</span>
              <span className="text-slate-200 text-[11px] font-mono truncate block">
                {ep.heavyMedia?.fullAudioUrl || <span className="text-slate-600 italic">Not deployed yet</span>}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">🎧 Forced Love Exegesis (coercedLoveAudioUrl)</span>
              <span className="text-slate-200 text-[11px] font-mono truncate block">
                {ep.heavyMedia?.coercedLoveAudioUrl || <span className="text-slate-600 italic">Not deployed yet</span>}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">🖼️ Visual Infographic (infographicUrl)</span>
              <span className="text-slate-200 text-[11px] font-mono truncate block">
                {ep.heavyMedia?.infographicUrl || <span className="text-slate-600 italic">Not deployed yet</span>}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">📊 Master Excel Sheet (spreadsheetUrl)</span>
              <span className="text-slate-200 text-[11px] font-mono truncate block">
                {ep.heavyMedia?.spreadsheetUrl || <span className="text-slate-600 italic">Not deployed yet</span>}
              </span>
            </div>
          </div>

          {/* Vercel Blob High-Capacity Media Uploader */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Target Heavy Media Property</label>
              <select
                value={heavyAssetType}
                onChange={(e) => setHeavyAssetType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="fullAudioUrl">🎧 Deep Dive Audio Track (fullAudioUrl)</option>
                <option value="coercedLoveAudioUrl">🎧 Forced Love Analysis (coercedLoveAudioUrl)</option>
                <option value="infographicUrl">🖼️ Visual Infographic Image (infographicUrl)</option>
                <option value="spreadsheetUrl">📊 Production Excel Worksheet (spreadsheetUrl)</option>
              </select>
            </div>

            {/* Dropzone */}
            <div
              onDragEnter={(e) => { e.preventDefault(); setHeavyDragActive(true); }}
              onDragOver={(e) => { e.preventDefault(); setHeavyDragActive(true); }}
              onDragLeave={(e) => { e.preventDefault(); setHeavyDragActive(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setHeavyDragActive(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setHeavyFile(e.dataTransfer.files[0]);
                  logMessage(`Heavy Drop: Selected "${e.dataTransfer.files[0].name}" for ${ep.episodeId}`);
                }
              }}
              onClick={() => document.getElementById(`heavy-file-input-${ep.episodeId}`)?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                heavyDragActive
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : heavyFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <input
                id={`heavy-file-input-${ep.episodeId}`}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setHeavyFile(e.target.files[0]);
                    logMessage(`Heavy File: Selected "${e.target.files[0].name}" for ${ep.episodeId}`);
                  }
                }}
                accept=".mp3,.wav,.xlsx,.png,.jpg,.jpeg,.pdf,.json,.csv"
              />
              <Upload className={`w-7 h-7 mx-auto mb-1.5 ${heavyFile ? 'text-emerald-400' : 'text-slate-500'}`} />
              {heavyFile ? (
                <div>
                  <p className="text-xs font-semibold text-emerald-300 truncate px-2">{heavyFile.name}</p>
                  <p className="text-[10px] text-slate-400">{(heavyFile.size / 1024 / 1024).toFixed(2)} MB • Ready for @vercel/blob SDK upload</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-medium text-slate-300">Click or drag heavy media files here</p>
                  <p className="text-[10px] text-slate-500">Audio (MP3/WAV), High-Res Diagrams (PNG/JPG), Worksheets (.xlsx)</p>
                </div>
              )}
            </div>

            {/* Progress & Upload Button */}
            {isUploadingHeavy ? (
              <div className="p-4 rounded-xl border border-cyan-500/40 bg-slate-950/90 space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-bold flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Uploading via @vercel/blob SDK...</span>
                  </span>
                  <span className="text-cyan-300 font-bold font-mono">{heavyProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300" style={{ width: `${heavyProgress}%` }} />
                </div>
                <p className="text-[10px] font-mono text-slate-400 truncate">{heavyStatus}</p>
              </div>
            ) : (
              <button
                onClick={() => handleHeavyUploadAndSync(ep.episodeId)}
                disabled={!heavyFile}
                className={`w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  heavyFile
                    ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer shadow-md shadow-cyan-950/50'
                    : 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Upload Heavy Media via @vercel/blob SDK ({ep.episodeId})</span>
              </button>
            )}

            {heavyError && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{heavyError}</span>
              </div>
            )}

            {heavyGeneratedUrl && (
              <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/25 space-y-2.5 text-xs shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Vercel Blob Public CDN URL
                  </span>
                  <button
                    onClick={() => handleHotInjectField(ep.episodeId, heavyAssetType, heavyGeneratedUrl)}
                    className="text-[10px] font-mono bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 px-2 py-1 rounded-lg transition-all cursor-pointer font-bold"
                  >
                    Auto-Inject to {heavyAssetType}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={heavyGeneratedUrl}
                    className="w-full bg-slate-950 border border-slate-800 text-emerald-300 text-[11px] font-mono p-2.5 rounded-xl focus:outline-none truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(heavyGeneratedUrl);
                      setHeavyCopied(true);
                      setTimeout(() => setHeavyCopied(false), 2000);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-mono text-[11px] font-bold shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                    title="Copy Public URL to Clipboard"
                  >
                    {heavyCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy to Clipboard</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Audio Verification Stream Player */}
                <div className="pt-2 border-t border-emerald-500/20">
                  <AudioStreamPlayer src={heavyGeneratedUrl} label="Uploaded Vercel Blob Audio Stream" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans select-none overflow-y-auto custom-scrollbar pb-24">
      {/* Top Console Navigation Bar */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-100 flex items-center gap-2">
              <span>Mountaintop Oversight Console</span>
              <span className="text-[10px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded font-bold">
                LOGOS 2026
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Explore Reality. Discover the Logos.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="hidden md:flex items-center gap-2.5 text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              GitHub Connected
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Vercel Blob Active
            </span>
          </div>

          <button
            onClick={handleSyncAllToGithub}
            disabled={isSyncing}
            className="flex items-center gap-2 text-xs font-mono bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-md shadow-amber-950/40 shrink-0 border border-amber-400/50 active:scale-95"
            title="Upload changes or update to GitHub Repo hermas37/LOGOS-EXPLORER-PWA"
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Github className="w-4 h-4 text-slate-950" />
            )}
            <span>{isSyncing ? 'Syncing Repo...' : 'Update GitHub (hermas37/LOGOS-EXPLORER-PWA)'}</span>
          </button>

          <button
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              showConfigPanel ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-300'
            }`}
            title="Toggle Fast API Token Overrides"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setGuideTab('episodes');
              setIsGuideOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-mono bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold shadow-sm shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Guide</span>
          </button>
        </div>
      </div>

      {/* Global Success Banner */}
      <AnimatePresence>
        {syncSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="m-4 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between gap-2 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncSuccessMessage}</span>
            </div>
            <button onClick={() => setSyncSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsible Quick API Token Bar */}
      <AnimatePresence>
        {showConfigPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-3 p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-3 overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 font-mono uppercase">Quick Token Config</span>
              <button onClick={() => setShowConfigPanel(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">GitHub PAT</label>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxx"
                  value={githubPat}
                  onChange={(e) => setGithubPat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Vercel Blob Token</label>
                <input
                  type="password"
                  placeholder="vercel_blob_rw_xxxxxxxx"
                  value={vercelBlobToken}
                  onChange={(e) => setVercelBlobToken(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">GitHub Target Repo</label>
                <input
                  type="text"
                  placeholder="username/repo"
                  value={githubRepo}
                  onChange={(e) => setGithubRepo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workspace Main Tabbed Navigation Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 pt-3 overflow-x-auto custom-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-max pb-0.5">
          <button
            onClick={() => setActiveMainTab('episodes')}
            className={`px-3.5 py-2.5 rounded-t-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-t border-x transition-all cursor-pointer shrink-0 ${
              activeMainTab === 'episodes'
                ? 'bg-slate-950 text-amber-400 border-amber-500/50 border-b-transparent -mb-px z-10 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-500" />
            <span>Episodes & CRUD</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full font-bold ml-1">
              {manifests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('credentials')}
            className={`px-3.5 py-2.5 rounded-t-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-t border-x transition-all cursor-pointer shrink-0 ${
              activeMainTab === 'credentials'
                ? 'bg-slate-950 text-amber-300 border-amber-500/50 border-b-transparent -mb-px z-10 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Credentials & Tokens</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
              githubPat && vercelBlobToken ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {githubPat && vercelBlobToken ? 'Saved' : 'Config'}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('media')}
            className={`px-3.5 py-2.5 rounded-t-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-t border-x transition-all cursor-pointer shrink-0 ${
              activeMainTab === 'media'
                ? 'bg-slate-950 text-cyan-400 border-cyan-500/50 border-b-transparent -mb-px z-10 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Media & Blob CDN</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full font-bold ml-1">
              Vercel
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('notebook')}
            className={`px-3.5 py-2.5 rounded-t-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-t border-x transition-all cursor-pointer shrink-0 ${
              activeMainTab === 'notebook'
                ? 'bg-slate-950 text-purple-300 border-purple-500/50 border-b-transparent -mb-px z-10 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>Gemini Notebook Studio</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded-full font-bold ml-1">
              AI
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab('deployment')}
            className={`px-3.5 py-2.5 rounded-t-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-t border-x transition-all cursor-pointer shrink-0 ${
              activeMainTab === 'deployment'
                ? 'bg-slate-950 text-emerald-400 border-emerald-500/50 border-b-transparent -mb-px z-10 shadow-sm'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Deployment & Sync</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-bold ml-1">
              Live
            </span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-8">

        {/* TAB 1: EPISODE CONFIGURATION */}
        {activeMainTab === 'episodes' && (
          <div className="space-y-8">
            {/* Episode Controls Header & Action Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                  <Layers className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider">
                    Episode Schema & Progression Manager
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Configure titles, study options, exegesis metadata, and sequence order</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-amber-950/40 cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Create Episode</span>
                </button>

                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setViewMode('accordion')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                      viewMode === 'accordion' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Accordion
                  </button>
                  <button
                    onClick={() => setViewMode('tabbed')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-bold ${
                      viewMode === 'tabbed' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tabbed
                  </button>
                </div>
              </div>
            </div>

            {/* Workflow Info Banner & Instruction Grid */}
            <div className="rounded-2xl border border-amber-500/30 bg-slate-900/90 p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold font-mono uppercase text-amber-300 tracking-wider">Episode Configuration & Deployment Workflow Instructions</span>
                </div>
                <button
                  onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
                  className="text-xs font-mono text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer flex items-center gap-1.5"
                >
                  <span>{showWorkflowGuide ? 'Hide Instructions' : 'Show Instructions'}</span>
                </button>
              </div>
              {showWorkflowGuide && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 text-xs">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 leading-relaxed shadow-sm hover:border-amber-500/30 transition-all">
                    <span className="text-amber-400 font-bold font-mono flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">1</span>
                      <span>Edit Light Metadata</span>
                    </span>
                    <p className="text-slate-300 text-xs">Modify episode title, subtitle, or exegesis transcript links. Changes stage locally in real-time.</p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 leading-relaxed shadow-sm hover:border-amber-500/30 transition-all">
                    <span className="text-amber-400 font-bold font-mono flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">2</span>
                      <span>Sequence Position</span>
                    </span>
                    <p className="text-slate-300 text-xs">Use ↑ ↓ position controls to adjust episode progression order for all PWA clients.</p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 leading-relaxed shadow-sm hover:border-amber-500/30 transition-all">
                    <span className="text-amber-400 font-bold font-mono flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px]">3</span>
                      <span>Commit to Manifest</span>
                    </span>
                    <p className="text-slate-300 text-xs">Click <b>Save Episode Changes</b> to sync directly to live <code>logos-explorer-manifest.json</code> on GitHub.</p>
                  </div>
                </div>
              )}
            </div>

            {/* VIEW MODE A: ACCORDION */}
            {viewMode === 'accordion' && (
              <div className="space-y-4">
                {manifests.map((ep, idx) => {
                  const epNum = ep.episodeNumber || (idx + 1);
                  const isExpanded = expandedEpisodeIds.includes(ep.episodeId);

                  return (
                    <div
                      key={ep.episodeId}
                      className={`rounded-2xl border transition-all overflow-hidden shadow-lg ${
                        isExpanded
                          ? 'border-amber-500/50 bg-slate-900/60 ring-1 ring-amber-500/20'
                          : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                      }`}
                    >
                      {/* Accordion Header */}
                      <div className="w-full p-4 flex items-center justify-between gap-3 text-left bg-slate-900/40 border-b border-slate-800/50">
                        <div
                          onClick={() => toggleAccordion(ep.episodeId)}
                          className="flex items-center gap-3 truncate cursor-pointer flex-grow"
                        >
                          <div className={`p-2 rounded-xl font-mono text-xs font-bold shrink-0 ${
                            isExpanded ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            EP {epNum}
                          </div>
                          <div className="truncate">
                            <h4 className="text-sm font-bold text-slate-100 truncate">{ep.title}</h4>
                            <p className="text-xs text-slate-400 truncate">{ep.subtitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                            <button
                              onClick={(e) => handleMoveEpisode(idx, 'up', e)}
                              disabled={idx === 0}
                              className={`p-1 rounded transition-colors ${
                                idx === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800 cursor-pointer'
                              }`}
                              title="Move Episode Up in Sequence"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleMoveEpisode(idx, 'down', e)}
                              disabled={idx === manifests.length - 1}
                              className={`p-1 rounded transition-colors ${
                                idx === manifests.length - 1 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800 cursor-pointer'
                              }`}
                              title="Move Episode Down in Sequence"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="hidden sm:inline-block text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-850">
                            ID: {ep.episodeId}
                          </span>

                          <button
                            onClick={() => toggleAccordion(ep.episodeId)}
                            className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-amber-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-slate-500" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content Panel */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-4 pb-5 border-t border-slate-800/80"
                          >
                            {renderEpisodeCompartment(ep, idx)}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE B: TABBED */}
            {viewMode === 'tabbed' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                  {manifests.map((ep, idx) => {
                    const epNum = ep.episodeNumber || (idx + 1);
                    const isSelected = ep.episodeId === activeEpId;

                    return (
                      <button
                        key={ep.episodeId}
                        onClick={() => setActiveEpId(ep.episodeId)}
                        className={`px-4 py-3 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/10'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-[10px] uppercase font-mono tracking-wider opacity-80">Episode {epNum}</div>
                        <div className="text-xs font-bold truncate max-w-[150px]">{ep.title}</div>
                      </button>
                    );
                  })}
                </div>

                {(() => {
                  const activeEp = manifests.find((m) => m.episodeId === activeEpId) || manifests[0];
                  const activeIdx = manifests.findIndex((m) => m.episodeId === activeEpId);
                  return (
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300">
                          Managing Sequence Position for <strong>Episode {activeEp.episodeNumber || activeIdx + 1}</strong>
                        </span>
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                          <button
                            onClick={(e) => handleMoveEpisode(activeIdx, 'up', e)}
                            disabled={activeIdx === 0}
                            className={`p-1.5 rounded transition-colors ${
                              activeIdx === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-amber-400 hover:bg-slate-800 cursor-pointer'
                            }`}
                            title="Move Episode Up"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleMoveEpisode(activeIdx, 'down', e)}
                            disabled={activeIdx === manifests.length - 1}
                            className={`p-1.5 rounded transition-colors ${
                              activeIdx === manifests.length - 1 ? 'text-slate-700 cursor-not-allowed' : 'text-amber-400 hover:bg-slate-800 cursor-pointer'
                            }`}
                            title="Move Episode Down"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {renderEpisodeCompartment(activeEp, activeIdx >= 0 ? activeIdx : 0)}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MEDIA MANAGEMENT */}
        {activeMainTab === 'media' && (
          <div className="space-y-6">
            {/* Media Hub Header */}
            <div className="p-4 rounded-2xl border border-cyan-500/30 bg-slate-900/80 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider flex items-center gap-2">
                      <span>Heavy Media & Vercel Blob CDN Hub</span>
                      <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/40 font-bold">
                        @vercel/blob SDK
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Upload high-capacity audio, vector diagrams, and spreadsheets directly to CDN</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Selected Episode:</span>
                  <select
                    value={activeEpId}
                    onChange={(e) => setActiveEpId(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs font-bold rounded-xl p-2 focus:outline-none focus:border-cyan-500"
                  >
                    {manifests.map((m, i) => (
                      <option key={m.episodeId} value={m.episodeId}>
                        EP {m.episodeNumber || i + 1}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Episode selector pills */}
              <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                {manifests.map((m, idx) => {
                  const isSel = m.episodeId === activeEpId;
                  return (
                    <button
                      key={m.episodeId}
                      onClick={() => setActiveEpId(m.episodeId)}
                      className={`px-3 py-2 rounded-xl border text-xs font-mono font-bold shrink-0 transition-all cursor-pointer ${
                        isSel
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      EP {m.episodeNumber || idx + 1} ({m.episodeId})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Standalone Heavy Media Uploader Card for Active Episode */}
            {(() => {
              const currentEp = manifests.find((m) => m.episodeId === activeEpId) || manifests[0];
              return (
                <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5 text-cyan-400" />
                      <h4 className="text-xs font-bold text-slate-100 uppercase font-mono tracking-wider">
                        Upload Heavy Media for {currentEp.title}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 font-bold">
                      ID: {currentEp.episodeId}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Target Heavy Media Property</label>
                      <select
                        value={heavyAssetType}
                        onChange={(e) => setHeavyAssetType(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                      >
                        <option value="fullAudioUrl">🎧 Deep Dive Audio Track (fullAudioUrl)</option>
                        <option value="coercedLoveAudioUrl">🎧 Forced Love Analysis (coercedLoveAudioUrl)</option>
                        <option value="infographicUrl">🖼️ Visual Infographic Image (infographicUrl)</option>
                        <option value="spreadsheetUrl">📊 Production Excel Worksheet (spreadsheetUrl)</option>
                      </select>
                    </div>

                    {/* Drag and Drop Zone */}
                    <div
                      onDragEnter={(e) => { e.preventDefault(); setHeavyDragActive(true); }}
                      onDragOver={(e) => { e.preventDefault(); setHeavyDragActive(true); }}
                      onDragLeave={(e) => { e.preventDefault(); setHeavyDragActive(false); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setHeavyDragActive(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          setHeavyFile(e.dataTransfer.files[0]);
                          logMessage(`Heavy Drop: Selected "${e.dataTransfer.files[0].name}" for ${currentEp.episodeId}`);
                        }
                      }}
                      onClick={() => document.getElementById(`heavy-file-input-media-tab`)?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                        heavyDragActive
                          ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99]'
                          : heavyFile
                          ? 'border-emerald-500/50 bg-emerald-500/5'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <input
                        id="heavy-file-input-media-tab"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setHeavyFile(e.target.files[0]);
                            logMessage(`Heavy File: Selected "${e.target.files[0].name}" for ${currentEp.episodeId}`);
                          }
                        }}
                        accept=".mp3,.wav,.xlsx,.png,.jpg,.jpeg,.pdf,.json,.csv"
                      />
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${heavyFile ? 'text-emerald-400' : 'text-slate-500'}`} />
                      {heavyFile ? (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-emerald-300 truncate px-2">{heavyFile.name}</p>
                          <p className="text-[11px] text-slate-400">{(heavyFile.size / 1024 / 1024).toFixed(2)} MB • Ready for @vercel/blob SDK upload</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-slate-200">Click or drag heavy media files here</p>
                          <p className="text-[11px] text-slate-500">Audio (MP3/WAV), High-Res Diagrams (PNG/JPG), Worksheets (.xlsx)</p>
                        </div>
                      )}
                    </div>

                    {/* Progress / Spinner & Action Button */}
                    {isUploadingHeavy ? (
                      <div className="p-4 rounded-xl border border-cyan-500/40 bg-slate-950 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-cyan-400 font-bold flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            <span>Uploading file via @vercel/blob SDK...</span>
                          </span>
                          <span className="text-cyan-300 font-bold">{heavyProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300" style={{ width: `${heavyProgress}%` }} />
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 truncate">{heavyStatus}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleHeavyUploadAndSync(currentEp.episodeId)}
                        disabled={!heavyFile}
                        className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                          heavyFile
                            ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 cursor-pointer shadow-lg shadow-cyan-950/50'
                            : 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        <Database className="w-4 h-4" />
                        <span>Upload Heavy Media via @vercel/blob SDK ({currentEp.episodeId})</span>
                      </button>
                    )}

                    {heavyError && (
                      <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{heavyError}</span>
                      </div>
                    )}

                    {heavyGeneratedUrl && (
                      <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/25 space-y-3 text-xs shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            Vercel Blob Public CDN URL
                          </span>
                          <button
                            onClick={() => handleHotInjectField(currentEp.episodeId, heavyAssetType, heavyGeneratedUrl)}
                            className="text-[10px] font-mono bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold"
                          >
                            Auto-Inject to {heavyAssetType}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={heavyGeneratedUrl}
                            className="w-full bg-slate-950 border border-slate-800 text-emerald-300 text-[11px] font-mono p-2.5 rounded-xl focus:outline-none truncate"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(heavyGeneratedUrl);
                              setHeavyCopied(true);
                              setTimeout(() => setHeavyCopied(false), 2000);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-mono text-[11px] font-bold shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                            title="Copy Public URL to Clipboard"
                          >
                            {heavyCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy to Clipboard</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Audio Stream Verification Player with Progress & Time Tracking */}
                        <div className="pt-2 border-t border-emerald-500/20">
                          <AudioStreamPlayer src={heavyGeneratedUrl} label="Vercel Blob Audio Stream Verification" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Media Property Status Grid for Selected Episode */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                      Current CDN Links for {currentEp.episodeId}:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">fullAudioUrl</span>
                            <span className="text-emerald-400 truncate block text-[11px]">
                              {currentEp.heavyMedia?.fullAudioUrl || 'Not configured'}
                            </span>
                          </div>
                          {currentEp.heavyMedia?.fullAudioUrl && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(currentEp.heavyMedia!.fullAudioUrl!);
                                setCopiedItemUrl('fullAudioUrl');
                                setTimeout(() => setCopiedItemUrl(null), 1500);
                              }}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded text-slate-300 cursor-pointer"
                              title="Copy URL"
                            >
                              {copiedItemUrl === 'fullAudioUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                        {currentEp.heavyMedia?.fullAudioUrl && (
                          <AudioStreamPlayer src={currentEp.heavyMedia.fullAudioUrl} label="fullAudioUrl Stream" />
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="truncate">
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">coercedLoveAudioUrl</span>
                            <span className="text-emerald-400 truncate block text-[11px]">
                              {currentEp.heavyMedia?.coercedLoveAudioUrl || 'Not configured'}
                            </span>
                          </div>
                          {currentEp.heavyMedia?.coercedLoveAudioUrl && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(currentEp.heavyMedia!.coercedLoveAudioUrl!);
                                setCopiedItemUrl('coercedLoveAudioUrl');
                                setTimeout(() => setCopiedItemUrl(null), 1500);
                              }}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded text-slate-300 cursor-pointer"
                              title="Copy URL"
                            >
                              {copiedItemUrl === 'coercedLoveAudioUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                        {currentEp.heavyMedia?.coercedLoveAudioUrl && (
                          <AudioStreamPlayer src={currentEp.heavyMedia.coercedLoveAudioUrl} label="coercedLoveAudioUrl Stream" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Committed Media Registry */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                    Committed Media Registry Log
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{registryHistory.length} files logged</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                {registryHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-200 font-bold truncate">{item.fileName}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          item.storageType === 'Vercel Blob CDN'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {item.storageType}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        Episode: {item.episodeId} • {item.size} • {item.timestamp}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.url);
                        setCopiedItemUrl(item.id);
                        setTimeout(() => setCopiedItemUrl(null), 1500);
                      }}
                      className="px-2.5 py-1.5 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors shrink-0 cursor-pointer flex items-center gap-1 text-[11px]"
                    >
                      {copiedItemUrl === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedItemUrl === item.id ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: CREDENTIALS & TOKENS */}
        {activeMainTab === 'credentials' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-amber-500/30 bg-slate-900/80 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider">
                      Integration Credentials & API Tokens
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configure GitHub PAT, target repository, and Vercel Blob tokens. Saved automatically to browser storage.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Persisted to LocalStorage
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GitHub Personal Access Token (PAT) */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-amber-300 uppercase font-bold flex items-center gap-1.5">
                      <Github className="w-4 h-4 text-amber-400" />
                      GitHub Personal Access Token (PAT)
                    </label>
                    <button
                      onClick={() => setShowPat(!showPat)}
                      className="text-[11px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1"
                    >
                      {showPat ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPat ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showPat ? 'text' : 'password'}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={githubPat}
                    onChange={(e) => setGithubPat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Required for direct GitHub commits of <code>logos-explorer-manifest.json</code> and markdown transcripts.
                  </p>
                </div>

                {/* Vercel Blob Storage Token */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-cyan-300 uppercase font-bold flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-cyan-400" />
                      Vercel Blob Read/Write Storage Token
                    </label>
                    <button
                      onClick={() => setShowBlobToken(!showBlobToken)}
                      className="text-[11px] font-mono text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1"
                    >
                      {showBlobToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showBlobToken ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showBlobToken ? 'text' : 'password'}
                    placeholder="vercel_blob_rw_xxxxxxxxxxxxxxxx"
                    value={vercelBlobToken}
                    onChange={(e) => setVercelBlobToken(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Enables high-speed client & server uploads for heavy MP3 audio tracks and infographics to Vercel CDN.
                  </p>
                </div>

                {/* Target GitHub Repository */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-mono text-amber-300 uppercase font-bold flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4 text-amber-400" />
                    Target GitHub Repository (owner/repo)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. hermas37/LOGOS-EXPLORER-PWA"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    The GitHub repository where manifests and light markdown assets are stored and synced.
                  </p>
                </div>

                {/* Git Branch */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-mono text-amber-300 uppercase font-bold flex items-center gap-1.5">
                    <GitBranch className="w-4 h-4 text-amber-400" />
                    Target Git Branch
                  </label>
                  <input
                    type="text"
                    placeholder="main"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Branch to target for commits (defaults to <code>main</code>).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/20 text-xs font-mono text-slate-300 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Tokens are stored client-side in browser storage. Never committed to public code.</span>
                </div>
                <button
                  onClick={() => {
                    setSyncSuccessMessage('Credentials successfully saved to browser local storage!');
                    setTimeout(() => setSyncSuccessMessage(null), 2500);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold uppercase shrink-0 cursor-pointer"
                >
                  Confirm Credentials
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: GEMINI NOTEBOOK STUDIO */}
        {activeMainTab === 'notebook' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl border border-purple-500/30 bg-slate-900/80 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider flex items-center gap-2">
                      <span>Gemini Notebook LM & AI Prompt Studio</span>
                      <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40 font-bold">
                        Gemini 2.5
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Download pre-configured NotebookLM Python Jupyter notebooks, copy exegesis prompts, and upload generated assets.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadNotebook}
                    className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-purple-950/40 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Notebook (.ipynb)</span>
                  </button>

                  <button
                    onClick={handleCopyNotebookPrompt}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    {notebookPromptCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
                    <span>{notebookPromptCopied ? 'Prompt Copied!' : 'Copy System Prompt'}</span>
                  </button>
                </div>
              </div>

              {/* Notebook Studio Workflow Overview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/20 space-y-2">
                  <span className="text-xs font-mono text-purple-300 font-bold uppercase flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-purple-400" />
                    1. Download Jupyter Notebook
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Obtain <code>Logos_Explorer_NotebookLM_Studio.ipynb</code> pre-loaded with the Google GenAI SDK and scripture exegesis prompts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/20 space-y-2">
                  <span className="text-xs font-mono text-amber-300 font-bold uppercase flex items-center gap-1.5">
                    <Github className="w-4 h-4 text-amber-400" />
                    2. Sync Transcripts to GitHub
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Export markdown transcripts and exegesis studies, then upload them directly to your GitHub repo target directory.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/20 space-y-2">
                  <span className="text-xs font-mono text-cyan-300 font-bold uppercase flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-cyan-400" />
                    3. Deploy Heavy Audio to Blob
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Upload multi-person deep dive audio recordings and infographics to Vercel Blob CDN for high-speed streaming.
                  </p>
                </div>
              </div>

              {/* Direct Asset Upload Area for Notebook Studio */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FolderUp className="w-4 h-4 text-purple-400" />
                  <span>Direct Gemini Output Asset Ingestion</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Select an episode below to link light text files (.md transcripts) or heavy media (.mp3 deep dives) produced by Gemini.
                </p>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-mono text-slate-400 uppercase">Target Episode:</label>
                  <select
                    value={activeEpId}
                    onChange={(e) => setActiveEpId(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-amber-300 font-mono text-xs font-bold rounded-xl p-2.5 focus:outline-none focus:border-purple-500"
                  >
                    {manifests.map((m, i) => (
                      <option key={m.episodeId} value={m.episodeId}>
                        EP {m.episodeNumber || i + 1}: {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DEPLOYMENT STATUS */}
        {activeMainTab === 'deployment' && (
          <div className="space-y-6">
            {/* Live Sync Status Banner */}
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-slate-900/80 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <Terminal className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 uppercase font-mono tracking-wider flex items-center gap-2">
                      <span>Live Deployment & Manifest Sync Status</span>
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                        Production
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">PWA Manifest endpoint synchronization and live system logs</p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    setIsSyncing(true);
                    await syncWithGithubDirectly(manifests);
                    setIsSyncing(false);
                    setSyncSuccessMessage('GitHub Manifest repository synced successfully!');
                    setTimeout(() => setSyncSuccessMessage(null), 3000);
                  }}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-emerald-950/40"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Push Sync to GitHub</span>
                </button>
              </div>

              {/* Status Grid Cards with Git Branch and Vercel Build Timestamp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                      <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                      Git Branch
                    </span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                      ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={gitBranch}
                      onChange={(e) => setGitBranch(e.target.value)}
                      className="text-xs font-mono font-bold text-amber-300 bg-slate-900 border border-slate-800 px-2 py-1 rounded w-full focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono pt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Connected & Synced
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      Last Successful Build
                    </span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-cyan-300 truncate">{lastVercelBuildTime}</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono pt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Vercel Edge Live
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 shadow-sm">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Github className="w-3.5 h-3.5 text-slate-300" />
                    GitHub Target Repo
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-200 truncate">{githubRepo}</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono pt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Push Permission
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 shadow-sm">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    Manifest File
                  </span>
                  <p className="text-xs font-mono font-bold text-emerald-300 truncate">logos-explorer-manifest.json</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono pt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Auto-Injected
                  </p>
                </div>
              </div>
            </div>

            {/* API Credentials Configuration Panel */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                    API Credentials & Token Overrides
                  </h4>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">GitHub Access Token</label>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={githubPat}
                    onChange={(e) => setGithubPat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Vercel Blob Storage Token</label>
                  <input
                    type="password"
                    placeholder="vercel_blob_rw_xxxxxxxx"
                    value={vercelBlobToken}
                    onChange={(e) => setVercelBlobToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">GitHub Target Repo</label>
                  <input
                    type="text"
                    placeholder="username/repo"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Operations Guide Card */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                    Deployment Lifecycle Operations Guide
                  </h4>
                </div>
                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono text-xs font-bold cursor-pointer"
                >
                  Open Guide Modal
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Refer to the Mountaintop Operations Guide for detailed explanations of light vs heavy asset pipelines, manifest scheme re-ordering, and live client propagation.
              </p>
            </div>

            {/* Real-time Oversee Console Stream */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-2 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <div className="flex items-center gap-2 text-slate-400">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-300">Live Oversee Stream Logs</span>
                </div>
                <button
                  onClick={() => setConsoleLogs(['System: Console logs cleared.'])}
                  className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar text-[11px] text-slate-400">
                {consoleLogs.map((log, i) => (
                  <p key={i} className="leading-tight">{log}</p>
                ))}
              </div>
            </div>

            {/* Live Manifest JSON Payload Inspector */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-300">
                    Live Manifest JSON Payload Inspector ({manifests.length} Episodes)
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(manifests, null, 2));
                    setSyncSuccessMessage('Manifest JSON payload copied to clipboard!');
                    setTimeout(() => setSyncSuccessMessage(null), 2500);
                  }}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-[10px] cursor-pointer flex items-center gap-1 font-bold"
                >
                  <Copy className="w-3 h-3 text-cyan-400" />
                  <span>Copy Payload JSON</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900/80 rounded-xl border border-slate-850 text-[10px] text-amber-200/90 max-h-48 overflow-y-auto custom-scrollbar leading-relaxed">
                {JSON.stringify(manifests, null, 2)}
              </pre>
            </div>
          </div>
        )}

      </div>

      {/* CREATE NEW EPISODE ENTRY MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FilePlus className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-100 uppercase font-mono">
                    Create New Episode Entry
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateEpisode} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase block">Episode Identifier (episodeId)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. episode-4"
                    value={newEpData.episodeId}
                    onChange={(e) => setNewEpData({ ...newEpData, episodeId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase block">Episode Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. The Word in Genesis & Logos"
                    value={newEpData.title}
                    onChange={(e) => setNewEpData({ ...newEpData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase block">Subtitle / Exegesis Focus</label>
                  <input
                    type="text"
                    placeholder="e.g. Johannine Cosmogony & Pre-existence"
                    value={newEpData.subtitle}
                    onChange={(e) => setNewEpData({ ...newEpData, subtitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase block">Sequence Order Number</label>
                  <input
                    type="number"
                    required
                    value={newEpData.episodeNumber}
                    onChange={(e) => setNewEpData({ ...newEpData, episodeNumber: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs font-bold uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-amber-950/40"
                  >
                    Create Episode
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE EPISODE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteConfirmEpId && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-rose-400">
                  <Trash2 className="w-5 h-5" />
                  <h3 className="font-bold text-sm uppercase font-mono">
                    Confirm Episode Deletion
                  </h3>
                </div>
                <button
                  onClick={() => setDeleteConfirmEpId(null)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-200">
                  Are you sure you want to delete episode <code className="text-amber-300 font-mono font-bold">{deleteConfirmEpId}</code>?
                </p>
                <p className="text-slate-400 text-[11px]">
                  This will remove the episode entry from the live manifest array and re-index the sequence progression numbers.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmEpId(null)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteEpisode(deleteConfirmEpId)}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-rose-950/40"
                >
                  Delete Episode
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OPERATIONS GUIDE OVERLAY MODAL */}
      <AnimatePresence>
        {isGuideOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-100 uppercase font-mono">
                    Mountaintop Admin Operations Guide
                  </h3>
                </div>
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Guide Navigation Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono overflow-x-auto">
                <button
                  onClick={() => setGuideTab('episodes')}
                  className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                    guideTab === 'episodes' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1. Creating Episodes
                </button>
                <button
                  onClick={() => setGuideTab('orders')}
                  className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                    guideTab === 'orders' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2. Managing Order
                </button>
                <button
                  onClick={() => setGuideTab('blob')}
                  className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                    guideTab === 'blob' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  3. Light vs Heavy Media
                </button>
                <button
                  onClick={() => setGuideTab('sync')}
                  className={`px-3 py-1.5 rounded-lg shrink-0 transition-all cursor-pointer font-bold ${
                    guideTab === 'sync' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  4. PWA Live Sync
                </button>
              </div>

              {/* Tab Content 1: Creating Episodes */}
              {guideTab === 'episodes' && (
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-mono text-amber-400 font-bold block uppercase text-[11px]">
                      🚀 Step 1: Initialize New Episode Schema
                    </span>
                    <p className="text-slate-300">
                      Click the <strong>+ Create Episode</strong> button in the top navbar or workflow panel. Enter the unique <code>episodeId</code> (e.g., <code>episode-4</code>), Title, Subtitle, and initial sequence number.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
                    <span className="text-slate-400 uppercase font-bold block">Generated Manifest Item Schema:</span>
                    <pre className="text-amber-200 bg-slate-900 p-2.5 rounded border border-slate-850 overflow-x-auto">
{`{
  "episodeId": "episode-4",
  "title": "Logos in Timeless Cosmogony",
  "subtitle": "Johannine Exegesis",
  "episodeNumber": 4,
  "transcriptUrl": "",
  "heavyMedia": { "fullAudioUrl": "", "coercedLoveAudioUrl": "" }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Managing Order */}
              {guideTab === 'orders' && (
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-mono text-amber-400 font-bold block uppercase text-[11px]">
                      🔢 Step 2: Reordering Episode Progression
                    </span>
                    <p className="text-slate-300">
                      Use the <strong>↑ (Up)</strong> and <strong>↓ (Down)</strong> controls on each episode's header in Accordion or Tabbed mode to shift sequence position.
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      The console automatically re-indexes <code>episodeNumber</code> values sequentially and commits the reordered array directly to <code>logos-explorer-manifest.json</code> on GitHub.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Content 3: Light vs Heavy Media */}
              {guideTab === 'blob' && (
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                  <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/30 space-y-1">
                    <span className="font-mono text-amber-400 font-bold block uppercase text-[11px]">
                      1. Light Metadata Pipeline (GitHub Repository)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Syncs titles, subtitles, raw Markdown transcripts (<code>.md</code>), and JSON structures directly to the GitHub repo. Ideal for fast, version-controlled text assets.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-1">
                    <span className="font-mono text-cyan-400 font-bold block uppercase text-[11px]">
                      2. Heavy Media Pipeline (Vercel Blob CDN)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Deploys high-capacity MP3 deep dives, forced love audio, vector infographics, and production spreadsheets to Vercel Blob CDN with low latency.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Content 4: PWA Live Sync */}
              {guideTab === 'sync' && (
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                    <span className="font-mono text-emerald-400 font-bold block uppercase text-[11px]">
                      ⚡ Step 4: Live PWA Sync Engine
                    </span>
                    <p className="text-slate-300">
                      When changes are saved or media files uploaded, the console commits <code>logos-explorer-manifest.json</code> to GitHub or hot-injects CDN links.
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      The PWA client dynamically fetches <code>/api/episodes</code> or fallback manifest, delivering immediate updates to all end users without app re-installation.
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsGuideOpen(false)}
                className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-amber-400"
              >
                Close Operations Guide
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
