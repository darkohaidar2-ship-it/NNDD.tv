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
  const [currentUserId, setCurrentUserId] = useState('usr-1');
  const [channels, setChannels] = useState(CHANNELS_DATA);
  const [activationRequests, setActivationRequests] = useState(() => getAllRequests(INITIAL_ACTIVATION_REQUESTS));

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

  return (
    <div className={`min-h-screen ${viewMode === 'permissions' ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#020617] text-white'} flex flex-col font-sans select-none relative overflow-x-hidden`} dir="rtl">
      
      {/* Ambient Lighting Backdrop for Admin Mode (Apple Light) */}
      {viewMode === 'permissions' && (
        <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute -top-32 -start-32 w-96 h-96 bg-blue-200/40 rounded-full blur-[130px]" />
          <div className="absolute top-1/3 -end-32 w-96 h-96 bg-indigo-200/30 rounded-full blur-[140px]" />
          <div className="absolute -bottom-32 start-1/3 w-96 h-96 bg-cyan-200/20 rounded-full blur-[130px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50/40 via-slate-50/80 to-slate-100" />
        </div>
      )}

      {/* Apple Floating Toast Notification */}
      {toast && (
        <div className="fixed top-5 inset-x-0 z-50 flex justify-center pointer-events-none px-4 animate-slide-up">
          <div className={`pointer-events-auto ${viewMode === 'permissions' ? 'bg-white/95 text-slate-900 border-slate-200/90 shadow-xl' : 'bg-slate-900/95 text-white border-white/15 shadow-2xl'} backdrop-blur-2xl border rounded-2xl p-4 flex items-center gap-3.5 max-w-md w-full ring-1 ring-black/5`}>
            <span className={`p-2 rounded-xl flex-shrink-0 ${
              toast.type === 'success' ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20' : 
              toast.type === 'info' ? 'bg-blue-500/15 text-blue-600 border border-blue-500/20' : 'bg-rose-500/15 text-rose-600 border border-rose-500/20'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : 
               toast.type === 'info' ? <Info className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </span>
            <div className="flex-1 min-w-0">
              <h5 className={`text-xs font-bold ${viewMode === 'permissions' ? 'text-slate-900' : 'text-white'}`}>{toast.title}</h5>
              <p className={`text-[11px] ${viewMode === 'permissions' ? 'text-slate-600' : 'text-slate-300'} mt-0.5 leading-relaxed`}>{toast.message}</p>
            </div>
            <button
              onClick={() => setToast(null)}
              className={`${viewMode === 'permissions' ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'} text-xs p-1`}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Top Navigation Header (Apple Light Mode Glass) */}
      {viewMode === 'permissions' ? (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm text-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            
            {/* Logo & Platform Name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20 border border-blue-400/40">
                4K
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base text-slate-900 tracking-wide">
                    NNDD TV
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
                    بەڕێوەبردن • Admin
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-normal hidden sm:block">
                  سیستەمی بەڕێوەبردنی دەسەڵاتەکان و کەناڵەکان
                </p>
              </div>
            </div>

            {/* Central Mode Switcher Pills (Clean Light Glass) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
              <button
                onClick={() => switchMode('permissions')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                  viewMode === 'permissions'
                    ? 'bg-white text-slate-900 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>بەڕێوەبردن</span>
              </button>

              <button
                onClick={() => switchMode('tv')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all duration-150"
              >
                <Tv className="w-4 h-4 text-indigo-600" />
                <span>ئەپی پەخش</span>
              </button>

              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-all duration-150"
              >
                <FileText className="w-4 h-4 text-amber-600" />
                <span>ڕاپۆرت</span>
              </button>
            </div>

            {/* User Switcher Dropdown, PWA/APK download button & Testing Guide */}
            <div className="flex items-center gap-2">
              
              {/* Download APK / Install PWA Button */}
              <button
                onClick={() => setIsInstallOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                title="داگرتنی فایلی APK و PWA بۆ مۆبایل و تیڤی"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">داگرتنی ئەپ (APK)</span>
              </button>

              <button
                onClick={() => setIsGuideOpen(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="ڕێبەری تاقیکردنەوەی ئەپ و وێبسایت"
              >
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span className="hidden md:inline">ڕێبەری تێست</span>
              </button>

              <div className="relative group">
                <div className="flex items-center gap-2 p-1.5 pe-3 rounded-xl bg-slate-100 border border-slate-200 cursor-pointer hover:bg-slate-200/80 transition-colors">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-300"
                  />
                  <div className="text-start hidden md:block">
                    <div className="text-[11px] font-bold text-slate-900 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[9px] text-slate-500">
                      {currentUser.role}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </div>

                {/* Dropdown Menu (Light Mode Apple) */}
                <div className="absolute end-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 hidden group-hover:block animate-fade-in z-50 text-slate-900">
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
                      className={`w-full text-start p-2 rounded-xl flex items-center gap-2.5 text-xs transition-colors ${
                        u.id === currentUserId 
                          ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200' 
                          : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-lg object-cover ring-1 ring-slate-200" />
                      <div className="flex-1 truncate">
                        <div className="truncate text-slate-900 font-medium">{u.name}</div>
                        <div className="text-[10px] text-slate-500">{u.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleOpenSandbox(currentUser)}
                className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 shadow-xs active:scale-95 transition-all"
                title="تاقیگەی دەسەڵاتەکان (Sandbox)"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
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
              onNotify={showToast}
              isStandalone={viewMode === 'tv'}
              isCapacitor={isCapacitor}
            />
          </main>
        )}
      </div>
      
      {/* Floating Return Switcher to Admin (In web browser, easily switch back to Admin) */}
      {!isCapacitor && viewMode === 'tv' && (
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
