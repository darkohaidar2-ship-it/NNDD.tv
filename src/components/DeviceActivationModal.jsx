import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Copy, 
  Check, 
  Share2, 
  X, 
  Key, 
  Camera, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Wifi,
  Radio,
  ArrowRight,
  Play
} from 'lucide-react';
import DabinLogo from './DabinLogo';
import { INITIAL_ACTIVATION_CODES } from '../data/mockData';
import { saveDeviceIdentity, getOrCreateDeviceIdentity } from '../data/deviceManager';
import { testXtreamConnection, importTargetServerChannels } from '../data/serverImporter';
import { 
  autoRegisterClientDevice, 
  subscribeToClientDeviceHotSwap, 
  getApiBaseUrl, 
  universalFetch 
} from '../data/dabinRealtimeService';

const HARDCODED_SERVER_URL = 'http://line.liondnscloud.ru:80';

export default function DeviceActivationModal({ 
  isOpen, 
  onClose, 
  device, 
  deviceIdentity,
  setDevice, 
  onActivationSuccess,
  onLoginSuccess,
  onNotify,
  onUnlockApp,
  serverConnectionStatus = 'connected',
  defaultTab = 'user_pass' // 'user_pass' or 'mac_activation'
}) {
  const currentDevice = device || deviceIdentity || getOrCreateDeviceIdentity();
  
  // Dual-mode active tab: 'user_pass' | 'mac_activation'
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // Tab 1: Username & Password State
  const [username, setUsername] = useState(currentDevice?.xtream_user || currentDevice?.activeUsername || '');
  const [password, setPassword] = useState(currentDevice?.xtream_pass || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Tab 2: Smart TV MAC Activation State
  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [isHotSwapped, setIsHotSwapped] = useState(false);

  const macAddress = currentDevice?.macAddress || 'K0:B1:24:B4:9C:2F';
  const devicePin = currentDevice?.deviceKey || currentDevice?.device_key || '1234';
  const portalUrl = currentDevice?.portalUrl || 'http://line.liondnscloud.ru/c/';

  // Sync inputs with currentDevice when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentDevice?.xtream_user) {
        setUsername(currentDevice.xtream_user);
      }
      if (currentDevice?.xtream_pass) {
        setPassword(currentDevice.xtream_pass);
      }
      setLoginError('');
      setCodeError('');
      setLoginSuccess(false);
      setCodeSuccess(false);
      setIsHotSwapped(false);
    }
  }, [isOpen, currentDevice?.xtream_user, currentDevice?.xtream_pass]);

  // Tab 2: Real-time Hot-Swap Auto-Login Listener
  useEffect(() => {
    if (!isOpen || !macAddress) return;

    let unsubscribe = null;
    try {
      unsubscribe = subscribeToClientDeviceHotSwap(macAddress, (updatedDevice) => {
        if (updatedDevice && (updatedDevice.xtream_user || updatedDevice.status === 'active')) {
          setIsHotSwapped(true);
          onNotify?.({
            title: 'شاشەکەت چالاککرا! 🎉',
            message: 'بەڕێوەبەر هێڵەکەی بۆ دیاریکردیت؛ ڕاستەوخۆ دەچیتە ناو کەناڵەکان.',
            type: 'success'
          });

          const merged = {
            ...currentDevice,
            ...updatedDevice,
            status: 'active',
            authorized: true,
            xtream_user: updatedDevice.xtream_user,
            xtream_pass: updatedDevice.xtream_pass,
            server_url: updatedDevice.server_url || HARDCODED_SERVER_URL,
            expiresAt: updatedDevice.app_expiry_date || updatedDevice.expiresAt
          };

          setDevice?.(merged);
          saveDeviceIdentity(merged);

          // Import channels immediately
          if (updatedDevice.xtream_user && updatedDevice.xtream_pass) {
            importTargetServerChannels({
              host: updatedDevice.server_url || HARDCODED_SERVER_URL,
              username: updatedDevice.xtream_user,
              password: updatedDevice.xtream_pass
            }).then(freshChannels => {
              onLoginSuccess?.(
                {
                  host: updatedDevice.server_url || HARDCODED_SERVER_URL,
                  username: updatedDevice.xtream_user,
                  password: updatedDevice.xtream_pass,
                  name: 'LionOTT Cloud',
                  type: 'xtream'
                },
                freshChannels,
                merged
              );
            }).catch(() => {});
          }

          onActivationSuccess?.(merged);
          setTimeout(() => {
            onClose?.();
          }, 1200);
        }
      });
    } catch (e) {
      console.warn('[Modal HotSwap Listener Catch]:', e);
    }

    return () => {
      try {
        unsubscribe?.();
      } catch (e) {}
    };
  }, [isOpen, macAddress]);

  // Keyboard navigation for TV Remote: Left/Right switches tabs, Escape closes modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      } else if (!isInput) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          setActiveTab(prev => prev === 'user_pass' ? 'mac_activation' : 'user_pass');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  // TAB 1: Handle Username & Password Submission
  const handleUserPassLogin = async (e) => {
    e?.preventDefault();
    setLoginError('');
    const u = username.trim();
    const p = password.trim();

    if (!u) {
      setLoginError('تکایە ناوی بەکارهێنەر (Username) داخڵ بکە.');
      return;
    }
    if (!p) {
      setLoginError('تکایە وشەی نهێنی (Password) داخڵ بکە.');
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Direct authentication test against hardcoded server
      const testRes = await testXtreamConnection({
        host: HARDCODED_SERVER_URL,
        serverUrl: HARDCODED_SERVER_URL,
        username: u,
        password: p
      });

      if (!testRes.success) {
        throw new Error(testRes.error || 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە، تکایە دڵنیابەرەوە.');
      }

      // 2. Prepare updated device identity
      let expiryIso = null;
      if (testRes.user?.exp_date && testRes.user.exp_date !== 'null') {
        const expNum = parseInt(testRes.user.exp_date, 10);
        if (!isNaN(expNum) && expNum > 0) {
          expiryIso = new Date(expNum * 1000).toISOString();
        }
      }

      const updatedDevice = {
        ...currentDevice,
        status: 'active',
        authorized: true,
        activeUsername: u,
        xtream_user: u,
        xtream_pass: p,
        server_url: HARDCODED_SERVER_URL,
        activePlan: testRes.isTrial ? 'تاقیکاری (Trial)' : 'فەرمی (Active Line)',
        expiresAt: expiryIso,
        lastActive: new Date().toISOString()
      };

      // 3. Save locally
      setDevice?.(updatedDevice);
      saveDeviceIdentity(updatedDevice);
      try {
        localStorage.setItem('nndd_active_xtream_config', JSON.stringify({
          host: HARDCODED_SERVER_URL,
          username: u,
          password: p,
          name: 'LionOTT Cloud',
          type: 'xtream'
        }));
      } catch (e) {}

      // 4. Sync the active user to Admin Panel in real-time
      autoRegisterClientDevice(macAddress, currentDevice?.deviceModel || 'Smart TV', {
        device_key: devicePin,
        xtream_user: u,
        xtream_pass: p,
        server_url: HARDCODED_SERVER_URL,
        status: 'active',
        customer_name: u,
        ip_address: currentDevice?.deviceIp || ''
      }).catch(err => {
        console.warn('[Sync to Admin Error]:', err);
      });

      setLoginSuccess(true);
      onNotify?.({
        title: 'چوونەژوورەوە سەرکەوتوو بوو 🎉',
        message: `بەخێربێن بۆ KOBIN TV. ئەکاونتی "${u}" بە سەرکەوتوویی کرایەوە.`,
        type: 'success'
      });

      // 5. Import server channels
      const freshChannels = await importTargetServerChannels({
        host: HARDCODED_SERVER_URL,
        username: u,
        password: p
      }).catch(() => []);

      onLoginSuccess?.(
        {
          host: HARDCODED_SERVER_URL,
          username: u,
          password: p,
          name: 'LionOTT Cloud',
          type: 'xtream'
        },
        freshChannels,
        updatedDevice
      );

      onActivationSuccess?.(updatedDevice);

      setTimeout(() => {
        onClose?.();
      }, 900);

    } catch (err) {
      setLoginError(err.message || 'هەڵەیەک ڕوویدا لە کاتی پەیوەستبوون بە سێرڤەر. تکایە دووبارە هەوڵبدەرەوە.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // TAB 2: Copy MAC
  const handleCopyMac = () => {
    navigator.clipboard?.writeText(macAddress);
    setCopiedMac(true);
    setTimeout(() => setCopiedMac(false), 2500);
    onNotify?.({
      title: 'کۆدی MAC کۆپیکرا 📋',
      message: `کۆدی ماک: ${macAddress} کۆپیکرا بۆ کلیپبۆرد.`,
      type: 'info'
    });
  };

  // TAB 2: Copy PIN
  const handleCopyKey = () => {
    navigator.clipboard?.writeText(devicePin);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
    onNotify?.({
      title: 'کۆدی PIN کۆپیکرا 📋',
      message: `کۆدی پین: ${devicePin} کۆپیکرا.`,
      type: 'info'
    });
  };

  // TAB 2: Copy Portal
  const handleCopyPortal = () => {
    navigator.clipboard?.writeText(portalUrl);
    setCopiedPortal(true);
    setTimeout(() => setCopiedPortal(false), 2500);
    onNotify?.({
      title: 'پۆڕتاڵ کۆپیکرا 🌐',
      message: `${portalUrl} کۆپیکرا.`,
      type: 'info'
    });
  };

  // TAB 2: WhatsApp Share
  const handleWhatsAppShare = () => {
    const text = `سڵاو بەڕێزم 🌷
داواکاری چالاککردنی شاشەی KOBIN TV:
📺 کۆدی ماک (MAC Address): ${macAddress}
🔑 کۆدی پین (Device PIN): ${devicePin}
🌐 پۆڕتاڵ (Portal): ${portalUrl}
📱 مۆدێلی ئامێر: ${currentDevice?.deviceModel || 'Smart TV'}

تکایە هێڵەکەم بۆ کارا بکەن. زۆر سوپاس!`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // TAB 2: Voucher Code Redemption
  const handleRedeemCode = (e) => {
    e.preventDefault();
    setCodeError('');
    const entered = activationCode.trim().toUpperCase();

    if (!entered) {
      setCodeError('تکایە کۆدی کاراکردن داخڵ بکە.');
      return;
    }

    const matched = INITIAL_ACTIVATION_CODES.find(c => c.code.toUpperCase() === entered);
    if (matched) {
      const updated = {
        ...currentDevice,
        status: 'active',
        activePlan: matched.planName,
        expiresAt: new Date(Date.now() + (matched.durationDays || 30) * 86400000).toISOString()
      };
      setDevice?.(updated);
      saveDeviceIdentity(updated);
      setCodeSuccess(true);
      onActivationSuccess?.(updated);
      onUnlockApp?.(matched.durationDays || 30);

      onNotify?.({
        title: 'ئەپەکە چالاککرا! پیرۆزە 🎉',
        message: `کۆدی "${matched.planName}" بە سەرکەوتوویی قبوڵکرا.`,
        type: 'success'
      });

      setTimeout(() => {
        onClose?.();
      }, 1000);
    } else {
      setCodeError('کۆدەکە هەڵەیە یان بەسەرچووە. تکایە دڵنیابەرەوە لە کۆدەکە.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-2xl animate-fade-in text-slate-100 select-none" dir="rtl">
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-w-lg w-full overflow-hidden flex flex-col max-h-[95vh] animate-slide-up backdrop-blur-md">
        
        {/* Top Header & Branding */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 p-4 sm:p-5 border-b border-cyan-500/20 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <DabinLogo className="h-8 w-auto" glow={true} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>KOBIN TV</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                    UNIFIED APP
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  پلاتفۆرمی یەکگرتووی پەخشی کەناڵەکان و سینەما
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="داخستن"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* DUAL-MODE TAB SWITCHER (Instant 1-Click / Remote Left-Right) */}
          <div className="mt-4 p-1 rounded-2xl bg-black/60 border border-white/10 flex items-center gap-1">
            {/* Tab 1 Button */}
            <button
              type="button"
              onClick={() => setActiveTab('user_pass')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                activeTab === 'user_pass'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.45)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" />
              <span>چوونەژوورەوە بە هەژمار</span>
            </button>

            {/* Tab 2 Button */}
            <button
              type="button"
              onClick={() => setActiveTab('mac_activation')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                activeTab === 'mac_activation'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.45)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>چالاککردنی شاشە (MAC)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs custom-internal-scrollbar">
          
          {/* =========================================================================
              TAB 1: USERNAME & PASSWORD LOGIN (Hardcoded Server http://line.liondnscloud.ru:80)
             ========================================================================= */}
          {activeTab === 'user_pass' && (
            <div className="space-y-4 animate-fade-in">
              {/* Informative pill */}
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/25 rounded-2xl flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span className="text-[11px] font-medium">سێرڤەری پەخش: LionOTT Cloud</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-300/80 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  ڕاستەوخۆ بەستراوەتەوە ✓
                </span>
              </div>

              {/* Login Form */}
              <form onSubmit={handleUserPassLogin} className="space-y-3.5">
                {/* Username Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    ناوی بەکارهێنەر (Username)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      dir="ltr"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="ناوی بەکارهێنەرەکەت داخڵ بکە..."
                      autoFocus
                      disabled={isLoggingIn}
                      className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-2xl py-3 px-10 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 block">
                    وشەی نهێنی (Password)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="وشەی نهێنیەکەت داخڵ بکە..."
                      disabled={isLoggingIn}
                      className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 rounded-2xl py-3 px-10 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Feedback Alerts */}
                {loginError && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span className="leading-snug">{loginError}</span>
                  </div>
                )}

                {loginSuccess && (
                  <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="leading-snug">چوونەژوورەوە سەرکەوتوو بوو! پەڕەکە دەکڕێتەوە...</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoggingIn || loginSuccess}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-[0_0_25px_rgba(6,182,212,0.45)] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>خەریکی پشکنین و بەستنەوەیە...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>چوونەژوورەوە (Login)</span>
                    </>
                  )}
                </button>
              </form>

              {/* Note below form */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-300">تێبینی:</span> بە چوونەژوورەوە، ئەکاونتەکەت ڕاستەوخۆ دەبەسترێتەوە بە ماک ئەدرەسی ئامێرەکەتەوە لە پانێڵی بەڕێوەبەر و بەردەوام دەبێت لە کارکردن.
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 2: SMART TV MAC ACTIVATION & REAL-TIME HOT-SWAP SYNC
             ========================================================================= */}
          {activeTab === 'mac_activation' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Real-time Status Badge Banner */}
              <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${
                      currentDevice?.status === 'active' || isHotSwapped ? 'bg-emerald-400' : 'bg-cyan-400'
                    }`} />
                    <div className={`w-3 h-3 rounded-full absolute animate-ping ${
                      currentDevice?.status === 'active' || isHotSwapped ? 'bg-emerald-400' : 'bg-cyan-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white">
                      {currentDevice?.status === 'active' || isHotSwapped ? (
                        'شاشەکەت چالاکە ✓'
                      ) : (
                        'پەیوەستە بە سێرڤەر - چاوەڕوانی دیاریکردنی هێڵ'
                      )}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      پەیوەندی لەگەڵ بەڕێوەبەر بەستراوەتەوە لە ڕێگەی Real-Time Hot-Swap
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  currentDevice?.status === 'active' || isHotSwapped
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {currentDevice?.status === 'active' || isHotSwapped ? 'ACTIVE' : 'READY'}
                </span>
              </div>

              {/* High-Contrast MAG MAC Card */}
              <div className="p-5 rounded-3xl bg-slate-950/95 border-2 border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.2)] space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400" />

                {/* Glowing Monospace MAC Address */}
                <div className="bg-slate-900/90 border border-cyan-400/40 rounded-2xl p-4 text-center space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium block">
                    MAC ADDRESS (کۆدی شاشەی KOBIN TV)
                  </span>
                  <div className="font-mono text-2xl sm:text-3xl font-black text-cyan-300 tracking-widest py-1 drop-shadow-[0_0_15px_rgba(6,182,212,0.7)] select-all">
                    {macAddress}
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">
                      کۆدی پین (Device PIN):
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/25 select-all">
                      {devicePin}
                    </span>
                  </div>
                </div>

                {/* Device Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">ناونیشانی پۆڕتاڵ (Portal URL):</span>
                      <span className="text-amber-300 font-bold break-all select-all text-[11px]">
                        {portalUrl}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPortal}
                      className="mt-2 text-[10px] text-cyan-300 hover:text-cyan-200 self-start flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPortal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPortal ? 'کۆپیکرا' : 'کۆپیکردنی پۆڕتاڵ'}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">مۆدێلی ئامێر:</span>
                      <span className="text-slate-200 text-[11px]">
                        {currentDevice?.deviceModel || 'Smart TV / Android'}
                      </span>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 font-mono">
                      IP: {currentDevice?.deviceIp || '149.255.228.84'}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: WhatsApp Share & Copy MAC */}
                <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>ناردنی ماک و پین بۆ وەتسئەپ 📲</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyMac}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedMac ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedMac ? 'کۆپیکرا ✓' : 'کۆپیکردنی MAC'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-amber-300" /> : <Key className="w-4 h-4" />}
                    <span>{copiedKey ? 'کۆپیکرا ✓' : 'کۆپیکردنی PIN'}</span>
                  </button>
                </div>
              </div>

              {/* Automatic HotSwap Listening Indicator */}
              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-2xl flex items-center gap-2.5 text-[11px] text-cyan-200">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
                <span>
                  <strong>سیستەمی نوێبوونەوەی خێرا (Hot-Swap):</strong> بەبێ دەستکاری ئەپ، کە بەڕێوەبەر لە پانێڵ هێڵەکەی دیاریکرد پەنجەرەکە دادەخرێت و کەناڵەکان دەکرێنەوە.
                </span>
              </div>

              {/* Optional Voucher Code Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-xs">کۆدی کاراکردنت پێیە؟ لێرە داخڵی بکە:</span>
                </div>

                <form onSubmit={handleRedeemCode} className="flex gap-2">
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="کۆدی بەشداربوون داخڵ بکە..."
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>کاراکردن</span>
                  </button>
                </form>

                {codeError && (
                  <p className="text-[11px] text-rose-400 font-medium">{codeError}</p>
                )}
                {codeSuccess && (
                  <p className="text-[11px] text-emerald-400 font-medium">ئەپەکەت بە سەرکەوتوویی چالاککرا!</p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer: Preview Free Channel Button */}
        <div className="bg-slate-950/80 p-3.5 sm:p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px]">ناسنامەی فەرمی KOBIN TV HD</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all active:scale-95 cursor-pointer text-xs"
          >
            <Play className="w-3.5 h-3.5 text-cyan-300" />
            <span>سەیرکردنی کەناڵی بێبەرامبەر (KOBIN TV Free)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
