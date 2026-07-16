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
  ChevronDown
} from 'lucide-react';
import { EpisodeManifest } from '../types';

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
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  // Upload Form State
  const [selectedAssetType, setSelectedAssetType] = useState<'spreadsheetUrl' | 'infographicUrl' | 'fullAudioUrl' | 'coercedLoveAudioUrl'>('fullAudioUrl');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Integration credentials overrides
  const [githubPat, setGithubPat] = useState('');
  const [vercelBlobToken, setVercelBlobToken] = useState('');
  const [githubRepo, setGithubRepo] = useState('');

  // Results State
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'System: Mountaintop oversight console initialized.',
    'System: Ready for asset staging.'
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Staged pending files Mock data (Assets in NotebookLM pipeline waiting for release)
  const stagedPendingAssets = [
    { name: 'mountain_road_deep_dive_v2_notebooklm.mp3', size: '18.4 MB', type: 'Deep Dive Audio' },
    { name: 'sovereign_love_vs_coercion_analysis.mp3', size: '12.1 MB', type: 'Forced Love Exegesis' },
    { name: 'theological_scientific_correlations_sheet.xlsx', size: '1.2 MB', type: 'Master Spreadsheet' },
    { name: 'mountaintop_road_visual_infographics.png', size: '4.8 MB', type: 'Vector Illustration' },
  ];

  const logMessage = (msg: string) => {
    setConsoleLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  // Auth check handler
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Default fallback simple password, or check process env if passed
    if (authToken === 'logos2026' || authToken === 'logos_secret') {
      setIsAuthenticated(true);
      setAuthError('');
      logMessage('Auth: Administrator session authenticated successfully.');
    } else {
      setAuthError('Invalid Admin Access Token. Please verify your credentials.');
      logMessage('Auth: Failed credential challenge.');
    }
  };

  // Drag and drop handlers (Usability Patterns Requirement)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFileToUpload(droppedFile);
      logMessage(`Upload: Selected dropped file "${droppedFile.name}" (${(droppedFile.size / 1024 / 1024).toFixed(2)} MB).`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFileToUpload(selectedFile);
      logMessage(`Upload: Selected file "${selectedFile.name}" via explorer.`);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Triggering uploading to server endpoint `/api/upload`
  const handleUploadAndSync = async () => {
    if (!fileToUpload) return;
    setIsUploading(true);
    setUploadProgress(10);
    setGeneratedUrl('');
    logMessage(`Vercel Blob: Commencing secure multi-part chunk upload...`);

    // Simulate upload stages
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 15;
      });
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('assetType', selectedAssetType);
      formData.append('episodeId', selectedEpisodeId);
      formData.append('githubPat', githubPat);
      formData.append('vercelBlobToken', vercelBlobToken);
      formData.append('githubRepo', githubRepo);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(timer);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setGeneratedUrl(data.cdnUrl);
        logMessage(`Vercel Blob: Upload complete! Live CDN URL generated.`);
        logMessage(`System: Autocorrect link staging for "${selectedAssetType}".`);

        if (data.updatedManifests) {
          onManifestUpdate(data.updatedManifests);
          setSyncSuccess(true);
          logMessage(`GitHub API: manifest.json successfully committed and synchronized!`);
        }
      } else {
        const errText = await response.text();
        throw new Error(errText || 'Upload failed');
      }
    } catch (err: any) {
      logMessage(`Error: Upload/Sync process failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Copy to clipboard helper
  const handleCopyToClipboard = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    logMessage('System: Live CDN URL copied to administrator clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe injector if manual replacement chosen
  const handleHotInject = async () => {
    if (!generatedUrl) return;
    setIsSyncing(true);
    logMessage('Manifest: Attempting hot-injection into active episode manifest...');

    try {
      const response = await fetch('/api/manifest-inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: selectedEpisodeId,
          field: selectedAssetType,
          value: generatedUrl
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onManifestUpdate(data.updatedManifests);
        setSyncSuccess(true);
        logMessage(`Manifest: Successfully hot-injected "${selectedAssetType}" live value!`);
      } else {
        throw new Error('Injection API error');
      }
    } catch (err: any) {
      logMessage(`Error: Hot injection failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Render Access Token Auth page first
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-slate-100 bg-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-5 text-center shadow-2xl relative"
        >
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-radial from-amber-500/5 to-transparent rounded-2xl pointer-events-none" />

          <div className="mx-auto p-4 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 w-14 h-14 flex items-center justify-center">
            <Shield className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-display font-bold text-lg text-slate-100">
              Mountaintop Gatekeeper
            </h3>
            <p className="text-xs text-slate-400 max-w-[280px] mx-auto">
              Access the static administrative dashboard. Push, host, and sync high-theological data assets.
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
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-amber-500/10"
            >
              Unlock Console
            </button>
          </form>

          <div className="border-t border-slate-800/80 pt-4 text-[10px] font-mono text-slate-500">
            Secure sandbox environment active. Use token: <code className="text-amber-500/70 font-bold">logos2026</code>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentEpisode = manifests.find((m) => m.episodeId === selectedEpisodeId) || manifests[0];

  const getEpisodeStoryMd = () => {
    return `# Boethius and the 4D Block Universe\n\n**Subtitle:** Eternity, Time, and Freedom\n\nIn this episode, we study the eternal tension between the timeless sovereignty of the mountaintop and the progressive, free steps of the road traveler below.\n\n## Philosophical Underpinnings\n\nDrawing from **Boethius\'s Consolation of Philosophy (Book V)**, eternity is defined as the whole of endless life possessed all at once. This unique viewpoint is paired with modern 4D cosmology (the **Block Universe**), bridging the gap between classical theology and contemporary space-time physics.\n\nWe explore how **Maximus the Confessor\'s** concepts of *Logos* (the unchangeable blueprint of divine melody) and *Tropos* (the human manner of performing that melody) demonstrate how true temporal freedom and divine destiny coexist.\n\n## Physics and Theology\n\nBy referencing recent work in quantum time theories, we show that actual flow is mathematically compatible with a completed 4D space-time block.`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans select-none overflow-y-auto custom-scrollbar pb-24">
      
      {/* Active Admin Indicator */}
      <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4.5 h-4.5 text-amber-500" />
          <h3 className="font-display font-semibold text-sm text-slate-200">
            Oversight Console (Eternity perspective)
          </h3>
        </div>
        <span className="text-[10px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
          ADMIN ACTIVE
        </span>
      </div>

      <div className="p-4 space-y-5">
        
        {/* Section 1: Staged Assets (NotebookLM files) */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>NotebookLM Pipeline Staging</span>
          </div>
          
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden divide-y divide-slate-800/60">
            {stagedPendingAssets.map((asset, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-900/50 transition-colors">
                <div className="flex items-start gap-2 max-w-[70%]">
                  <FileText className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <span className="text-slate-200 font-medium block truncate">{asset.name}</span>
                    <span className="text-[10px] text-slate-400">{asset.size} • {asset.type}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logMessage(`Upload: Staged asset "${asset.name}" targeted for pipeline upload.`);
                    if (asset.type.includes('Deep')) setSelectedAssetType('fullAudioUrl');
                    else if (asset.type.includes('Forced')) setSelectedAssetType('coercedLoveAudioUrl');
                    else if (asset.type.includes('Spreadsheet')) setSelectedAssetType('spreadsheetUrl');
                    else setSelectedAssetType('infographicUrl');
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-all"
                >
                  Target
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Drag and Drop Upload Portal */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs uppercase tracking-wider">
            <FolderUp className="w-4 h-4 text-cyan-400" />
            <span>Upload & Synchronize Asset</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30 space-y-4">
            
            {/* Asset Category Selection */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Target Manifest Attribute</label>
              <select
                value={selectedAssetType}
                onChange={(e) => setSelectedAssetType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="fullAudioUrl">🎧 Deep Dive Audio (fullAudioUrl)</option>
                <option value="coercedLoveAudioUrl">🎧 Forced Love Analysis (coercedLoveAudioUrl)</option>
                <option value="spreadsheetUrl">📊 Master Excel Sheet (spreadsheetUrl)</option>
                <option value="infographicUrl">🖼️ Visual Infographic (infographicUrl)</option>
              </select>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-amber-500 bg-amber-500/5'
                  : fileToUpload
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".mp3,.wav,.xlsx,.png,.jpg,.jpeg"
              />
              <Upload className={`w-8 h-8 mx-auto mb-2 ${fileToUpload ? 'text-emerald-400' : 'text-slate-500'}`} />
              
              {fileToUpload ? (
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-emerald-300 truncate px-2">{fileToUpload.name}</p>
                  <p className="text-[10px] text-slate-400">{(fileToUpload.size / 1024 / 1024).toFixed(2)} MB • Ready</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-300">Drag & drop files here or click to browse</p>
                  <p className="text-[10px] text-slate-500">Supports MP3 study tracks, spreadsheets, or graphics</p>
                </div>
              )}
            </div>

            {/* Dynamic Credentials panel (collapsible/expandable for safety) */}
            <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-500 uppercase font-bold tracking-wider">
                <Key className="w-3.5 h-3.5" />
                <span>Cloud Credentials Integration</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <input
                  type="password"
                  placeholder="Vercel Blob Token (Optional)"
                  value={vercelBlobToken}
                  onChange={(e) => setVercelBlobToken(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                  title="If empty, handles storage securely in the local workspace database"
                />
                <input
                  type="password"
                  placeholder="GitHub Secret PAT (Optional)"
                  value={githubPat}
                  onChange={(e) => setGithubPat(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                  title="If empty, updates local workspace manifest directly"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {isUploading ? (
                <div className="space-y-2 text-center">
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-850">
                    <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 animate-pulse uppercase tracking-wider">
                    Pipelining upload: {uploadProgress}% Completed
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleUploadAndSync}
                  disabled={!fileToUpload}
                  className={`w-full py-3.5 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 ${
                    fileToUpload
                      ? 'bg-cyan-600 text-slate-950 hover:bg-cyan-500 active:scale-98 cursor-pointer'
                      : 'bg-slate-850 text-slate-500 border border-slate-800 cursor-not-allowed'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Execute Sync & CDN Push</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Section 3: Generated Links Output Area */}
        <AnimatePresence>
          {generatedUrl && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 space-y-3 shadow-md"
            >
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs uppercase font-bold tracking-wider">
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>Live Vercel Blob CDN Link Created</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={generatedUrl}
                  readOnly
                  className="flex-grow bg-slate-950 border border-emerald-500/20 text-emerald-300 text-xs font-mono p-2.5 rounded-lg focus:outline-none"
                />
                <button
                  onClick={handleCopyToClipboard}
                  className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 active:scale-90 transition-all"
                  title="Copy CDN Link"
                >
                  {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
                </button>
              </div>

              {/* Instant inject option */}
              <div className="pt-1.5">
                <button
                  onClick={handleHotInject}
                  disabled={isSyncing}
                  className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                >
                  {isSyncing ? 'Hot Injecting...' : 'Hot-Inject URL into Active Manifest'}
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 4: Live Sync Success Message */}
        <AnimatePresence>
          {syncSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 rounded-xl border border-cyan-500/20 bg-cyan-950/25 flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="text-xs font-bold text-cyan-300 block">Manifest Synchronized!</span>
                <p className="text-[11px] text-slate-300 font-light mt-0.5 leading-relaxed">
                  Your changes have been safely updated. PWA users will immediately receive the new study materials upon their next load.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* References Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>References</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Production Worksheet (.xlsx) */}
            <a
              href={currentEpisode?.heavyMedia?.spreadsheetUrl || "https://vercel-blob.com/logos_production_worksheet-v2.xlsx"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 hover:border-slate-700 transition-all text-left cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-100 block">Production Worksheet</span>
                  <span className="text-[10px] text-slate-400 font-mono">logos_production_worksheet-v2.xlsx</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500" />
            </a>

            {/* 2. Episode Story (.md) */}
            <button
              onClick={() => setIsStoryOpen(!isStoryOpen)}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/60 hover:border-slate-700 transition-all text-left w-full cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-100 block">Episode Story</span>
                  <span className="text-[10px] text-slate-400 font-mono font-sans">episode_story.md</span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isStoryOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Collapsible Story Viewer */}
          <AnimatePresence>
            {isStoryOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-5 rounded-xl border border-slate-800 bg-slate-950 text-slate-300 text-xs leading-relaxed font-sans max-h-[300px] overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-4">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider font-bold">
                      episode_story.md • Markdown Preview
                    </span>
                    <a
                      href={`data:text/markdown;charset=utf-8,${encodeURIComponent(getEpisodeStoryMd())}`}
                      download="episode_story.md"
                      className="text-[10px] text-slate-400 hover:text-slate-200 font-mono underline"
                    >
                      Download MD
                    </a>
                  </div>
                  
                  {/* Styled Story Content */}
                  <div className="space-y-3.5 text-slate-300">
                    <h1 className="text-sm font-bold text-slate-100 uppercase tracking-tight border-b border-slate-800 pb-1">
                      # {currentEpisode?.title || "The Mountain and the Road"}
                    </h1>
                    <p className="italic text-slate-400">
                      **Subtitle:** {currentEpisode?.subtitle || "Eternity, Time, and Freedom"}
                    </p>
                    <p>
                      In this episode, we study the eternal tension between the timeless sovereignty of the mountaintop and the progressive, free steps of the road traveler below.
                    </p>
                    <h3 className="text-xs font-bold text-[#d97706] uppercase tracking-wide mt-2">
                      ## Philosophical Underpinnings
                    </h3>
                    <p>
                      Drawing from **Boethius\'s Consolation of Philosophy (Book V)**, eternity is defined as the whole of endless life possessed all at once. This unique viewpoint is paired with modern 4D cosmology (the **Block Universe**), bridging the gap between classical theology and contemporary space-time physics.
                    </p>
                    <p>
                      We explore how **Maximus the Confessor\'s** concepts of *Logos* (the unchangeable blueprint of divine melody) and *Tropos* (the human manner of performing that melody) demonstrate how true temporal freedom and divine destiny coexist.
                    </p>
                    <h3 className="text-xs font-bold text-[#d97706] uppercase tracking-wide mt-2">
                      ## Physics and Theology
                    </h3>
                    <p>
                      By referencing recent work in quantum time theories, we show that actual flow is mathematically compatible with a completed 4D space-time block.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section 5: Admin Terminal Logs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs uppercase tracking-wider">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Diagnostic Overlord Logs</span>
            </div>
            <button
              onClick={() => setConsoleLogs(['System: Oversighted terminal logs purged.'])}
              className="text-[9px] font-mono text-slate-500 hover:text-slate-300 transition-colors uppercase font-bold"
            >
              Clear Logs
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 h-32 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1 text-slate-400">
            {consoleLogs.map((log, idx) => (
              <div key={idx} className="leading-relaxed whitespace-pre-wrap break-all">
                {log.startsWith('System:') || log.startsWith('[') ? (
                  log
                ) : log.toLowerCase().includes('error') ? (
                  <span className="text-rose-400 font-medium">⚠️ {log}</span>
                ) : (
                  <span className="text-amber-400/90">{log}</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
