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
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  Wifi, 
  Smartphone, 
  CheckCircle2, 
  X, 
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
  Crown,
  Trash2,
  Edit3,
  Calendar,
  Monitor
} from 'lucide-react';
import DabinLogo from './DabinLogo';
import { 
  fetchDevicesRealtime, 
  subscribeToDevicesRealtime, 
  assignLineToDevice, 
  renewDeviceOneMonth, 
  checkLionOttUpstream, 
  calculateSavingsMetrics, 
  playUrgentAlertChime,
  deleteDeviceRealtime,
  wipeAllDevicesRealtime
} from '../data/dabinRealtimeService';
import { parseM3uUrl } from '../utils/m3uParser';
import { normalizeMac } from '../data/deviceManager';

// Duration Presets requested for subscriptions
const DURATION_PRESETS = [
  { label: 'تێستی ١٢ کاتژمێری', days: 0.5, desc: '12 Hours Trial' },
  { label: 'تێستی ٢٤ کاتژمێری', days: 1, desc: '24 Hours Trial' },
  { label: '١ مانگ', days: 30, desc: '30 Days' },
  { label: '٣ مانگ', days: 90, desc: '90 Days' },
  { label: '٦ مانگ', days: 180, desc: '180 Days' },
  { label: '١٢ مانگ (١ ساڵ)', days: 365, desc: '365 Days Full' },
];

export default function DabinRealtimeAdminDashboard({ onSwitchToTv, onNotify }) {
  // State
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // Quick Assign Form State (Pure MAC, NO PIN)
  const [m3uPasteInput, setM3uPasteInput] = useState('');
  const [formMac, setFormMac] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formServerUrl, setFormServerUrl] = useState('http://line.liondnscloud.ru:80');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formAppExpiryDays, setFormAppExpiryDays] = useState(365);
  const [formPanelExpiryDays, setFormPanelExpiryDays] = useState(30);

  // Hot-Swap Renew Form State
  const [renewM3uPaste, setRenewM3uPaste] = useState('');
  const [renewUsername, setRenewUsername] = useState('');
  const [renewPassword, setRenewPassword] = useState('');
  const [renewServerUrl, setRenewServerUrl] = useState('http://line.liondnscloud.ru:80');

  // Load Initial Devices & Subscribe to Realtime Updates
  useEffect(() => {
    let unsubscribe = () => {};

    const loadData = async () => {
      setIsLoading(true);
      const data = await fetchDevicesRealtime();
      setDevices(data);
      setIsLoading(false);

      const hasUrgent = data.some(d => d.status === 'needs_panel_renewal');
      if (hasUrgent && soundEnabled) {
        playUrgentAlertChime();
      }
    };

    loadData();

    unsubscribe = subscribeToDevicesRealtime((change) => {
      setDevices(prev => {
        const updatedDev = change.device;
        if (!updatedDev) return prev;
        const norm = normalizeMac(updatedDev.mac_address);
        const idx = prev.findIndex(d => normalizeMac(d.mac_address) === norm);

        if (change.type === 'WIPE_ALL') {
          return [];
        }

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

  // Periodic Auto-Discovery & Online Presence Poll (every 3s as requested for immediate auto-refresh)
  useEffect(() => {
    let isSubscribed = true;
    const pollDevices = async () => {
      try {
        const refreshed = await fetchDevicesRealtime();
        if (isSubscribed && Array.isArray(refreshed)) {
          setDevices(prev => {
            if (JSON.stringify(prev) === JSON.stringify(refreshed)) return prev;
            return refreshed;
          });
        }
      } catch (e) {}
    };

    const timer = setInterval(pollDevices, 3000);
    return () => {
      isSubscribed = false;
      clearInterval(timer);
    };
  }, []);

  // Manual Refresh Handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await fetchDevicesRealtime();
      setDevices(refreshed);
      onNotify?.({
        title: 'نوێکرایەوە 🔄',
        message: `${refreshed.length} ئامێر لە داتابەیس بارکرانەوە.`,
        type: 'info'
      });
    } catch (e) {
      onNotify?.({ title: 'هەڵە لە نوێکردنەوە', message: e.message, type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

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

  // Open Quick Assign Modal (Pure MAC, no PIN)
  const handleOpenAssign = (device = null) => {
    if (device) {
      setSelectedDeviceForAssign(device);
      setFormMac(device.mac_address);
      setFormCustomerName(device.customer_name || '');
      setFormCustomerPhone(device.customer_phone || '');
      setFormServerUrl(device.server_url || 'http://line.liondnscloud.ru:80');
      setFormUsername(device.xtream_user || '');
      setFormPassword(device.xtream_pass || '');
      setFormAppExpiryDays(365);
      setFormPanelExpiryDays(30);
    } else {
      setSelectedDeviceForAssign(null);
      setFormMac('K0:B1:24:' + Math.floor(10 + Math.random()*89) + ':' + Math.floor(10 + Math.random()*89) + ':' + Math.floor(10 + Math.random()*89));
      setFormCustomerName('');
      setFormCustomerPhone('');
      setFormServerUrl('http://line.liondnscloud.ru:80');
      setFormUsername('');
      setFormPassword('');
      setFormAppExpiryDays(365);
      setFormPanelExpiryDays(30);
    }
    setM3uPasteInput('');
    setIsQuickAssignOpen(true);
  };

  // Submit Quick Assign
  const handleSubmitAssign = async (e) => {
    e.preventDefault();
    if (!formMac.trim() || !formUsername.trim() || !formPassword.trim()) {
      onNotify?.({
        title: 'تکایە خانە پێویستەکان پڕبکەرەوە',
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
        title: 'ئامێر چالاککرا و هێڵ بەسترایەوە ✓',
        message: `ماک: ${updated.mac_address} بە سەرکەوتوویی لەگەڵ سێرڤەر ڕێکخرا.`,
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
    setRenewUsername(device.xtream_user || '');
    setRenewPassword(device.xtream_pass || '');
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
        title: 'نوێکردنەوەی Hot-Swap ئەنجامدرا ✓',
        message: `هێڵی (${updated.mac_address}) بە خێرایی نوێکرایەوە و گەیشتە سەر شاشەی کڕیار.`,
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

  // Delete a single device
  const handleDeleteDevice = async (device) => {
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی ئامێری (${device.mac_address}) لە سیستەم؟`)) return;
    try {
      await deleteDeviceRealtime(device.mac_address);
      setDevices(prev => prev.filter(d => normalizeMac(d.mac_address) !== normalizeMac(device.mac_address)));
      onNotify?.({
        title: 'ئامێر سڕایەوە 🗑️',
        message: `ئامێری ${device.mac_address} لە ئەدمین پانێڵ سڕایەوە.`,
        type: 'info'
      });
    } catch (err) {
      onNotify?.({ title: 'هەڵە لە سڕینەوە', message: err.message, type: 'error' });
    }
  };

  // Wipe / Reset All devices to 0
  const handleWipeAll = async () => {
    if (!window.confirm('ئایا دڵنیایت لە سڕینەوە و پاککردنەوەی هەموو ئامێرەکان؟ سیستەمەکە بە فرێشی ڕێکدەخرێتەوە.')) return;
    try {
      await wipeAllDevicesRealtime();
      setDevices([]);
      onNotify?.({
        title: 'ئەدمین پانێڵ پاککرایەوە 🧹',
        message: 'هەموو ئامێرەکان سڕانەوە (0 Devices). هەر ئامێرێک ئەپ بکاتەوە، ئۆتۆماتیکی وەک ئامێری نوێ تۆمار دەبێت.',
        type: 'success'
      });
    } catch (err) {
      onNotify?.({ title: 'هەڵە لە سفرکردنەوە', message: err.message, type: 'error' });
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
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 font-sans p-3 sm:p-5 lg:p-6 space-y-4 select-text" dir="rtl">
      
      {/* =========================================================================
          MICROSOFT ERP COMMAND BAR RIBBON (Dynamics 365 / Business Central Style)
         ========================================================================= */}
      <header className="rounded-lg bg-[#111726] border border-[#222E46] p-3 sm:p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Left: Module Identity & Status */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-[#0078D4] flex items-center justify-center text-white shadow-sm shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">
                KOBIN TV <span className="text-[#0078D4] font-medium">Business Central ERP</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Cloud Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              سیستەمی بەڕێوەبردنی ئامێرەکان، بەستنەوەی کۆدی MAC و دابەشکردنی سێرڤەر بە شێوەی ERP
            </p>
          </div>
        </div>

        {/* Right: Fluent Action Command Bar */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          
          {/* Refresh Action */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded-md bg-[#182236] hover:bg-[#202C44] text-slate-200 border border-[#2B3A56] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="نوێکردنەوەی دەستبەجێی لیستی ئامێرەکان (خۆکارانە هەموو ٣ چرکە جارێک نوێ دەبێتەوە)"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>نوێکردنەوەی ئامێرەکان (Refresh)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Auto-refresh active (3s)" />
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-md border text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              soundEnabled
                ? 'bg-[#182236] text-amber-300 border-amber-500/40'
                : 'bg-[#182236] text-slate-400 border-[#2B3A56]'
            }`}
            title={soundEnabled ? 'دەنگی زەنگ چالاکە' : 'دەنگی زەنگ بێدەنگکراوە'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Bouquet Builder */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('switch_admin_tab', { detail: 'bouquet_builder' }));
            }}
            className="px-3 py-1.5 rounded-md bg-[#182236] hover:bg-[#202C44] text-slate-200 border border-[#2B3A56] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="فلتەرکردن و شاردنەوەی بەشەکان و دروستکردنی بووکێی تایبەت"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>بەڕێوەبەری بەشەکان</span>
          </button>

          {/* Wipe All (Fresh Start) */}
          {devices.length > 0 && (
            <button
              onClick={handleWipeAll}
              className="px-3 py-1.5 rounded-md bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 border border-rose-500/40 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
              title="سڕینەوەی هەموو ئامێرەکان بۆ دەستپێکی نوێ"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>سفرکردنەوە</span>
            </button>
          )}

          {/* New Line / Assign Button (Primary Action - Microsoft Blue) */}
          <button
            onClick={() => handleOpenAssign()}
            className="px-4 py-1.5 rounded-md bg-[#0078D4] hover:bg-[#106EBE] text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>بەستنەوەی هێڵی نوێ</span>
          </button>

          {/* Switch to Live TV */}
          {onSwitchToTv && (
            <button
              onClick={onSwitchToTv}
              className="px-3 py-1.5 rounded-md bg-[#182236] hover:bg-[#202C44] text-slate-200 border border-[#2B3A56] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live TV</span>
            </button>
          )}

        </div>
      </header>

      {/* =========================================================================
          URGENT NOTIFICATION STRIP (Fluent Alert Banner)
         ========================================================================= */}
      {devices.length > 0 && metrics.urgentRenewalCount > 0 && (
        <div className="rounded-lg bg-[#2E1015] border-l-4 border-l-[#D13438] border border-[#521B24] p-3 sm:p-4 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#D13438] text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>ئاگاداری: {metrics.urgentRenewalCount} کڕیار ئێستا ئەپەکەیان کردەوە و هێڵەکەیان تەواوە!</span>
              </h2>
              <p className="text-[11px] text-slate-300 mt-0.5">
                تەنها بە 0.1 کرێدیت هێڵی مانگانەیان نوێ بکەرەوە تا کەناڵەکانیان ڕانەوەستێت.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('urgent')}
            className="px-3.5 py-1.5 rounded-md bg-[#D13438] hover:bg-[#A82A2D] text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer shrink-0 self-end md:self-auto"
          >
            پیشاندانی کڕیارە پەلەکان ({metrics.urgentRenewalCount})
          </button>
        </div>
      )}

      {/* =========================================================================
          MICROSOFT ERP KPI METRIC TILES (Dynamics 365 Tiles)
         ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* Tile 1: Online Presence (Fluent Green #107C41) */}
        <div className="rounded-lg bg-[#111726] border border-[#222E46] border-t-2 border-t-[#107C41] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">ئامێرە ئۆنلاینەکان (Live Presence)</span>
            <div className="w-6 h-6 rounded bg-[#107C41]/20 flex items-center justify-center text-[#107C41]">
              <Wifi className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{metrics.onlineCount}</span>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              لە سەرخەتن
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 border-t border-[#1C263A] pt-1.5">
            چاودێری ڕاستەوخۆ لە ڕێگەی Heartbeat
          </div>
        </div>

        {/* Tile 2: Urgent Renewal (Fluent Crimson #D13438) */}
        <div className={`rounded-lg p-4 shadow-sm flex flex-col justify-between border ${
          metrics.urgentRenewalCount > 0
            ? 'bg-[#1F1418] border-[#591C26] border-t-2 border-t-[#D13438]'
            : 'bg-[#111726] border-[#222E46] border-t-2 border-t-[#D13438]'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">پێویست بە نوێکردنەوە (0.1 Cr)</span>
            <div className={`w-6 h-6 rounded flex items-center justify-center ${
              metrics.urgentRenewalCount > 0 ? 'bg-[#D13438] text-white' : 'bg-white/5 text-slate-400'
            }`}>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${metrics.urgentRenewalCount > 0 ? 'text-[#FF5C61]' : 'text-white'}`}>
              {metrics.urgentRenewalCount}
            </span>
            <span className="text-[11px] text-slate-400">
              {metrics.urgentRenewalCount > 0 ? '🚨 پێویستی بە نوێکردنەوەیە' : 'سەقامگیرە'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 border-t border-[#1C263A] pt-1.5">
            کڕیار سەیری ئەپ دەکات و هێڵی بەسەرچووە
          </div>
        </div>

        {/* Tile 3: Pending Activation (Fluent Amber #FFB900) */}
        <div className="rounded-lg bg-[#111726] border border-[#222E46] border-t-2 border-t-[#FFB900] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">چاوەڕوانی کاراکردنی MAC</span>
            <div className="w-6 h-6 rounded bg-[#FFB900]/20 flex items-center justify-center text-[#FFB900]">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">{metrics.pendingActivationCount}</span>
            <span className="text-[11px] text-amber-300 font-medium">ئامێری نوێ</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 border-t border-[#1C263A] pt-1.5">
            ئەپەکەیان کردووەتەوە و چاوەڕێی هێڵن
          </div>
        </div>

        {/* Tile 4: Credit Savings & Profit (Microsoft Blue #0078D4) */}
        <div className="rounded-lg bg-[#111726] border border-[#222E46] border-t-2 border-t-[#0078D4] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-semibold text-slate-300">کرێدیتی پارێزراو (Credit Savings)</span>
            <div className="w-6 h-6 rounded bg-[#0078D4]/20 flex items-center justify-center text-[#0078D4]">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white font-mono">+{metrics.creditsSaved}</span>
              <span className="text-[11px] text-cyan-300 font-mono">Cr</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 font-semibold">
              ≈ {(metrics.moneySavedIqd).toLocaleString()} IQD
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 border-t border-[#1C263A] pt-1.5 flex items-center justify-between">
            <span>بەشداربووی ساڵانە: <strong>{metrics.total1YearSubscriptions}</strong></span>
            <span>مەسروف: <strong>{metrics.totalSpentMonthlyCredits} Cr</strong></span>
          </div>
        </div>

      </section>

      {/* =========================================================================
          MICROSOFT ERP DATAGRID (Business Central List Page)
         ========================================================================= */}
      <section className="rounded-lg bg-[#111726] border border-[#222E46] shadow-sm overflow-hidden">
        
        {/* Toolbar & Filter Tabs */}
        <div className="p-3 sm:p-4 border-b border-[#222E46] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* View Filter Segmented Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs scrollbar-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#0078D4] text-white'
                  : 'bg-[#182236] hover:bg-[#202C44] text-slate-300 border border-[#2B3A56]'
              }`}
            >
              هەموو ({devices.length})
            </button>

            <button
              onClick={() => setStatusFilter('urgent')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                statusFilter === 'urgent'
                  ? 'bg-[#D13438] text-white'
                  : metrics.urgentRenewalCount > 0
                    ? 'bg-rose-950/40 text-rose-300 border border-rose-500/50'
                    : 'bg-[#182236] hover:bg-[#202C44] text-slate-300 border border-[#2B3A56]'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-300" />
              <span>پەلە ({metrics.urgentRenewalCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('online')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                statusFilter === 'online'
                  ? 'bg-[#107C41] text-white'
                  : 'bg-[#182236] hover:bg-[#202C44] text-slate-300 border border-[#2B3A56]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>ئۆنلاین ({metrics.onlineCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-[#0078D4] text-white'
                  : 'bg-[#182236] hover:bg-[#202C44] text-slate-300 border border-[#2B3A56]'
              }`}
            >
              چالاکەکان ({devices.filter(d => d.status === 'active').length})
            </button>

            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-[#FFB900] text-slate-950 font-bold'
                  : 'bg-[#182236] hover:bg-[#202C44] text-slate-300 border border-[#2B3A56]'
              }`}
            >
              چاوەڕوان ({metrics.pendingActivationCount})
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="گەڕان بە MAC، ناوی کڕیار، یوزەر..."
              className="w-full pl-3 pr-9 py-1.5 rounded-md bg-[#0A0E17] border border-[#2B3A56] focus:border-[#0078D4] text-xs text-white placeholder-slate-500 outline-none transition-colors font-mono"
            />
          </div>

        </div>

        {/* DataGrid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead className="bg-[#151D2E] text-[11px] font-semibold text-slate-300 border-b border-[#222E46]">
              <tr>
                <th className="p-3 text-start">کۆدی ماک (MAC Address)</th>
                <th className="p-3 text-start">کڕیار & پەیوەندی</th>
                <th className="p-3 text-start">دۆخ & ئۆنلاین</th>
                <th className="p-3 text-start">ماوەی ئەپ (App Expiry)</th>
                <th className="p-3 text-start">هێڵی سێرڤەر (LionOTT)</th>
                <th className="p-3 text-start">یوزەرنەیم</th>
                <th className="p-3 text-end">کردارەکان</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#1D273B] font-mono text-xs">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center font-sans">
                    <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-md bg-[#182236] border border-[#2B3A56] flex items-center justify-center text-[#0078D4]">
                        <Monitor className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-semibold text-white">هیچ ئامێرێک لە سیستەمدا نییە</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        کاتێک هەر کڕیارێک یان مۆبایلێک ئەپەکە دەکاتەوە، لە یەکەم چرکەدا کۆدی MAC لێرە تۆمار دەبێت و دەتوانیت هێڵی سێرڤەری بۆ دابنێیت.
                      </p>
                    </div>
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
                        isUrgent 
                          ? 'bg-[#2E1418] hover:bg-[#381A20]' 
                          : 'hover:bg-[#161F32]'
                      }`}
                    >
                      {/* MAC Address (Pure MAC, No PIN) */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-cyan-300 text-xs tracking-wider">
                            {device.mac_address}
                          </span>
                          <button
                            onClick={() => handleCopy(device.mac_address, `mac-${device.mac_address}`)}
                            className="text-slate-400 hover:text-white cursor-pointer p-0.5"
                            title="کۆپیکردنی MAC"
                          >
                            {copiedId === `mac-${device.mac_address}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] border border-slate-700">
                            {device.customer_name?.includes('Android') || device.customer_name?.includes('Phone') ? 'Mobile' : 'Device'}
                          </span>
                          {device.device_key && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 text-[9px] border border-amber-800/50 font-mono" title="Device PIN Key">
                              🔑 PIN: {device.device_key}
                            </span>
                          )}
                          {(device.ip_address || device.deviceIp) && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 text-[9px] border border-cyan-800/50 font-mono" title="Public IP">
                              🌐 {device.ip_address || device.deviceIp}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer & Phone */}
                      <td className="p-3 font-sans">
                        <div className="font-semibold text-white text-xs">
                          {device.customer_name || 'کڕیاری نوێ'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>{device.customer_phone || '—'}</span>
                          {device.customer_phone && (
                            <a
                              href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(device.customer_phone.replace(/[^0-9]/g, ''))}&text=${encodeURIComponent(`سڵاو بەڕێز ${device.customer_name || ''}، خزمەتگوزاری KOBIN.tv بۆ ئەم ئامێرە (${device.mac_address}) چالاککرا.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300"
                              title="ناردنی نامەی WhatsApp"
                            >
                              <Send className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Status & Online Presence */}
                      <td className="p-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            isUrgent
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                              : device.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : device.status === 'banned'
                                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}>
                            {isUrgent ? 'پەلە 🚨' : device.status === 'active' ? 'چالاکە' : device.status === 'banned' ? 'ڕاگیراوە' : 'چاوەڕوانە'}
                          </span>

                          <span className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span>{isOnline ? 'Online' : 'Offline'}</span>
                          </span>
                        </div>
                      </td>

                      {/* App Expiry Date */}
                      <td className="p-3">
                        <div className="text-white text-xs font-semibold">
                          {appExp ? appExp.toLocaleDateString('en-GB') : 'دیاری نەکراوە'}
                        </div>
                        <div className="text-[10px] font-sans mt-0.5">
                          {appExp && appExp > now ? (
                            <span className="text-emerald-400 font-medium">
                              {Math.ceil((appExp.getTime() - now.getTime()) / 86400000)} ڕۆژ ماوە
                            </span>
                          ) : appExp ? (
                            <span className="text-rose-400">بەسەرچووە</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </div>
                      </td>

                      {/* Server Panel Expiry */}
                      <td className="p-3">
                        <div className={`text-xs font-semibold ${panelExp && panelExp <= now ? 'text-rose-400' : 'text-amber-300'}`}>
                          {panelExp ? panelExp.toLocaleDateString('en-GB') : 'بێ هێڵ'}
                        </div>
                        <div className="text-[10px] font-sans mt-0.5">
                          {panelExp && panelExp > now ? (
                            <span className="text-slate-400">{Math.ceil((panelExp.getTime() - now.getTime()) / 86400000)} ڕۆژی سێرڤەر ماوە</span>
                          ) : panelExp ? (
                            <span className="text-rose-400 font-bold">بەسەرچووە ⚠️</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Line */}
                      <td className="p-3">
                        {device.xtream_user ? (
                          <div>
                            <div className="text-xs font-semibold text-slate-200">
                              {device.xtream_user}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-sans">
                              پاسۆرد: {device.xtream_pass}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-sans text-xs">تەرخان نەکراوە</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-end">
                        <div className="flex items-center justify-end gap-1.5 font-sans">
                          
                          {/* Hot-Swap Renew */}
                          <button
                            onClick={() => handleOpenRenew(device)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                              isUrgent
                                ? 'bg-[#D13438] hover:bg-[#A82A2D] text-white shadow-sm'
                                : 'bg-[#182236] hover:bg-[#202C44] text-slate-200 border border-[#2B3A56]'
                            }`}
                            title="نوێکردنەوەی خێرای هێڵ (Hot-Swap)"
                          >
                            <Zap className="w-3 h-3 text-amber-300" />
                            <span>{isUrgent ? 'نوێکردنەوە ⚡' : 'نوێکردنەوە'}</span>
                          </button>

                          {/* Inspect Status */}
                          {device.xtream_user && (
                            <button
                              onClick={() => handleInspectLionOttStatus(device)}
                              className="p-1 rounded-md bg-[#182236] hover:bg-[#202C44] text-slate-300 border border-[#2B3A56] transition-colors cursor-pointer"
                              title="پشکنینی دۆخی سێرڤەر"
                            >
                              <Activity className="w-3.5 h-3.5 text-cyan-400" />
                            </button>
                          )}

                          {/* Edit / Quick Assign */}
                          <button
                            onClick={() => handleOpenAssign(device)}
                            className="p-1 rounded-md bg-[#182236] hover:bg-[#202C44] text-slate-300 border border-[#2B3A56] transition-colors cursor-pointer"
                            title="دەستکاریکردنی زانیارییەکان"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteDevice(device)}
                            className="p-1 rounded-md bg-[#182236] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#2B3A56] hover:border-rose-500/30 transition-colors cursor-pointer"
                            title="سڕینەوەی ئامێر لە سیستەم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </section>

      {/* =========================================================================
          MICROSOFT ERP DIALOG 1: ASSIGN / EDIT LINE (With Preset Duration Chips)
         ========================================================================= */}
      {isQuickAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in text-slate-100" dir="rtl">
          <div className="bg-[#111726] border border-[#2B3A56] rounded-lg shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
            
            {/* Header */}
            <div className="bg-[#151D2E] p-4 border-b border-[#222E46] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#0078D4] text-white flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">بەستنەوە و دیاریکردنی هێڵی سێرڤەر (Device Provisioning)</h3>
                  <p className="text-[11px] text-slate-400">دیاریکردنی ماوەی بەشداری و بەستنەوە بە کۆدی MAC</p>
                </div>
              </div>

              <button
                onClick={() => setIsQuickAssignOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAssign} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Intelligent M3U Auto-Extractor */}
              <div className="p-3 rounded-md bg-[#151D2E] border border-[#2B3A56] space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>پەیستی ڕاستەوخۆی لینکی M3U (یان Get.php):</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Auto-Extract Server, User, Pass</span>
                </div>
                <input
                  type="text"
                  value={m3uPasteInput}
                  onChange={(e) => handleM3uPasteChange(e.target.value)}
                  placeholder="http://line.liondnscloud.ru:80/get.php?username=...&password=..."
                  className="w-full p-2 rounded bg-[#0A0E17] border border-[#2B3A56] text-amber-200 font-mono text-xs outline-none focus:border-[#0078D4]"
                />
              </div>

              {/* Target MAC Address (PURE MAC, NO PIN) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">کۆدی ماک (MAC Address):</label>
                <input
                  type="text"
                  required
                  value={formMac}
                  onChange={(e) => setFormMac(e.target.value)}
                  placeholder="K0:B1:24:XX:XX:XX"
                  className="w-full p-2 rounded bg-[#0A0E17] border border-[#2B3A56] text-cyan-300 font-mono font-bold text-xs outline-none focus:border-[#0078D4]"
                />
              </div>

              {/* SUBSCRIPTION DURATION SELECTOR (The exact presets requested by user) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                  ماوەی بەشداری کڕیار (Subscription Duration):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-sans">
                  {DURATION_PRESETS.map((p) => {
                    const isSelected = formAppExpiryDays === p.days;
                    return (
                      <button
                        key={p.days}
                        type="button"
                        onClick={() => setFormAppExpiryDays(p.days)}
                        className={`p-2 rounded-md border text-center transition-colors cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-[#0078D4] border-[#0078D4] text-white font-bold shadow-sm'
                            : 'bg-[#151D2E] border-[#2B3A56] hover:bg-[#1D273B] text-slate-300'
                        }`}
                      >
                        <span className="text-xs">{p.label}</span>
                        <span className="text-[10px] text-slate-300/80 font-mono mt-0.5">{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Extracted Server Credentials */}
              <div className="p-3 rounded-md bg-[#151D2E] border border-[#2B3A56] space-y-2.5 font-mono">
                <span className="text-[10px] text-slate-400 font-sans font-semibold block">زانیارییەکانی سێرڤەر:</span>
                
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Server Host URL:</label>
                  <input
                    type="text"
                    required
                    value={formServerUrl}
                    onChange={(e) => setFormServerUrl(e.target.value)}
                    className="w-full p-1.5 rounded bg-[#0A0E17] border border-[#2B3A56] text-white text-xs outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Username:</label>
                    <input
                      type="text"
                      required
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full p-1.5 rounded bg-[#0A0E17] border border-[#2B3A56] text-amber-300 font-bold text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-0.5">Password:</label>
                    <input
                      type="text"
                      required
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full p-1.5 rounded bg-[#0A0E17] border border-[#2B3A56] text-amber-300 font-bold text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">ناوی کڕیار (تێبینی):</label>
                  <input
                    type="text"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="بۆ نمونە: کڕیاری سلێمانی"
                    className="w-full p-2 rounded bg-[#0A0E17] border border-[#2B3A56] text-white text-xs outline-none focus:border-[#0078D4]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">ژمارەی تەلەفۆن / WhatsApp:</label>
                  <input
                    type="text"
                    value={formCustomerPhone}
                    onChange={(e) => setFormCustomerPhone(e.target.value)}
                    placeholder="+964 7XX XXX XXXX"
                    className="w-full p-2 rounded bg-[#0A0E17] border border-[#2B3A56] text-white text-xs outline-none font-mono focus:border-[#0078D4]"
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-[#222E46] flex items-center justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsQuickAssignOpen(false)}
                  className="px-3.5 py-1.5 rounded-md bg-[#182236] hover:bg-[#202C44] text-slate-300 border border-[#2B3A56] text-xs font-medium cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 rounded-md bg-[#0078D4] hover:bg-[#106EBE] text-white font-semibold text-xs shadow-sm cursor-pointer active:scale-95"
                >
                  تۆمارکردن و بەستنەوە ✓
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MICROSOFT ERP DIALOG 2: INSTANT HOT-SWAP RENEW MODAL
         ========================================================================= */}
      {isRenewModalOpen && selectedDeviceForRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in text-slate-100" dir="rtl">
          <div className="bg-[#111726] border border-[#2B3A56] rounded-lg shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-scale-up">
            
            <div className="bg-[#151D2E] p-4 border-b border-[#222E46] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-[#D13438] text-white flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">نوێکردنەوەی خێرای هێڵ (Instant Hot-Swap)</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedDeviceForRenew.mac_address}</p>
                </div>
              </div>
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRenew} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-md bg-[#151D2E] border border-[#2B3A56] text-slate-300 space-y-1 font-sans">
                <div className="font-semibold text-white text-xs">
                  کڕیار: {selectedDeviceForRenew.customer_name || 'بەکارهێنەری دیاریکراو'}
                </div>
                <div className="text-[11px] text-slate-400">
                  تەنها هێڵە تازەکەی LionOTT (0.1 Cr) لێرە دابنێ؛ لە چرکەیەکدا لەسەر شاشەی کڕیار دەکرێتەوە.
                </div>
              </div>

              {/* Paste new M3U */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">پەیستی هێڵی نوێی M3U:</label>
                <input
                  type="text"
                  value={renewM3uPaste}
                  onChange={(e) => handleRenewM3uPasteChange(e.target.value)}
                  placeholder="پەیستی لینکی نوێی LionOTT..."
                  className="w-full p-2 rounded bg-[#0A0E17] border border-[#2B3A56] text-amber-200 font-mono text-xs outline-none focus:border-[#0078D4]"
                />
              </div>

              {/* User & Pass */}
              <div className="grid grid-cols-2 gap-2.5 font-mono">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Username:</label>
                  <input
                    type="text"
                    required
                    value={renewUsername}
                    onChange={(e) => setRenewUsername(e.target.value)}
                    className="w-full p-2 rounded bg-[#0A0E17] border border-[#2B3A56] text-white font-bold text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Password:</label>
                  <input
                    type="text"
                    required
                    value={renewPassword}
                    onChange={(e) => setRenewPassword(e.target.value)}
                    className="w-full p-2 rounded bg-[#0A0E17] border border-[#2B3A56] text-white font-bold text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#222E46] flex items-center justify-end gap-2 font-sans">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="px-3 py-1.5 rounded-md bg-[#182236] text-slate-300 border border-[#2B3A56] text-xs font-medium cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-[#0078D4] hover:bg-[#106EBE] text-white font-semibold text-xs shadow-sm cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>نوێکردنەوە و ناردن بۆ شاشە ✓</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* =========================================================================
          MICROSOFT ERP DIALOG 3: LIVE LIONOTT UPSTREAM STATUS INSPECTOR
         ========================================================================= */}
      {isStatusInspectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in text-slate-100" dir="rtl">
          <div className="bg-[#111726] border border-[#2B3A56] rounded-lg shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-scale-up">
            
            <div className="bg-[#151D2E] p-4 border-b border-[#222E46] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">پشکنینی دۆخی سێرڤەری LionOTT</h3>
              </div>
              <button
                onClick={() => setIsStatusInspectorOpen(false)}
                className="p-1 rounded hover:bg-white/10 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 text-xs font-mono">
              {isInspecting ? (
                <div className="py-6 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-[#0078D4] animate-spin mx-auto" />
                  <p className="text-slate-400 font-sans">پەیوەندی کردن بە سێرڤەری LionOTT...</p>
                </div>
              ) : inspectedStatus ? (
                <div className="space-y-2.5 font-mono">
                  <div className="p-2.5 rounded bg-[#151D2E] border border-[#2B3A56] flex items-center justify-between">
                    <span className="text-slate-400 font-sans">دۆخی هەژمار:</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      inspectedStatus.isExpired ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {inspectedStatus.status}
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-[#151D2E] border border-[#2B3A56] flex items-center justify-between">
                    <span className="text-slate-400 font-sans">بەسەرچوون لە سێرڤەر:</span>
                    <span className="text-amber-300 font-bold">{inspectedStatus.expDateFormatted}</span>
                  </div>

                  <div className="p-2.5 rounded bg-[#151D2E] border border-[#2B3A56] flex items-center justify-between">
                    <span className="text-slate-400 font-sans">پەیوەندی چالاک (Active Cons):</span>
                    <span className="text-cyan-300 font-bold">{inspectedStatus.activeConnections} / {inspectedStatus.maxConnections}</span>
                  </div>

                  <div className="p-2.5 rounded bg-[#151D2E] border border-[#2B3A56] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-sans">ناونیشانی سێرڤەر:</span>
                    <span className="text-slate-300">{inspectedStatus.serverUrl}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-rose-400 font-sans">پەیوەندی لەگەڵ سێرڤەر سەرکەوتوو نەبوو.</div>
              )}

              <button
                onClick={() => setIsStatusInspectorOpen(false)}
                className="w-full py-2 rounded-md bg-[#182236] hover:bg-[#202C44] text-white font-sans font-medium text-xs border border-[#2B3A56] cursor-pointer"
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
