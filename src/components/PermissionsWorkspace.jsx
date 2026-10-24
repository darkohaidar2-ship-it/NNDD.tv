import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  CheckSquare, 
  Square, 
  Save, 
  Search, 
  Filter, 
  Sparkles, 
  GripVertical, 
  Trash2, 
  PlusCircle, 
  Tv, 
  Radio, 
  CreditCard, 
  Film, 
  BarChart3, 
  Layers, 
  Zap, 
  CheckCircle2, 
  Info,
  Laptop,
  Check,
  AlertCircle,
  Key,
  Copy,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  Share2,
  Type,
  Palette,
  RotateCcw,
  Eye,
  Sliders,
  Server,
  Activity,
  Flame,
  Crown,
  Coins,
  TrendingUp,
  Smartphone,
  Monitor,
  Globe,
  Wifi,
  ShieldAlert,
  ExternalLink,
  LayoutDashboard
} from 'lucide-react';
import { INITIAL_ACTIVATION_CODES, SUBSCRIPTION_PLANS, CHANNELS_DATA, INITIAL_ACTIVATION_REQUESTS } from '../data/mockData';
import { AVAILABLE_FONTS, applyFontToDocument, getCurrentFont } from '../data/fonts';
import { calculateJitResellerMetrics, RESELLER_POOL_CONFIG, TIER_CONFIGS, normalizeUserWithJit } from '../data/jitCreditEngine';
import { 
  getStoredTelemetry, 
  toggleDeviceIpLock, 
  detectDeviceType, 
  getRegisteredDevicesList, 
  registerOrUpdateDeviceEntry, 
  createNewDeviceCode 
} from '../data/telemetryService';
import ChannelManagerTab from './ChannelManagerTab';
import ActivationRequestsTab from './ActivationRequestsTab';
import VodManagerTab from './VodManagerTab';
import ServersManagerTab from './ServersManagerTab';
import DabinStudioTab from './DabinStudioTab';
import DabinResellerPanel from './DabinResellerPanel';
import DabinRealtimeAdminDashboard from './DabinRealtimeAdminDashboard';
import BouquetBuilderTab from './BouquetBuilderTab';
// IosErpDashboard removed to simplify panel

const ICON_MAP = {
  Tv: Tv,
  Radio: Radio,
  CreditCard: CreditCard,
  Film: Film,
  ShieldCheck: ShieldCheck,
  BarChart3: BarChart3
};

export default function PermissionsWorkspace({ 
  users, 
  setUsers, 
  permissions, 
  channels = CHANNELS_DATA,
  setChannels,
  requests = INITIAL_ACTIVATION_REQUESTS,
  setRequests,
  series = [],
  setSeries,
  movies = [],
  setMovies,
  onOpenSandbox,
  onNotify,
  onSwitchToTv,
  adminTheme = 'light',
  onToggleTheme
}) {
  const isLight = adminTheme === 'light';
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('realtime_middleware'); // 'erp' | 'servers' | 'channels' | 'telemetry' | 'roles' | 'codes' | 'vod' | 'requests' | 'settings'
  const [selectedUserIds, setSelectedUserIds] = useState(['usr-1']);
  const [focusedUserId, setFocusedUserId] = useState('usr-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [draggedUserIds, setDraggedUserIds] = useState([]);
  const [dragOverRoleId, setDragOverRoleId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Telemetry & Device IP Matrix State
  const [telemetryMap, setTelemetryMap] = useState(() => getStoredTelemetry());
  const [devicesList, setDevicesList] = useState(() => getRegisteredDevicesList());

  useEffect(() => {
    const handleTelemetrySync = () => {
      setTelemetryMap(getStoredTelemetry());
      setDevicesList(getRegisteredDevicesList());
    };
    window.addEventListener('nndd_telemetry_updated', handleTelemetrySync);
    window.addEventListener('nndd_devices_updated', handleTelemetrySync);
    window.addEventListener('storage', handleTelemetrySync);
    const interval = setInterval(handleTelemetrySync, 2000);
    return () => {
      window.removeEventListener('nndd_telemetry_updated', handleTelemetrySync);
      window.removeEventListener('nndd_devices_updated', handleTelemetrySync);
      window.removeEventListener('storage', handleTelemetrySync);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleTabSwitch = (e) => {
      if (e.detail) {
        setActiveWorkspaceTab(e.detail);
      }
    };
    window.addEventListener('switch_admin_tab', handleTabSwitch);
    return () => window.removeEventListener('switch_admin_tab', handleTabSwitch);
  }, []);

  const jitMetrics = calculateJitResellerMetrics(users);

  // Toggle IP Lock for Device
  const handleToggleIpLock = (deviceId, currentLock) => {
    const nextLocked = !currentLock;
    toggleDeviceIpLock(deviceId, nextLocked);
    setTelemetryMap(getStoredTelemetry());
    onNotify?.({
      title: nextLocked ? 'ئامێر بە IP قفڵکرا (IP Locked)' : 'قفڵی IP کرایەوە (IP Unlocked)',
      message: nextLocked 
        ? `ئامێری ${deviceId} بەستراوەتەوە تەنها بەم ناونیشانی IP و ڕێگری لە هاوبەشکردن دەکرێت.` 
        : `ئامێری ${deviceId} ئازادکرا بۆ هەر ئینتەرنێتێک.`,
      type: nextLocked ? 'success' : 'info'
    });
  };

  // Activation Codes State (Reseller Engine)
  const [codes, setCodes] = useState(INITIAL_ACTIVATION_CODES);
  const [selectedPlanForCode, setSelectedPlanForCode] = useState('plan_pro');

  // Font & Typography State
  const [selectedFontId, setSelectedFontId] = useState(() => getCurrentFont().id);
  const [customPreviewText, setCustomPreviewText] = useState('بەخێربێن بۆ NNDD TV • پەخشی ڕاستەوخۆی کەناڵەکان بە کوالێتی 4K Ultra HD');

  const handleSelectFont = (fontId) => {
    setSelectedFontId(fontId);
    const font = applyFontToDocument(fontId);
    onNotify?.({
      title: 'فۆنتی سیستەم گۆڕدرا',
      message: `فۆنتی تەواوی بەرنامە و ئەپەکە گۆڕدرا بۆ "${font.kurdishName}".`,
      type: 'success'
    });
  };

  const handleResetFont = () => {
    const font = applyFontToDocument('ibm-plex');
    setSelectedFontId('ibm-plex');
    onNotify?.({
      title: 'گەڕانەوە بۆ فۆنتی سەرەتایی',
      message: 'فۆنتی سیستەم گەڕێنرایەوە بۆ فۆنتی فەرمی (IBM Plex Sans Arabic).',
      type: 'info'
    });
  };

  // Filter users based on query and department
  const filteredUsers = users.filter(user => {
    const matchesQuery = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.deviceMac.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'all' || user.department === departmentFilter;
    return matchesQuery && matchesDept;
  });

  const departments = ['all', 'ئەدمین', 'تەکنیکی', 'ناوەڕۆک', 'فرۆش و بریکار', 'پشتیوانی', 'بەشداربووان'];
  const focusedUser = users.find(u => u.id === focusedUserId) || users[0];

  // Toggle single user selection
  const toggleSelectUser = (id, e) => {
    e.stopPropagation();
    setSelectedUserIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
    setFocusedUserId(id);
  };

  // Toggle MAC Device Lock for a user
  const toggleMacLock = (userId, e) => {
    e.stopPropagation();
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextState = !u.macLocked;
        onNotify?.({
          title: nextState ? 'ئامێر قفڵکرا (MAC Locked)' : 'قفڵی ئامێر کرایەوە (Unlocked)',
          message: `بەستنەوەی ئەکاونتی "${u.name}" بە ئامێری ${u.deviceMac} ${nextState ? 'چالاککرا' : 'ناچالاککرا'}.`,
          type: nextState ? 'success' : 'info'
        });
        return { ...u, macLocked: nextState };
      }
      return u;
    }));
  };

  // Select all or clear
  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e, userId) => {
    let toDrag = selectedUserIds.includes(userId) ? selectedUserIds : [userId];
    setDraggedUserIds(toDrag);
    e.dataTransfer.setData('text/plain', JSON.stringify(toDrag));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  const handleDragOver = (e, roleId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverRoleId !== roleId) {
      setDragOverRoleId(roleId);
    }
  };

  const handleDragLeave = (e, roleId) => {
    if (dragOverRoleId === roleId) {
      setDragOverRoleId(null);
    }
  };

  const handleDrop = (e, roleId) => {
    e.preventDefault();
    setDragOverRoleId(null);
    let targetUserIds = draggedUserIds;
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (data) targetUserIds = JSON.parse(data);
    } catch {}

    if (!targetUserIds || targetUserIds.length === 0) return;
    assignRoleToUsers(targetUserIds, roleId);
  };

  const assignRoleToUsers = (userIds, roleId) => {
    setUsers(prev => prev.map(user => {
      if (userIds.includes(user.id)) {
        if (!user.permissions.includes(roleId)) {
          return {
            ...user,
            permissions: [...user.permissions, roleId]
          };
        }
      }
      return user;
    }));

    const roleObj = permissions.find(p => p.id === roleId);
    onNotify?.({
      title: 'دەسەڵات بە سەرکەوتوویی زیادکرا',
      message: `دەسەڵاتی "${roleObj?.name}" بۆ ${userIds.length} بەکارهێنەر دیاریکرا.`,
      type: 'success'
    });
  };

  const removeRoleFromUser = (userId, roleId, e) => {
    e?.stopPropagation();
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          permissions: user.permissions.filter(p => p !== roleId)
        };
      }
      return user;
    }));

    const roleObj = permissions.find(p => p.id === roleId);
    onNotify?.({
      title: 'دەسەڵات لابرا',
      message: `دەسەڵاتی "${roleObj?.name}" لە بەکارهێنەر سەندرایەوە.`,
      type: 'info'
    });
  };

  const handleSaveToDatabase = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onNotify?.({
        title: 'پاشەکەوتکرا لە داتابەیس',
        message: 'تەواوی دەسەڵات، کۆدەکان و گۆڕانکارییەکان بە سەرکەوتوویی لە داتابەیسی NNDD TV نوێکرانەوە.',
        type: 'success'
      });
    }, 600);
  };

  // Generate New Activation Code (Reseller tool)
  const handleGenerateCode = () => {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanForCode) || SUBSCRIPTION_PLANS[1];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newCodeStr = `KRD-2026-${plan.id.toUpperCase()}-${randomNum}`;

    const newCodeObj = {
      id: `code-${Date.now()}`,
      code: newCodeStr,
      planId: plan.id,
      planName: plan.name,
      durationDays: plan.durationDays,
      status: 'بەردەست',
      price: plan.price,
      createdBy: focusedUser.name,
      createdAt: '2026-10-08',
      usedByMac: null
    };

    setCodes(prev => [newCodeObj, ...prev]);
    onNotify?.({
      title: 'کۆدی سەبسکرایب دروستکرا',
      message: `کۆدی "${newCodeStr}" بۆ ${plan.name} ئامادەکرا و دەتوانیت بۆ کڕیاری بنێریت.`,
      type: 'success'
    });
  };

  const handleCopyCode = (codeStr) => {
    navigator.clipboard?.writeText(codeStr);
    onNotify?.({
      title: 'کۆد کۆپیکرا',
      message: `کۆدی ${codeStr} کۆپیکرا؛ دەتوانیت لە وەتسئەپ بینێریت.`,
      type: 'info'
    });
  };

  return (
    <div className={`space-y-6 ${isLight ? 'text-slate-900' : 'text-white'}`}>
      
      {/* Top Banner: Dark Glass Command Bar & Bento Telemetry */}
      <div className={`backdrop-blur-2xl rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden transition-colors duration-300 ${isLight ? "bg-white/95 border border-slate-200 text-slate-900 shadow-slate-200/60" : "bg-slate-900/60 border border-white/10 text-white ring-1 ring-white/5"}`}>
        {/* Ambient Glow Accents */}
        <div className="absolute -top-24 -end-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full lg:w-auto">
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/30">
              <Server className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className={`text-lg font-black tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span>NNDD Enterprise Management</span>
                  <span className="text-slate-400 font-normal text-xs">• کۆنترۆڵی ئەدمین</span>
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Sync Online
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                بەڕێوەبردنی سێرڤەرەکان، کەناڵەکانی M3U8، کۆدی بریکار، VOD و دەسەڵاتی ستاف
              </p>
            </div>
          </div>

          {/* Glass Navigation Tabs */}
          <div className="flex items-center flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => setActiveWorkspaceTab('realtime_middleware')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'realtime_middleware'
                  ? 'bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-400 ring-1 ring-white/20'
                  : 'bg-red-950/40 text-amber-300 hover:bg-red-900/40 border border-red-500/30'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span>🔴 میدڵوێر و ئامێرەکانی DABIN.tv (Real-Time)</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('bouquet_builder')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'bouquet_builder'
                  ? 'bg-gradient-to-r from-red-600 via-amber-600 to-amber-500 text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-400 ring-1 ring-white/20'
                  : 'bg-red-950/40 text-amber-300 hover:bg-red-900/40 border border-red-500/30'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>✨ بووکێ و بەڕێوەبەری بەشەکان (Bouquet Builder)</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('dabin_studio')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'dabin_studio'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>🎬 پەخشی کەناڵی دابین (DABIN Studio)</span>
            </button>
            <button
              onClick={() => setActiveWorkspaceTab('channels')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'channels'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-cyan-300" />
              <span>📺 کەناڵەکان ({channels.length})</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('servers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'servers'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-blue-300" />
              <span>🌐 سێرڤەرەکان</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('telemetry')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'telemetry'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-300" />
              <span>🛡️ ئامێرەکان و IP</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('codes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'codes'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>کۆدی بریکار ({codes.length})</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('vod')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'vod'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>VOD</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('requests')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'requests'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>داواکاری تێست</span>
              {(requests || []).filter(r => r?.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeWorkspaceTab === 'settings'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] border border-cyan-400/40 ring-1 ring-white/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>فۆنت و ڕێکخستن</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                isLight
                  ? "bg-amber-500/10 text-amber-800 border-amber-300 hover:bg-amber-500/20 shadow-xs"
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
              }`}
              title="گۆڕینی دۆخی ڕەنگ (Light / Dark)"
            >
              <span>{isLight ? "☀️ لایت مۆد" : "🌙 دارک مۆد"}</span>
            </button>
          )}
          <button
            onClick={() => onOpenSandbox(focusedUser)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.35)] border border-purple-400/30 hover:brightness-110 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>Sandbox</span>
          </button>

          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 transition-all duration-150 disabled:opacity-50 border border-emerald-400/30 cursor-pointer"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'پاشەکەوتکردن...' : 'پاشەکەوتکردن'}</span>
          </button>
        </div>
      </div>

      {/* JIT Reseller Credit Pool Bento Grid (Apple Liquid Glass) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Pool */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">پوڵی گشتی بریکار</span>
            <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <Coins className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white tracking-tight">{jitMetrics.totalPoolCredits}</span>
            <span className="text-xs font-bold text-cyan-300 font-mono">Cr ($137)</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>ماوە لە پوڵ:</span>
            <span className="font-bold text-emerald-400 font-mono">{jitMetrics.poolRemainingCredits} Cr</span>
          </div>
        </div>

        {/* Card 2: Burned Credits */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">کرێدیتی سەرفکراو</span>
            <span className="p-2 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-300 tracking-tight">{jitMetrics.totalCreditsConsumed}</span>
            <span className="text-xs font-bold text-slate-400 font-mono">/ {jitMetrics.totalCreditsAllocated} تەرخانکراو</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>کڕیاری پارەدراو:</span>
            <span className="font-bold text-white font-mono">{jitMetrics.activePaidCount} کەس</span>
          </div>
        </div>

        {/* Card 3: Dormant Saving */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">سەیڤینگی کرێدیت (Standby)</span>
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-300 tracking-tight">{jitMetrics.creditsSavedByDormant}</span>
            <span className="text-xs font-bold text-emerald-400 font-mono">Cr پارێزراوە</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>تیڤیی کوژاوە (Standby):</span>
            <span className="font-bold text-cyan-300 font-mono">{jitMetrics.dormantSavingCount} ئامێر</span>
          </div>
        </div>

        {/* Card 4: Net Profit */}
        <div className="bg-slate-900/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">قازانجی کڕین و فرۆشتن</span>
            <span className="p-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/30">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-300 tracking-tight">${jitMetrics.netProfitUsd}</span>
            <span className="text-xs font-bold text-slate-400 font-mono">دۆلار</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>ڕێژەی قازانج:</span>
            <span className="font-bold text-purple-400 font-mono">+{jitMetrics.profitMarginPercent}% Margin</span>
          </div>
        </div>
      </div>

      {/* ========================================================
          TAB: DABIN RESELLER & MANAGEMENT MASTER PANEL (8 SECTIONS)
         ======================================================== */}
      {activeWorkspaceTab === 'realtime_middleware' && (
        <div className="animate-fade-in -mx-4 sm:-mx-8 -my-6">
          <DabinRealtimeAdminDashboard
            onSwitchToTv={onSwitchToTv}
            onNotify={onNotify}
          />
        </div>
      )}

      {activeWorkspaceTab === 'bouquet_builder' && (
        <div className="animate-fade-in -mx-4 sm:-mx-8 -my-6">
          <BouquetBuilderTab
            onSwitchToTv={onSwitchToTv}
            onNotify={onNotify}
          />
        </div>
      )}

      {activeWorkspaceTab === 'reseller' && (
        <div className="animate-fade-in -mx-4 sm:-mx-8 -my-6">
          <DabinResellerPanel
            onSwitchToTv={onSwitchToTv}
            onNotify={onNotify}
            adminTheme={adminTheme}
            onToggleTheme={onToggleTheme}
          />
        </div>
      )}

      {/* ========================================================
          TAB: IOS ERP & LIQUID GLASS JIT DASHBOARD
         ======================================================== */}
      {activeWorkspaceTab === 'erp' && (
        <div className="animate-fade-in">
          <IosErpDashboard
            onSwitchToTv={onSwitchToTv}
            onNotify={onNotify}
            currentUser={focusedUser}
            adminTheme={adminTheme}
            onToggleTheme={onToggleTheme}
          />
        </div>
      )}

      {/* ========================================================
          TAB: REAL-TIME DEVICE TELEMETRY & SCREEN LINKING MATRIX
         ======================================================== */}
      {activeWorkspaceTab === 'telemetry' && (
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in space-y-5 text-white ring-1 ring-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>لیستی شاشە و ئامێرەکان (Device & Screen Matrix)</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                    Live Sync Real-Time
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تەواوی شاشە و ئامێرە تۆمارکراوەکان لەسەر پلانی خۆڕایی (Free) لەگەڵ کۆد و لینکی ڕاستەوخۆ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => {
                  const newDev = createNewDeviceCode();
                  if (newDev) {
                    setDevicesList(getRegisteredDevicesList());
                    navigator.clipboard?.writeText(newDev.directUrl);
                    onNotify?.({ 
                      title: 'ئامێری نوێ دروستکرا! 🎉', 
                      message: `کۆد: ${newDev.code} - لینکی ڕاستەوخۆش کۆپیکرا.`, 
                      type: 'success' 
                    });
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border border-cyan-400/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>شاشەی نوێ</span>
              </button>

              <button
                onClick={() => {
                  setDevicesList(getRegisteredDevicesList());
                  setTelemetryMap(getStoredTelemetry());
                  onNotify?.({ title: 'لیستی ئامێرەکان نوێکرایەوە', message: 'تەواوی شاشەکان لە کاتی ڕاستەقینەدا نوێکرانەوە.', type: 'info' });
                }}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>نوێکردنەوە</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('ئایا دڵنیایت لە پاککردنەوە و سڕینەوەی هەموو ئامێرەکان؟ (0 ئامێر دەمێنێتەوە)')) {
                    clearAllRegisteredDevices();
                    setDevicesList([]);
                    onNotify?.({ 
                      title: 'ئامێرەکان پاککرانەوە', 
                      message: 'تەواوی لیستی ئامێرەکان بە سەرکەوتوویی سفر کرایەوە (0 ئامێر).', 
                      type: 'success' 
                    });
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>سڕینەوەی ئامێرەکان</span>
              </button>
            </div>
          </div>

          {/* Quick Summary Bento Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">کۆی گشتی شاشەکان</div>
                <div className="text-xl font-mono font-black text-white">{devicesList.length} شاشە</div>
              </div>
              <Monitor className="w-5 h-5 text-cyan-400" />
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">شاشە ئۆنلاینەکان</div>
                <div className="text-xl font-mono font-black text-emerald-400">
                  {devicesList.filter(d => d.online).length} چالاک
                </div>
              </div>
              <Wifi className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">پلان و سەبسکرایب</div>
                <div className="text-sm font-bold text-slate-200">100% خۆڕایی (0 کڕیار)</div>
              </div>
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
          </div>

          {/* Real-time Registered Devices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-medium">
                  <th className="py-3 text-start">کۆدی شاشە (Screen Code)</th>
                  <th className="py-3 text-start">لینکی ڕاستەوخۆی ئامێر (Direct Link)</th>
                  <th className="py-3 text-start">ئامێر</th>
                  <th className="py-3 text-start">ناونیشانی IP</th>
                  <th className="py-3 text-start">پلان و کەناڵ</th>
                  <th className="py-3 text-start">کەناڵی ئێستا</th>
                  <th className="py-3 text-start">دۆخ</th>
                  <th className="py-3 text-end">کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {devicesList.map(dev => {
                  const directLink = dev.directUrl || `${window.location.origin}/?device=${dev.code}`;

                  return (
                    <tr key={dev.code} className="hover:bg-white/[0.04] transition-colors">
                      {/* Unique Screen Code */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            <Key className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-mono text-xs font-bold text-white tracking-wider">
                            {dev.code}
                          </span>
                        </div>
                      </td>

                      {/* Direct Device Link (وەک چۆن کەناڵ لینکی هەیە) */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] px-2.5 py-1 rounded-xl bg-slate-950/80 border border-white/15 text-cyan-300 font-medium max-w-[170px] truncate" title={directLink}>
                            ?device={dev.code.substring(0, 14)}...
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(directLink);
                              onNotify?.({ title: 'لینکی ئامێر کۆپیکرا! 📋', message: directLink, type: 'info' });
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="کۆپیکردنی لینکی تایبەتی ئەم شاشەیە"
                          >
                            <Copy className="w-3 h-3 text-cyan-400" />
                          </button>
                          <a
                            href={directLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="کردنەوەی ئەم شاشەیە لە تابی نوێدا"
                          >
                            <ExternalLink className="w-3 h-3 text-emerald-400" />
                          </a>
                        </div>
                      </td>

                      {/* Device Type Form Factor */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-white/10 text-cyan-300 border border-white/10">
                            {dev.deviceType === 'tv' ? <Monitor className="w-3.5 h-3.5" /> :
                             dev.deviceType === 'mobile' ? <Smartphone className="w-3.5 h-3.5 text-purple-300" /> :
                             <Globe className="w-3.5 h-3.5 text-emerald-300" />}
                          </span>
                          <span className="text-[11px] text-slate-300 uppercase font-bold">{dev.deviceType || 'tv'}</span>
                        </div>
                      </td>

                      {/* Public IP */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs px-2.5 py-1 rounded-xl bg-slate-950/80 border border-white/15 text-slate-200 font-bold tracking-wider">
                            {dev.ip || '185.193.18.94'}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(dev.ip || '185.193.18.94');
                              onNotify?.({ title: 'IP کۆپیکرا', message: dev.ip, type: 'info' });
                            }}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="کۆپیکردنی IP"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Subscription Plan (Always Free as requested) */}
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 bg-slate-700/30 text-slate-200 border-white/20">
                          <Tv className="w-3 h-3 text-cyan-300" />
                          <span>خۆڕایی (Free) • 509 کەناڵ</span>
                        </span>
                      </td>

                      {/* Currently Playing Channel */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 text-white font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span className="truncate max-w-[130px]">{dev.channelName || 'Rudaw TV HD'}</span>
                        </div>
                      </td>

                      {/* Live Status */}
                      <td className="py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1.5 ${
                          dev.online
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dev.online ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                          <span>{dev.online ? 'ئۆنلاین' : 'ئۆفلاین'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 text-end">
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(directLink);
                            onNotify?.({ title: 'لینکی ئامێر کۆپیکرا! 📋', message: directLink, type: 'success' });
                          }}
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all inline-flex items-center gap-1 cursor-pointer active:scale-95"
                          title="کۆپیکردنی لینک"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>شەیر</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: RESELLER & ACTIVATION CODES GENERATOR (Dark Glass)
         ======================================================== */}
      {activeWorkspaceTab === 'codes' && (
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in space-y-6 text-white ring-1 ring-white/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Key className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>کۆدەکانی بەشداری و بریکار (Activation Codes)</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                    {codes.length} کۆد
                  </span>
                </h3>
              </div>
            </div>

            {/* Generator Box */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <select
                value={selectedPlanForCode}
                onChange={(e) => setSelectedPlanForCode(e.target.value)}
                className="text-xs font-bold text-white bg-slate-950/80 border border-white/15 rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
              >
                {SUBSCRIPTION_PLANS.map(plan => (
                  <option key={plan.id} value={plan.id} className="bg-slate-900 text-white">
                    {plan.name} ({plan.price})
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateCode}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.35)] active:scale-95 transition-all border border-emerald-400/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>دروستکردنی کۆد</span>
              </button>
            </div>
          </div>

          {/* Codes Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-medium">
                  <th className="py-3 text-start">کۆدی چالاککردن (Code)</th>
                  <th className="py-3 text-start">پلانی بەشداری</th>
                  <th className="py-3 text-start">ماوە</th>
                  <th className="py-3 text-start">نرخ</th>
                  <th className="py-3 text-start">دۆخ</th>
                  <th className="py-3 text-start">ئامێری بەکارهێنەر</th>
                  <th className="py-3 text-end">کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {codes.map(c => (
                  <tr key={c.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3 font-mono font-bold text-white flex items-center gap-2">
                      <span className="text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                        {c.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(c.code)}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
                        title="کۆپیکردنی کۆد"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="py-3 font-semibold text-white">{c.planName}</td>
                    <td className="py-3 text-slate-400">{c.durationDays} ڕۆژ</td>
                    <td className="py-3 font-bold text-emerald-400">{c.price}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'بەردەست'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-cyan-400 text-[11px]">
                      {c.usedByMac || 'هێشتا لێنەدراوە'}
                    </td>
                    <td className="py-3 text-end">
                      <a
                        href={`https://wa.me/?text=سڵاو،%20ئەمە%20کۆدی%20بەشداریکردنی%20NNDD%20TVـە:%20${c.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-semibold transition-all border border-emerald-500/30"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>ناردن بۆ وەتسئەپ</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB: SERVERS ERP & MULTI-SERVER FAILOVER ENGINE
         ======================================================== */}
      {/* ========================================================
          TAB 0: DABIN BROADCAST STUDIO (CHANNEL #1 CONTROLLER)
         ======================================================== */}
      {activeWorkspaceTab === 'dabin_studio' && (
        <DabinStudioTab onNotify={onNotify} />
      )}

      {activeWorkspaceTab === 'servers' && (
        <ServersManagerTab 
          channels={channels} 
          setChannels={setChannels} 
          onNotify={onNotify} 
        />
      )}

      {/* ========================================================
          TAB 3: CHANNEL MANAGER CRUD & EPG
         ======================================================== */}
      {activeWorkspaceTab === 'channels' && (
        <ChannelManagerTab 
          channels={channels} 
          setChannels={setChannels} 
          onNotify={onNotify} 
        />
      )}

      {/* ========================================================
          TAB: VOD STUDIO (SERIES & MOVIES MANAGEMENT)
         ======================================================== */}
      {activeWorkspaceTab === 'vod' && (
        <VodManagerTab 
          series={series}
          setSeries={setSeries}
          movies={movies}
          setMovies={setMovies}
          onNotify={onNotify}
        />
      )}

      {/* ========================================================
          TAB 4: ACTIVATION & TRIAL REQUESTS QUEUE
         ======================================================== */}
      {activeWorkspaceTab === 'requests' && (
        <ActivationRequestsTab 
          requests={requests} 
          setRequests={setRequests} 
          onNotify={onNotify} 
        />
      )}

      {/* ========================================================
          TAB 1: TWO-COLUMN DRAG & DROP WORKSPACE (MAIN)
         ======================================================== */}
      

      {/* ========================================================
          TAB 3: SYSTEM SETTINGS & FONT CONTROLLER (گۆڕینی فۆنتی ڕووکار)
         ======================================================== */}
      {activeWorkspaceTab === 'settings' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Setting Banner */}
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <Type className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    ڕێکخستنی فۆنت و تایپۆگرافی (Fonts & Typography Settings)
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-950/60 text-purple-300 border border-purple-500/30">
                    سیستەمی زیندوو (Live)
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  لە ڕێی ئەم پانێڵەوە دەتوانیت بە یەک کلیک فۆنتی ڕووکاری تەواوی سیستەم (وێبسایتی بەڕێوەبردن + ئەپی تیڤی) بگۆڕیت بەبێ دەستکاری هیچ سۆرس کۆدێک.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleResetFont}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                title="گەڕانەوە بۆ فۆنتی سەرەتایی"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>گەڕانەوە بۆ فۆنتی سەرەتایی</span>
              </button>
            </div>
          </div>

          {/* Active Font Showcase Card */}
          {(() => {
            const currentObj = AVAILABLE_FONTS.find(f => f.id === selectedFontId) || AVAILABLE_FONTS[0];
            return (
              <div className="bg-gradient-to-r from-slate-950/90 via-purple-950/50 to-slate-950/90 text-white rounded-2xl p-5 border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/20 backdrop-blur-md flex items-center justify-center text-xl font-black text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                    Aa
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-purple-300 font-medium">فۆنتی هەڵبژێردراوی ئێستا:</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        چالاکە لەسەر تەواوی پڕۆگرامەکە
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-white mt-0.5" style={{ fontFamily: currentObj.fontFamily }}>
                      {currentObj.kurdishName} ({currentObj.name})
                    </h4>
                  </div>
                </div>

                <div className="text-xs text-slate-700 font-mono bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl">
                  CSS: <code>font-family: {currentObj.fontFamily}</code>
                </div>
              </div>
            );
          })()}

          {/* Available Fonts Grid (5 Cards - Apple Light Mode) */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                <span>لیستی فۆنتە بەردەستەکان بۆ پڕۆگرام (کلیک لە هەر یەکێکیان بکە بۆ گۆڕینی دەستبەجێ):</span>
              </h4>
              <span className="text-xs text-slate-500 font-medium">٥ فۆنتی مۆدێرن بەردەستە</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_FONTS.map(font => {
                const isSelected = selectedFontId === font.id;

                return (
                  <div
                    key={font.id}
                    onClick={() => handleSelectFont(font.id)}
                    className={`relative rounded-2xl border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/60 ring-2 ring-purple-300/40 shadow-sm scale-[1.01]'
                        : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top Header of Font Card */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {font.category}
                            </span>
                            {font.badge && (
                              <span className="text-[10px] font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                                {font.badge}
                              </span>
                            )}
                          </div>
                          <h4 
                            className="text-base font-bold text-slate-900 mt-2"
                            style={{ fontFamily: font.fontFamily }}
                          >
                            {font.kurdishName}
                          </h4>
                          <span className="text-[11px] font-mono text-slate-500">
                            {font.name}
                          </span>
                        </div>

                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                          isSelected ? 'bg-purple-600 text-white shadow-xs' : 'border border-slate-200 text-transparent'
                        }`}>
                          <Check className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Font Description */}
                      <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                        {font.description}
                      </p>

                      {/* Font Live Sample Preview */}
                      <div 
                        className="mt-4 p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs"
                        style={{ fontFamily: font.fontFamily }}
                      >
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {font.sampleHeading}
                        </div>
                        <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {font.sampleBody}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                          {font.sampleNumbers}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {isSelected ? 'فۆنتی چالاکە' : 'کلیک بکە بۆ دیاریکردن'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFont(font.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {isSelected ? 'هەڵبژێردراوە ✓' : 'هەڵبژاردن'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Live Testing Sandbox (Apple Light Mode) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  تاقیگەی ڕاستەوخۆ (Live Font Preview Sandbox)
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                هەر تێکستێک بنووسە بۆ بینینی شێوازی فۆنتەکە بە ڕاستەوخۆ
              </span>
            </div>

            {/* Custom text input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                تێکستی تاقیکردنەوەی خۆت لێرە بنووسە:
              </label>
              <input
                type="text"
                value={customPreviewText}
                onChange={(e) => setCustomPreviewText(e.target.value)}
                placeholder="تێکستێک بنووسە..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-purple-500 outline-none text-xs transition-all"
              />
            </div>

            {/* Live Render Area using Selected Font */}
            {(() => {
              const activeFont = AVAILABLE_FONTS.find(f => f.id === selectedFontId) || AVAILABLE_FONTS[0];
              return (
                <div 
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
                  style={{ fontFamily: activeFont.fontFamily }}
                >
                  <div>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded-md">
                      پێشبینینی ناونیشان (Heading):
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      {customPreviewText}
                    </h3>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md">
                      پێشبینینی لیستی کەناڵ و بەشەکان (TV Channels & Numbers):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-2">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">١</span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">ڕووداو 4K</div>
                          <div className="text-[10px] text-slate-500">سەرەکی • Ultra HD</div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">٢</span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">کوردستان 24</div>
                          <div className="text-[10px] text-slate-500">هەواڵ • 1080p</div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold text-xs flex items-center justify-center">٣</span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">beIN SPORTS 1</div>
                          <div className="text-[10px] text-slate-500">وەرزش • 4K</div>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-bold text-xs flex items-center justify-center">٤</span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">MBC 1 HD</div>
                          <div className="text-[10px] text-slate-500">تایبەت • HD</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md">
                      پێشبینینی دوگمە و کارلێکەکان (Buttons & Actions):
                    </span>
                    <div className="flex flex-wrap gap-2.5 mt-2">
                      <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold active:scale-95 transition-all shadow-xs">
                        پەخشی ڕاستەوخۆ دەستپێبکە
                      </button>
                      <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold active:scale-95 transition-all shadow-xs">
                        کۆدی بەشداربوون داخڵبکە
                      </button>
                      <button className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold active:scale-95 transition-all shadow-2xs">
                        دەربارەی NNDD TV
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}

