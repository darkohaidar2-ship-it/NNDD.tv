import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Film,
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
  Play,
  RefreshCw
} from 'lucide-react';
import DabinLogo from './DabinLogo';
import { INITIAL_ACTIVATION_CODES } from '../data/mockData';
import { saveDeviceIdentity, getOrCreateDeviceIdentity } from '../data/deviceManager';
import { testXtreamConnection, importTargetServerChannels, importTargetServerVod } from '../data/serverImporter';
import { authenticateMacWithLionOtt } from '../data/macAuthService';
import { 
  autoRegisterClientDevice, 
  subscribeToClientDeviceHotSwap, 
  getApiBaseUrl, 
  universalFetch 
} from '../data/dabinRealtimeService';
import { useDevice } from '../context/DeviceContext';

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
  defaultTab
}) {
  const currentDevice = device || deviceIdentity || getOrCreateDeviceIdentity();
  const { isTv } = useDevice();
  const modalRef = useRef(null);
  
  // Smart Device Detection on Launch:
  // On TV / Large Non-Touch Screen: Default to 'mac_activation' (Smart TV activation with MAC)
  // On Mobile / Tablet: Default to 'user_pass' (Username & Password login)
  const resolvedDefaultTab = defaultTab !== undefined && defaultTab !== null 
    ? defaultTab 
    : (isTv ? 'mac_activation' : 'user_pass');

  // Dual-mode active tab: 'user_pass' | 'mac_activation'
  const [activeTab, setActiveTab] = useState(resolvedDefaultTab);

  // Sync tab on modal open
  useEffect(() => {
    if (isOpen) {
      if (defaultTab !== undefined && defaultTab !== null) {
        setActiveTab(defaultTab);
      } else {
        setActiveTab(isTv ? 'mac_activation' : 'user_pass');
      }
    }
  }, [isOpen, isTv, defaultTab]);
  
  // Tab 1: Username & Password State
  const [username, setUsername] = useState(currentDevice?.xtream_user || currentDevice?.activeUsername || '');
  const [password, setPassword] = useState(currentDevice?.xtream_pass || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Download & Sync Progress State (Channels, Movies, Series 1% -> 100%)
  const [isSyncingData, setIsSyncingData] = useState(false);
  const [syncPhase, setSyncPhase] = useState('idle'); // 'idle' | 'channels' | 'movies' | 'series' | 'complete'
  const [channelsPercent, setChannelsPercent] = useState(0);
  const [channelsCount, setChannelsCount] = useState(0);
  const [moviesPercent, setMoviesPercent] = useState(0);
  const [moviesCount, setMoviesCount] = useState(0);
  const [seriesPercent, setSeriesPercent] = useState(0);
  const [seriesCount, setSeriesCount] = useState(0);
  const [currentSyncMessage, setCurrentSyncMessage] = useState('');

  // Tab 2: Smart TV MAC Activation State
  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [isHotSwapped, setIsHotSwapped] = useState(false);
  const [isCheckingMac, setIsCheckingMac] = useState(false);

  const macAddress = currentDevice?.macAddress || 'K0:B1:24:B4:9C:2F';
  const devicePin = currentDevice?.deviceKey || currentDevice?.device_key || '1234';
  const portalUrl = 'http://line.liondnscloud.ru:80/c/';

  // Sync inputs with currentDevice when modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentDevice?.xtream_user) {
        setUsername(currentDevice.xtream_user);
      }
      if (currentDevice?.xtream_pass) {
        setPassword(currentDevice.xtream_pass);
      }
      if (macAddress) {
        try {
          localStorage.setItem('kobin_device_mac', macAddress);
        } catch (e) {}
      }
      setLoginError('');
      setCodeError('');
      setLoginSuccess(false);
      setCodeSuccess(false);
      setIsHotSwapped(false);
    }
  }, [isOpen, currentDevice?.xtream_user, currentDevice?.xtream_pass, macAddress]);

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

          // Save Persistent Auto-Login Session
          try {
            const sessionPayload = {
              username: updatedDevice.xtream_user || '',
              password: updatedDevice.xtream_pass || '',
              server_url: updatedDevice.server_url || HARDCODED_SERVER_URL,
              macAddress: macAddress,
              device_key: devicePin,
              status: 'active',
              exp_date: updatedDevice.exp_date || null,
              app_expiry_date: updatedDevice.app_expiry_date || updatedDevice.expiresAt || null,
              expiresAt: updatedDevice.app_expiry_date || updatedDevice.expiresAt || null,
              loginMethod: 'mac_activation',
              lastLogin: new Date().toISOString(),
              token: `session_mac_${Date.now()}`
            };
            localStorage.setItem('kobin_tv_session', JSON.stringify(sessionPayload));
            if (sessionPayload.username && sessionPayload.password) {
              localStorage.setItem('nndd_active_xtream_config', JSON.stringify({
                host: sessionPayload.server_url,
                username: sessionPayload.username,
                password: sessionPayload.password,
                name: 'KOBIN TV Server',
                type: 'xtream'
              }));
            }
          } catch (e) {}

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
                  name: 'KOBIN TV Server',
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

  // Keyboard & D-Pad Remote Navigation for Smart TV:
  // Left/Right switches tabs, Up/Down moves focus across inputs & action buttons, Escape/Backspace closes modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA';

      if (e.key === 'Escape' || (e.key === 'Backspace' && !isInput)) {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (!isInput) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          setActiveTab(prev => prev === 'user_pass' ? 'mac_activation' : 'user_pass');
          return;
        }
      }

      // D-Pad Up / Down sequential navigation across modal interactive elements
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const focusable = modalRef.current?.querySelectorAll(
          'button, [tabindex="0"], input, select, textarea'
        );
        if (focusable && focusable.length > 0) {
          const list = Array.from(focusable).filter(el => !el.disabled && el.offsetParent !== null);
          const currentIndex = list.indexOf(activeEl);
          if (currentIndex !== -1) {
            e.preventDefault();
            const nextIndex = e.key === 'ArrowDown'
              ? (currentIndex + 1) % list.length
              : (currentIndex - 1 + list.length) % list.length;
            list[nextIndex]?.focus();
          } else if (list.length > 0) {
            e.preventDefault();
            list[0]?.focus();
          }
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

      // 3. Save locally in LocalStorage
      setDevice?.(updatedDevice);
      saveDeviceIdentity(updatedDevice);
      try {
        const sessionPayload = {
          username: u,
          password: p,
          server_url: HARDCODED_SERVER_URL,
          macAddress: macAddress,
          device_key: devicePin,
          status: 'active',
          exp_date: testRes.user?.exp_date || null,
          app_expiry_date: expiryIso,
          expiresAt: expiryIso,
          isTrial: !!testRes.isTrial,
          loginMethod: 'user_pass',
          lastLogin: new Date().toISOString(),
          token: testRes.user?.auth ? `token_${u}_${Date.now()}` : `session_${Date.now()}`
        };
        localStorage.setItem('kobin_tv_session', JSON.stringify(sessionPayload));
        localStorage.setItem('kobin_tv_mac_session', JSON.stringify(sessionPayload));
        localStorage.setItem('nndd_active_xtream_config', JSON.stringify({
          host: HARDCODED_SERVER_URL,
          username: u,
          password: p,
          name: 'KOBIN TV Server',
          type: 'xtream'
        }));
        localStorage.setItem('kobin_tv_saved_credentials', JSON.stringify({
          username: u,
          password: p,
          server: HARDCODED_SERVER_URL,
          savedAt: new Date().toISOString()
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

      // 5. ENTER VISUAL DOWNLOAD PROGRESS (1% -> 100% for Channels, Movies, Series)
      setIsSyncingData(true);
      setSyncPhase('channels');
      setChannelsPercent(5);
      setCurrentSyncMessage('خەریکی هێنانی کەناڵەکانە لە سێرڤەرەوە...');

      // --- PHASE 1: CHANNELS (٪١ تا ٪١٠٠) ---
      let freshChannels = [];
      try {
        freshChannels = await importTargetServerChannels(
          { host: HARDCODED_SERVER_URL, username: u, password: p },
          (prog) => {
            if (prog && prog.total > 0) {
              const pct = Math.max(5, Math.min(99, Math.round((prog.current / prog.total) * 100)));
              setChannelsPercent(pct);
              if (prog.loadedCount) setChannelsCount(prog.loadedCount);
              setCurrentSyncMessage(`٪${pct} کەناڵەکان دابەزین (${prog.loadedCount || 0} کەناڵ)`);
            }
          }
        );
      } catch (chErr) {
        console.warn('[Channels Import Warn]:', chErr);
      }
      setChannelsPercent(100);
      setChannelsCount(freshChannels?.length || 0);
      setCurrentSyncMessage(`٪١٠٠ کەناڵەکان دابەزین (${freshChannels?.length || 0} کەناڵ)`);

      await new Promise(r => setTimeout(r, 350));

      // --- PHASE 2 & 3: MOVIES & SERIES (٪١ تا ٪١٠٠) ---
      setSyncPhase('movies');
      setMoviesPercent(5);
      setCurrentSyncMessage('خەریکی هێنانی فیلمەکانە لە سێرڤەرەوە...');

      let freshVod = { movies: [], series: [] };
      try {
        freshVod = await importTargetServerVod(
          { host: HARDCODED_SERVER_URL, username: u, password: p },
          (prog) => {
            if (prog.stage === 'movies') {
              const pct = Math.max(5, Math.min(99, Math.round((prog.current / Math.max(1, prog.total)) * 100)));
              setMoviesPercent(pct);
              if (prog.count) setMoviesCount(prog.count);
              setCurrentSyncMessage(`٪${pct} فیلمەکان دابەزین (${prog.count || 0} فیلم)`);
            } else if (prog.stage === 'series') {
              setSyncPhase('series');
              const pct = Math.max(5, Math.min(99, Math.round((prog.current / Math.max(1, prog.total)) * 100)));
              setSeriesPercent(pct);
              if (prog.count) setSeriesCount(prog.count);
              setCurrentSyncMessage(`٪${pct} زنجیرەکان دابەزین (${prog.count || 0} زنجیرە)`);
            }
          }
        );
      } catch (vodErr) {
        console.warn('[VOD Import Warn]:', vodErr);
      }

      setMoviesPercent(100);
      setMoviesCount(freshVod?.movies?.length || 0);
      setSeriesPercent(100);
      setSeriesCount(freshVod?.series?.length || 0);
      setSyncPhase('complete');
      setCurrentSyncMessage('هەموو کەناڵ، فیلم و زنجیرەکان بە سەرکەوتوویی دابەزین!');

      setLoginSuccess(true);
      onNotify?.({
        title: 'چوونەژوورەوە و دابەزاندن سەرکەوتوو بوو 🎉',
        message: `بەخێربێن بۆ KOBIN TV. (${freshChannels?.length || 0}) کەناڵ، (${freshVod?.movies?.length || 0}) فیلم، (${freshVod?.series?.length || 0}) زنجیرە دابەزین.`,
        type: 'success'
      });

      onLoginSuccess?.(
        {
          host: HARDCODED_SERVER_URL,
          username: u,
          password: p,
          name: 'KOBIN TV Server',
          type: 'xtream'
        },
        freshChannels,
        updatedDevice,
        freshVod
      );

      onActivationSuccess?.(updatedDevice);

      setTimeout(() => {
        onClose?.();
      }, 1400);

    } catch (err) {
      let friendly = err.message || 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە، تکایە دڵنیابەرەوە لە زانیارییەکانت.';
      if (friendly.includes('fetch') || friendly.includes('Network') || friendly.includes('511') || friendly.includes('HTTP')) {
        friendly = 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە، تکایە دڵنیابەرەوە لە زانیارییەکانت.';
      }
      setLoginError(friendly);
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

  // TAB 2: Direct Port 80 MAC Authentication Check
  const handleCheckMacPort80 = async () => {
    setIsCheckingMac(true);
    setCodeError('');
    try {
      const res = await authenticateMacWithLionOtt(macAddress, true);
      if (res && res.authorized && res.session) {
        setIsHotSwapped(true);
        onNotify?.({
          title: 'شاشەکەت چالاکە! 🎉',
          message: 'ئەم ماک ئەدرێسە لەسەر سێرڤەر پەسەندکراوە و هێڵەکەت کارایە.',
          type: 'success'
        });
        const merged = {
          ...currentDevice,
          ...res.session,
          status: 'active',
          authorized: true
        };
        setDevice?.(merged);
        saveDeviceIdentity(merged);

        if (res.session.username && res.session.password) {
          importTargetServerChannels({
            host: res.session.server_url || HARDCODED_SERVER_URL,
            username: res.session.username,
            password: res.session.password
          }).then(freshChannels => {
            onLoginSuccess?.(
              {
                host: res.session.server_url || HARDCODED_SERVER_URL,
                username: res.session.username,
                password: res.session.password,
                name: 'KOBIN TV Server',
                type: 'xtream'
              },
              freshChannels,
              merged
            );
          }).catch(() => {});
        }

        setTimeout(() => {
          onClose?.();
        }, 1200);
      } else {
        setCodeError('ئەم ماک ئەدرێسە هێشتا لەسەر سێرڤەری LionOTT چالاک نەکراوە یان بەسەرچووە.');
      }
    } catch (err) {
      setCodeError('نەتوانرا پەیوەندی بە پۆرت 80 سێرڤەرەوە بکرێت.');
    } finally {
      setIsCheckingMac(false);
    }
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

      try {
        const sessionPayload = {
          username: currentDevice?.xtream_user || currentDevice?.activeUsername || matched.code,
          password: currentDevice?.xtream_pass || '',
          server_url: currentDevice?.server_url || HARDCODED_SERVER_URL,
          macAddress: macAddress,
          device_key: devicePin,
          status: 'active',
          app_expiry_date: updated.expiresAt,
          expiresAt: updated.expiresAt,
          loginMethod: 'voucher_code',
          lastLogin: new Date().toISOString(),
          token: `session_code_${Date.now()}`
        };
        localStorage.setItem('kobin_tv_session', JSON.stringify(sessionPayload));
      } catch (e) {}

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
      <div 
        ref={modalRef}
        className="bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-w-lg w-full overflow-hidden flex flex-col max-h-[95vh] animate-slide-up backdrop-blur-md"
      >
        
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
              tabIndex={0}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-105 outline-none"
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
              tabIndex={0}
              onClick={() => setActiveTab('user_pass')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-105 outline-none ${
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
              tabIndex={0}
              onClick={() => setActiveTab('mac_activation')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-105 outline-none ${
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
              {isSyncingData ? (
                /* LIVE DOWNLOAD PROGRESS: CHANNELS 1%-100%, MOVIES 1%-100%, SERIES 1%-100% */
                <div className="space-y-3.5 py-2 animate-fade-in">
                  <div className="text-center space-y-1 mb-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>خەریکی دابەزاندنی داتاکانی سێرڤەر...</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-mono mt-1">
                      {currentSyncMessage}
                    </p>
                  </div>

                  {/* 1. Live TV Channels Progress Card */}
                  <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                    channelsPercent >= 100 
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                      : 'bg-black/50 border-cyan-500/30'
                  } space-y-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${
                          channelsPercent >= 100 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        }`}>
                          <Tv className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-white block">کەناڵەکان (Live Channels)</span>
                          <span className="text-[10px] text-slate-400">
                            {channelsPercent >= 100 
                              ? `٪١٠٠ کەناڵەکان دابەزین (${channelsCount} کەناڵ)` 
                              : `٪${channelsPercent} کەناڵەکان دابەزین (${channelsCount} کەناڵ)`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-cyan-300">
                          %{channelsPercent}
                        </span>
                        {channelsPercent >= 100 && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-scale-in" />
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                        style={{ width: `${channelsPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 2. VOD Movies Progress Card */}
                  <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                    moviesPercent >= 100 
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                      : 'bg-black/50 border-amber-500/30'
                  } space-y-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${
                          moviesPercent >= 100 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}>
                          <Film className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-white block">فیلمەکان (VOD Movies)</span>
                          <span className="text-[10px] text-slate-400">
                            {moviesPercent >= 100 
                              ? `٪١٠٠ فیلمەکان دابەزین (${moviesCount} فیلم)` 
                              : moviesPercent > 0 
                                ? `٪${moviesPercent} فیلمەکان دابەزین (${moviesCount} فیلم)` 
                                : 'لە نۆرەی دابەزاندندایە...'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-amber-300">
                          %{moviesPercent}
                        </span>
                        {moviesPercent >= 100 && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-scale-in" />
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                        style={{ width: `${moviesPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* 3. Series Progress Card */}
                  <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                    seriesPercent >= 100 
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]' 
                      : 'bg-black/50 border-purple-500/30'
                  } space-y-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl ${
                          seriesPercent >= 100 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                            : 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                        }`}>
                          <Tv className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-white block">زنجیرەکان (Series)</span>
                          <span className="text-[10px] text-slate-400">
                            {seriesPercent >= 100 
                              ? `٪١٠٠ زنجیرەکان دابەزین (${seriesCount} زنجیرە)` 
                              : seriesPercent > 0 
                                ? `٪${seriesPercent} زنجیرەکان دابەزین (${seriesCount} زنجیرە)` 
                                : 'لە نۆرەی دابەزاندندایە...'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-sm text-purple-300">
                          %{seriesPercent}
                        </span>
                        {seriesPercent >= 100 && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-scale-in" />
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(168,85,247,0.8)]"
                        style={{ width: `${seriesPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Completion Notice */}
                  {syncPhase === 'complete' && (
                    <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center text-xs font-bold animate-pulse">
                      🎉 هەموو کەناڵ، فیلم و زنجیرەکان دابەزین! پەڕەکە دەکڕێتەوە...
                    </div>
                  )}
                </div>
              ) : (
                /* Login Form */
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
                        tabIndex={0}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="ناوی بەکارهێنەرەکەت داخڵ بکە..."
                        autoFocus={!isTv}
                        disabled={isLoggingIn}
                        className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:scale-[1.01] rounded-2xl py-3 px-10 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
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
                        tabIndex={0}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="وشەی نهێنیەکەت داخڵ بکە..."
                        disabled={isLoggingIn}
                        className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:scale-[1.01] rounded-2xl py-3 px-10 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      
                      <button
                        type="button"
                        tabIndex={0}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-white p-1 rounded-lg outline-none"
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

                  {loginSuccess && !isSyncingData && (
                    <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span className="leading-snug">چوونەژوورەوە سەرکەوتوو بوو! پەڕەکە دەکڕێتەوە...</span>
                    </div>
                  )}

                  {/* Submit Action Button */}
                  <button
                    type="submit"
                    tabIndex={0}
                    disabled={isLoggingIn || loginSuccess}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-[0_0_25px_rgba(6,182,212,0.45)] active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-[1.02] outline-none"
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
              )}

              {/* Note below form */}
              {!isSyncingData && (
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-slate-400 leading-relaxed">
                  <span className="font-bold text-slate-300">تێبینی:</span> بە چوونەژوورەوە، ئەکاونتەکەت ڕاستەوخۆ لەناو LocalStorage خەزن دەکرێت و بەردەوام دەبێت لە کارکردن.
                </div>
              )}
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
                      tabIndex={0}
                      onClick={handleCopyPortal}
                      className="mt-2 text-[10px] text-cyan-300 hover:text-cyan-200 self-start flex items-center gap-1 cursor-pointer p-1 rounded-lg focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:scale-105 outline-none"
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
                    <div className="mt-2 text-[10px] text-cyan-400 font-sans flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>دۆخ: پەیوەستی ڕاستەوخۆ (Port 80 Direct)</span>
                    </div>
                  </div>
                </div>

                {/* Direct Port 80 MAC Verification Button */}
                <button
                  type="button"
                  tabIndex={0}
                  onClick={handleCheckMacPort80}
                  disabled={isCheckingMac}
                  className="w-full py-3 px-4 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 hover:text-white font-bold text-xs border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:scale-[1.02] outline-none"
                >
                  {isCheckingMac ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>خەریکی پشکنینی ڕاستەوخۆیە لە LionOTT (Port 80)...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-cyan-400" />
                      <span>پشکنینی چالاکبوونی هێڵ لە LionOTT (Port 80)</span>
                    </>
                  )}
                </button>

                {/* Action Buttons: WhatsApp Share & Copy MAC */}
                <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    tabIndex={0}
                    onClick={handleWhatsAppShare}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-105 outline-none"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>ناردنی ماک و پین بۆ وەتسئەپ 📲</span>
                  </button>

                  <button
                    type="button"
                    tabIndex={0}
                    onClick={handleCopyMac}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-105 outline-none"
                  >
                    {copiedMac ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedMac ? 'کۆپیکرا ✓' : 'کۆپیکردنی MAC'}</span>
                  </button>

                  <button
                    type="button"
                    tabIndex={0}
                    onClick={handleCopyKey}
                    className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-105 outline-none"
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
                    tabIndex={0}
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="کۆدی بەشداربوون داخڵ بکە..."
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:scale-[1.01] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono uppercase"
                  />
                  <button
                    type="submit"
                    tabIndex={0}
                    className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-105 outline-none"
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
            tabIndex={0}
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all active:scale-95 cursor-pointer text-xs focus-visible:ring-2 focus-visible:ring-white focus-visible:scale-105 outline-none"
          >
            <Play className="w-3.5 h-3.5 text-cyan-300" />
            <span>سەیرکردنی کەناڵی بێبەرامبەر (KOBIN TV Free)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
