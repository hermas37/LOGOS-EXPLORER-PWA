import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Shield, ShieldAlert, Sparkles, Compass, Cpu, HelpCircle, Activity } from 'lucide-react';
import { EpisodeManifest } from './types';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [dashboard, setDashboard] = useState<'user' | 'admin'>('user');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState('episode-1');
  const [selectedStudyId, setSelectedStudyId] = useState('script');
  
  // Manifest lists state
  const [manifests, setManifests] = useState<EpisodeManifest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch manifests from server API
  const fetchManifests = async () => {
    try {
      const response = await fetch('/api/episodes');
      if (response.ok) {
        const data = await response.json();
        setManifests(data);
      } else {
        throw new Error('Failed to fetch manifests from backend');
      }
    } catch (err: any) {
      console.warn('API error, falling back to static backup manifest:', err);
      // Fallback fallback if API is not yet running
      try {
        const localResponse = await fetch('/logos-explorer-manifest.json');
        if (localResponse.ok) {
          const data = await localResponse.json();
          setManifests(data);
        } else {
          setErrorMessage('Database error: Unable to load manifest backup.');
        }
      } catch (localErr: any) {
        setErrorMessage('Severe database error: No manifest available.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManifests();
  }, []);

  // Handler for administrative updates
  const handleManifestUpdate = (updatedManifests: EpisodeManifest[]) => {
    setManifests(updatedManifests);
  };

  const currentEpisode = manifests.find((m) => m.episodeId === selectedEpisodeId) || manifests[0];

  return (
    <div className="min-h-screen w-screen bg-[#020617] flex items-center justify-center relative overflow-hidden font-sans select-none antialiased">
      
      {/* Blurred Backdrop Elements */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-[#1e293b] rounded-full blur-[120px] opacity-40 pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#0f172a] rounded-full blur-[120px] opacity-60 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#d97706] rounded-full blur-[200px] opacity-10 pointer-events-none"></div>

      {/* 9:16 MOBILE VIEWPORT HARNESS */}
      <div 
        id="pwa-frame-wrapper"
        className="relative w-full max-w-[432px] h-[100dvh] md:h-[768px] bg-[#0f172a] shadow-2xl border-x border-slate-800 flex flex-col z-10 md:rounded-3xl overflow-hidden"
      >
        {/* TOP GLASSMORPHISM APP BAR */}
        <header className="shrink-0 px-6 pt-7 pb-6 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-black tracking-[0.25em] text-[#d97706] uppercase" style={{ fontFamily: '"Arial Black", "Arial Bold", Gadget, sans-serif' }}>LOGOS-EXPLORER</h1>
            <p className="text-[13px] md:text-sm font-extrabold text-white leading-relaxed mt-2.5 max-w-[340px]">
              Exploring Johannine Logos, the cosmic logic<br />transmitting Beauty & Wonder,<br />Purpose and Love.
            </p>
            <div className="mt-5 pt-4 border-t border-white/5 w-full">
              <p className="text-[11px] font-bold text-slate-300 leading-relaxed max-w-[360px] mx-auto uppercase tracking-wide">
                <span className="text-amber-500 font-extrabold">GUIDE:</span> FOLLOW THE SEQUENCE BELOW
              </p>
            </div>
          </div>
        </header>

        {/* STUDY STAGE & CONTROLLER CORE */}
        <main className="flex-grow overflow-hidden bg-[#0f172a] relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 p-6 bg-[#0f172a]">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-amber-500 animate-spin" />
                <Compass className="w-5 h-5 text-amber-500 absolute animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                  Loading study manifest
                </span>
                <p className="text-[10px] text-slate-500 italic">
                  Aligning linear coordinates with the timeless now...
                </p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-[#0f172a] space-y-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-200">Database Access Fail</h4>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={fetchManifests}
                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-mono text-slate-200 transition-colors"
              >
                Retry Database Query
              </button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {dashboard === 'user' ? (
                <motion.div
                  key="user-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <UserDashboard
                    manifests={manifests}
                    selectedEpisodeId={selectedEpisodeId}
                    setSelectedEpisodeId={setSelectedEpisodeId}
                    selectedStudyId={selectedStudyId}
                    setSelectedStudyId={setSelectedStudyId}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="admin-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full"
                >
                  <AdminDashboard
                    manifests={manifests}
                    onManifestUpdate={handleManifestUpdate}
                    selectedEpisodeId={selectedEpisodeId}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>

        {/* NAVIGATION: BOTTOM BAR */}
        <footer className="shrink-0 h-20 bg-slate-900/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-8">
          <button
            onClick={() => setDashboard('user')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              dashboard === 'user' ? 'opacity-100' : 'opacity-40 hover:opacity-75'
            }`}
          >
            <div className={`w-1 h-1 rounded-full mb-1 transition-all ${dashboard === 'user' ? 'bg-[#d97706]' : 'bg-transparent'}`}></div>
            <BookOpen className={`w-6 h-6 transition-all ${dashboard === 'user' ? 'text-[#d97706]' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold ${dashboard === 'user' ? 'text-[#d97706]' : 'text-slate-400'}`}>STUDY</span>
          </button>

          <button
            onClick={() => setDashboard('admin')}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              dashboard === 'admin' ? 'opacity-100' : 'opacity-40 hover:opacity-75'
            }`}
          >
            <div className={`w-1 h-1 rounded-full mb-1 transition-all ${dashboard === 'admin' ? 'bg-[#d97706]' : 'bg-transparent'}`}></div>
            <Shield className={`w-6 h-6 transition-all ${dashboard === 'admin' ? 'text-[#d97706]' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold ${dashboard === 'admin' ? 'text-slate-400' : 'text-slate-400'}`}>ADMIN</span>
          </button>
        </footer>

      </div>

      {/* Helper Contextual Info (Outside Mobile Frame) */}
      <div className="absolute left-12 top-1/2 -translate-y-1/2 hidden xl:block w-48 space-y-6">
        <div className="border-l-2 border-[#d97706] pl-4">
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">Vantage Point</p>
          <h3 className="text-slate-100 text-sm font-medium italic">The Road Traveler</h3>
        </div>
        <p className="text-slate-500 text-xs leading-relaxed">9:16 mobile container optimized for hand-held theological study and deep reflection.</p>
      </div>
      
      <div className="absolute right-12 top-1/2 -translate-y-1/2 hidden xl:block w-48">
        <div className="border-r-2 border-slate-700 pr-4 text-right">
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">System State</p>
          <h3 className="text-slate-100 text-sm font-medium tracking-tight">Production: Active</h3>
        </div>
      </div>

    </div>
  );
}
