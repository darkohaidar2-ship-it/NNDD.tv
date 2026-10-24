import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Tv, 
  Activity, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  Wifi, 
  Smartphone, 
  CheckCircle2, 
  X, 
  Flame, 
  Key, 
  Lock, 
  Send, 
  Coins, 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Server,
  Layers,
  ChevronRight,
  UserCheck,
  Ban,
  Crown
} from 'lucide-react';
import DabinLogo from './DabinLogo';
import { 
  fetchDevicesRealtime, 
  subscribeToDevicesRealtime, 
  assignLineToDevice, 
  renewDeviceOneMonth, 
  checkLionOttUpstream, 
  calculateSavingsMetrics, 
  playUrgentAlertChime 
} from '../data/dabinRealtimeService';
import { parseM3uUrl } from '../utils/m3uParser';
import { normalizeMac } from '../data/deviceManager';

export default function DabinRealtimeAdminDashboard({ onSwitchToTv, onNotify }) {
  // State
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'urgent' | 'online' | 'active' | 'pending'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  // Modals State
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);
  const [selectedDeviceForAssign, setSelectedDeviceForAssign] = useState(null);

  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [selectedDeviceForRenew, setSelectedDeviceForRenew] = useState(null);

  const [isStatusInspectorOpen, setIsStatusInspectorOpen] = useState(false);
  const [inspectedStatus, setInspectedStatus] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Quick Assign Form State
  const [m3uPasteInput, setM3uPasteInput] = useState('');
  const [formMac, setFormMac] = useState('');
  const [formDeviceKey, setFormDeviceKey] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formServerUrl, setFormServerUrl] = useState('http://line.liondnscloud.ru:80');
  const [formUsername, setFormUsername] = useState('292c8215');
  const [formPassword, setFormPassword] = useState('adef5d6e');
  const [formAppExpiryDays, setFormAppExpiryDays] = useState(365);
  const [formPanelExpiryDays, setFormPanelExpiryDays] = useState(30);

  // Hot-Swap Renew Form State
  const [renewM3uPaste, setRenewM3uPaste] = useState('');
  const [renewUsername, setRenewUsername] = useState('');
  const [renewPassword, setRenewPassword] = useState('');
  const [renewServerUrl, setRenewServerUrl] = useState('http://line.liondnscloud.ru:80');

  // Load Initial Devices & Subscribe to Supabase Realtime Pub/Sub
  useEffect(() => {
    let unsubscribe = () => {};

    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchDevicesRealtime();
      setDevices(data);
      setIsLoading(false);

      // Check if any device currently needs renewal
      const hasUrgent = data.some(d => d.status === 'needs_panel_renewal');
      if (hasUrgent && soundEnabled) {
        playUrgentAlertChime();
      }
    };

    loadData();

    // Setup Real-Time pub/sub
    unsubscribe = subscribeToDevicesRealtime((change) => {
      console.log('[Dashboard Realtime Change]:', change);

      setDevices(prev => {
        const updatedDev = change.device;
        if (!updatedDev) return prev;
        const norm = normalizeMac(updatedDev.mac_address);
        const idx = prev.findIndex(d => normalizeMac(d.mac_address) === norm);

        if (change.type === 'DELETE') {
          return prev.filter(d => normalizeMac(d.mac_address) !== norm);
        }

        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], ...updatedDev };
          return next;
        } else {
          return [updatedDev, ...prev];
        }
      });

      if (change.device?.status === 'needs_panel_renewal') {
        if (soundEnabled) playUrgentAlertChime();
        onNotify?.({
          title: 'ئاگاداری بەپەلەی نوێکردنەوە! 🚨',
          message: `کڕیاری (${change.device.customer_name || change.device.mac_address}) ئەپەکەی کردەوە! هێڵی LionOTT بەسەرچووە؛ 0.1 کرێدیت نوێ بکەوە.`,
          type: 'error'
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [soundEnabled]);

  // Periodic heartbeat / online presence refresh (every 30s)
  useEffect(() => {
    const timer = setInterval(async () => {
      const refreshed = await fetchDevicesRealtime();
      setDevices(refreshed);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute Metrics
  const metrics = useMemo(() => calculateSavingsMetrics(devices), [devices]);

  // Filtered Devices
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        (d.mac_address || '').toLowerCase().includes(q) ||
        (d.customer_name || '').toLowerCase().includes(q) ||
        (d.customer_phone || '').includes(q) ||
        (d.xtream_user || '').toLowerCase().includes(q);

      if (!matchQuery) return false;

      if (statusFilter === 'urgent') return d.status === 'needs_panel_renewal';
      if (statusFilter === 'online') return d.is_online;
      if (statusFilter === 'active') return d.status === 'active';
      if (statusFilter === 'pending') return d.status === 'pending_activation';

      return true;
    });
  }, [devices, searchQuery, statusFilter]);

  // Copy helper
  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onNotify?.({
      title: 'کۆپیکرا 📋',
      message: text,
      type: 'info'
    });
  };

  // M3U Auto-Parser Trigger for Quick Assign Modal
  const handleM3uPasteChange = (val) => {
    setM3uPasteInput(val);
    const parsed = parseM3uUrl(val);
    if (parsed.isValid) {
      setFormServerUrl(parsed.serverUrl);
      setFormUsername(parsed.username);
      setFormPassword(parsed.password);
      onNotify?.({
        title: 'لینکی M3U ناسێندرا! ⚡',
        message: `سێرڤەر: ${parsed.serverUrl} | یوزەر: ${parsed.username}`,
        type: 'success'
      });
    }
  };

  // M3U Auto-Parser Trigger for Hot-Swap Renew Modal
  const handleRenewM3uPasteChange = (val) => {
    setRenewM3uPaste(val);
    const parsed = parseM3uUrl(val);
    if (parsed.isValid) {
      setRenewServerUrl(parsed.serverUrl);
      setRenewUsername(parsed.username);
      setRenewPassword(parsed.password);
      onNotify?.({
        title: 'هێڵی نوێ ناسێندرا! ⚡',
        message: `یوزەرنەیم: ${parsed.username} دیاریکرا`,
        type: 'success'
      });
    }
  };

  // Open Quick Assign Modal
  const handleOpenAssign = (device = null) => {
    if (device) {
      setSelectedDeviceForAssign(device);
      setFormMac(device.mac_address);
      setFormDeviceKey(device.device_key || '7788');
      setFormCustomerName(device.customer_name || '');
      setFormCustomerPhone(device.customer_phone || '');
      setFormServerUrl(device.server_url || 'http://line.liondnscloud.ru:80');
      setFormUsername(device.xtream_user || '292c8215');
      setFormPassword(device.xtream_pass || 'adef5d6e');
    } else {
      setSelectedDeviceForAssign(null);
      setFormMac('DA:B1:24:' + Math.floor(10 + Math.random()*89) + ':' + Math.floor(10 + Math.random()*89) + ':' + Math.floor(10 + Math.random()*89));
      setFormDeviceKey(Math.floor(1000 + Math.random()*9000).toString());
      setFormCustomerName('');
      setFormCustomerPhone('');
      setFormServerUrl('http://line.liondnscloud.ru:80');
      setFormUsername('292c8215');
      setFormPassword('adef5d6e');
    }
    setM3uPasteInput('');
    setIsQuickAssignOpen(true);
  };

  // Submit Quick Assign
  const handleSubmitAssign = async (e) => {
    e.preventDefault();
    if (!formMac.trim() || !formUsername.trim() || !formPassword.trim()) {
      onNotify?.({
        title: 'تکایە هەموو خانەکان پڕبکەرەوە',
        message: 'کۆدی MAC و یوزەر و پاسوۆردی LionOTT پێویستن.',
        type: 'error'
      });
      return;
    }

    try {
      const updated = await assignLineToDevice({
        mac_address: formMac,
        server_url: formServerUrl,
        xtream_user: formUsername,
        xtream_pass: formPassword,
        customer_name: formCustomerName,
        customer_phone: formCustomerPhone,
        app_expiry_days: Number(formAppExpiryDays) || 365,
        panel_expiry_days: Number(formPanelExpiryDays) || 30
      });

      setDevices(prev => {
        const norm = normalizeMac(updated.mac_address);
        const idx = prev.findIndex(d => normalizeMac(d.mac_address) === norm);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updated;
          return next;
        }
        return [updated, ...prev];
      });

      setIsQuickAssignOpen(false);
      onNotify?.({
        title: 'ئامێر چالاککرا و هێڵ بەسترایەوە 🎉',
        message: `ماک: ${updated.mac_address} بە سەرکەوتوویی بەسترایەوە بە هێڵی LionOTT.`,
        type: 'success'
      });
    } catch (err) {
      onNotify?.({
        title: 'هەڵە لە بەستنەوەی هێڵ',
        message: err.message,
        type: 'error'
      });
    }
  };

  // Open Hot-Swap Renew Modal
  const handleOpenRenew = (device) => {
    setSelectedDeviceForRenew(device);
    setRenewM3uPaste('');
    setRenewUsername(device.xtream_user || '292c8215');
    setRenewPassword(device.xtream_pass || 'adef5d6e');
    setRenewServerUrl(device.server_url || 'http://line.liondnscloud.ru:80');
    setIsRenewModalOpen(true);
  };

  // Submit Hot-Swap Renewal
  const handleSubmitRenew = async (e) => {
    e.preventDefault();
    if (!selectedDeviceForRenew) return;

    try {
      const updated = await renewDeviceOneMonth(
        selectedDeviceForRenew.mac_address,
        renewUsername,
        renewPassword,
        renewServerUrl
      );

      setDevices(prev => {
        const norm = normalizeMac(updated.mac_address);
        return prev.map(d => normalizeMac(d.mac_address) === norm ? { ...d, ...updated, status: 'active' } : d);
      });

      setIsRenewModalOpen(false);
      onNotify?.({
        title: 'نوێکردنەوەی خێرای Hot-Swap ئەنجامدرا! ⚡',
        message: `هێڵی (${updated.mac_address}) نوێکرایەوە و لە چەند میلی چرکەیەکدا گەیشتە سەر شاشەی کڕیار.`,
        type: 'success'
      });
    } catch (err) {
      onNotify?.({
        title: 'هەڵە لە نوێکردنەوە',
        message: err.message,
        type: 'error'
      });
    }
  };

  // Inspect Live LionOTT Status
  const handleInspectLionOttStatus = async (device) => {
    setSelectedDeviceForAssign(device);
    setIsInspecting(true);
    setIsStatusInspectorOpen(true);
    setInspectedStatus(null);

    const res = await checkLionOttUpstream(device.xtream_user, device.xtream_pass, device.server_url);
    setInspectedStatus(res);
    setIsInspecting(false);
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans p-3 sm:p-6 lg:p-8 space-y-6 animate-fade-in select-text" dir="rtl">
      
      {/* =========================================================================
          TOP BRANDING & LIVE CONTROLS HEADER
          Deep Red, Black, and Gold Accents (DABIN.tv Official Branding)
         ========================================================================= */}
      <header className="rounded-3xl bg-gradient-to-r from-[#12070A] via-[#1A0B10] to-[#0A0714] border-2 border-red-900/40 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        {/* Subtle Gold / Amber Ambient Radial Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-black/60 border border-amber-500/30 shadow-[0_0_25px_rgba(245,158,11,0.25)] flex items-center justify-center">
              <DabinLogo className="h-10 w-auto" glow={true} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                  DABIN.tv <span className="text-amber-400 font-normal text-sm sm:text-base">Real-Time Middleware & Admin</span>
                </h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-mono font-bold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  REALTIME PUB/SUB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                سیستەمی هۆشمەندی گێڕانەوەی کرێدیت، چاودێری ڕاستەوخۆ و بەستنەوەی کۆدی MAC بە سێرڤەری LionOTT
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
              title={soundEnabled ? 'دەنگی زەنگ چالاکە' : 'دەنگی زەنگ بێدەنگکراوە'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'دەنگ چالاکە' : 'بێدەنگ'}</span>
            </button>

            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('switch_admin_tab', { detail: 'bouquet_builder' }));
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-amber-300 ring-1 ring-white/20 hover:brightness-110"
              title="فلتەرکردن و شاردنەوەی بەشەکان و دروستکردنی بووکێی تایبەت"
            >
              <Crown className="w-4 h-4 text-slate-950" />
              <span>✨ بەڕێوەبەری بەشەکان (Bouquet Builder)</span>
            </button>

            <button
              onClick={() => handleOpenAssign()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center gap-2 cursor-pointer border border-amber-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>زیادکردن و بەستنەوەی هێڵ (M3U)</span>
            </button>

            {onSwitchToTv && (
              <button
                onClick={onSwitchToTv}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/10"
              >
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>کردنەوەی ئەپ (Live TV)</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          CRITICAL SMART SAVING NOTIFICATION BANNER (When any user needs renewal)
         ========================================================================= */}
      {metrics.urgentRenewalCount > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-red-950 via-red-900 to-amber-950 border-2 border-red-500 text-white p-5 shadow-[0_0_35px_rgba(239,68,68,0.35)] flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg shrink-0">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-base font-black text-amber-300 flex items-center gap-2">
                <span>ئاگاداری بەپەلەی سێرڤەر: {metrics.urgentRenewalCount} کڕیار ئێستا ئەپەکەیان کردەوە!</span>
              </h2>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                بەشداربووانی ١ ساڵە کە هێڵی ١ مانگی LionOTTـەکەیان بەسەرچووە ئێستا سەیر دەکەن؛ تەنها بە 0.1 کرێدیت نوێیان بکەرەوە تا کەناڵەکانیان ڕانەوەستێت!
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('urgent')}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            پیشاندانی کڕیارە پەلەکان ({metrics.urgentRenewalCount})
          </button>
        </div>
      )}

      {/* =========================================================================
          LIVE STAT CARDS (Real-Time Synchronized & Smart Savings Meter)
         ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Online Devices Live Pulse */}
        <div className="rounded-3xl bg-slate-900/80 border border-emerald-500/30 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">ئامێرە ئۆنلاینەکان (Live Presence)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-black text-white font-mono">{metrics.onlineCount}</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ئێستا چالاکن
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            هەموو چرکەیەک لە ڕێگەی Heartbeat نوێ دەبێتەوە
          </div>
        </div>

        {/* Card 2: Urgent Renewals (Blinking Red & Gold) */}
        <div className={`rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between transition-all ${
          metrics.urgentRenewalCount > 0
            ? 'bg-red-950/60 border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.25)]'
            : 'bg-slate-900/80 border border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">پێویست بە نوێکردنەوەی 0.1 Cr</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              metrics.urgentRenewalCount > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-white/5 text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className={`text-3xl font-black font-mono ${metrics.urgentRenewalCount > 0 ? 'text-red-400' : 'text-white'}`}>
              {metrics.urgentRenewalCount}
            </span>
            <span className={`text-xs font-bold ${metrics.urgentRenewalCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {metrics.urgentRenewalCount > 0 ? '🚨 کڕیار لەسەر خەتە!' : 'سەقامگیرە'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            کڕیار سەیری ئەپ دەکات و هێڵی مانگانەی تەواو بووە
          </div>
        </div>

        {/* Card 3: Pending MAC Activations */}
        <div className="rounded-3xl bg-slate-900/80 border border-amber-500/30 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">چاوەڕوانی کاراکردنی MAC</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-black text-white font-mono">{metrics.pendingActivationCount}</span>
            <span className="text-xs text-amber-400 font-bold">شاشەی نوێ</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            ئەپەکەیان کردووەتەوە و چاوەڕێی سێرڤەرن
          </div>
        </div>

        {/* Card 4: SMART CREDIT-SAVING METER (The Secret Reseller Profit Multiplier) */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-black border-2 border-amber-500/40 p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>پارێزراوی کرێدیتەکان (Saved)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
              SMART JIT
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-300 font-mono">+{metrics.creditsSaved}</span>
              <span className="text-xs font-bold text-amber-200">Cr گەڕاوەتەوە</span>
            </div>
            <div className="text-xs font-mono text-emerald-400 mt-0.5 font-bold">
              ≈ {(metrics.moneySavedIqd).toLocaleString()} IQD قازانج
            </div>
          </div>

          <div className="text-[10px] text-slate-400 mt-2 border-t border-white/10 pt-2 flex items-center justify-between">
            <span>بەشداربووی ساڵانە: <strong>{metrics.total1YearSubscriptions}</strong></span>
            <span>مەسروفی LionOTT: <strong>{metrics.totalSpentMonthlyCredits} Cr</strong></span>
          </div>
        </div>

      </section>

      {/* =========================================================================
          REAL-TIME DEVICE MANAGER TABLE & FILTER BAR
         ========================================================================= */}
      <section className="rounded-3xl bg-slate-900/90 border border-white/10 p-5 sm:p-7 shadow-2xl space-y-5">
        
        {/* Filter & Search Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>بەڕێوەبردنی ئامێرەکانی DABIN.tv</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/15">
                  {filteredDevices.length} شاشە
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                هەموو گۆڕانکارییەک لە یوزەر و پاسوۆرد دەستبەجێ لەسەر شاشەی کڕیار نوێ دەبێتەوە (Hot-Swapping)
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان بە MAC، ناوی کڕیار، تەلەفۆن، یوزەر..."
              className="w-full pl-3 pr-10 py-2 rounded-xl bg-black/50 border border-white/15 focus:border-amber-400 text-xs text-white placeholder-slate-500 outline-none transition-colors font-mono"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-950 border-white'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
            }`}
          >
            هەموو ({devices.length})
          </button>

          <button
            onClick={() => setStatusFilter('urgent')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'urgent'
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : metrics.urgentRenewalCount > 0
                  ? 'bg-red-950/60 text-red-300 border-red-500/50 animate-pulse'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>پەلەی نوێکردنەوە ({metrics.urgentRenewalCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('online')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'online'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ئۆنلاینەکان ({metrics.onlineCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-cyan-600 text-white border-cyan-500'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
            }`}
          >
            چالاکەکان ({devices.filter(d => d.status === 'active').length})
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
            }`}
          >
            چاوەڕوان ({metrics.pendingActivationCount})
          </button>
        </div>

        {/* Real-Time Devices Table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-black/40">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="border-b border-white/10 bg-white/5 text-[11px] font-bold text-slate-400">
                <tr>
                  <th className="p-4 text-start">کۆدی ماک (MAC) & PIN</th>
                  <th className="p-4 text-start">کڕیار & WhatsApp</th>
                  <th className="p-4 text-start">دۆخ & ئۆنلاین</th>
                  <th className="p-4 text-start">ماوەی کڕیار (١ ساڵ)</th>
                  <th className="p-4 text-start">سێرڤەری LionOTT (١ مانگ)</th>
                  <th className="p-4 text-start">هێڵی بەستراوە</th>
                  <th className="p-4 text-end">کردارەکانی سێرڤەر</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5 font-mono">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                      هیچ ئامێرێک نەدۆزرایەوە بەپێی ئەم گەڕانە.
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map(device => {
                    const isUrgent = device.status === 'needs_panel_renewal';
                    const isOnline = device.is_online;
                    const appExp = device.app_expiry_date ? new Date(device.app_expiry_date) : null;
                    const panelExp = device.panel_expiry_date ? new Date(device.panel_expiry_date) : null;
                    const now = new Date();

                    return (
                      <tr 
                        key={device.id || device.mac_address} 
                        className={`transition-colors ${
                          isUrgent ? 'bg-red-950/40 hover:bg-red-950/60' : 'hover:bg-white/5'
                        }`}
                      >
                        {/* MAC & Device Key */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-cyan-300 text-xs tracking-wider">
                              {device.mac_address}
                            </span>
                            <button
                              onClick={() => handleCopy(device.mac_address, `mac-${device.mac_address}`)}
                              className="text-slate-400 hover:text-white cursor-pointer"
                              title="کۆپیکردنی MAC"
                            >
                              {copiedId === `mac-${device.mac_address}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>PIN: <strong className="text-amber-400">{device.device_key || '----'}</strong></span>
                          </div>
                        </td>

                        {/* Customer & Phone */}
                        <td className="p-4 font-sans">
                          <div className="font-bold text-white text-xs">
                            {device.customer_name || 'کڕیاری تۆمارنەکراو'}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                            <span>{device.customer_phone || 'بێ تەلەفۆن'}</span>
                            {device.customer_phone && (
                              <a
                                href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(device.customer_phone.replace(/[^0-9]/g, ''))}&text=${encodeURIComponent(`سڵاو بەڕێز ${device.customer_name || ''}، خزمەتگوزاری DABIN.tv چالاککراوە.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:text-emerald-300"
                                title="ناردنی پەیامی WhatsApp"
                              >
                                <Send className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Status & Online Presence */}
                        <td className="p-4 font-sans">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              isUrgent
                                ? 'bg-red-500/20 text-red-300 border-red-500 animate-pulse font-black'
                                : device.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : device.status === 'banned'
                                    ? 'bg-slate-700 text-slate-300 border-slate-600'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            }`}>
                              {isUrgent ? '🚨 نوێکردنەوەی 0.1 Cr!' : device.status === 'active' ? 'چالاکە' : device.status === 'banned' ? 'ڕاگیراوە' : 'چاوەڕوانە'}
                            </span>

                            <span className="flex items-center gap-1 text-[11px] text-slate-300">
                              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                              <span>{isOnline ? 'Online' : 'Offline'}</span>
                            </span>
                          </div>
                        </td>

                        {/* App Expiry Date (1 Year) */}
                        <td className="p-4">
                          <div className="text-white text-xs font-bold">
                            {appExp ? appExp.toLocaleDateString('en-GB') : 'دیاری نەکراوە'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                            {appExp && appExp > now ? (
                              <span className="text-emerald-400">
                                {Math.ceil((appExp.getTime() - now.getTime()) / 86400000)} ڕۆژی ماوە
                              </span>
                            ) : (
                              <span className="text-rose-400">بەسەرچووە</span>
                            )}
                          </div>
                        </td>

                        {/* LionOTT Panel Expiry Date (1 Month) */}
                        <td className="p-4">
                          <div className={`text-xs font-bold ${panelExp && panelExp <= now ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
                            {panelExp ? panelExp.toLocaleDateString('en-GB') : 'بێ هێڵ'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                            {panelExp && panelExp > now ? (
                              <span>{Math.ceil((panelExp.getTime() - now.getTime()) / 86400000)} ڕۆژی سێرڤەر ماوە</span>
                            ) : (
                              <span className="text-red-400 font-bold">0.1 کرێدیت تەواوە ⚠️</span>
                            )}
                          </div>
                        </td>

                        {/* Assigned Line Credentials */}
                        <td className="p-4">
                          {device.xtream_user ? (
                            <div>
                              <div className="text-xs font-bold text-slate-200">
                                {device.xtream_user}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-sans">
                                <span>کلیل: {device.xtream_pass}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-sans text-xs">تەرخان نەکراوە</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-end">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            
                            {/* Hot-Swap Renew Button */}
                            <button
                              onClick={() => handleOpenRenew(device)}
                              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
                                isUrgent
                                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black'
                                  : 'bg-white/10 hover:bg-white/20 text-white'
                              }`}
                              title="نوێکردنەوەی خێرا (Hot-Swap)"
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>{isUrgent ? 'نوێکردنەوەی پەلە ⚡' : 'نوێکردنەوە'}</span>
                            </button>

                            {/* Check Live LionOTT Status Button */}
                            {device.xtream_user && (
                              <button
                                onClick={() => handleInspectLionOttStatus(device)}
                                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
                                title="پشکنینی دۆخی سێرڤەری LionOTT لە کاتی ڕاستەقینەدا"
                              >
                                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                              </button>
                            )}

                            {/* Edit / Quick Assign */}
                            <button
                              onClick={() => handleOpenAssign(device)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
                              title="دەستکاریکردنی هێڵ و بەستنەوە"
                            >
                              <Server className="w-3.5 h-3.5 text-amber-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODAL 1: ONE-CLICK QUICK ACTIVATE / ASSIGN M3U LINE (AUTO-PARSER)
         ========================================================================= */}
      {isQuickAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in text-slate-100" dir="rtl">
          <div className="bg-[#0C0E17] border-2 border-amber-500/40 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-red-950 via-[#1A0B10] to-[#0A0714] p-5 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>دیاریکردن و بەستنەوەی هێڵی LionOTT بە ماک</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      AUTO-PARSER
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">تەنها لینکی M3U کۆپی بکە و پەیستی بکە، تەواوی خانەکان خۆیان پڕدەبنەوە</p>
                </div>
              </div>

              <button
                onClick={() => setIsQuickAssignOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAssign} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Intelligent M3U Line Paste Box */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>پەیستی ڕاستەوخۆی لینکی M3U (یان Get.php):</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Auto-Extract Server, User, Pass</span>
                </div>
                <input
                  type="text"
                  value={m3uPasteInput}
                  onChange={(e) => handleM3uPasteChange(e.target.value)}
                  placeholder="http://line.liondnscloud.ru:80/get.php?username=292c8215&password=adef5d6e&type=m3u_plus&output=ts"
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-amber-400/40 text-amber-200 font-mono text-xs outline-none focus:border-amber-400"
                />
              </div>

              {/* Target MAC & PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">کۆدی ماک (MAC Address):</label>
                  <input
                    type="text"
                    required
                    value={formMac}
                    onChange={(e) => setFormMac(e.target.value)}
                    placeholder="DA:B1:24:97:88:12"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 text-cyan-300 font-mono font-bold text-xs outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">کۆدی ئامێر (Device PIN Key):</label>
                  <input
                    type="text"
                    value={formDeviceKey}
                    onChange={(e) => setFormDeviceKey(e.target.value)}
                    placeholder="7788"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 text-amber-300 font-mono font-bold text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Extracted LionOTT Server Credentials */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3 font-mono">
                <span className="text-[10px] text-slate-400 font-sans font-bold block">زانیارییە دەرهێنراوەکانی سێرڤەر:</span>
                
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Server Host URL:</label>
                  <input
                    type="text"
                    required
                    value={formServerUrl}
                    onChange={(e) => setFormServerUrl(e.target.value)}
                    className="w-full p-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Username:</label>
                    <input
                      type="text"
                      required
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/50 border border-white/15 text-amber-300 font-bold text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Password:</label>
                    <input
                      type="text"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full p-2 rounded-xl bg-black/50 border border-white/15 text-amber-300 font-bold text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Note & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">ناوی کڕیار (تێبینی ئەدمین):</label>
                  <input
                    type="text"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="بۆ نمونە: کاروان عەلی"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">ژمارەی WhatsApp:</label>
                  <input
                    type="text"
                    value={formCustomerPhone}
                    onChange={(e) => setFormCustomerPhone(e.target.value)}
                    placeholder="+964 770 000 0000"
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/15 text-white text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Subscriptions Duration Config (Smart Saving) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30">
                  <span className="text-[10px] text-cyan-300 font-bold block mb-1">ماوەی ئەپ بۆ کڕیار (App Expiry):</span>
                  <select
                    value={formAppExpiryDays}
                    onChange={(e) => setFormAppExpiryDays(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-cyan-400/40 text-cyan-200 text-xs font-bold outline-none"
                  >
                    <option value={365}>١ ساڵی تەواو (365 Days) - بەهای 1.0 Cr</option>
                    <option value={180}>٦ مانگ (180 Days)</option>
                    <option value={90}>٣ مانگ (90 Days)</option>
                    <option value={30}>١ مانگ (30 Days)</option>
                    <option value={1}>تێستی ٢٤ کاتژمێر (1 Day)</option>
                  </select>
                </div>

                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30">
                  <span className="text-[10px] text-amber-300 font-bold block mb-1">هێڵی دەستپێکی LionOTT (0.1 Cr):</span>
                  <select
                    value={formPanelExpiryDays}
                    onChange={(e) => setFormPanelExpiryDays(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-slate-900 border border-amber-400/40 text-amber-200 text-xs font-bold outline-none"
                  >
                    <option value={30}>١ مانگ (30 Days - مەسروفی 0.1 Cr تەنها)</option>
                    <option value={60}>٢ مانگ (60 Days)</option>
                    <option value={1}>تێستی ١ ڕۆژ</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsQuickAssignOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  تۆمارکردن و بەستنەوە بە شاشە ✓
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: URGENT HOT-SWAP RENEW MODAL (Instant Refresh On Client Screen)
         ========================================================================= */}
      {isRenewModalOpen && selectedDeviceForRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in text-slate-100" dir="rtl">
          <div className="bg-[#0C0E17] border-2 border-red-500 rounded-3xl shadow-[0_0_50px_rgba(239,68,68,0.3)] max-w-lg w-full overflow-hidden flex flex-col animate-scale-up">
            
            <div className="bg-gradient-to-r from-red-950 via-red-900 to-black p-5 border-b border-red-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-600 text-white shadow-lg">
                  <Zap className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-300">
                    نوێکردنەوەی خێرای هێڵ (Instant Hot-Swap)
                  </h3>
                  <p className="text-xs text-slate-300 font-mono">{selectedDeviceForRenew.mac_address}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRenew} className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-slate-300 space-y-1">
                <div className="font-bold text-white text-xs">
                  کڕیار: {selectedDeviceForRenew.customer_name || 'بەکارهێنەری ساڵانە'}
                </div>
                <div className="text-[11px] text-slate-400">
                  ماوەی کڕیار بەپێی ئەپ تا <strong className="text-emerald-400 font-mono">{selectedDeviceForRenew.app_expiry_date ? new Date(selectedDeviceForRenew.app_expiry_date).toLocaleDateString('en-GB') : '١ ساڵ'}</strong> چالاکە.
                </div>
                <div className="text-[11px] text-amber-300">
                  تەنها هێڵە ١ مانگییە تازەکەی LionOTT (0.1 Cr) لێرە دابنێ؛ لە چرکەیەکدا پەخشی شاشەکەی دەکرێتەوە!
                </div>
              </div>

              {/* Paste new M3U */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">پەیستی هێڵی نوێی M3U:</label>
                <input
                  type="text"
                  value={renewM3uPaste}
                  onChange={(e) => handleRenewM3uPasteChange(e.target.value)}
                  placeholder="پەیستی لینکی نوێی LionOTT..."
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-amber-400/40 text-amber-200 font-mono text-xs outline-none"
                />
              </div>

              {/* User & Pass */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Username:</label>
                  <input
                    type="text"
                    required
                    value={renewUsername}
                    onChange={(e) => setRenewUsername(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 text-white font-bold text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Password:</label>
                  <input
                    type="text"
                    required
                    value={renewPassword}
                    onChange={(e) => setRenewPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/15 text-white font-bold text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-black text-xs shadow-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>نوێکردنەوە و ناردنی دەستبەجێ بۆ شاشە (Hot-Swap) ✓</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: LIVE LIONOTT UPSTREAM STATUS INSPECTOR MODAL
         ========================================================================= */}
      {isStatusInspectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in text-slate-100" dir="rtl">
          <div className="bg-[#0C0E17] border border-cyan-500/40 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-scale-up">
            
            <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-black p-5 border-b border-cyan-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">پشکنینی دۆخی سێرڤەری LionOTT (Live Ping)</h3>
              </div>
              <button
                onClick={() => setIsStatusInspectorOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              {isInspecting ? (
                <div className="py-8 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-slate-400 font-sans">خەریکی پەیوەندی کردنە بە player_api.php لە سێرڤەری LionOTT...</p>
                </div>
              ) : inspectedStatus ? (
                <div className="space-y-3 font-mono">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-slate-400 font-sans">دۆخی هەژمار:</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      inspectedStatus.isExpired ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {inspectedStatus.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-slate-400 font-sans">بەسەرچوون لە سێرڤەر:</span>
                    <span className="text-amber-300 font-bold">{inspectedStatus.expDateFormatted}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <span className="text-slate-400 font-sans">پەیوەندی چالاک (Active Cons):</span>
                    <span className="text-cyan-300 font-bold">{inspectedStatus.activeConnections} / {inspectedStatus.maxConnections}</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-sans">ناونیشانی سێرڤەر:</span>
                    <span className="text-slate-300">{inspectedStatus.serverUrl}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-rose-400 font-sans">پەیوەندی لەگەڵ سێرڤەر سەرکەوتوو نەبوو.</div>
              )}

              <button
                onClick={() => setIsStatusInspectorOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-sans font-bold text-xs"
              >
                داخستن
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
