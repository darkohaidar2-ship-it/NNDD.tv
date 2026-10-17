import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import PermissionsWorkspace from './components/PermissionsWorkspace';
import SimulationSandboxModal from './components/SimulationSandboxModal';
import KurdLocalTvApp from './components/KurdLocalTvApp';
import StrategicReportModal from './components/StrategicReportModal';
import InstallAppModal from './components/InstallAppModal';
import { INITIAL_USERS, INITIAL_PERMISSIONS, CHANNELS_DATA, INITIAL_ACTIVATION_REQUESTS } from './data/mockData';
import { getCurrentFont, applyFontToDocument } from './data/fonts';
import { getAllRequests } from './data/deviceManager';
import { 
  Tv, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  Users, 
  CheckCircle2, 
  Info, 
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Monitor,
  LayoutDashboard,
  HelpCircle,
  Maximize2,
  Download
} from 'lucide-react';

export default function App() {
  // Intelligent Device & Mode Detection
  const isCapacitor = Capacitor.isNativePlatform() || (
    typeof window !== 'undefined' && (
      window.Capacitor !== undefined ||
      window.location.protocol === 'capacitor:' ||
      (window.location.hostname === 'localhost' && (!window.location.port || window.location.port === ''))
    )
  );

  // Robust function to detect if URL explicitly requested Admin Panel
  // Supports: /Adm1n_pan0l, /adm1n_pan0l, /admin, /permissions, #Adm1n_pan0l, #admin, ?mode=admin, ?Adm1n_pan0l
  const checkIsAdminUrl = () => {
    if (typeof window === 'undefined') return false;
    try {
      const href = (window.location.href || '').toLowerCase();
      const path = (window.location.pathname || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      const fullUrl = `${href} ${path} ${search} ${hash}`;
      const params = new URLSearchParams(window.location.search);

      // 1. If explicitly requested ?mode=tv without secret keywords, stay in TV mode
      if (params.get('mode') === 'tv' && !fullUrl.includes('adm1n') && !fullUrl.includes('pan0l')) {
        try { sessionStorage.removeItem('nndd_admin_active'); } catch (e) {}
        return false;
      }

      // 2. Check session storage if previously unlocked in this tab
      try {
        if (sessionStorage.getItem('nndd_admin_active') === 'true') {
          return true;
        }
      } catch (e) {}

      // 3. Direct Secret Admin Entrance requested by user: Adm1n_pan0l (and variations)
      const matchesAdmin = 
        fullUrl.includes('adm1n') || 
        fullUrl.includes('pan0l') || 
        fullUrl.includes('panol') || 
        fullUrl.includes('admin') || 
        fullUrl.includes('permission');

      if (matchesAdmin) {
        try { sessionStorage.setItem('nndd_admin_active', 'true'); } catch (e) {}
        return true;
      }
    } catch (e) {}
    return false;
  };

  const initialMode = checkIsAdminUrl() ? 'permissions' : 'tv';

  // Navigation mode: 'permissions' | 'tv'
  const [viewMode, setViewMode] = useState(initialMode);

  // Sync mode with URL hash / popstate / pathname changes dynamically
  useEffect(() => {
    if (checkIsAdminUrl()) {
      setViewMode('permissions');
    }

    const handleUrlChange = () => {
      if (checkIsAdminUrl()) {
        setViewMode('permissions');
      } else {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'tv') {
          setViewMode('tv');
        }
      }
    };

    // Fast watcher interval (200ms) to immediately catch any URL changes
    const interval = setInterval(() => {
      if (checkIsAdminUrl()) {
        setViewMode(prev => (prev !== 'permissions' ? 'permissions' : prev));
      }
    }, 200);

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Keyboard shortcut: In web browser, pressing 'A' or 'a' opens Admin
  useEffect(() => {
    if (isCapacitor) return;
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'a' || e.key === 'A') {
        if (viewMode === 'tv') {
          switchMode('permissions');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, isCapacitor]);
  
  // Data State
  const [users, setUsers] = useState(INITIAL_USERS);
  const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
  const [currentUserId, setCurrentUserId] = useState(() => {
    try {
      const stored = localStorage.getItem('nndd_current_user_id');
      if (stored) return stored;
    } catch(e) {}
    return 'usr-free-client';
  });
  const [activationRequests, setActivationRequests] = useState(() => getAllRequests(INITIAL_ACTIVATION_REQUESTS));
  const [channels, setChannels] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_channels');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return CHANNELS_DATA;
  });

  // VOD Series & Movies State
  const [vodSeries, setVodSeries] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_vod_series');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [];
  });

  const [vodMovies, setVodMovies] = useState(() => {
    try {
      const cached = localStorage.getItem('nndd_cached_vod_movies');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [];
  });

  // Stale-While-Revalidate (SWR): Always revalidate channels & VOD in the background on launch
  useEffect(() => {
    const fetchRemoteData = async () => {
      try {
        // Fetch fresh channels without caching
        // In Capacitor (native Android), try fetching live remote from Vercel first, fallback to local
        const channelsSources = isCapacitor 
          ? [`https://nndd-tv.vercel.app/channels.json?t=${Date.now()}`, `/channels.json?t=${Date.now()}`]
          : [`/channels.json?t=${Date.now()}`];

        for (const src of channelsSources) {
          try {
            const resCh = await fetch(src, { cache: 'no-store' });
            if (resCh.ok) {
              const data = await resCh.json();
              if (Array.isArray(data) && data.length > 0) {
                const cachedStr = localStorage.getItem('nndd_cached_channels');
                const newStr = JSON.stringify(data);
                if (cachedStr !== newStr) {
                  console.log(`[Channels Sync] Auto-updated ${data.length} channels from ${src}`);
                  setChannels(data);
                  try { localStorage.setItem('nndd_cached_channels', newStr); } catch(e) {}
                }
                break; // Successfully loaded fresh channels
              }
            }
          } catch(err) {}
        }
      } catch(e) {}

      try {
        const vodSources = isCapacitor
          ? [`https://nndd-tv.vercel.app/vod_content.json?t=${Date.now()}`, `/vod_content.json?t=${Date.now()}`]
          : [`/vod_content.json?t=${Date.now()}`];

        for (const src of vodSources) {
          try {
            const resVod = await fetch(src, { cache: 'no-store' });
            if (resVod.ok) {
              const vodData = await resVod.json();
              if (vodData?.series && Array.isArray(vodData.series)) {
                const cachedSeriesStr = localStorage.getItem('nndd_cached_vod_series');
                const newSeriesStr = JSON.stringify(vodData.series);
                if (cachedSeriesStr !== newSeriesStr) {
                  setVodSeries(vodData.series);
                  try { localStorage.setItem('nndd_cached_vod_series', newSeriesStr); } catch(e){}
                }
              }
              if (vodData?.movies && Array.isArray(vodData.movies)) {
                const cachedMoviesStr = localStorage.getItem('nndd_cached_vod_movies');
                const newMoviesStr = JSON.stringify(vodData.movies);
                if (cachedMoviesStr !== newMoviesStr) {
                  setVodMovies(vodData.movies);
                  try { localStorage.setItem('nndd_cached_vod_movies', newMoviesStr); } catch(e){}
                }
              }
              break;
            }
          } catch(err) {}
        }
      } catch(e) {}
    };
    fetchRemoteData();
    window.addEventListener('nndd_config_updated', fetchRemoteData);
    return () => window.removeEventListener('nndd_config_updated', fetchRemoteData);
  }, [isCapacitor]);

  // Modals
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sandboxInitialUser, setSandboxInitialUser] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  // PWA Deferred Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Initialize and apply saved UI font on mount
  useEffect(() => {
    const font = getCurrentFont();
    applyFontToDocument(font.id);
  }, []);

  // Apple Toast Alert State
  const [toast, setToast] = useState(null);

  const showToast = ({ title, message, type = 'success' }) => {
    setToast({ title, message, type });
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  const handleOpenSandbox = (user) => {
    setSandboxInitialUser(user || users.find(u => u.id === currentUserId));
    setIsSandboxOpen(true);
  };

  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  // Helper to switch mode & update URL search parameter
  const switchMode = (mode) => {
    setViewMode(mode);
    try {
      const url = new URL(window.location);
      if (mode === 'permissions') {
        try { sessionStorage.setItem('nndd_admin_active', 'true'); } catch (e) {}
        url.pathname = '/Adm1n_pan0l';
        url.searchParams.delete('mode');
      } else {
        try { sessionStorage.removeItem('nndd_admin_active'); } catch (e) {}
        url.pathname = '/';
        url.searchParams.set('mode', 'tv');
      }
      window.history.replaceState({}, '', url);
    } catch (e) {}
  };

  // Ensure document and body scroll behavior in admin vs tv mode
  useEffect(() => {
    if (viewMode === 'permissions') {
      document.documentElement.style.overflow = 'auto';
      document.documentElement.style.height = 'auto';
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    } else {
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.height = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
    }
  }, [viewMode]);

  return (
    <div className={`min-h-screen ${viewMode === 'permissions' ? 'bg-[#070B14] text-slate-100 overflow-y-auto' : 'bg-[#020617] text-white overflow-hidden'} flex flex-col font-sans select-none relative`} dir="rtl">
      
      {/* Ambient Lighting Backdrop for Admin Mode (Dark Cinema Glassmorphism) */}
      {viewMode === 'permissions' && (
        <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute -top-40 start-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/3 -end-20 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[160px]" />
          <div className="absolute -bottom-40 start-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#070B14]/80 to-[#070B14]" />
        </div>
      )}

      {/* Modern Frosted Glass Toast Notification */}
      {toast && (
        <div className="fixed top-5 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-slide-up">
          <div className="pointer-events-auto bg-slate-900/90 text-white border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl rounded-2xl p-4 flex items-center gap-3.5 max-w-md w-full ring-1 ring-white/10">
            <span className={`p-2 rounded-xl flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
              toast.type === 'info' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
               toast.type === 'info' ? <Info className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </span>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white">{toast.title}</h5>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Top Navigation Header (Dark Cinema Frosted Glass) */}
      {viewMode === 'permissions' ? (
        <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
                4K
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base text-white tracking-wide">
                    NNDD TV
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs">
                    بەڕێوەبردن • Admin
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-normal hidden sm:block">
                  سیستەمی بەڕێوەبردنی سێرڤەر و کەناڵەکان و بریکارەکان
                </p>
              </div>
            </div>

            {/* Central Mode Switcher Pills (Elevated Glass) */}
            <div className="flex items-center bg-white/[0.06] p-1 rounded-2xl border border-white/10 shadow-inner backdrop-blur-xl">
              <button
                onClick={() => switchMode('permissions')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  viewMode === 'permissions'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20 font-black border border-cyan-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-cyan-300" />
                <span>بەڕێوەبردن</span>
              </button>

              <button
                onClick={() => switchMode('tv')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer"
              >
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>ئەپی پەخش</span>
              </button>

              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-150 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>ڕاپۆرت</span>
              </button>
            </div>

            {/* User Switcher Dropdown, PWA/APK download button & Testing Guide */}
            <div className="flex items-center gap-2">
              
              {/* Download APK / Install PWA Button */}
              <button
                onClick={() => setIsInstallOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 border border-emerald-400/30 active:scale-95 transition-all cursor-pointer"
                title="داگرتنی فایلی APK و PWA بۆ مۆبایل و تیڤی"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">داگرتنی ئەپ (APK)</span>
              </button>

              <button
                onClick={() => setIsGuideOpen(true)}
                className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="ڕێبەری تاقیکردنەوەی ئەپ و وێبسایت"
              >
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                <span className="hidden md:inline">ڕێبەری تێست</span>
              </button>

              <div className="relative group">
                <div className="flex items-center gap-2 p-1.5 pe-3 rounded-xl bg-white/[0.06] border border-white/10 cursor-pointer hover:bg-white/[0.12] transition-colors">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/20"
                  />
                  <div className="text-start hidden md:block">
                    <div className="text-[11px] font-bold text-white leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {currentUser.role}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Dropdown Menu (Dark Frosted Glass) */}
                <div className="absolute end-0 top-full mt-2 w-64 bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 p-2 hidden group-hover:block animate-fade-in z-50 text-white ring-1 ring-white/10">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    گۆڕینی بەکارهێنەری چالاک:
                  </div>
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUserId(u.id);
                        showToast({
                          title: 'بەکارهێنەر گۆڕدرا',
                          message: `ئێستا وەک "${u.name}" دەچیتە ناو سیستم.`,
                          type: 'info'
                        });
                      }}
                      className={`w-full text-start p-2 rounded-xl flex items-center gap-2.5 text-xs transition-colors cursor-pointer ${
                        u.id === currentUserId 
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/30' 
                          : 'hover:bg-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-lg object-cover ring-1 ring-white/20" />
                      <div className="flex-1 truncate">
                        <div className="truncate text-white font-medium">{u.name}</div>
                        <div className="text-[10px] text-slate-400">{u.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleOpenSandbox(currentUser)}
                className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25 shadow-xs active:scale-95 transition-all cursor-pointer"
                title="تاقیگەی دەسەڵاتەکان (Sandbox)"
              >
                <Sparkles className="w-4 h-4 text-purple-300" />
              </button>
            </div>

          </div>
        </header>
      ) : null}

      {/* Main Workspace Body */}
      <div className="flex-1">
        {viewMode === 'permissions' ? (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <PermissionsWorkspace
              users={users}
              setUsers={setUsers}
              permissions={permissions}
              channels={channels}
              setChannels={setChannels}
              requests={activationRequests}
              setRequests={setActivationRequests}
              series={vodSeries}
              setSeries={setVodSeries}
              movies={vodMovies}
              setMovies={setVodMovies}
              onOpenSandbox={handleOpenSandbox}
              onNotify={showToast}
            />
          </main>
        ) : (
          <main className="animate-fade-in">
            <KurdLocalTvApp
              onSwitchToAdmin={() => switchMode('permissions')}
              currentUser={currentUser}
              channels={channels}
              setChannels={setChannels}
              requests={activationRequests}
              setRequests={setActivationRequests}
              vodSeriesProp={vodSeries}
              setVodSeriesProp={setVodSeries}
              vodMoviesProp={vodMovies}
              setVodMoviesProp={setVodMovies}
              onNotify={showToast}
              isStandalone={viewMode === 'tv'}
              isCapacitor={isCapacitor}
            />
          </main>
        )}
      </div>
      
      {/* Floating Return Switcher to Admin (Only visible if admin session is actively unlocked) */}
      {viewMode === 'tv' && (typeof window !== 'undefined' && sessionStorage.getItem('nndd_admin_active') === 'true') && (
        <div className="fixed bottom-6 start-6 z-50 pointer-events-auto">
          <button
            onClick={() => switchMode('permissions')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-2xl shadow-blue-500/40 border border-blue-400/50 backdrop-blur-2xl active:scale-95 transition-all group cursor-pointer"
            title="چوون بۆ پانێڵی بەڕێوەبردن"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-200 group-hover:scale-110 transition-transform" />
            <span>پانێڵی بەڕێوەبردن (Admin)</span>
          </button>
        </div>
      )}

      {/* Interactive Simulation Sandbox Modal */}
      <SimulationSandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        users={users}
        permissions={permissions}
        initialUser={sandboxInitialUser}
      />

      {/* Strategic Report & Project Review Modal */}
      <StrategicReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Install PWA and Download APK Modal */}
      <InstallAppModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      {/* Testing Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-fade-in">
          <div className="bg-slate-900/95 rounded-3xl shadow-2xl border border-white/15 p-6 max-w-lg w-full space-y-4 animate-slide-up text-xs leading-relaxed text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <span>ڕێبەری تاقیکردنەوەی NNDD TV و وێبسایت</span>
              </h3>
              <button onClick={() => setIsGuideOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-slate-300">
              <div className="p-3 bg-blue-950/50 border border-blue-500/30 rounded-2xl">
                <strong className="text-blue-300 block mb-1">١. تێستی تەنها ئەپی تیڤی (TV App):</strong>
                <p>
                  بۆ شاشەی تەلەفزیۆن یان مۆبایل بە فوول سکرین:
                  <br />
                  <code className="text-blue-300 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded mt-1 inline-block border border-blue-500/20">
                    http://localhost:5173/?mode=tv
                  </code>
                </p>
              </div>

              <div className="p-3 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl">
                <strong className="text-indigo-300 block mb-1">٢. تێستی وێبسایتی بەڕێوەبردن (Admin Website):</strong>
                <p>
                  بۆ بەڕێوەبردنی دەسەڵاتەکان و دروستکردنی کۆدی بریکار:
                  <br />
                  <code className="text-indigo-300 font-mono font-bold bg-slate-950 px-2 py-0.5 rounded mt-1 inline-block border border-indigo-500/20">
                    http://localhost:5173/
                  </code>
                </p>
              </div>

              <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-2xl">
                <strong className="text-emerald-300 block mb-1">٣. فایلی فەرمی APK و PWA:</strong>
                <p>
                  فایلی <code>NNDD-TV-app.apk</code> ڕاستەوخۆ بە قەبارەی ٤.٤ مێگابایت کۆمپاڵکرا و ئامادەیە بۆ دامەزراندن لەسەر هەر مۆبایل و Smart TVیەک!
                </p>
              </div>
            </div>

            <div className="pt-2 text-end">
              <button
                onClick={() => setIsGuideOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                تێگەیشتم
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
