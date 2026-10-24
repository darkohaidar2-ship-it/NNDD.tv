import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Globe, 
  Smartphone, 
  Tv, 
  Users, 
  FileText, 
  Newspaper, 
  LifeBuoy, 
  History, 
  Settings, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  Flame, 
  Coins, 
  Key, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Send, 
  Download, 
  Share2, 
  Laptop, 
  QrCode, 
  TrendingUp, 
  HelpCircle,
  LogOut,
  Maximize2
} from 'lucide-react';

import DabinLogo from './DabinLogo';
import { 
  SUBSCRIPTION_DURATIONS,
  getPanelInfo, 
  savePanelInfo, 
  getResellerCredits, 
  setResellerCredits,
  getResellerDevices, 
  saveResellerDevices, 
  assignServerToDevice,
  getM3uLines, 
  saveM3uLines,
  getMagDevices, 
  saveMagDevices,
  getSellers, 
  saveSellers,
  getDomains, 
  saveDomains,
  getTemplates, 
  saveTemplates,
  getNews, 
  getTickets, 
  createNewTicket,
  getLogs, 
  addResellerLog,
  getTwoFactorStatus, 
  toggleTwoFactor,
  resetFreshResellerData
} from '../data/resellerData';

export default function DabinResellerPanel({
  onSwitchToTv,
  onNotify,
  adminTheme = 'light',
  onToggleTheme
}) {
  const isLight = adminTheme === 'light';

  // -------------------------------------------------------------
  // Navigation State (Exact 8 Sections)
  // -------------------------------------------------------------
  const [activeTab, setActiveTab] = useState('dashboard'); 
  // 'dashboard' | 'domains' | 'devices' | 'sellers' | 'tools' | 'tickets' | 'logs' | 'settings'

  // Sub-tabs for Section 3 (Devices)
  const [deviceSubTab, setDeviceSubTab] = useState('smart_tv'); // 'smart_tv' | 'm3u_lines' | 'mag_devices'

  // -------------------------------------------------------------
  // Core Data State
  // -------------------------------------------------------------
  const [panelInfo, setPanelInfo] = useState(() => getPanelInfo());
  const [devices, setDevices] = useState(() => getResellerDevices());
  const [m3uLines, setM3uLines] = useState(() => getM3uLines());
  const [magDevices, setMagDevices] = useState(() => getMagDevices());
  const [sellers, setSellers] = useState(() => getSellers());
  const [domains, setDomains] = useState(() => getDomains());
  const [templates, setTemplates] = useState(() => getTemplates());
  const [newsList, setNewsList] = useState(() => getNews());
  const [tickets, setTickets] = useState(() => getTickets());
  const [logs, setLogs] = useState(() => getLogs());
  const [twoFactor, setTwoFactor] = useState(() => getTwoFactorStatus());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // -------------------------------------------------------------
  // Modals State
  // -------------------------------------------------------------
  // Assign Server Modal (for Smart TV / Device Code)
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignDuration, setAssignDuration] = useState('24h');
  const [assignServerType, setAssignServerType] = useState('xtream'); // 'xtream' | 'm3u'
  const [assignM3uUrl, setAssignM3uUrl] = useState('');
  const [assignHost, setAssignHost] = useState('http://line.liondnscloud.ru');
  const [assignUsername, setAssignUsername] = useState('');
  const [assignPassword, setAssignPassword] = useState('');
  const [assignClientName, setAssignClientName] = useState('');
  const [assignPhone, setAssignPhone] = useState('');

  // 2FA Modal
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);
  const [twoFactorInputCode, setTwoFactorInputCode] = useState('');

  // New Ticket Modal
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [tktSubject, setTktSubject] = useState('');
  const [tktDepartment, setTktDepartment] = useState('Live Streams');
  const [tktPriority, setTktPriority] = useState('normal');
  const [tktMessage, setTktMessage] = useState('');

  // New DNS Domain Modal
  const [isDnsModalOpen, setIsDnsModalOpen] = useState(false);
  const [dnsHost, setDnsHost] = useState('');
  const [dnsPort, setDnsPort] = useState('80');
  const [dnsNote, setDnsNote] = useState('');

  // New M3U Line Modal
  const [isM3uModalOpen, setIsM3uModalOpen] = useState(false);
  const [newLineUser, setNewLineUser] = useState('');
  const [newLinePass, setNewLinePass] = useState('');
  const [newLineClient, setNewLineClient] = useState('');
  const [newLineDuration, setNewLineDuration] = useState('1m');

  // New Sub-reseller Modal
  const [isSellerModalOpen, setIsSellerModalOpen] = useState(false);
  const [newSellerName, setNewSellerName] = useState('');
  const [newSellerPhone, setNewSellerPhone] = useState('');
  const [newSellerCity, setNewSellerCity] = useState('');
  const [newSellerCredits, setNewSellerCredits] = useState('5');

  // Copy helper
  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    onNotify?.({
      title: 'کۆپیکرا 📋',
      message: `${text.substring(0, 35)}... کۆپیکرا بۆ کلیپبۆرد`,
      type: 'info'
    });
  };

  // Sync listener
  useEffect(() => {
    const handlePanelSync = () => {
      setPanelInfo(getPanelInfo());
      setDevices(getResellerDevices());
      setLogs(getLogs());
    };
    window.addEventListener('dabin_panel_updated', handlePanelSync);
    window.addEventListener('dabin_devices_updated', handlePanelSync);
    return () => {
      window.removeEventListener('dabin_panel_updated', handlePanelSync);
      window.removeEventListener('dabin_devices_updated', handlePanelSync);
    };
  }, []);

  // Open Assign Server Modal for a device
  const handleOpenAssignModal = (dev = null) => {
    if (dev) {
      setSelectedDevice(dev);
      setAssignClientName(dev.clientName || '');
      setAssignPhone(dev.phone || '');
      setAssignDuration(dev.durationId || '24h');
      setAssignServerType(dev.serverType || 'xtream');
      setAssignM3uUrl(dev.m3uUrl || '');
      setAssignHost(dev.serverHost || 'http://line.liondnscloud.ru');
      setAssignUsername(dev.serverUsername || '');
      setAssignPassword(dev.serverPassword || '');
    } else {
      setSelectedDevice({
        serialNumber: `DABIN-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        clientName: '',
        phone: '',
        deviceIp: '149.255.228.110',
        deviceModel: 'Smart TV (Samsung/LG/TiviMate)'
      });
      setAssignClientName('');
      setAssignPhone('');
      setAssignDuration('24h');
      setAssignServerType('xtream');
      setAssignM3uUrl('');
      setAssignHost('http://line.liondnscloud.ru');
      setAssignUsername(`dabin_${Math.floor(1000 + Math.random() * 9000)}`);
      setAssignPassword(`pwd_${Math.random().toString(36).substring(2, 8)}`);
    }
    setIsAssignModalOpen(true);
  };

  // Commit Server Assignment to Device
  const handleSaveDeviceAssignment = (e) => {
    e?.preventDefault();
    if (!selectedDevice?.serialNumber) return;

    const res = assignServerToDevice({
      serialNumber: selectedDevice.serialNumber,
      clientName: assignClientName,
      phone: assignPhone,
      durationId: assignDuration,
      serverType: assignServerType,
      m3uUrl: assignM3uUrl,
      serverHost: assignHost,
      serverUsername: assignUsername,
      serverPassword: assignPassword
    });

    setDevices(getResellerDevices());
    setPanelInfo(getPanelInfo());
    setLogs(getLogs());
    setIsAssignModalOpen(false);

    onNotify?.({
      title: 'سێرڤەر و پاکێج بەسترایەوە 🎉',
      message: `ئامێری (${selectedDevice.serialNumber}) بە سەرکەوتوویی خرایە سەر ${res.durationLabel}.`,
      type: 'success'
    });
  };

  // Create Ticket
  const handleCreateTicket = (e) => {
    e?.preventDefault();
    if (!tktSubject.trim() || !tktMessage.trim()) return;

    createNewTicket({
      subject: tktSubject,
      department: tktDepartment,
      priority: tktPriority,
      message: tktMessage
    });

    setTickets(getTickets());
    setIsTicketModalOpen(false);
    setTktSubject('');
    setTktMessage('');

    onNotify?.({
      title: 'تیکێتی پاڵپشتی نێردرا 🚀',
      message: 'داواکاریەکەت گەیشتە تیمی ئەندازیاری LionOTT.',
      type: 'success'
    });
  };

  // Add DNS Domain
  const handleAddDns = (e) => {
    e?.preventDefault();
    if (!dnsHost.trim()) return;

    const updated = [
      ...domains,
      {
        id: `dns-${Date.now()}`,
        host: dnsHost.trim(),
        port: Number(dnsPort) || 80,
        protocol: dnsPort === '443' ? 'https' : 'http',
        ssl: dnsPort === '443',
        status: 'online',
        pingMs: 40,
        isDefault: false,
        note: dnsNote.trim() || 'دۆمەینی نوێ'
      }
    ];

    saveDomains(updated);
    setDomains(updated);
    setIsDnsModalOpen(false);
    setDnsHost('');
    setDnsNote('');

    onNotify?.({
      title: 'دۆمەینی DNS زیادکرا',
      message: `${dnsHost} بە سەرکەوتوویی تۆمارکرا.`,
      type: 'success'
    });
  };

  // Add M3U Line
  const handleCreateM3uLine = (e) => {
    e?.preventDefault();
    const u = newLineUser.trim() || `usr_${Math.floor(1000 + Math.random() * 9000)}`;
    const p = newLinePass.trim() || `pwd_${Math.random().toString(36).substring(2, 8)}`;
    const dur = SUBSCRIPTION_DURATIONS.find(d => d.id === newLineDuration) || SUBSCRIPTION_DURATIONS[2];

    const host = domains.find(d => d.isDefault)?.host || 'line.liondnscloud.ru';
    const m3uLink = `http://${host}/get.php?username=${u}&password=${p}&type=m3u_plus&output=ts`;

    const newLine = {
      id: `line-${Date.now()}`,
      username: u,
      password: p,
      clientName: newLineClient.trim() || 'کڕیاری M3U',
      durationLabel: dur.labelKu,
      m3uUrl: m3uLink,
      host: `http://${host}`,
      createdAt: new Date().toLocaleDateString('en-GB'),
      expiresAt: new Date(Date.now() + (dur.days || 30) * 86400000).toLocaleDateString('en-GB'),
      status: 'active',
      maxConnections: 1
    };

    const updated = [newLine, ...m3uLines];
    saveM3uLines(updated);
    setM3uLines(updated);

    // Deduct credit
    if (dur.creditCost > 0) {
      setResellerCredits(Math.max(0, getResellerCredits() - dur.creditCost));
      addResellerLog({
        type: 'credit',
        description: `دروستکردنی هێڵی M3U بۆ (${newLine.clientName}) - بەکارهێنان: ${dur.creditCost} Cr`,
        amount: `-${dur.creditCost} Cr`
      });
      setPanelInfo(getPanelInfo());
      setLogs(getLogs());
    }

    setIsM3uModalOpen(false);
    setNewLineUser('');
    setNewLinePass('');
    setNewLineClient('');

    onNotify?.({
      title: 'هێڵی M3U دروستکرا 🎉',
      message: `لینکی M3U بۆ "${newLine.clientName}" ئامادەیە.`,
      type: 'success'
    });
  };

  // Add Sub-reseller
  const handleAddSeller = (e) => {
    e?.preventDefault();
    if (!newSellerName.trim()) return;

    const cr = Number(newSellerCredits) || 0;
    const newS = {
      id: `seller-${Date.now()}`,
      name: newSellerName.trim(),
      phone: newSellerPhone.trim(),
      city: newSellerCity.trim() || 'کوردستان',
      creditsGiven: cr,
      creditsUsed: 0,
      activeLines: 0,
      balanceUsd: cr * 10,
      status: 'active'
    };

    const updated = [newS, ...sellers];
    saveSellers(updated);
    setSellers(updated);
    setIsSellerModalOpen(false);
    setNewSellerName('');
    setNewSellerPhone('');

    addResellerLog({
      type: 'seller',
      description: `زیادکردنی بریکاری نوێ: ${newS.name} بە ${cr} کرێدیت`,
      amount: `-${cr} Cr`
    });
    setLogs(getLogs());

    onNotify?.({
      title: 'بریکاری نوێ زیادکرا',
      message: `پەنێڵ بۆ ${newS.name} چالاککرا.`,
      type: 'success'
    });
  };

  // Clean wipe
  const handleCleanFreshReset = () => {
    if (window.confirm('ئایا دڵنیایت لە پاککردنەوەی تەواوی داتاکان و فرێشکردنی پەنێڵی Dabintv بە ٦ کرێدیت؟')) {
      resetFreshResellerData(true);
      setPanelInfo(getPanelInfo());
      setDevices(getResellerDevices());
      setM3uLines([]);
      setMagDevices([]);
      setLogs(getLogs());
      setTwoFactor(getTwoFactorStatus());
      onNotify?.({
        title: 'ئەدمین پانێڵ بە تەواوی پاککرایەوە 🧹',
        message: 'سەرجەم داتاکان فرێش کرانەوە؛ ناوی پەنێڵ: Dabintv و کرێدیت: 6.',
        type: 'success'
      });
    }
  };

  // Navigation Items
  const navItems = [
    { id: 'dashboard', labelKu: '١. بەشی سەرەکی (Dashboard & 2FA)', icon: LayoutDashboard },
    { id: 'domains', labelKu: '٢. بەشی دۆمەینەکان (DNS Hosting)', icon: Globe },
    { id: 'devices', labelKu: '٣. بەڕێوەبردنی ئامێرەکان و هێڵەکان (Devices)', icon: Smartphone, highlight: true },
    { id: 'sellers', labelKu: '٤. بەڕێوەبردنی فرۆشیارەکان (Sellers)', icon: Users },
    { id: 'tools', labelKu: '٥. ئامرازەکان و هەواڵەکان (Tools & News)', icon: FileText },
    { id: 'tickets', labelKu: '٦. بەشی پاڵپشتی (Tickets)', icon: LifeBuoy },
    { id: 'logs', labelKu: '٧. بەشی تۆمارەکان (Logs)', icon: History },
    { id: 'settings', labelKu: '٨. ڕێکخستنەکان و هەژمار (Settings)', icon: Settings },
  ];

  return (
    <div className={`min-h-screen flex flex-col font-sans select-none ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-[#070b14] text-slate-100'
    }`} dir="rtl">
      
      {/* ========================================================
          TOP HEADER: BRANDING, CREDITS & 2FA BANNER
         ======================================================== */}
      <header className={`sticky top-0 z-40 border-b px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl ${
        isLight 
          ? 'bg-white/95 border-slate-200 shadow-xs' 
          : 'bg-[#090d16]/90 border-white/10 shadow-2xl'
      }`}>
        {/* Left: Official DABIN Logo & Panel Name */}
        <div className="flex items-center gap-3">
          <DabinLogo className="h-10 sm:h-11 w-auto" glow={true} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-cyan-400 to-amber-500 font-mono">
                {panelInfo.panelName}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                Reseller Master
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              سیستەمی بەڕێوەبردنی هێڵەکان و فرۆشتنی سێرڤەر
            </p>
          </div>
        </div>

        {/* Right: Credits Badge, 2FA Status, Theme & Exit */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap">
          
          {/* CREDITS BADGE (PROMINENT CREDITS: 6) */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/20 border border-amber-500/35 shadow-xs">
            <Coins className="w-4 h-4 text-amber-500 animate-pulse" />
            <div className="text-start">
              <div className="text-[9px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                CREDITS:
              </div>
              <div className="text-sm sm:text-base font-black text-amber-500 font-mono leading-none">
                {panelInfo.credits.toFixed(1)}
              </div>
            </div>
          </div>

          {/* 2FA Security Pill */}
          <button
            onClick={() => setIs2faModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              twoFactor.isEnabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
            }`}
            title="پاراستنی دوو هەنگاوی (2FA)"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>2FA: {twoFactor.isEnabled ? 'Active' : 'Inactive'}</span>
          </button>

          {/* Theme Switcher */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
              title="گۆڕینی دۆخی ڕەنگ"
            >
              {isLight ? '☀️' : '🌙'}
            </button>
          )}

          {/* Switch to TV App */}
          <button
            onClick={onSwitchToTv}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
          >
            <Tv className="w-4 h-4" />
            <span>گەڕانەوە بۆ تیڤی</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          HORIZONTAL NAVIGATION BAR (8 SECTIONS TABS)
         ======================================================== */}
      <nav className={`border-b px-4 sm:px-8 py-2.5 overflow-x-auto custom-internal-scrollbar flex items-center gap-2 ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0b101c] border-white/10'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(2,132,199,0.35)] scale-102'
                  : isLight
                    ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
              } ${item.highlight && !isActive ? 'ring-1 ring-amber-500/40 text-amber-600 dark:text-amber-400 font-black' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.labelKu}</span>
            </button>
          );
        })}
      </nav>

      {/* ========================================================
          MAIN CONTENT AREA (BY ACTIVE SECTION)
         ======================================================== */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">

        {/* -------------------------------------------------------------
            SECTION 1: DASHBOARD & 2FA SECURITY
           ------------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Credits */}
              <div className={`p-5 rounded-3xl border relative overflow-hidden ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-xl'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">کرێدیتی بەردەست (LionOTT)</span>
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500">
                    <Coins className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-500 font-mono">{panelInfo.credits.toFixed(1)}</span>
                  <span className="text-xs font-bold text-slate-400 font-mono">CREDITS</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>ناوی پانێڵ:</span>
                  <span className="font-bold text-sky-500 font-mono">{panelInfo.panelName}</span>
                </div>
              </div>

              {/* Card 2: Smart TV Devices */}
              <div className={`p-5 rounded-3xl border relative overflow-hidden ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-xl'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">ئامێرە چالاکەکانی شاشە</span>
                  <div className="p-2 rounded-xl bg-sky-500/15 text-sky-500">
                    <Tv className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-sky-500 font-mono">{devices.length}</span>
                  <span className="text-xs font-bold text-slate-400">شاشە</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>کەناڵە دابینکراوەکان:</span>
                  <span className="font-bold text-emerald-500 font-mono">20,188 4K</span>
                </div>
              </div>

              {/* Card 3: Free Trials */}
              <div className={`p-5 rounded-3xl border relative overflow-hidden ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-xl'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تێستەکانی ١٢ و ٢٤ کاتژمێر</span>
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-500 font-mono">
                    {devices.filter(d => d.isTrial).length}
                  </span>
                  <span className="text-xs font-bold text-slate-400">تێست بەردەوامە</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>تێچووی کرێدیت:</span>
                  <span className="font-bold text-emerald-500 font-mono">0.0 Cr بێبەرامبەر</span>
                </div>
              </div>

              {/* Card 4: Server Status */}
              <div className={`p-5 rounded-3xl border relative overflow-hidden ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-xl'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">سێرڤەری سەرەکی</span>
                  <div className="p-2 rounded-xl bg-purple-500/15 text-purple-500">
                    <Globe className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-black text-purple-500 font-mono">LionOTT 4K</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold">Online</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>خێرایی وەڵام (Ping):</span>
                  <span className="font-bold text-sky-400 font-mono">38ms</span>
                </div>
              </div>

            </div>

            {/* 2FA Security Banner & Quick Actions */}
            <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-white/10'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className={`p-3 rounded-2xl ${
                  twoFactor.isEnabled ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500/15 text-amber-500'
                }`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    پاراستنی دوو هەنگاوی (Two-Factor Authentication - 2FA)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    بۆ پاراستنی هەژمار و کرێدیتەکانت لە چوونەژوورەوەی نەناسراو لە ڕێگەی ئەپی Google Authenticator
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-3 py-1 rounded-xl ${
                  twoFactor.isEnabled ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                }`}>
                  {twoFactor.isEnabled ? 'Active (پارێزراوە)' : 'Inactive (ناچالاکە)'}
                </span>
                <button
                  onClick={() => setIs2faModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs active:scale-95 transition-all"
                >
                  {twoFactor.isEnabled ? 'ڕێکخستنەوەی 2FA' : 'چالاککردنی 2FA'}
                </button>
              </div>
            </div>

            {/* Recent Devices Quick Table */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-white/10'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold">دوایین شاشە و هێڵە تۆمارکراوەکان</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">کۆدی ئامێرەکان لەگەڵ ماوەی کارایی و سێرڤەری دیاریکراو</p>
                </div>
                <button
                  onClick={() => setActiveTab('devices')}
                  className="text-xs font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1"
                >
                  <span>بینینی هەموو هێڵەکان</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className={`border-b text-[11px] font-bold ${
                    isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'
                  }`}>
                    <tr>
                      <th className="pb-3 text-start">کۆدی ئامێر (Device Code)</th>
                      <th className="pb-3 text-start">ناوی کڕیار</th>
                      <th className="pb-3 text-start">ماوەی پاکێج</th>
                      <th className="pb-3 text-start">سێرڤەری بەستراوە</th>
                      <th className="pb-3 text-start">بەرواری بەسەرچوون</th>
                      <th className="pb-3 text-end">کردارەکان</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {devices.slice(0, 5).map((dev) => (
                      <tr key={dev.id} className="hover:bg-sky-500/5 transition-colors">
                        <td className="py-3 font-mono font-bold text-sky-500">
                          {dev.serialNumber}
                        </td>
                        <td className="py-3 font-bold">{dev.clientName || 'نەزانراو'}</td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            dev.isTrial ? 'bg-emerald-500/15 text-emerald-500' : 'bg-sky-500/15 text-sky-500'
                          }`}>
                            {dev.durationLabel || 'تێستی ٢٤ کاتژمێر'}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {dev.serverType === 'm3u' ? (dev.m3uUrl ? 'M3U Custom Link' : 'None') : (dev.serverHost || 'None')}
                        </td>
                        <td className="py-3 text-[11px] text-slate-500 dark:text-slate-400">
                          {new Date(dev.expiresAt).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3 text-end">
                          <button
                            onClick={() => handleOpenAssignModal(dev)}
                            className="px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 font-bold text-[11px]"
                          >
                            دەستکاری / سێرڤەر
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            SECTION 2: DOMAINS & DNS HOSTING
           ------------------------------------------------------------- */}
        {activeTab === 'domains' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sky-500" />
                  <span>ڕێکخستن و بەڕێوەبردنی دۆمەینەکان (DNS Hosting)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ڕێکخستنی ناونیشان و بەستەرەکانی پەخش کە دەدرێت بە کڕیارەکان و بە ئەپەکانەوە دەبەسترێتەوە
                </p>
              </div>

              <button
                onClick={() => setIsDnsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>زیادکردنی DNS نوێ</span>
              </button>
            </div>

            <div className={`rounded-3xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-xl'
            }`}>
              <table className="w-full text-start text-xs">
                <thead className={`border-b text-[11px] font-bold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-400'
                }`}>
                  <tr>
                    <th className="p-4 text-start">دۆمەین / ناونیشان (Host)</th>
                    <th className="p-4 text-start">پۆرت</th>
                    <th className="p-4 text-start">پرۆتۆکۆل</th>
                    <th className="p-4 text-start">SSL</th>
                    <th className="p-4 text-start">پینگ</th>
                    <th className="p-4 text-start">تێبینی</th>
                    <th className="p-4 text-end">کردار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {domains.map((d) => (
                    <tr key={d.id} className="hover:bg-sky-500/5 transition-colors">
                      <td className="p-4 font-mono font-bold text-sky-500 flex items-center gap-2">
                        <span>{d.host}</span>
                        {d.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-500">
                            بنەڕەتی
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-mono">{d.port}</td>
                      <td className="p-4 uppercase font-mono">{d.protocol}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.ssl ? 'bg-emerald-500/15 text-emerald-500' : 'bg-slate-200 dark:bg-white/10 text-slate-500'
                        }`}>
                          {d.ssl ? 'چالاکە' : 'ناچالاک'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-emerald-500">{d.pingMs}ms</td>
                      <td className="p-4 text-slate-500 dark:text-slate-400">{d.note}</td>
                      <td className="p-4 text-end">
                        <button
                          onClick={() => handleCopy(`http://${d.host}:${d.port}`, d.id)}
                          className="px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 font-bold text-[11px]"
                        >
                          {copiedId === d.id ? 'کۆپیکرا ✓' : 'کۆپیکردن'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            SECTION 3: DEVICE & LINE MANAGEMENT (MOST IMPORTANT SECTION)
           ------------------------------------------------------------- */}
        {activeTab === 'devices' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Sub-tabs Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-sky-500" />
                  <span>بەڕێوەبردنی ئامێرەکان و هێڵەکان (Device & Line Management)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  دیاریکردنی سێرڤەر و پاکێج بەپێی کۆدی هەموو بەکارهێنەرێک (تێستی ١٢ و ٢٤ کاتژمێر تا ١ ساڵ)
                </p>
              </div>

              {/* Sub-tabs buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10">
                <button
                  onClick={() => setDeviceSubTab('smart_tv')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    deviceSubTab === 'smart_tv'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  Smart TV (کۆدی ئامێر)
                </button>
                <button
                  onClick={() => setDeviceSubTab('m3u_lines')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    deviceSubTab === 'm3u_lines'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  M3U Lines
                </button>
                <button
                  onClick={() => setDeviceSubTab('mag_devices')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    deviceSubTab === 'mag_devices'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  MAG Devices
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Smart TV (Device Code based assignment) */}
            {deviceSubTab === 'smart_tv' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="گەڕان بەپێی کۆدی ئامێر، ناو، تەلەفۆن..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full ps-9 pe-3 py-2 rounded-xl text-xs border outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-white/10'
                      }`}
                    />
                  </div>

                  <button
                    onClick={() => handleOpenAssignModal(null)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all w-full sm:w-auto justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تۆمارکردن و بەستنەوەی کۆدی شاشە</span>
                  </button>
                </div>

                <div className={`rounded-3xl border overflow-hidden ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-xl'
                }`}>
                  <table className="w-full text-start text-xs">
                    <thead className={`border-b text-[11px] font-bold ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                      <tr>
                        <th className="p-4 text-start">کۆدی ئامێر (Device Code)</th>
                        <th className="p-4 text-start">ناوی کڕیار و ژمارە</th>
                        <th className="p-4 text-start">پاکێج / ماوە</th>
                        <th className="p-4 text-start">سێرڤەری تەرخانکراو</th>
                        <th className="p-4 text-start">ئایپی و مۆدێل</th>
                        <th className="p-4 text-start">بەسەرچوون</th>
                        <th className="p-4 text-end">دیاریکردنی سێرڤەر</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {devices
                        .filter(d => 
                          (d.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.phone || '').includes(searchQuery)
                        )
                        .map((dev) => (
                          <tr key={dev.id} className="hover:bg-sky-500/5 transition-colors">
                            <td className="p-4 font-mono font-black text-sky-500">
                              <div className="flex items-center gap-2">
                                <span>{dev.serialNumber}</span>
                                <button
                                  onClick={() => handleCopy(dev.serialNumber, dev.id)}
                                  className="text-slate-400 hover:text-sky-500"
                                  title="کۆپیکردنی کۆد"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold">{dev.clientName || 'بەکارهێنەر'}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{dev.phone || 'بێ تەلەفۆن'}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                dev.isTrial
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                              }`}>
                                {dev.durationLabel || 'تێستی ٢٤ کاتژمێری'}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-[11px]">
                              {dev.serverType === 'm3u' ? (
                                <span className="text-amber-500 font-bold" title={dev.m3uUrl}>
                                  M3U Link ({dev.m3uUrl ? dev.m3uUrl.substring(0, 24) + '...' : 'بەتاڵە'})
                                </span>
                              ) : (
                                <span className="text-cyan-500 font-bold">
                                  {dev.serverHost || 'http://line.liondnscloud.ru'}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-[11px] text-slate-400">
                              <div>{dev.deviceModel || 'Smart TV'}</div>
                              <div className="font-mono">{dev.deviceIp || '149.255.228.x'}</div>
                            </td>
                            <td className="p-4 text-[11px] font-mono">
                              {new Date(dev.expiresAt).toLocaleDateString('en-GB')}
                            </td>
                            <td className="p-4 text-end">
                              <button
                                onClick={() => handleOpenAssignModal(dev)}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
                              >
                                دیاریکردنی سێرڤەر
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 2: M3U Lines */}
            {deviceSubTab === 'm3u_lines' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">هێڵەکانی M3U و بەستەری ڕاستەوخۆ</h3>
                  <button
                    onClick={() => setIsM3uModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>دروستکردنی هێڵی نوێ</span>
                  </button>
                </div>

                <div className={`rounded-3xl border overflow-hidden ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-xl'
                }`}>
                  <table className="w-full text-start text-xs">
                    <thead className={`border-b text-[11px] font-bold ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                      <tr>
                        <th className="p-4 text-start">کڕیار</th>
                        <th className="p-4 text-start">یوزەرنەیم</th>
                        <th className="p-4 text-start">پاسوۆرد</th>
                        <th className="p-4 text-start">ماوە</th>
                        <th className="p-4 text-start">بەرواری بەسەرچوون</th>
                        <th className="p-4 text-end">لینکی M3U</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {m3uLines.map((l) => (
                        <tr key={l.id} className="hover:bg-sky-500/5 transition-colors">
                          <td className="p-4 font-bold">{l.clientName}</td>
                          <td className="p-4 font-mono text-sky-500 font-bold">{l.username}</td>
                          <td className="p-4 font-mono">{l.password}</td>
                          <td className="p-4">{l.durationLabel}</td>
                          <td className="p-4 font-mono">{l.expiresAt}</td>
                          <td className="p-4 text-end">
                            <button
                              onClick={() => handleCopy(l.m3uUrl, l.id)}
                              className="px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 font-bold text-[11px]"
                            >
                              {copiedId === l.id ? 'کۆپیکرا ✓' : 'کۆپیکردنی M3U'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {m3uLines.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400">
                            هیچ هێڵێکی سەربەخۆی M3U دروست نەکراوە. دەتوانیت لە دوگمەی سەرەوە هێڵی نوێ دروست بکەیت.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 3: MAG Devices */}
            {deviceSubTab === 'mag_devices' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold">ئامێرەکانی MAG (بە MAC Address)</h3>
                  <button
                    onClick={() => {
                      const mac = prompt('MAC Address بنووسە (بۆ نمونە 00:1A:79:B2:44:01):');
                      if (mac && mac.trim()) {
                        const newM = {
                          id: `mag-${Date.now()}`,
                          mac: mac.trim(),
                          clientName: 'کڕیاری MAG',
                          portal: 'http://line.liondnscloud.ru/c',
                          status: 'active',
                          expiresAt: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB')
                        };
                        saveMagDevices([newM, ...magDevices]);
                        setMagDevices([newM, ...magDevices]);
                        onNotify?.({ title: 'ئامێری MAG زیادکرا', message: `${mac} تۆمارکرا.`, type: 'success' });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>زیادکردنی ئامێری MAG</span>
                  </button>
                </div>

                <div className={`rounded-3xl border overflow-hidden ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-xl'
                }`}>
                  <table className="w-full text-start text-xs">
                    <thead className={`border-b text-[11px] font-bold ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}>
                      <tr>
                        <th className="p-4 text-start">MAC Address</th>
                        <th className="p-4 text-start">کڕیار</th>
                        <th className="p-4 text-start">پۆڕتاڵ (Portal URL)</th>
                        <th className="p-4 text-start">دۆخ</th>
                        <th className="p-4 text-start">بەسەرچوون</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {magDevices.map((m) => (
                        <tr key={m.id} className="hover:bg-sky-500/5 transition-colors">
                          <td className="p-4 font-mono font-bold text-sky-500">{m.mac}</td>
                          <td className="p-4 font-bold">{m.clientName}</td>
                          <td className="p-4 font-mono text-[11px]">{m.portal}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500">
                              چالاکە
                            </span>
                          </td>
                          <td className="p-4 font-mono">{m.expiresAt}</td>
                        </tr>
                      ))}
                      {magDevices.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-400">
                            هیچ ئامێرێکی MAG تۆمار نەکراوە.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------
            SECTION 4: SELLER MANAGEMENT (SUB-RESELLERS)
           ------------------------------------------------------------- */}
        {activeTab === 'sellers' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-sky-500" />
                  <span>بەڕێوەبردنی فرۆشیارەکان (Sub-reseller Management)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  دروستکردنی پەنێڵی فرۆشیاری لاوەکی و دابەشکردنی کرێدیت بەسەر فرۆشیارەکانتدا
                </p>
              </div>

              <button
                onClick={() => setIsSellerModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>زیادکردنی فرۆشیاری نوێ</span>
              </button>
            </div>

            <div className={`rounded-3xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-xl'
            }`}>
              <table className="w-full text-start text-xs">
                <thead className={`border-b text-[11px] font-bold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-400'
                }`}>
                  <tr>
                    <th className="p-4 text-start">ناوی فرۆشیار</th>
                    <th className="p-4 text-start">تەلەفۆن</th>
                    <th className="p-4 text-start">شار</th>
                    <th className="p-4 text-start">کرێدیتی پێدراو</th>
                    <th className="p-4 text-start">سەرفکراو</th>
                    <th className="p-4 text-start">هێڵە چالاکەکان</th>
                    <th className="p-4 text-start">باڵانس</th>
                    <th className="p-4 text-end">کردار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                  {sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-sky-500/5 transition-colors">
                      <td className="p-4 font-bold">{s.name}</td>
                      <td className="p-4 font-mono">{s.phone}</td>
                      <td className="p-4">{s.city}</td>
                      <td className="p-4 font-mono font-bold text-amber-500">{s.creditsGiven} Cr</td>
                      <td className="p-4 font-mono">{s.creditsUsed} Cr</td>
                      <td className="p-4 font-mono font-bold text-sky-500">{s.activeLines}</td>
                      <td className="p-4 font-mono font-bold text-emerald-500">${s.balanceUsd}</td>
                      <td className="p-4 text-end">
                        <button
                          onClick={() => {
                            const addCr = prompt(`چەند کرێدیت دەبەخشیت بە ${s.name}؟`, '5');
                            if (addCr && !isNaN(addCr)) {
                              s.creditsGiven += Number(addCr);
                              saveSellers([...sellers]);
                              setSellers([...sellers]);
                              onNotify?.({ title: 'کرێدیت بەخشرا', message: `${addCr} کرێدیت زیادکرا.`, type: 'success' });
                            }
                          }}
                          className="px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 font-bold text-[11px]"
                        >
                          زیادکردنی کرێدیت
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            SECTION 5: TOOLS & NEWS
           ------------------------------------------------------------- */}
        {activeTab === 'tools' && (
          <div className="space-y-6 animate-fade-in">
            {/* Templates Subsection */}
            <div className="space-y-4">
              <div className="border-b pb-4 border-slate-200 dark:border-white/10">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-sky-500" />
                  <span>قاڵبەکانی ناردنی زانیاری (Message Templates)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  شێوازی ئامادەکراو بۆ ناردنی زانیاری هێڵ و کۆد بۆ کڕیار لە ڕێگەی WhatsApp، SMS و Telegram
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {templates.map((tmpl) => (
                  <div key={tmpl.id} className={`p-5 rounded-3xl border flex flex-col justify-between ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10'
                  }`}>
                    <div>
                      <h4 className="text-sm font-bold text-sky-500 mb-2">{tmpl.titleKu}</h4>
                      <pre className="text-[11px] font-sans whitespace-pre-wrap text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-black/30 p-3 rounded-2xl border border-slate-200 dark:border-white/5 leading-relaxed">
                        {tmpl.content}
                      </pre>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">قاڵبی فەرمی دابین</span>
                      <button
                        onClick={() => handleCopy(tmpl.content, tmpl.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === tmpl.id ? 'کۆپیکرا ✓' : 'کۆپیکردن'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* News Subsection */}
            <div className="space-y-4 pt-4">
              <div className="border-b pb-4 border-slate-200 dark:border-white/10">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-purple-500" />
                  <span>هەواڵ و ئاگادارییەکانی سێرڤەر (LionOTT Bulletins)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  نوێکردنەوەکانی پەخشی کەناڵەکان و باشترکردنی سەقامگیری سێرڤەری سەرەکی
                </p>
              </div>

              <div className="space-y-3">
                {newsList.map((n) => (
                  <div key={n.id} className={`p-5 rounded-3xl border ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-white/10'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-sky-500">{n.titleKu}</span>
                      <span className="text-[11px] font-mono text-slate-400">{n.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{n.bodyKu}</p>
                    <div className="mt-3 text-[10px] text-slate-400 font-mono">نێردراوە لەلایەن: {n.author}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            SECTION 6: SUPPORT TICKETS
           ------------------------------------------------------------- */}
        {activeTab === 'tickets' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-white/10">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-emerald-500" />
                  <span>داواکارییەکانی پاڵپشتی (Support Tickets)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  ناردنی کێشە تەکنیکییەکان و پرسیارەکانت بۆ سێرڤەری سەرەکی و بینینی وەڵامەکان
                </p>
              </div>

              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>تیکێتی نوێ (New Ticket)</span>
              </button>
            </div>

            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className={`p-5 rounded-3xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-white/10'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-500">#{t.id}</span>
                      <h4 className="text-sm font-bold">{t.subject}</h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500">
                      وەڵامدراوەتەوە
                    </span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/5 text-xs text-slate-700 dark:text-slate-200">
                    <strong>وەڵامی تیمی تەکنیکی:</strong> {t.lastReply}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">بەرواری ناردن: {t.createdAt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            SECTION 7: LOGS & HISTORY
           ------------------------------------------------------------- */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b pb-4 border-slate-200 dark:border-white/10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" />
                <span>تۆماری چالاکی و کرێدیتەکان (Logs & History)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                چاودێریکردنی مێژووی سەرفکردنی کرێدیت، فرۆشتن، و چوونەژوورەوەکان
              </p>
            </div>

            <div className={`rounded-3xl border overflow-hidden ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/60 border-white/10 shadow-xl'
            }`}>
              <table className="w-full text-start text-xs">
                <thead className={`border-b text-[11px] font-bold ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-slate-400'
                }`}>
                  <tr>
                    <th className="p-4 text-start">کات و بەروار</th>
                    <th className="p-4 text-start">جۆر</th>
                    <th className="p-4 text-start">ڕوونکردنەوەی چالاکی</th>
                    <th className="p-4 text-start">بڕی کرێدیت</th>
                    <th className="p-4 text-start">باڵانسی ماوە</th>
                    <th className="p-4 text-end">بەکارهێنەر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5 font-mono text-[11px]">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-sky-500/5 transition-colors">
                      <td className="p-4 text-slate-400">{l.timestamp}</td>
                      <td className="p-4 uppercase font-bold text-sky-500">{l.type}</td>
                      <td className="p-4 font-sans text-xs">{l.description}</td>
                      <td className="p-4 font-bold text-amber-500">{l.amount || '0'}</td>
                      <td className="p-4 font-bold text-emerald-500">{l.balance}</td>
                      <td className="p-4 text-end text-slate-400 font-sans">{l.actor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            SECTION 8: SETTINGS & PROFILE
           ------------------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in max-w-3xl">
            <div className="border-b pb-4 border-slate-200 dark:border-white/10">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-500" />
                <span>ڕێکخستنەکان و هەژمار (Settings & Profile)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                گۆڕینی ناوی پانێڵ، پاسۆرد، و خاوێنکردنەوەی تەواوی داتاکان
              </p>
            </div>

            {/* Profile Info Card */}
            <div className={`p-6 rounded-3xl border space-y-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-white/10'
            }`}>
              <h3 className="text-sm font-bold text-sky-500">زانیاری هەژماری فرۆشیار</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ناوی پانێڵ</label>
                  <input
                    type="text"
                    value={panelInfo.panelName}
                    onChange={(e) => {
                      const updated = { ...panelInfo, panelName: e.target.value };
                      setPanelInfo(updated);
                      savePanelInfo(updated);
                    }}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-white/10'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ژمارەی کرێدیت (Credits)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={panelInfo.credits}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setResellerCredits(val);
                      setPanelInfo(getPanelInfo());
                    }}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold text-amber-500 ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-white/10'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Clean Wipe Data (As user requested) */}
            <div className="p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 space-y-3">
              <h3 className="text-sm font-bold text-rose-500 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>پاککردنەوەی تەواوی داتاکان و فرێشکردنی ئەدمین پانێڵ</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                بە کلیک لەم دوگمەیە سەرجەم ئامێرە کۆنەکان و داتاکانی تێست دەسڕدرێنەوە و پانێڵەکە بە شێوەیەکی فەرمی بە ناوی <strong>Dabintv</strong> و <strong>CREDITS: 6</strong> دەست پێدەکاتەوە.
              </p>
              <button
                onClick={handleCleanFreshReset}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs active:scale-95 transition-all shadow-md"
              >
                سڕینەوە و فرێشکردنی گشتی ئەدمین پانێڵ
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================
          STICKY FOOTER WITH PANEL CREDITS & COPYRIGHT
         ======================================================== */}
      <footer className={`border-t px-4 sm:px-8 py-3 text-xs flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#090d16] border-white/10 text-slate-400'
      }`}>
        <div className="flex items-center gap-2 font-mono">
          <span>ناوی پانێڵ:</span>
          <strong className="text-sky-500 font-bold">{panelInfo.panelName}</strong>
          <span>•</span>
          <span>ژمارەی کرێدیت:</span>
          <strong className="text-amber-500 font-bold">CREDITS: {panelInfo.credits.toFixed(1)}</strong>
        </div>
        <div className="text-[11px]">
          DABIN.tv Premium IPTV Solutions • All Rights Reserved 2026
        </div>
      </footer>

      {/* ========================================================
          MODAL: ASSIGN SERVER & DURATION TO DEVICE
         ======================================================== */}
      {isAssignModalOpen && selectedDevice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/15 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-500">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">دیاریکردنی ماوە و سێرڤەر بۆ شاشە</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{selectedDevice.serialNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeviceAssignment} className="space-y-4 text-xs">
              
              {/* Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ناوی کڕیار</label>
                  <input
                    type="text"
                    required
                    placeholder="بۆ نمونە: دیاری دارا"
                    value={assignClientName}
                    onChange={(e) => setAssignClientName(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ژمارەی مۆبایل</label>
                  <input
                    type="text"
                    placeholder="0770 xxx xxxx"
                    value={assignPhone}
                    onChange={(e) => setAssignPhone(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                    }`}
                  />
                </div>
              </div>

              {/* DURATION SELECTION (As requested: 12h, 24h, 1M, 3M, 6M, 12M) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-2">
                  دیاریکردنی ماوەی بەشداربوون یان تێست (Subscription Duration):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUBSCRIPTION_DURATIONS.map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setAssignDuration(dur.id)}
                      className={`p-2.5 rounded-2xl border text-start transition-all ${
                        assignDuration === dur.id
                          ? 'border-sky-500 bg-sky-500/15 text-sky-500 font-bold ring-2 ring-sky-500/30'
                          : isLight
                            ? 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                            : 'border-white/10 bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{dur.labelKu}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {dur.isTrial ? 'بێبەرامبەر (0 Cr)' : `${dur.creditCost} کرێدیت`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SERVER CONFIGURATION (M3U or Xtream Codes) */}
              <div className="p-4 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-500">جۆری سێرڤەر:</span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                      <input
                        type="radio"
                        name="srvType"
                        checked={assignServerType === 'xtream'}
                        onChange={() => setAssignServerType('xtream')}
                      />
                      <span>Xtream Codes (Host + User + Pass)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold ms-3">
                      <input
                        type="radio"
                        name="srvType"
                        checked={assignServerType === 'm3u'}
                        onChange={() => setAssignServerType('m3u')}
                      />
                      <span>لینکی M3U</span>
                    </label>
                  </div>
                </div>

                {assignServerType === 'xtream' ? (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">Server Host (ناونیشانی سێرڤەر)</label>
                      <input
                        type="text"
                        required
                        placeholder="http://line.liondnscloud.ru"
                        value={assignHost}
                        onChange={(e) => setAssignHost(e.target.value)}
                        className={`w-full p-2 rounded-xl border font-mono ${
                          isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-white/10'
                        }`}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">Username</label>
                        <input
                          type="text"
                          required
                          placeholder="یوزەرنەیم"
                          value={assignUsername}
                          onChange={(e) => setAssignUsername(e.target.value)}
                          className={`w-full p-2 rounded-xl border font-mono ${
                            isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-white/10'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">Password</label>
                        <input
                          type="text"
                          required
                          placeholder="تێپەڕەوشە"
                          value={assignPassword}
                          onChange={(e) => setAssignPassword(e.target.value)}
                          className={`w-full p-2 rounded-xl border font-mono ${
                            isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-white/10'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <label className="block text-[10px] text-slate-400 mb-0.5 font-bold">لینکی فەرمی M3U</label>
                    <textarea
                      rows="3"
                      required
                      placeholder="http://example.com/get.php?username=...&password=...&type=m3u_plus"
                      value={assignM3uUrl}
                      onChange={(e) => setAssignM3uUrl(e.target.value)}
                      className={`w-full p-2 rounded-xl border font-mono text-[11px] ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-white/10'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/10 text-slate-500 font-bold"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold shadow-md active:scale-95 transition-all"
                >
                  پاشەکەوتکردن و چالاککردنی شاشە
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: 2FA ACTIVATION (GOOGLE AUTHENTICATOR)
         ======================================================== */}
      {is2faModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 animate-scale-up ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/15 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-500" />
                <h3 className="text-base font-bold">پاراستنی دوو هەنگاوی (2FA)</h3>
              </div>
              <button onClick={() => setIs2faModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-3 py-2">
              <div className="inline-flex p-4 rounded-3xl bg-white border border-slate-200 shadow-inner">
                <QrCode className="w-24 h-24 text-slate-900" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ئەم کۆدە نهێنییە لە ئەپی Google Authenticator داخڵ بکە:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-slate-300 dark:border-white/10 font-mono font-bold text-sky-500 tracking-widest text-sm">
                {twoFactor.secretKey}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">کۆدی ٦ ژمارەیی ئەپەکە</label>
              <input
                type="text"
                maxLength="6"
                placeholder="123456"
                value={twoFactorInputCode}
                onChange={(e) => setTwoFactorInputCode(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-center font-mono text-lg font-bold tracking-widest ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  toggleTwoFactor(!twoFactor.isEnabled);
                  setTwoFactor(getTwoFactorStatus());
                  setIs2faModalOpen(false);
                  onNotify?.({
                    title: 'دۆخی 2FA گۆڕدرا',
                    message: `پاراستنی دوو هەنگاوی ${!twoFactor.isEnabled ? 'چالاککرا' : 'ناچالاککرا'}.`,
                    type: 'success'
                  });
                }}
                className={`w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all ${
                  twoFactor.isEnabled ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {twoFactor.isEnabled ? 'ناچالاککردنی 2FA' : 'تەواو و چالاککردنی 2FA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: NEW TICKET
         ======================================================== */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 space-y-4 animate-scale-up ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/15 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold">ناردنی داواکاری پاڵپشتی نوێ</h3>
              </div>
              <button onClick={() => setIsTicketModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">بابەتی کێشەکە</label>
                <input
                  type="text"
                  required
                  placeholder="بۆ نمونە: کێشەی دەنگی کەناڵی BeIN"
                  value={tktSubject}
                  onChange={(e) => setTktSubject(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">بەش (Department)</label>
                  <select
                    value={tktDepartment}
                    onChange={(e) => setTktDepartment(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                    }`}
                  >
                    <option value="Live Streams">Live Streams</option>
                    <option value="Billing & Credits">Billing & Credits</option>
                    <option value="VOD & Series">VOD & Series</option>
                    <option value="General Support">General Support</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ئاستی گرنگی</label>
                  <select
                    value={tktPriority}
                    onChange={(e) => setTktPriority(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                    }`}
                  >
                    <option value="normal">ئاسایی</option>
                    <option value="high">بەپەلە</option>
                    <option value="critical">زۆر گرنگ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">دەقی کێشەکە و ڕوونکردنەوە</label>
                <textarea
                  rows="4"
                  required
                  placeholder="تکایە زانیاری تەواوی کێشەکە لێرە بنووسە..."
                  value={tktMessage}
                  onChange={(e) => setTktMessage(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-400"
                >
                  داخستن
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  ناردنی تیکێت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD DNS
         ======================================================== */}
      {isDnsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 animate-scale-up ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/15 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-sky-500" />
                <span>زیادکردنی ناونیشانی DNS</span>
              </h3>
              <button onClick={() => setIsDnsModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDns} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">دۆمەین (Hostname)</label>
                <input
                  type="text"
                  required
                  placeholder="stream.dabintv.com"
                  value={dnsHost}
                  onChange={(e) => setDnsHost(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">پۆرت</label>
                <input
                  type="number"
                  value={dnsPort}
                  onChange={(e) => setDnsPort(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">تێبینی</label>
                <input
                  type="text"
                  placeholder="سێرڤەری VIP بۆ مۆبایل"
                  value={dnsNote}
                  onChange={(e) => setDnsNote(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDnsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-400"
                >
                  داخستن
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  زیادکردنی DNS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD M3U LINE
         ======================================================== */}
      {isM3uModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 animate-scale-up ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/15 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-500" />
                <span>دروستکردنی هێڵی نوێی M3U</span>
              </h3>
              <button onClick={() => setIsM3uModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateM3uLine} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ناوی کڕیار</label>
                <input
                  type="text"
                  placeholder="سەروەر مەحمود"
                  value={newLineClient}
                  onChange={(e) => setNewLineClient(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Username (ئارەزوومەندانە)</label>
                  <input
                    type="text"
                    placeholder="خۆکار دروست دەکرێت"
                    value={newLineUser}
                    onChange={(e) => setNewLineUser(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Password</label>
                  <input
                    type="text"
                    placeholder="خۆکار دروست دەکرێت"
                    value={newLinePass}
                    onChange={(e) => setNewLinePass(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ماوەی پاکێج</label>
                <select
                  value={newLineDuration}
                  onChange={(e) => setNewLineDuration(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                  }`}
                >
                  {SUBSCRIPTION_DURATIONS.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.labelKu} - {d.creditCost} Cr
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsM3uModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-400"
                >
                  داخستن
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  دروستکردن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD SUB-RESELLER
         ======================================================== */}
      {isSellerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-4 animate-scale-up ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/15 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-500" />
                <span>زیادکردنی فرۆشیاری نوێ</span>
              </h3>
              <button onClick={() => setIsSellerModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSeller} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ناوی فرۆشیار یان فرۆشگا</label>
                <input
                  type="text"
                  required
                  placeholder="کۆمپیوتەری سلێمانی"
                  value={newSellerName}
                  onChange={(e) => setNewSellerName(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">ژمارەی تەلەفۆن</label>
                  <input
                    type="text"
                    placeholder="0770 xxx xxxx"
                    value={newSellerPhone}
                    onChange={(e) => setNewSellerPhone(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">شار</label>
                  <input
                    type="text"
                    placeholder="هەولێر / سلێمانی"
                    value={newSellerCity}
                    onChange={(e) => setNewSellerCity(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ژمارەی کرێدیتی دەستپێک</label>
                <input
                  type="number"
                  value={newSellerCredits}
                  onChange={(e) => setNewSellerCredits(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border font-mono font-bold text-amber-500 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-white/10'
                  }`}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSellerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-slate-400"
                >
                  داخستن
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  تۆمارکردنی فرۆشیار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
