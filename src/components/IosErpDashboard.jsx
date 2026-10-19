import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Server,
  BarChart3,
  Settings,
  Tv,
  Film,
  Sparkles,
  Zap,
  Flame,
  Crown,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Play,
  Pause,
  Clock,
  Lock,
  Unlock,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Globe,
  Wifi,
  Smartphone,
  Monitor,
  Info,
  AlertCircle,
  Trash2,
  Eye,
  Share2,
  Send,
  Sliders,
  DollarSign,
  TrendingUp,
  Cpu,
  Layers,
  CheckCircle2,
  X,
  Menu
} from 'lucide-react';

import { 
  TIER_CONFIGS, 
  RESELLER_POOL_CONFIG, 
  calculateJitResellerMetrics, 
  normalizeUserWithJit 
} from '../data/jitCreditEngine';

import {
  getMasterXtreamConfig,
  saveMasterXtreamConfig,
  getStoredLines,
  saveStoredLines,
  getResellerPoolCredits,
  setResellerPoolCredits,
  testXtreamServerHealth,
  createNewXtreamLine,
  toggleLineSuspension,
  extendLineSubscription,
  deleteLine,
  toggleLineIpLock,
  formatRemainingTime
} from '../data/xtreamResellerApi';

export default function IosErpDashboard({
  onSwitchToTv,
  onNotify,
  currentUser
}) {
  // Navigation & View Mode State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'lines' | 'wallet' | 'telemetry' | 'analytics' | 'settings'
  const [viewPersona, setViewPersona] = useState('admin'); // 'admin' | 'customer'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data State
  const [lines, setLines] = useState(() => getStoredLines());
  const [poolCredits, setPoolCredits] = useState(() => getResellerPoolCredits());
  const [masterConfig, setMasterConfig] = useState(() => getMasterXtreamConfig());
  const [selectedCustomerId, setSelectedCustomerId] = useState(() => {
    const list = getStoredLines();
    return list[0]?.id || 'line-dario-1y';
  });

  // Telemetry & Server Health State
  const [serverHealth, setServerHealth] = useState({
    isOnline: true,
    latencyMs: 48,
    statusText: 'Connected (Lion 4K)',
    activeCons: 4
  });
  const [isTestingServer, setIsTestingServer] = useState(false);

  // Search & Filter State in Active Lines
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'online' | 'active' | 'standby' | 'suspended'
  const [tierFilter, setTierFilter] = useState('all');

  // Modals State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Line Generator Form State
  const [formClientName, setFormClientName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTier, setFormTier] = useState('year1');
  const [formMaxCons, setFormMaxCons] = useState('1');
  const [generatedResult, setGeneratedResult] = useState(null);

  // Top Up Form State
  const [topUpAmount, setTopUpAmount] = useState('5.0');

  // Test Server Health on Mount
  useEffect(() => {
    let isMounted = true;
    testXtreamServerHealth(masterConfig).then(res => {
      if (isMounted && res) {
        setServerHealth({
          isOnline: res.isOnline,
          latencyMs: res.latencyMs || 48,
          statusText: res.statusText || 'Connected',
          activeCons: res.activeCons || 4
        });
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Periodic Telemetry Simulation Refresh (Every 15s)
  useEffect(() => {
    const interval = setInterval(() => {
      setLines(prev => {
        // Toggle random online states for realism
        return prev.map(l => {
          if (l.status === 'suspended') return l;
          const randomToggle = Math.random() > 0.85;
          return randomToggle ? { ...l, isOnline: !l.isOnline } : l;
        });
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Copy with Visual Feedback
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    onNotify?.({
      title: 'کۆپیکرا',
      message: `زانیارییەکان لە کلیپبۆرد پاشەکەوتکران.`,
      type: 'info'
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Test Connection Handler
  const handleTestConnection = async () => {
    setIsTestingServer(true);
    try {
      const res = await testXtreamServerHealth(masterConfig);
      setServerHealth({
        isOnline: res.isOnline,
        latencyMs: res.latencyMs,
        statusText: res.statusText,
        activeCons: res.activeCons || 4
      });
      onNotify?.({
        title: res.isOnline ? 'سێرڤەر پەیوەستکرا (Online)' : 'کێشە لە پەیوەندی',
        message: `پەیوەندی لەگەڵ ${masterConfig.host} پشکێنرا. دواکەوتن: ${res.latencyMs}ms`,
        type: res.isOnline ? 'success' : 'error'
      });
    } catch (e) {
      onNotify?.({
        title: 'کێشە لە پەیوەندی',
        message: 'نەتوانرا پەیوەندی بە سێرڤەرەوە بکرێت.',
        type: 'error'
      });
    } finally {
      setIsTestingServer(false);
    }
  };

  // Create Line Handler
  const handleCreateLineSubmit = (e) => {
    e.preventDefault();
    if (!formClientName.trim()) {
      onNotify?.({
        title: 'ناوی کڕیار پێویستە',
        message: 'تکایە ناوی کڕیار یان ناوێک بۆ هێڵەکە دیاری بکە.',
        type: 'warning'
      });
      return;
    }

    try {
      const res = createNewXtreamLine({
        clientName: formClientName,
        phone: formPhone,
        planTier: formTier,
        maxConnections: formMaxCons
      });

      setLines(getStoredLines());
      setPoolCredits(res.remainingPoolCredits);
      setGeneratedResult(res);

      onNotify?.({
        title: 'هێڵ بە سەرکەوتوویی دروستکرا',
        message: `هێڵی نوێ بۆ "${formClientName}" چالاککرا بە مۆدێلی JIT (0.1 کرێدیت سووتێنرا).`,
        type: 'success'
      });
    } catch (err) {
      onNotify?.({
        title: 'هەڵە لە دروستکردنی هێڵ',
        message: err.message || 'نەتوانرا هێڵەکە دروست بکرێت.',
        type: 'error'
      });
    }
  };

  // Suspend / Resume Line
  const handleToggleSuspend = (lineId) => {
    const res = toggleLineSuspension(lineId);
    setLines(res.updatedLines);
    onNotify?.({
      title: res.status === 'active' ? 'هێڵ چالاککرایەوە' : 'هێڵ ڕاگیرا (Suspended)',
      message: res.status === 'active' ? 'پەخشی هێڵەکە کارایەوە.' : 'پەخشی ئەم بەشداربووە ڕاگیرا.',
      type: res.status === 'active' ? 'success' : 'warning'
    });
  };

  // Extend Line
  const handleExtendLine = (lineId, tierKey = 'month1') => {
    try {
      const res = extendLineSubscription(lineId, tierKey);
      setLines(res.updatedLines);
      setPoolCredits(res.remainingPool);
      onNotify?.({
        title: 'بەشداربوون درێژکرایەوە',
        message: `ماوەی هێڵەکە زیادکرا و باڵانسی کرێدیت نوێکرایەوە.`,
        type: 'success'
      });
    } catch (err) {
      onNotify?.({
        title: 'هەڵە لە درێژکردنەوە',
        message: err.message,
        type: 'error'
      });
    }
  };

  // IP Lock Toggle
  const handleToggleIpLock = (lineId) => {
    const res = toggleLineIpLock(lineId);
    setLines(res.updatedLines);
    onNotify?.({
      title: res.isIpLocked ? 'ئامێر بە IP قفڵکرا' : 'قفڵی IP کرایەوە',
      message: res.isIpLocked 
        ? 'ئەم هێڵە بەسترایەوە تەنها بە یەک ئینتەرنێتەوە بۆ ڕێگری لە هاوبەشکردن.' 
        : 'ئەم هێڵە ئازادکرا بۆ هەر ئینتەرنێتێک.',
      type: res.isIpLocked ? 'success' : 'info'
    });
  };

  // Delete Line
  const handleDeleteLine = (lineId, name) => {
    if (confirm(`ئایا دڵنیایت لە سڕینەوەی هێڵی "${name}"؟`)) {
      const updated = deleteLine(lineId);
      setLines(updated);
      onNotify?.({
        title: 'هێڵ سڕدرایەوە',
        message: `هێڵی ${name} لە سیستم سڕدرایەوە.`,
        type: 'info'
      });
    }
  };

  // Top Up Credits
  const handleTopUpSubmit = (e) => {
    e.preventDefault();
    const addVal = parseFloat(topUpAmount);
    if (isNaN(addVal) || addVal <= 0) return;
    const nextVal = parseFloat((poolCredits + addVal).toFixed(2));
    setResellerPoolCredits(nextVal);
    setPoolCredits(nextVal);
    setIsTopUpModalOpen(false);
    onNotify?.({
      title: 'کرێدیت بارگاوی کرایەوە',
      message: `بڕی +${addVal} کرێدیت زیادکرا. کۆی ئێستا: ${nextVal} کرێدیت.`,
      type: 'success'
    });
  };

  // Save Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveMasterXtreamConfig(masterConfig);
    onNotify?.({
      title: 'ڕێکخستنەکان پاشەکەوتکران',
      message: 'زانیاری سێرڤەری سەرەکی بە سەرکەوتوویی نوێکرایەوە.',
      type: 'success'
    });
  };

  // Computed Metrics
  const metrics = useMemo(() => {
    let totalRevenueIqd = 0;
    let totalOnline = 0;
    let totalSuspended = 0;
    let totalStandby = 0;
    let totalAllocatedCredits = 0;
    let totalConsumedCredits = 0;
    let totalSavedCredits = 0;

    lines.forEach(l => {
      totalRevenueIqd += (l.priceIqd || 0);
      if (l.isOnline) totalOnline++;
      if (l.status === 'suspended') totalSuspended++;
      if (l.jitStatus === 'standby') totalStandby++;
      totalAllocatedCredits += (l.creditsAllocated || 0);
      totalConsumedCredits += (l.creditsConsumed || 0);
      totalSavedCredits += (l.creditsSaved || 0);
    });

    const activeLinesCount = lines.filter(l => l.status === 'active').length;
    // Estimated hardware cost based on consumed credits (0.1 Cr = 1,450 IQD)
    const hardwareCostIqd = Math.round((totalConsumedCredits / 0.1) * RESELLER_POOL_CONFIG.costPerMonthIqd);
    const netProfitIqd = Math.max(0, totalRevenueIqd - hardwareCostIqd);
    const profitMargin = totalRevenueIqd > 0 ? Math.round((netProfitIqd / totalRevenueIqd) * 100) : 85;

    return {
      totalLines: lines.length,
      activeLinesCount,
      totalOnline,
      totalSuspended,
      totalStandby,
      totalRevenueIqd,
      netProfitIqd,
      profitMargin,
      totalAllocatedCredits: parseFloat(totalAllocatedCredits.toFixed(2)),
      totalConsumedCredits: parseFloat(totalConsumedCredits.toFixed(2)),
      totalSavedCredits: parseFloat(totalSavedCredits.toFixed(2))
    };
  }, [lines]);

  // Filtered Lines
  const filteredLines = useMemo(() => {
    return lines.filter(l => {
      const matchQuery = 
        l.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.phone && l.phone.includes(searchQuery)) ||
        (l.currentIp && l.currentIp.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === 'online') matchStatus = l.isOnline;
      else if (statusFilter === 'active') matchStatus = l.status === 'active';
      else if (statusFilter === 'standby') matchStatus = l.jitStatus === 'standby';
      else if (statusFilter === 'suspended') matchStatus = l.status === 'suspended';

      let matchTier = true;
      if (tierFilter !== 'all') matchTier = l.planTier === tierFilter;

      return matchQuery && matchStatus && matchTier;
    });
  }, [lines, searchQuery, statusFilter, tierFilter]);

  // Selected Customer for Member Portal View
  const selectedCustomer = useMemo(() => {
    return lines.find(l => l.id === selectedCustomerId) || lines[0] || SEED_LINES[0];
  }, [lines, selectedCustomerId]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden" dir="rtl">
      
      {/* Background Liquid Glass Ambient Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] start-[-5%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] end-[-5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-[35%] end-[20%] w-[450px] h-[450px] bg-blue-600/8 rounded-full blur-[120px]" />
      </div>

      {/* Top iOS ERP Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1px] shadow-[0_0_20px_rgba(6,182,212,0.35)]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Tv className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white">NNDD.TV</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25 font-bold">
                  iOS ERP v3.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">سیستەمی بەڕێوەبردنی بریکار و کۆنتڕۆڵی JIT</p>
            </div>
          </div>
        </div>

        {/* Center: Persona Switcher (Admin ERP vs Member Portal) */}
        <div className="flex items-center bg-black/40 backdrop-blur-xl border border-white/10 p-1 rounded-2xl shadow-inner">
          <button
            onClick={() => setViewPersona('admin')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewPersona === 'admin'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>کۆنتڕۆڵی ئەدمین (ERP)</span>
          </button>

          <button
            onClick={() => setViewPersona('customer')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewPersona === 'customer'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>پۆڕتاڵی بەشداربوو (Member)</span>
          </button>
        </div>

        {/* Right: Quick Actions & TV Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Server Status Pill */}
          <div 
            onClick={handleTestConnection}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
            title="کلیک بکە بۆ تێستکردنی پەیوەندی سێرڤەر"
          >
            <span className={`w-2 h-2 rounded-full ${serverHealth.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'} animate-pulse`} />
            <span className="text-xs font-medium text-slate-300">
              {serverHealth.latencyMs}ms • Lion 4K
            </span>
          </div>

          {/* Quick Line Generator Button */}
          <button
            onClick={() => {
              setGeneratedResult(null);
              setIsGenerateModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">دروستکردنی هێڵ</span>
          </button>

          {/* Open TV Player Button */}
          {onSwitchToTv && (
            <button
              onClick={onSwitchToTv}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="کردنەوەی ئەپی تیڤی لە پەنجەرەی تەواودا"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">تیڤی پلەیەر</span>
            </button>
          )}
        </div>

      </header>

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden z-10 relative">

        {/* Collapsible iOS ERP Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 start-0 z-30 transition-all duration-300 ease-in-out
          bg-slate-950/80 md:bg-black/30 backdrop-blur-2xl border-e border-white/10
          flex flex-col justify-between p-3.5
          ${isSidebarCollapsed ? 'w-20' : 'w-64'}
          ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          {/* Sidebar Top Menu */}
          <div className="space-y-4">
            
            {/* Collapse / Expand Toggle Button (Desktop) */}
            <div className="hidden md:flex items-center justify-between px-2">
              {!isSidebarCollapsed && (
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">بەشەکانی کۆنتڕۆڵ</span>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title={isSidebarCollapsed ? 'فراوانکردنی مێنیو' : 'بچووککردنەوەی مێنیو'}
              >
                {isSidebarCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1.5">
              {[
                { id: 'dashboard', label: 'داشبۆرد (Overview)', icon: LayoutDashboard },
                { id: 'lines', label: `هێڵە چالاکەکان (${lines.length})`, icon: Users },
                { id: 'wallet', label: 'جزدانی کرێدیت و JIT', icon: CreditCard, badge: `${poolCredits} Cr` },
                { id: 'telemetry', label: 'دۆخی سێرڤەر (Xtream)', icon: Server, ping: true },
                { id: 'analytics', label: 'شیکاری دارایی (IQD)', icon: BarChart3 },
                { id: 'settings', label: 'ڕێکخستنی سێرڤەر', icon: Settings }
              ].map(item => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id && viewPersona === 'admin';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setViewPersona('admin');
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-start cursor-pointer
                      ${isActive 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}
                    `}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    {!isSidebarCollapsed && (
                      <span className="flex-1 truncate">{item.label}</span>
                    )}
                    {!isSidebarCollapsed && item.badge && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/25">
                        {item.badge}
                      </span>
                    )}
                    {!isSidebarCollapsed && item.ping && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Pricing Tier Card in Sidebar */}
            {!isSidebarCollapsed && (
              <div className="p-3 rounded-2xl bg-slate-900/40 border border-white/5 space-y-2 mt-4 text-[11px]">
                <div className="font-bold text-slate-300 flex items-center justify-between">
                  <span>نرخە جێگیرەکان (IQD):</span>
                  <span className="text-[10px] text-cyan-400">JIT Model</span>
                </div>
                <div className="space-y-1 text-slate-400">
                  <div className="flex justify-between">
                    <span>١ مانگ:</span>
                    <span className="text-white font-mono font-bold">5,000 IQD (0.1 Cr)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>٣ مانگ:</span>
                    <span className="text-cyan-300 font-mono font-bold">9,000 IQD (0.3 Cr)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>٦ مانگ:</span>
                    <span className="text-purple-300 font-mono font-bold">15,000 IQD (0.6 Cr)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>١ ساڵ دایمۆند:</span>
                    <span className="text-amber-300 font-mono font-bold">28,000 IQD (1.0 Cr)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Bottom: Credit Gauge & Account */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            {!isSidebarCollapsed ? (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">باڵانسی کرێدیت:</span>
                  <span className="font-mono font-bold text-emerald-400">{poolCredits} / 5.0 Cr</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (poolCredits / 5.0) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                  <span>دەستکەوتی JIT:</span>
                  <span className="text-cyan-300 font-bold">+{metrics.totalSavedCredits} Cr پارێزراو</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center" title={`باڵانسی کرێدیت: ${poolCredits} Cr`}>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                  {poolCredits}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsTopUpModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              {!isSidebarCollapsed && <span>بارگاوی کردنەوە (+Cr)</span>}
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

          {/* If Member Portal View Selected */}
          {viewPersona === 'customer' ? (
            <MemberPortalView
              customer={selectedCustomer}
              allCustomers={lines}
              onSelectCustomer={setSelectedCustomerId}
              onLaunchPlayer={onSwitchToTv}
              onCopy={handleCopy}
              copiedId={copiedId}
            />
          ) : (
            /* Admin ERP Views */
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboardOverview
                  metrics={metrics}
                  lines={lines}
                  poolCredits={poolCredits}
                  serverHealth={serverHealth}
                  onOpenGenerate={() => {
                    setGeneratedResult(null);
                    setIsGenerateModalOpen(true);
                  }}
                  onOpenTopUp={() => setIsTopUpModalOpen(true)}
                  onSelectTab={setActiveTab}
                  onCopy={handleCopy}
                  copiedId={copiedId}
                />
              )}

              {activeTab === 'lines' && (
                <ActiveLinesView
                  lines={filteredLines}
                  totalCount={lines.length}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  tierFilter={tierFilter}
                  setTierFilter={setTierFilter}
                  onToggleSuspend={handleToggleSuspend}
                  onExtendLine={handleExtendLine}
                  onToggleIpLock={handleToggleIpLock}
                  onDeleteLine={handleDeleteLine}
                  onOpenGenerate={() => {
                    setGeneratedResult(null);
                    setIsGenerateModalOpen(true);
                  }}
                  onCopy={handleCopy}
                  copiedId={copiedId}
                />
              )}

              {activeTab === 'wallet' && (
                <CreditWalletView
                  poolCredits={poolCredits}
                  metrics={metrics}
                  onOpenTopUp={() => setIsTopUpModalOpen(true)}
                  onOpenGenerate={() => {
                    setGeneratedResult(null);
                    setIsGenerateModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'telemetry' && (
                <ServerTelemetryView
                  config={masterConfig}
                  serverHealth={serverHealth}
                  onTestConnection={handleTestConnection}
                  isTesting={isTestingServer}
                  metrics={metrics}
                />
              )}

              {activeTab === 'analytics' && (
                <RevenueAnalyticsView
                  metrics={metrics}
                  lines={lines}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsMasterView
                  config={masterConfig}
                  setConfig={setMasterConfig}
                  onSave={handleSaveSettings}
                  onTestConnection={handleTestConnection}
                  isTesting={isTestingServer}
                />
              )}
            </>
          )}

        </main>
      </div>

      {/* MODAL: One-Click Line Generator */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-fade-in">
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative overflow-hidden space-y-5 animate-slide-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">دروستکردنی هێڵی نوێ (Line Generator)</h3>
                  <p className="text-xs text-slate-400">بەشداربوونی زیرەک بە مۆدێلی JIT (0.1 کرێدیت دەبڕدرێت)</p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Generated Result Screen (If generated) */}
            {generatedResult ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">هێڵی کڕیار بە سەرکەوتوویی دروستکرا!</h4>
                  <p className="text-xs text-slate-300">
                    باڵانسی ماوە: <span className="font-mono text-emerald-300 font-bold">{generatedResult.remainingPoolCredits} Cr</span>
                  </p>
                </div>

                {/* Account Details Box */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">ناوی کڕیار:</span>
                    <span className="font-bold text-white">{generatedResult.line.clientName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">پاکێج:</span>
                    <span className="font-bold text-cyan-300">{generatedResult.line.planName}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Username:</span>
                    <span className="font-mono font-bold text-white">{generatedResult.line.username}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <span className="text-slate-400">Password:</span>
                    <span className="font-mono font-bold text-white">{generatedResult.line.password}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">M3U8 URL:</span>
                    <button
                      onClick={() => handleCopy(generatedResult.m3uUrl, 'm3u-res')}
                      className="px-2 py-1 rounded-lg bg-white/10 text-cyan-300 hover:text-white flex items-center gap-1 font-bold text-[10px]"
                    >
                      {copiedId === 'm3u-res' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>کۆپیکردنی لینک</span>
                    </button>
                  </div>
                </div>

                {/* WhatsApp Quick Message Generator */}
                <button
                  onClick={() => {
                    const msg = `سڵاو بەڕێز ${generatedResult.line.clientName}\nئەکاونتی NNDD TV بۆ تۆ چالاککرا:\n- پاکێج: ${generatedResult.line.planName}\n- ناوی بەکارهێنەر: ${generatedResult.line.username}\n- وشەی نهێنی: ${generatedResult.line.password}\n- لینکی M3U:\n${generatedResult.m3uUrl}\nبەهیوای کاتێکی خۆش!`;
                    handleCopy(msg, 'wa-msg');
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>کۆپیکردنی پەیامی ئامادەی WhatsApp بۆ کڕیار</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setGeneratedResult(null);
                      setFormClientName('');
                      setFormPhone('');
                    }}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    دروستکردنی هێڵێکی تر
                  </button>
                </div>
              </div>
            ) : (
              /* Generator Form */
              <form onSubmit={handleCreateLineSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">ناوی کڕیار / بەشداربوو *</label>
                  <input
                    type="text"
                    required
                    placeholder="نموونە: ئارام عەلی"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">ژمارەی مۆبایل (ئارەزوومەندانە)</label>
                  <input
                    type="text"
                    placeholder="0770 000 0000"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50"
                  />
                </div>

                {/* Plan Selection with Exact Pricing Tiers */}
                <div>
                  <label className="block text-slate-300 font-bold mb-2">هەڵبژاردنی پاکێج و نرخ (IQD):</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'trial', name: 'تێستی ٢٤ کاتژمێر', price: '0 IQD', cr: '0.0 Cr', desc: 'Free Trial' },
                      { id: 'month1', name: '١ مانگ', price: '5,000 IQD', cr: '0.1 Cr', desc: 'Monthly' },
                      { id: 'month3', name: '٣ مانگ', price: '9,000 IQD', cr: '0.3 Cr', desc: 'Quarterly' },
                      { id: 'month6', name: '٦ مانگ', price: '15,000 IQD', cr: '0.6 Cr', desc: 'Semi-Annual' },
                      { id: 'year1', name: '١ ساڵ دایمۆند', price: '28,000 IQD', cr: '1.0 Cr', desc: 'VIP Diamond' }
                    ].map(tier => {
                      const isSelected = formTier === tier.id;
                      return (
                        <div
                          key={tier.id}
                          onClick={() => setFormTier(tier.id)}
                          className={`
                            p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between
                            ${isSelected 
                              ? 'bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                              : 'bg-black/30 border-white/10 hover:bg-white/5'}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{tier.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-bold">
                              {tier.cr}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                            <span className="font-mono font-bold text-emerald-400">{tier.price}</span>
                            <span className="text-[10px] text-slate-400">{tier.desc}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Smart JIT Preserved Notice */}
                <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-slate-300 text-[11px] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-cyan-300">میکانیزمی JIT زیرەک:</span> کاتێک پاکێجی ٦ مانگ یان ١ ساڵ هەڵدەبژێریت، سیستمەکە تۆماری دەکات بەڵام لە سێرڤەری سەرەکی <span className="text-white font-bold">تەنها 0.1 کرێدیت بۆ مانگی یەکەم دەبڕدرێت</span> کاتێک کڕیار دەست بە تەماشاکردن دەکات.
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsGenerateModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold"
                  >
                    پەشیمانبوونەوە
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
                  >
                    دروستکردن و خەرجکردنی 0.1 Cr
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* MODAL: Top Up Credits Pool */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-2xl animate-fade-in">
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-slide-up text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-black text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>بارگاوی کردنەوەی باڵانسی کرێدیت</span>
              </h3>
              <button onClick={() => setIsTopUpModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/10 flex justify-between items-center">
                <span className="text-slate-400">باڵانسی ئێستا:</span>
                <span className="text-emerald-400 font-mono font-bold text-sm">{poolCredits} Credits</span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">بڕی کرێدیت بۆ زیادکردن:</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['1.0', '5.0', '10.0'].map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setTopUpAmount(val)}
                      className={`py-2 rounded-xl border text-center font-mono font-bold ${
                        topUpAmount === val ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      +{val} Cr
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/5 text-slate-300"
                >
                  داخستن
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                >
                  زیادکردنی باڵانس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/**
 * =========================================================================
 * SUB-COMPONENT 1: Admin Dashboard Overview
 * =========================================================================
 */
function AdminDashboardOverview({
  metrics,
  lines,
  poolCredits,
  serverHealth,
  onOpenGenerate,
  onOpenTopUp,
  onSelectTab,
  onCopy,
  copiedId
}) {
  return (
    <div className="space-y-6">

      {/* Top Welcome & KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total IQD Revenue */}
        <div className="p-5 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute top-0 end-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">کۆی داهات (IQD)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {metrics.totalRevenueIqd.toLocaleString()} <span className="text-xs font-normal text-slate-400">IQD</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>قازانجی خاوێن: {metrics.profitMargin}% ({metrics.netProfitIqd.toLocaleString()} IQD)</span>
          </div>
        </div>

        {/* KPI 2: Available Reseller Credits Pool */}
        <div className="p-5 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="absolute top-0 end-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">باڵانسی کرێدیت (Reseller Pool)</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {poolCredits} <span className="text-xs font-normal text-slate-400">/ 5.0 Cr</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>خەرجکراو: {metrics.totalConsumedCredits} Cr • پارێزراو: {metrics.totalSavedCredits} Cr</span>
          </div>
        </div>

        {/* KPI 3: Active Subscriptions & Live Users */}
        <div className="p-5 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="absolute top-0 end-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">هێڵە چالاکەکان</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {metrics.activeLinesCount} <span className="text-xs font-normal text-slate-400">هێڵ</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-purple-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{metrics.totalOnline} بەکارهێنەر ئێستا سەیری دەکەن</span>
          </div>
        </div>

        {/* KPI 4: Server Health & Latency */}
        <div className="p-5 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute top-0 end-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400">دۆخی سێرڤەر (Xtream)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight flex items-center gap-2">
            <span>{serverHealth.latencyMs}ms</span>
            <span className="text-xs font-bold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              Online
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
            <span>Lion OTT 4K • 20,188 کەناڵ</span>
          </div>
        </div>

      </div>

      {/* JIT Smart Credit Preservation Showcase Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-slate-900/60 border border-cyan-500/20 backdrop-blur-2xl shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>JIT Credit Optimization Active</span>
            </span>
            <span className="text-xs text-slate-400">• داهێنانی تایبەتی NNDD TV</span>
          </div>
          <h3 className="text-base font-black text-white">
            بە مۆدێلی JIT، کڕینی پاکێجی ١ ساڵی دایمۆند کرێدیتی هەموو ساڵەکە ناسووتێنێت!
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            سیستمەکە تەنها مانگ بە مانگ (<strong className="text-cyan-300">0.1 کرێدیت</strong>) لە سێرڤەری سەرەکی خەرج دەکات لەگەڵ داگیرسانی تیڤی و سەیرکردن لەلایەن کڕیارەوە. هەموو ئەو کاتانەی تیڤی ناکرێتەوە، کرێدیتی بریکار بە پارێزراوی دەمێنێتەوە.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-center">
            <div className="text-xl font-mono font-black text-emerald-400">+{metrics.totalSavedCredits} Cr</div>
            <div className="text-[10px] text-slate-400">کرێدیتی پاشەکەوتکراو</div>
          </div>
          <button
            onClick={onOpenGenerate}
            className="px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
          >
            دروستکردنی هێڵی نوێ
          </button>
        </div>
      </div>

      {/* Quick Active Lines Table Preview */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">دوایین بەشداربووە چالاکەکان و پەخشی ڕاستەوخۆ</h3>
          </div>
          <button
            onClick={() => onSelectTab('lines')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>بینینی تەواوی هێڵەکان ({lines.length})</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                <th className="pb-3 text-start font-bold">کڕیار / بەشداربوو</th>
                <th className="pb-3 text-start font-bold">پاکێج</th>
                <th className="pb-3 text-start font-bold">دۆخی پەخش</th>
                <th className="pb-3 text-start font-bold">کاتی ماوە</th>
                <th className="pb-3 text-start font-bold">کرێدیتی JIT</th>
                <th className="pb-3 text-end font-bold">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {lines.slice(0, 5).map(line => {
                const tier = TIER_CONFIGS[line.planTier] || TIER_CONFIGS.year1;
                return (
                  <tr key={line.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 text-start">
                      <div className="font-bold text-white">{line.clientName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{line.username} • {line.phone || 'بێ تەلەفۆن'}</div>
                    </td>
                    <td className="py-3 text-start">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.badgeClass}`}>
                        {tier.nameEn}
                      </span>
                    </td>
                    <td className="py-3 text-start">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${line.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                        <span className={line.isOnline ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                          {line.isOnline ? 'سەیر دەکات' : 'ئۆفلاین'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{line.currentChannel}</div>
                    </td>
                    <td className="py-3 text-start font-mono text-slate-300">
                      {formatRemainingTime(line.planExpiryDate)}
                    </td>
                    <td className="py-3 text-start">
                      <div className="text-[11px] font-mono font-bold text-cyan-300">
                        {line.creditsConsumed} Cr خەرج
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        +{line.creditsSaved} Cr پاشەکەوت
                      </div>
                    </td>
                    <td className="py-3 text-end">
                      <button
                        onClick={() => {
                          const m3u = `${line.serverHost}/get.php?username=${line.username}&password=${line.password}&type=m3u_plus&output=ts`;
                          onCopy(m3u, line.id);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 text-[10px] font-bold border border-white/10"
                      >
                        {copiedId === line.id ? 'کۆپیکرا' : 'M3U'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/**
 * =========================================================================
 * SUB-COMPONENT 2: Active Lines Management View (Data Table)
 * =========================================================================
 */
function ActiveLinesView({
  lines,
  totalCount,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  tierFilter,
  setTierFilter,
  onToggleSuspend,
  onExtendLine,
  onToggleIpLock,
  onDeleteLine,
  onOpenGenerate,
  onCopy,
  copiedId
}) {
  return (
    <div className="space-y-5">
      
      {/* Header with Search & Filter Controls */}
      <div className="p-5 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="گەڕان بەپێی ناوی کڕیار، یوزەر، ژمارە، یان IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-10 pe-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400/50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="all">تەواوی دۆخەکان ({totalCount})</option>
            <option value="online">ڕاستەوخۆ (Online)</option>
            <option value="active">چالاک (Active)</option>
            <option value="standby">خەوتوو / پاشەکەوت (Standby)</option>
            <option value="suspended">ڕاگیراو (Suspended)</option>
          </select>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-3 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="all">تەواوی پاکێجەکان</option>
            <option value="trial">تێستی ٢٤ کاتژمێر (0 IQD)</option>
            <option value="month1">١ مانگ (5,000 IQD)</option>
            <option value="month3">٣ مانگ (9,000 IQD)</option>
            <option value="month6">٦ مانگ (15,000 IQD)</option>
            <option value="year1">١ ساڵ دایمۆند (28,000 IQD)</option>
          </select>

          <button
            onClick={onOpenGenerate}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>هێڵی نوێ</span>
          </button>
        </div>

      </div>

      {/* Active Lines Full Data Table */}
      <div className="rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-black/30 border-b border-white/10 text-slate-400 text-[11px]">
              <tr>
                <th className="p-4 text-start font-bold">کڕیار / زانیاری هێڵ</th>
                <th className="p-4 text-start font-bold">پاکێج و نرخ</th>
                <th className="p-4 text-start font-bold">پەخشی ڕاستەوخۆ</th>
                <th className="p-4 text-start font-bold">کاتی بەسەرچوون</th>
                <th className="p-4 text-start font-bold">ئامێر و IP Lock</th>
                <th className="p-4 text-start font-bold">کرێدیتی JIT</th>
                <th className="p-4 text-end font-bold">کۆنتڕۆڵ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {lines.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400">
                    هیچ هێڵێک بەم مەرجانە نەدۆزرایەوە.
                  </td>
                </tr>
              ) : (
                lines.map(line => {
                  const tier = TIER_CONFIGS[line.planTier] || TIER_CONFIGS.year1;
                  const isSuspended = line.status === 'suspended';
                  const m3uUrl = `${line.serverHost}/get.php?username=${line.username}&password=${line.password}&type=m3u_plus&output=ts`;

                  return (
                    <tr key={line.id} className={`hover:bg-white/5 transition-colors ${isSuspended ? 'opacity-60 bg-rose-950/10' : ''}`}>
                      
                      {/* Customer Info */}
                      <td className="p-4 text-start">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${line.isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'}`} />
                          <span className="font-bold text-white text-sm">{line.clientName}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          یوزەر: <span className="text-cyan-300">{line.username}</span> • وشە: <span className="text-slate-300">{line.password}</span>
                        </div>
                        {line.phone && (
                          <div className="text-[10px] text-slate-400 font-mono">{line.phone}</div>
                        )}
                      </td>

                      {/* Package & Price */}
                      <td className="p-4 text-start">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tier.badgeClass}`}>
                          {tier.nameEn}
                        </span>
                        <div className="font-mono font-bold text-emerald-400 text-xs mt-1">
                          {line.priceIqd?.toLocaleString()} IQD
                        </div>
                      </td>

                      {/* Live Telemetry */}
                      <td className="p-4 text-start">
                        <div className="flex items-center gap-1.5">
                          <span className={line.isOnline ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {line.isOnline ? 'پەخش چالاکە' : 'ئۆفلاین'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 truncate max-w-[150px]">
                          {line.currentChannel}
                        </div>
                      </td>

                      {/* Expiry Countdown */}
                      <td className="p-4 text-start">
                        <div className="font-mono text-xs text-white">
                          {formatRemainingTime(line.planExpiryDate)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          خول: {formatRemainingTime(line.serverCycleExpiryDate)}
                        </div>
                      </td>

                      {/* IP Lock & Device */}
                      <td className="p-4 text-start">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onToggleIpLock(line.id)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                              line.isIpLocked 
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                            }`}
                            title={line.isIpLocked ? 'قفڵکراوە بەم IPیەوە' : 'کلیک بکە بۆ قفڵکردنی IP'}
                          >
                            {line.isIpLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <span className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]">
                            {line.currentIp}
                          </span>
                        </div>
                      </td>

                      {/* JIT Metrics */}
                      <td className="p-4 text-start">
                        <div className="font-mono text-xs text-cyan-300 font-bold">
                          {line.creditsConsumed} Cr خەرج
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono">
                          +{line.creditsSaved} Cr پاشەکەوت
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Copy M3U */}
                          <button
                            onClick={() => onCopy(m3uUrl, line.id)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 transition-colors"
                            title="کۆپیکردنی لینکی M3U"
                          >
                            {copiedId === line.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Suspend / Resume Toggle */}
                          <button
                            onClick={() => onToggleSuspend(line.id)}
                            className={`p-1.5 rounded-xl border transition-colors ${
                              isSuspended 
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                            }`}
                            title={isSuspended ? 'چالاککردنەوە' : 'ڕاگرتن (Suspend)'}
                          >
                            {isSuspended ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>

                          {/* Quick Extend Plan */}
                          <button
                            onClick={() => onExtendLine(line.id, 'month1')}
                            className="px-2 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-bold hover:bg-purple-500/25"
                            title="+١ مانگ درێژکردنەوە"
                          >
                            +1M
                          </button>

                          {/* Delete Line */}
                          <button
                            onClick={() => onDeleteLine(line.id, line.clientName)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 transition-colors"
                            title="سڕینەوە"
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
      </div>

    </div>
  );
}

/**
 * =========================================================================
 * SUB-COMPONENT 3: Credit Wallet & JIT Engine Breakdown
 * =========================================================================
 */
function CreditWalletView({
  poolCredits,
  metrics,
  onOpenTopUp,
  onOpenGenerate
}) {
  return (
    <div className="space-y-6">

      {/* Main Credit Pool Status */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Master Reseller Pool
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              جزدانی کرێدیتی بریکار و مۆدێلی JIT
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              ١ کرێدیت یەکسانە بە ١٠ مانگی سێرڤەر (0.1 کرێدیت بۆ هەر مانگێک). لەگەڵ باڵانسی 5.0 کرێدیت، دەتوانیت ٥٠ مانگی پەخش چالاک بکەیت یان ٥ ساڵی تەواوی دایمۆند.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-black/50 border border-white/10 text-center min-w-[200px]">
            <div className="text-xs text-slate-400 mb-1">باڵانسی ئێستا لە بەردەستدا:</div>
            <div className="text-4xl font-mono font-black text-emerald-400 tracking-tight">
              {poolCredits} <span className="text-sm font-normal text-slate-400">Cr</span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <button
                onClick={onOpenTopUp}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-white font-bold text-xs cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                + بارگاوی کردنەوە
              </button>
            </div>
          </div>

        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>خەرجکراو: {metrics.totalConsumedCredits} Cr</span>
            <span>ماوە: {poolCredits} Cr لە 5.0 Cr</span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-white/10">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, (poolCredits / 5.0) * 100)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Pricing Matrix Breakdown (Hardcoded IQD & Credits) */}
      <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-cyan-400" />
          <span>پەیکەری نرخەکان بە دینار (IQD) و دەستکەوتی کرێدیت</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div className="p-4 rounded-2xl bg-black/40 border border-sky-500/20 space-y-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-300">١ مانگ</span>
            <div className="text-xl font-bold font-mono text-white">5,000 IQD</div>
            <div className="text-slate-400">خەرجی سێرڤەر: <strong className="text-sky-300 font-mono">0.1 Credit</strong></div>
            <div className="text-[10px] text-emerald-400">قازانج: ~3,550 IQD بۆ هەر کڕیارێک</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-cyan-500/20 space-y-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300">٣ مانگ</span>
            <div className="text-xl font-bold font-mono text-white">9,000 IQD</div>
            <div className="text-slate-400">خەرجی سێرڤەر: <strong className="text-cyan-300 font-mono">0.3 Credit</strong></div>
            <div className="text-[10px] text-emerald-400">قازانج: ~4,650 IQD (بە لێدەرکردنی JIT)</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/20 space-y-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300">٦ مانگ</span>
            <div className="text-xl font-bold font-mono text-white">15,000 IQD</div>
            <div className="text-slate-400">خەرجی سێرڤەر: <strong className="text-purple-300 font-mono">0.6 Credit</strong></div>
            <div className="text-[10px] text-emerald-400">قازانج: ~6,300 IQD (بە پێشەکی 0.1 Cr)</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/20 space-y-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">١ ساڵ دایمۆند VIP</span>
            <div className="text-xl font-bold font-mono text-white">28,000 IQD</div>
            <div className="text-slate-400">خەرجی سێرڤەر: <strong className="text-amber-300 font-mono">1.0 Credit</strong></div>
            <div className="text-[10px] text-emerald-400">قازانج: ~13,500 IQD خاوێن بە JIT</div>
          </div>

        </div>
      </div>

    </div>
  );
}

/**
 * =========================================================================
 * SUB-COMPONENT 4: Server Telemetry & Xtream Status
 * =========================================================================
 */
function ServerTelemetryView({
  config,
  serverHealth,
  onTestConnection,
  isTesting,
  metrics
}) {
  return (
    <div className="space-y-6">

      <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>پشکنینی دۆخی سێرڤەری Lion 4K (Xtream Codes API)</span>
            </h2>
            <p className="text-xs text-slate-400">چاودێری ڕاستەوخۆی سێرڤەری پەخش، دواکەوتنی ئینتەرنێت و پەیوەندییەکان</p>
          </div>

          <button
            onClick={onTestConnection}
            disabled={isTesting}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            <span>پشکنینی دووبارە (Ping Test)</span>
          </button>
        </div>

        {/* Telemetry Bento */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
          
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-slate-400">ناونیشانی سێرڤەر (Host):</span>
            <div className="font-mono text-cyan-300 font-bold truncate">{config.host}</div>
            <div className="text-[10px] text-slate-400">پۆڕت: 80 / 443 (Reverse Proxy)</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-slate-400">دواکەوتنی پینگ (Latency):</span>
            <div className="font-mono text-emerald-400 font-bold text-lg">{serverHealth.latencyMs} ms</div>
            <div className="text-[10px] text-emerald-400">سەقامگیر و لەبارە بۆ پەخشی 4K HDR</div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
            <span className="text-slate-400">کۆی کەناڵ و بەرهەمەکان:</span>
            <div className="font-mono text-purple-300 font-bold text-lg">147,785</div>
            <div className="text-[10px] text-slate-400">20,188 کەناڵ • 102,663 فیلم • 24,934 زنجیرە</div>
          </div>

        </div>

      </div>

    </div>
  );
}

/**
 * =========================================================================
 * SUB-COMPONENT 5: Revenue Analytics & Business Intelligence
 * =========================================================================
 */
function RevenueAnalyticsView({ metrics, lines }) {
  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <span className="text-xs font-bold text-slate-400">کۆی گشتی فرۆشراو (Gross Revenue)</span>
          <div className="text-2xl font-black font-mono text-white mt-2">
            {metrics.totalRevenueIqd.toLocaleString()} IQD
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">تەواوی پارەی وەرگیراو لە کڕیاران</div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <span className="text-xs font-bold text-slate-400">تێچووی سێرڤەر (Reseller Hardware Cost)</span>
          <div className="text-2xl font-black font-mono text-rose-400 mt-2">
            {((metrics.totalConsumedCredits / 0.1) * 1450).toLocaleString()} IQD
          </div>
          <div className="text-[11px] text-slate-400 mt-1">بەپێی ژمارەی مانگە خەرجکراوەکان</div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <span className="text-xs font-bold text-slate-400">قازانجی خاوێن (Net Margin)</span>
          <div className="text-2xl font-black font-mono text-cyan-300 mt-2">
            {metrics.netProfitIqd.toLocaleString()} IQD
          </div>
          <div className="text-[11px] text-cyan-300 mt-1">{metrics.profitMargin}% ڕێژەی قازانج</div>
        </div>

      </div>

    </div>
  );
}

/**
 * =========================================================================
 * SUB-COMPONENT 6: Settings Master Xtream Configuration
 * =========================================================================
 */
function SettingsMasterView({
  config,
  setConfig,
  onSave,
  onTestConnection,
  isTesting
}) {
  return (
    <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl max-w-2xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>ڕێکخستنی سێرڤەری سەرەکی Xtream Codes API</span>
          </h2>
          <p className="text-xs text-slate-400">دیاریکردنی زانیاری بەستنەوە بە سێرڤەری بریکار (Lion OTT / BQPanel)</p>
        </div>
      </div>

      <form onSubmit={onSave} className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-bold mb-1.5">ناونیشانی سێرڤەر (Host URL)</label>
          <input
            type="text"
            required
            value={config.host}
            onChange={(e) => setConfig({ ...config, host: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-400/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">ناوی بەکارهێنەری سەرەکی (Username)</label>
            <input
              type="text"
              required
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-400/50"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1.5">وشەی نهێنی (Password)</label>
            <input
              type="text"
              required
              value={config.password}
              onChange={(e) => setConfig({ ...config, password: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-400/50"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onTestConnection}
            disabled={isTesting}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 font-bold flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
            <span>پشکنینی بەستنەوە</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.35)] cursor-pointer"
          >
            پاشەکەوتکردنی ڕێکخستنەکان
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * =========================================================================
 * SUB-COMPONENT 7: Member / Customer iOS Dashboard View
 * =========================================================================
 */
function MemberPortalView({
  customer,
  allCustomers,
  onSelectCustomer,
  onLaunchPlayer,
  onCopy,
  copiedId
}) {
  const tier = TIER_CONFIGS[customer.planTier] || TIER_CONFIGS.year1;
  const m3uUrl = `${customer.serverHost}/get.php?username=${customer.username}&password=${customer.password}&type=m3u_plus&output=ts`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Top Banner: Member Switcher for Demo / Preview */}
      <div className="p-4 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Users className="w-4 h-4 text-purple-400" />
          <span>پێشبینی وەک بەشداربوو (Preview as Customer):</span>
        </div>
        <select
          value={customer.id}
          onChange={(e) => onSelectCustomer(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white font-bold text-xs focus:outline-none cursor-pointer"
        >
          {allCustomers.map(c => (
            <option key={c.id} value={c.id}>
              {c.clientName} ({c.planName})
            </option>
          ))}
        </select>
      </div>

      {/* Main iOS Liquid Glass Card for Member */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/15 shadow-2xl relative overflow-hidden space-y-6">
        
        {/* Glowing Ambient Top */}
        <div className="absolute top-0 end-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shadow-[0_0_25px_rgba(168,85,247,0.35)]">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
                <Crown className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{customer.clientName}</h1>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${tier.badgeClass}`}>
                  {tier.nameEn}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">بەخێربێیت بۆ داشبۆردی بەشداربووی NNDD TV</p>
            </div>
          </div>

          {/* Days Left Glowing Badge */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-center min-w-[140px]">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">ماوەی بەشداربوون:</div>
            <div className="text-lg font-mono font-black text-cyan-300 mt-0.5">
              {formatRemainingTime(customer.planExpiryDate)}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">سێرڤەر: Lion 4K Online</div>
          </div>
        </div>

        {/* Categories Quick Access Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          
          <div 
            onClick={onLaunchPlayer}
            className="p-5 rounded-2xl bg-gradient-to-br from-blue-600/15 to-cyan-600/10 border border-cyan-500/25 hover:border-cyan-400/50 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <Tv className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                20,188 CH
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">پەخشی ڕاستەوخۆ (Live TV)</h3>
            <p className="text-xs text-slate-400 mt-1">کەناڵەکانی کوردی، وەرزشی 4K، هەواڵ و خێزانی</p>
          </div>

          <div 
            onClick={onLaunchPlayer}
            className="p-5 rounded-2xl bg-gradient-to-br from-purple-600/15 to-indigo-600/10 border border-purple-500/25 hover:border-purple-400/50 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <Film className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                102,663
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">سینەما و فیلم (VOD Movies)</h3>
            <p className="text-xs text-slate-400 mt-1">فیلمی ژێرنووسکراوی کوردی و نوێترینەکانی جیهان</p>
          </div>

          <div 
            onClick={onLaunchPlayer}
            className="p-5 rounded-2xl bg-gradient-to-br from-amber-600/15 to-orange-600/10 border border-amber-500/25 hover:border-amber-400/50 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <Sparkles className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                24,934
              </span>
            </div>
            <h3 className="font-bold text-white text-sm">زنجیرە و دراما (Series)</h3>
            <p className="text-xs text-slate-400 mt-1">درامای دۆبلاژکراوی کوردی، تورکی و جیهانی</p>
          </div>

        </div>

        {/* Launch Player Big Button */}
        <div className="pt-2">
          <button
            onClick={onLaunchPlayer}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>کردنەوەی تیڤی پلەیەری فەرمی NNDD (Launch Player)</span>
          </button>
        </div>

      </div>

      {/* Member Credentials & M3U Box */}
      <div className="p-6 rounded-3xl bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-4 text-xs">
        <h3 className="font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>زانیارییەکانی بەستنەوەی ئەپ و تیڤی (IPTV Credentials)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex justify-between items-center">
            <span className="text-slate-400">ناوی بەکارهێنەر:</span>
            <span className="font-mono font-bold text-cyan-300">{customer.username}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex justify-between items-center">
            <span className="text-slate-400">وشەی نهێنی:</span>
            <span className="font-mono font-bold text-white">{customer.password}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="truncate flex-1">
            <span className="text-slate-400 block mb-0.5">لینکی فەرمی M3U8 Playlist:</span>
            <span className="font-mono text-[11px] text-slate-300 truncate block">{m3uUrl}</span>
          </div>
          <button
            onClick={() => onCopy(m3uUrl, 'cust-m3u')}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shrink-0"
          >
            {copiedId === 'cust-m3u' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>کۆپی</span>
          </button>
        </div>
      </div>

    </div>
  );
}
