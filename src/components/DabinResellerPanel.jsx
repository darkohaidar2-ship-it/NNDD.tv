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
  Maximize2,
  Eye,
  Activity,
  DollarSign,
  Receipt,
  Calendar,
  Wifi,
  Radio,
  Camera
} from 'lucide-react';

import DabinLogo from './DabinLogo';
import { generateMagMacAddress } from '../data/deviceManager';
import { 
  SUBSCRIPTION_DURATIONS,
  getPanelInfo, 
  savePanelInfo, 
  getResellerCredits, 
  setResellerCredits,
  getResellerDevices, 
  saveResellerDevices, 
  assignServerToDevice,
  updateDeviceActivity,
  addDeviceTransaction,
  toggleDeviceStatus,
  deleteResellerDevice,
  registerNewMagDevice,
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

  // -------------------------------------------------------------
  // MAC Master Profile & Device Activity & Ledger State
  // -------------------------------------------------------------
  const [activeMacProfile, setActiveMacProfile] = useState(null);
  const [isMacProfileOpen, setIsMacProfileOpen] = useState(false);

  // New Transaction inside MAC Profile
  const [newTxAction, setNewTxAction] = useState('نوێکردنەوەی پاکێج');
  const [newTxPrice, setNewTxPrice] = useState('15000');
  const [newTxStatus, setNewTxStatus] = useState('پارەدراوە (کاش)');
  const [newTxNotes, setNewTxNotes] = useState('');

  // Register New MAG Device Modal State
  const [isNewMagModalOpen, setIsNewMagModalOpen] = useState(false);
  const [newMagMac, setNewMagMac] = useState('');
  const [newMagClient, setNewMagClient] = useState('');
  const [newMagPhone, setNewMagPhone] = useState('');
  const [newMagDuration, setNewMagDuration] = useState('1m');
  const [newMagPrice, setNewMagPrice] = useState('15000');
  const [newMagServerType, setNewMagServerType] = useState('xtream');
  const [newMagHost, setNewMagHost] = useState('http://line.liondnscloud.ru');
  const [newMagUser, setNewMagUser] = useState('');
  const [newMagPass, setNewMagPass] = useState('');
  const [newMagM3u, setNewMagM3u] = useState('');
  const [newMagNotes, setNewMagNotes] = useState('');

  // Relative Time & Live Channel Telemetry Helper
  const formatRelativeActivity = (activity) => {
    if (!activity || !activity.timestamp) {
      return { text: 'ناچالاکە (Standby)', isLive: false, channel: 'DABIN.tv' };
    }
    const diffSec = Math.floor((Date.now() - Number(activity.timestamp)) / 1000);
    const channel = activity.channelName || 'DABIN.tv';

    if (diffSec < 240) { // under 4 minutes
      return { text: 'ئێستا سەیر دەکات 🟢', isLive: true, channel };
    } else if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return { text: `پێش ${mins} خولەک`, isLive: false, channel };
    } else if (diffSec < 86400) {
      const hrs = Math.floor(diffSec / 3600);
      return { text: `پێش ${hrs} کاتژمێر`, isLive: false, channel };
    } else {
      const days = Math.floor(diffSec / 86400);
      return { text: `پێش ${days} ڕۆژ`, isLive: false, channel };
    }
  };

  // Open MAC Master Profile
  const handleOpenMacProfile = (dev) => {
    setActiveMacProfile(dev);
    setIsMacProfileOpen(true);
  };

  // Add Manual Transaction to MAC Profile
  const handleAddProfileTransaction = (e) => {
    e?.preventDefault();
    if (!activeMacProfile) return;
    const priceNum = parseInt(newTxPrice, 10) || 0;
    const res = addDeviceTransaction(activeMacProfile.serialNumber || activeMacProfile.macAddress, {
      action: newTxAction,
      priceIqd: priceNum,
      paymentStatus: newTxStatus,
      adminNotes: newTxNotes
    });
    if (res) {
      const refreshedList = getResellerDevices();
      setDevices(refreshedList);
      const updatedProfile = refreshedList.find(d => 
        d.serialNumber === activeMacProfile.serialNumber || d.macAddress === activeMacProfile.macAddress
      );
      if (updatedProfile) setActiveMacProfile(updatedProfile);
      setLogs(getLogs());
      setNewTxNotes('');
      onNotify?.({
        title: 'مامەڵەی دارایی تۆمارکرا 💳',
        message: `بڕی ${priceNum.toLocaleString()} IQD بۆ ئامێری (${activeMacProfile.macAddress}) تۆمارکرا.`,
        type: 'success'
      });
    }
  };

  // Toggle Device Status (active / suspended)
  const handleToggleStatus = (dev) => {
    const updated = toggleDeviceStatus(dev.serialNumber || dev.macAddress);
    if (updated) {
      const refreshedList = getResellerDevices();
      setDevices(refreshedList);
      if (activeMacProfile && (activeMacProfile.serialNumber === dev.serialNumber || activeMacProfile.macAddress === dev.macAddress)) {
        setActiveMacProfile(updated);
      }
      setLogs(getLogs());
      onNotify?.({
        title: 'دۆخی ئامێر گۆڕدرا',
        message: `ئامێری (${dev.macAddress || dev.serialNumber}) ئێستا ${updated.status === 'active' ? 'چالاکە' : 'ڕاگیراوە'}.`,
        type: 'info'
      });
    }
  };

  // Delete Device
  const handleDeleteDevice = (dev) => {
    if (window.confirm(`ئایا دڵنیایت لە سڕینەوەی ئامێری (${dev.macAddress || dev.serialNumber})؟`)) {
      const filtered = deleteResellerDevice(dev.serialNumber || dev.macAddress);
      setDevices(filtered);
      setIsMacProfileOpen(false);
      setActiveMacProfile(null);
      setLogs(getLogs());
      onNotify?.({
        title: 'ئامێر سڕایەوە',
        message: `ئامێری (${dev.macAddress || dev.serialNumber}) بە سەرکەوتوویی سڕایەوە.`,
        type: 'error'
      });
    }
  };

  // Create New MAG Device
  const handleSaveNewMagDevice = (e) => {
    e?.preventDefault();
    if (!newMagMac.trim()) {
      onNotify?.({ title: 'تکایە کۆدی ماک بنووسە', message: 'کۆدی MAC پێویستە.', type: 'error' });
      return;
    }
    const res = registerNewMagDevice({
      mac: newMagMac.trim(),
      clientName: newMagClient.trim(),
      phone: newMagPhone.trim(),
      durationId: newMagDuration,
      priceIqd: parseInt(newMagPrice, 10) || 0,
      serverType: newMagServerType,
      serverHost: newMagHost,
      serverUsername: newMagUser || `mag_${Math.floor(1000 + Math.random() * 9000)}`,
      serverPassword: newMagPass || `pwd_${Math.random().toString(36).substring(2,8)}`,
      m3uUrl: newMagM3u,
      adminNotes: newMagNotes
    });

    const refreshedList = getResellerDevices();
    setDevices(refreshedList);
    setPanelInfo(getPanelInfo());
    setLogs(getLogs());
    setIsNewMagModalOpen(false);

    onNotify?.({
      title: 'ئامێری MAG تۆمارکرا 🎉',
      message: `ئامێری (${res.macAddress}) بە سەرکەوتوویی خرایە سەر ${res.durationLabel}.`,
      type: 'success'
    });
  };

  // WhatsApp Invoice Helper
  const handleSendWhatsAppInvoice = (dev) => {
    const totalSpent = (dev.transactions || []).reduce((acc, t) => acc + (t.priceIqd || 0), 0);
    const text = `سڵاو بەڕێز ${dev.clientName || 'کڕیاری خۆشەویست'} 🌷
پسوولەی بەشداربوونی فەرمی DABIN.tv:
📺 کۆدی ماگ (MAC): ${dev.macAddress}
🔑 کۆدی ئامێر (Device Code): ${dev.serialNumber}
📦 پاکێجی چالاک: ${dev.durationLabel}
📅 بەرواری بەسەرچوون: ${new Date(dev.expiresAt).toLocaleDateString('en-GB')}
🌐 پۆڕتاڵی پەخش: ${dev.portalUrl || 'http://line.liondnscloud.ru/c/'}
💰 کۆی پارەی وەرگیراو: ${totalSpent.toLocaleString()} IQD

سوپاس بۆ بەکارهێنانی DABIN.tv Premium IPTV Solutions!`;

    const url = `https://api.whatsapp.com/send?phone=${encodeURIComponent(dev.phone || '')}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

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
    if (!selectedDevice?.serialNumber && !selectedDevice?.macAddress) return;

    const res = assignServerToDevice({
      serialNumber: selectedDevice.serialNumber,
      macAddress: selectedDevice.macAddress,
      clientName: assignClientName,
      phone: assignPhone,
      durationId: assignDuration,
      serverType: assignServerType,
      m3uUrl: assignM3uUrl,
      serverHost: assignHost,
      serverUsername: assignUsername,
      serverPassword: assignPassword
    });

    const refreshedList = getResellerDevices();
    setDevices(refreshedList);
    setPanelInfo(getPanelInfo());
    setLogs(getLogs());
    setIsAssignModalOpen(false);

    if (activeMacProfile && (activeMacProfile.serialNumber === selectedDevice.serialNumber || activeMacProfile.macAddress === selectedDevice.macAddress)) {
      setActiveMacProfile(res);
    }

    onNotify?.({
      title: 'سێرڤەر و پاکێج بەسترایەوە 🎉',
      message: `ئامێری (${selectedDevice.macAddress || selectedDevice.serialNumber}) بە سەرکەوتوویی خرایە سەر ${res.durationLabel}.`,
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
                        <th className="p-4 text-start">کۆدی ماک (MAG MAC) & ئامێر</th>
                        <th className="p-4 text-start">ناوی کڕیار و پەیوەندی</th>
                        <th className="p-4 text-start">کۆتا ئەکتیڤیتی (Live Activity)</th>
                        <th className="p-4 text-start">پاکێج / بەسەرچوون</th>
                        <th className="p-4 text-start">سێرڤەری تەرخانکراو</th>
                        <th className="p-4 text-start">دۆخ</th>
                        <th className="p-4 text-end">کردارەکان</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {devices
                        .filter(d => 
                          (d.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.macAddress || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.phone || '').includes(searchQuery)
                        )
                        .map((dev) => {
                          const activity = formatRelativeActivity(dev.lastActivity);
                          return (
                            <tr key={dev.id} className="hover:bg-sky-500/5 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenMacProfile(dev)}
                                    className="font-mono font-black text-sky-500 hover:text-sky-400 hover:underline flex items-center gap-1.5 cursor-pointer text-xs"
                                    title="کردنەوەی پرۆفایلی تەواوی ئەم ماکە"
                                  >
                                    <Tv className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{dev.macAddress || '00:1A:79:B4:9C:2F'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleCopy(dev.macAddress || dev.serialNumber, dev.id)}
                                    className="text-slate-400 hover:text-sky-500"
                                    title="کۆپیکردنی MAC"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  سریاڵ: {dev.serialNumber}
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="font-bold">{dev.clientName || 'بەکارهێنەر'}</div>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                  <span>{dev.phone || 'بێ تەلەفۆن'}</span>
                                  {dev.phone && (
                                    <button
                                      type="button"
                                      onClick={() => handleSendWhatsAppInvoice(dev)}
                                      className="text-emerald-500 hover:text-emerald-400"
                                      title="گفتوگۆی وەتسئەپ"
                                    >
                                      <Send className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              {/* Live Activity Telemetry ("کۆتا ئەکتیڤیتی") */}
                              <td className="p-4">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${activity.isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                                  <span className="font-bold text-[11px] text-slate-200">
                                    {activity.channel}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {activity.text}
                                </div>
                              </td>

                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  dev.isTrial
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                                }`}>
                                  {dev.durationLabel || 'تێستی ٢٤ کاتژمێری'}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                                  بەسەرچوون: {new Date(dev.expiresAt).toLocaleDateString('en-GB')}
                                </div>
                              </td>

                              <td className="p-4 font-mono text-[11px]">
                                {dev.serverType === 'm3u' ? (
                                  <span className="text-amber-500 font-bold" title={dev.m3uUrl}>
                                    M3U Link ({dev.m3uUrl ? dev.m3uUrl.substring(0, 18) + '...' : 'بەتاڵە'})
                                  </span>
                                ) : (
                                  <span className="text-cyan-500 font-bold truncate block max-w-[150px]" title={dev.serverHost}>
                                    {dev.serverHost || 'line.liondnscloud.ru'}
                                  </span>
                                )}
                              </td>

                              {/* Status Toggle */}
                              <td className="p-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(dev)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                    dev.status === 'active'
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
                                  }`}
                                  title="گۆڕینی دۆخی ئامێر"
                                >
                                  {dev.status === 'active' ? 'چالاکە ✓' : 'ڕاگیراوە ⏸'}
                                </button>
                              </td>

                              <td className="p-4 text-end">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenMacProfile(dev)}
                                    className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/30 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                    title="پرۆفایلی تەواوی ئەم ماکە و کڕین و فرۆشتن"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>پرۆفایل</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenAssignModal(dev)}
                                    className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
                                    title="دیاریکردنی سێرڤەر و ماوە"
                                  >
                                    سێرڤەر
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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

            {/* Sub-tab 3: MAG Devices & Stalker Profiles */}
            {deviceSubTab === 'mag_devices' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="گەڕان بەپێی MAC Address، ناو، تەلەفۆن..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full ps-9 pe-3 py-2 rounded-xl text-xs border outline-none ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-white/10'
                      }`}
                    />
                  </div>

                  <button
                    onClick={() => {
                      setNewMagMac(generateMagMacAddress());
                      setNewMagClient('');
                      setNewMagPhone('');
                      setNewMagDuration('1m');
                      setNewMagPrice('15000');
                      setNewMagServerType('xtream');
                      setNewMagHost('http://line.liondnscloud.ru');
                      setNewMagUser(`mag_${Math.floor(1000 + Math.random() * 9000)}`);
                      setNewMagPass(`pwd_${Math.random().toString(36).substring(2, 8)}`);
                      setNewMagM3u('');
                      setNewMagNotes('');
                      setIsNewMagModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all w-full sm:w-auto justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>تۆمارکردنی ئامێری نوێی MAG (بە MAC)</span>
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
                        <th className="p-4 text-start">MAC Address (Infomir)</th>
                        <th className="p-4 text-start">کڕیار و تەلەفۆن</th>
                        <th className="p-4 text-start">کۆتا ئەکتیڤیتی</th>
                        <th className="p-4 text-start">پاکێج / بەسەرچوون</th>
                        <th className="p-4 text-start">کۆی کڕین و فرۆشتن</th>
                        <th className="p-4 text-start">دۆخ</th>
                        <th className="p-4 text-end">پرۆفایلی ماک و کردار</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {devices
                        .filter(d => 
                          (d.macAddress || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (d.phone || '').includes(searchQuery)
                        )
                        .map((m) => {
                          const activity = formatRelativeActivity(m.lastActivity);
                          const totalSales = (m.transactions || []).reduce((acc, t) => acc + (t.priceIqd || 0), 0);
                          return (
                            <tr key={m.id} className="hover:bg-cyan-500/5 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenMacProfile(m)}
                                    className="font-mono font-black text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1.5 cursor-pointer text-xs"
                                    title="کردنەوەی پرۆفایلی تەواوی ئەم ماکە"
                                  >
                                    <Tv className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{m.macAddress || '00:1A:79:...'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleCopy(m.macAddress, m.id)}
                                    className="text-slate-400 hover:text-cyan-400"
                                    title="کۆپیکردنی MAC"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  پۆڕتاڵ: {m.portalUrl || 'http://line.liondnscloud.ru/c/'}
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="font-bold">{m.clientName || 'کڕیاری MAG'}</div>
                                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                  <span>{m.phone || 'بێ تەلەفۆن'}</span>
                                  {m.phone && (
                                    <button
                                      type="button"
                                      onClick={() => handleSendWhatsAppInvoice(m)}
                                      className="text-emerald-500 hover:text-emerald-400"
                                      title="گفتوگۆی وەتسئەپ"
                                    >
                                      <Send className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${activity.isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                                  <span className="font-bold text-[11px] text-slate-200">
                                    {activity.channel}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {activity.text}
                                </div>
                              </td>

                              <td className="p-4">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  {m.durationLabel || '١ مانگ'}
                                </span>
                                <div className="text-[10px] text-slate-400 font-mono mt-1">
                                  بەسەرچوون: {new Date(m.expiresAt).toLocaleDateString('en-GB')}
                                </div>
                              </td>

                              <td className="p-4">
                                <div className="font-bold text-emerald-400 font-mono text-xs">
                                  {totalSales > 0 ? `${totalSales.toLocaleString()} IQD` : '0 IQD (تێست)'}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {(m.transactions || []).length} مامەڵە تۆمارکراوە
                                </div>
                              </td>

                              <td className="p-4">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(m)}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                    m.status === 'active'
                                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                                  }`}
                                >
                                  {m.status === 'active' ? 'چالاکە ✓' : 'ڕاگیراوە ⏸'}
                                </button>
                              </td>

                              <td className="p-4 text-end">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOpenMacProfile(m)}
                                    className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/30 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                                    title="پرۆفایلی تەواوی ماک و فرۆشتن"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>پرۆفایل</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenAssignModal(m)}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 active:scale-95 transition-all cursor-pointer"
                                    title="گۆڕینی پاکێج"
                                  >
                                    نوێکردنەوە
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDevice(m)}
                                    className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                    title="سڕینەوە"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      {devices.length === 0 && (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-400">
                            هیچ ئامێرێکی MAG تۆمار نەکراوە. لە دوگمەی سەرەوە ئامێری نوێ تۆمار بکە.
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
              
              {/* MAC Address Identification */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-cyan-300 font-bold block">ئەکاونتی ئەم شاشەیە (MAC Address):</span>
                  <span className="font-mono text-sm sm:text-base font-black text-cyan-200 tracking-wider">
                    {selectedDevice.macAddress || selectedDevice.serialNumber}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-300 bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                  {selectedDevice.deviceModel || 'Smart TV'}
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

      {/* ========================================================
          MODAL: MAC MASTER PROFILE & FINANCIAL SALES LEDGER
          وەک پرۆفایلێک بۆ نیشاندانی ماک، تایبەتمەندیەکانی و مێژووی کڕین و فرۆشتن
         ======================================================== */}
      {isMacProfileOpen && activeMacProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl animate-fade-in text-start select-text" dir="rtl">
          <div className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-scale-up ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-cyan-500/30 text-white'
          }`}>
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-white/10 flex items-start sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                  <Tv className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono font-bold">
                      MAG STALKER PROFILE
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1.5 ${
                      formatRelativeActivity(activeMacProfile.lastActivity).isLive
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-700/50 text-slate-300 border-white/10'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${formatRelativeActivity(activeMacProfile.lastActivity).isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{formatRelativeActivity(activeMacProfile.lastActivity).isLive ? 'سەرهێڵە (Live)' : 'ناچالاکە (Standby)'}</span>
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-mono font-black text-cyan-300 tracking-wider mt-1 flex items-center gap-2">
                    <span>{activeMacProfile.macAddress || '00:1A:79:B4:9C:2F'}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeMacProfile.macAddress, 'modal-mac')}
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="کۆپیکردنی MAC"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-3 flex-wrap">
                    <span>سریاڵ: <strong className="text-emerald-400">{activeMacProfile.serialNumber}</strong></span>
                    <span>•</span>
                    <span>کڕیار: <strong className="text-white">{activeMacProfile.clientName || 'بەکارهێنەری تۆمارنەکراو'}</strong></span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMacProfileOpen(false)}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Top 3 Metric Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">کۆی کڕین و داهات (Total Sales):</span>
                    <span className="text-base font-black font-mono text-emerald-400">
                      {((activeMacProfile.transactions || []).reduce((acc, t) => acc + (t.priceIqd || 0), 0)).toLocaleString()} IQD
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/20 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">کۆتا ئەکتیڤیتی (Current Activity):</span>
                    <span className="text-xs font-bold text-cyan-300 block truncate max-w-[180px]">
                      {activeMacProfile.lastActivity?.channelName || 'DABIN.tv Channel'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatRelativeActivity(activeMacProfile.lastActivity).text}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">پاکێج و کارایی (Package Plan):</span>
                    <span className="text-xs font-bold text-amber-300 block">
                      {activeMacProfile.durationLabel || 'تێستی ٢٤ کاتژمێری'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      بەسەرچوون: {new Date(activeMacProfile.expiresAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bento Grid: Device Specs & Telemetry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Panel 1: Hardware Specs & Portal Info */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                    <h4 className="font-bold text-xs flex items-center gap-1.5 text-slate-800 dark:text-white">
                      <Tv className="w-4 h-4 text-sky-500" />
                      <span>تایبەتمەندیەکانی ئامێر و پۆڕتاڵ (System Info)</span>
                    </h4>
                    <span className="font-mono text-[10px] text-slate-400">Hardware ID</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">کۆدی ماک (MAC Address):</span>
                      <span className="font-mono font-bold text-cyan-400">{activeMacProfile.macAddress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">سریاڵی ئامێر (Hardware Serial):</span>
                      <span className="font-mono font-bold text-emerald-400">{activeMacProfile.serialNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">پۆڕتاڵی Stalker (Portal URL):</span>
                      <span className="font-mono text-amber-300 break-all">{activeMacProfile.portalUrl || 'http://line.liondnscloud.ru/c/'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ئایپی بەستنەوە (IP Address):</span>
                      <span className="font-mono text-slate-300">{activeMacProfile.deviceIp}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">مۆدێلی ئامێر (Device Model):</span>
                      <span className="text-slate-300">{activeMacProfile.deviceModel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ناوی کڕیار:</span>
                      <span className="font-bold text-white">{activeMacProfile.clientName || 'دیاری نەکراوە'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">تەلەفۆن:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-300">{activeMacProfile.phone || 'بێ تەلەفۆن'}</span>
                        {activeMacProfile.phone && (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppInvoice(activeMacProfile)}
                            className="px-2 py-0.5 rounded bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold hover:bg-emerald-600/50 transition-colors cursor-pointer"
                          >
                            وەتسئەپ 💬
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Live Server & Stream Telemetry */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                    <h4 className="font-bold text-xs flex items-center gap-1.5 text-slate-800 dark:text-white">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>دۆخی پەخش و سێرڤەر (Stream & Server)</span>
                    </h4>
                    <span className="font-mono text-[10px] text-cyan-400">LIVE MONITOR</span>
                  </div>

                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">کەناڵی ئێستا یان کۆتا بینین:</span>
                      <span className="font-bold text-cyan-300">
                        📺 {activeMacProfile.lastActivity?.channelName || 'DABIN.tv Channel'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">دۆخی پەیوەندی:</span>
                      <span className="font-bold text-emerald-400">
                        {formatRelativeActivity(activeMacProfile.lastActivity).text}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">جۆری سێرڤەر (Server Type):</span>
                      <span className="font-mono font-bold uppercase text-sky-400">{activeMacProfile.serverType || 'xtream'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">سێرڤەری تەرخانکراو (Host):</span>
                      <span className="font-mono text-cyan-300 break-all">{activeMacProfile.serverHost || 'line.liondnscloud.ru'}</span>
                    </div>
                    {activeMacProfile.serverUsername && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">یوزەرنەیم (Username):</span>
                        <span className="font-mono font-bold text-emerald-400">{activeMacProfile.serverUsername}</span>
                      </div>
                    )}
                    {activeMacProfile.serverPassword && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">تێپەڕەوشە (Password):</span>
                        <span className="font-mono text-slate-300">{activeMacProfile.serverPassword}</span>
                      </div>
                    )}
                    {activeMacProfile.m3uUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">لینکی M3U:</span>
                        <span className="font-mono text-amber-300 truncate max-w-[200px]" title={activeMacProfile.m3uUrl}>
                          {activeMacProfile.m3uUrl}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenAssignModal(activeMacProfile);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>نوێکردنەوە یان گۆڕینی سێرڤەر و پاکێج</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Panel 3: Financial & Sales History (مێژووی کڕین و فرۆشتن) */}
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-500" />
                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                      مێژووی دارایی - کڕین و فرۆشتنی ئەم ئامێرە (Sales & Transactions Ledger)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {(activeMacProfile.transactions || []).length} مامەڵەی تۆمارکراو
                  </span>
                </div>

                {/* Transactions Table */}
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white dark:bg-slate-900/80">
                  <table className="w-full text-start text-xs">
                    <thead className="bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-white/10 text-[11px]">
                      <tr>
                        <th className="p-3 text-start">بەروار و کات</th>
                        <th className="p-3 text-start">جۆری مامەڵە</th>
                        <th className="p-3 text-start">پاکێج</th>
                        <th className="p-3 text-start">بڕی پارە (IQD)</th>
                        <th className="p-3 text-start">کرێدیت</th>
                        <th className="p-3 text-start">دۆخی پارەدان</th>
                        <th className="p-3 text-start">تێبینی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                      {(activeMacProfile.transactions || []).map((tx, idx) => (
                        <tr key={tx.id || idx} className="hover:bg-sky-500/5 transition-colors">
                          <td className="p-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">{tx.date}</td>
                          <td className="p-3 font-bold text-slate-200">{tx.action}</td>
                          <td className="p-3 text-sky-400 font-semibold">{tx.planLabel || tx.durationId}</td>
                          <td className="p-3 font-mono font-black text-emerald-400">
                            {tx.priceIqd > 0 ? `${tx.priceIqd.toLocaleString()} IQD` : '0 IQD (تێست)'}
                          </td>
                          <td className="p-3 font-mono text-slate-400">{tx.creditsUsed || 0} Cr</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.paymentStatus?.includes('تێست')
                                ? 'bg-sky-500/20 text-sky-300'
                                : tx.paymentStatus?.includes('قەرز')
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {tx.paymentStatus || 'پارەدراوە'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">{tx.adminNotes || '—'}</td>
                        </tr>
                      ))}
                      {(!activeMacProfile.transactions || activeMacProfile.transactions.length === 0) && (
                        <tr>
                          <td colSpan="7" className="p-6 text-center text-slate-400">
                            هیچ مامەڵەیەکی پێشوو بۆ ئەم ئامێرە تۆمار نەکراوە.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Manual Transaction Form */}
                <form onSubmit={handleAddProfileTransaction} className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
                  <h5 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>تۆمارکردنی مامەڵەی نوێی کڕین یان پارەدان بۆ ئەم ئامێرە:</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">جۆری مامەڵە</label>
                      <select
                        value={newTxAction}
                        onChange={(e) => setNewTxAction(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs outline-none"
                      >
                        <option value="کڕینی پاکێجی ١ مانگ">کڕینی پاکێجی ١ مانگ</option>
                        <option value="کڕینی پاکێجی ٣ مانگ">کڕینی پاکێجی ٣ مانگ</option>
                        <option value="کڕینی پاکێجی ٦ مانگ">کڕینی پاکێجی ٦ مانگ</option>
                        <option value="کڕینی پاکێجی ١ ساڵ">کڕینی پاکێجی ١ ساڵ</option>
                        <option value="نوێکردنەوەی بەشداربوون">نوێکردنەوەی بەشداربوون</option>
                        <option value="تێستی بێ بەرامبەر">تێستی بێ بەرامبەر</option>
                        <option value="وەرگرتنی پارەی کاش">وەرگرتنی پارەی کاش</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">بڕی پارە (دیناری عێراقی IQD)</label>
                      <input
                        type="number"
                        step="1000"
                        value={newTxPrice}
                        onChange={(e) => setNewTxPrice(e.target.value)}
                        placeholder="15000"
                        className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-emerald-400 font-mono font-bold text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">دۆخی پارەدان</label>
                      <select
                        value={newTxStatus}
                        onChange={(e) => setNewTxStatus(e.target.value)}
                        className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs outline-none"
                      >
                        <option value="پارەدراوە (کاش)">پارەدراوە (کاش)</option>
                        <option value="پارەدراوە (فاستپەی/هەواڵە)">پارەدراوە (فاستپەی/هەواڵە)</option>
                        <option value="قەرز">قەرز (Unpaid)</option>
                        <option value="تێست (بێبەرامبەر)">تێست (بێبەرامبەر)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold mb-1">تێبینی کورت</label>
                      <input
                        type="text"
                        value={newTxNotes}
                        onChange={(e) => setNewTxNotes(e.target.value)}
                        placeholder="بۆ نمونە: پارەی کاش وەرگیرا لە دوکان"
                        className="w-full p-2 rounded-xl bg-slate-800 border border-white/10 text-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>تۆمارکردنی مامەڵە لە مێژوودا</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsAppInvoice(activeMacProfile)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ناردنی پسوولەی وەتسئەپ بۆ کڕیار 📲</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(activeMacProfile)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    activeMacProfile.status === 'active'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                  }`}
                >
                  {activeMacProfile.status === 'active' ? 'ڕاگرتنی هێڵ ⏸' : 'چالاککردنەوە ▶'}
                </button>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteDevice(activeMacProfile)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer"
                >
                  سڕینەوەی ئەم ماکە
                </button>
                <button
                  type="button"
                  onClick={() => setIsMacProfileOpen(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  داخستن
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REGISTER NEW MAG DEVICE DIRECTLY
         ======================================================== */}
      {isNewMagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-start select-text" dir="rtl">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-7 space-y-4 animate-scale-up ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-cyan-500/30 text-white'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">تۆمارکردنی ئامێری نوێی MAG (بە MAC Address)</h3>
                  <p className="text-[11px] text-slate-400">کۆدی ماکی کڕیار بنووسە و پاکێجەکەی بۆ هەڵبژێرە</p>
                </div>
              </div>
              <button onClick={() => setIsNewMagModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMagDevice} className="space-y-3.5 text-xs">
              
              {/* MAC Address with Generator Helper */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-400">کۆدی ماک (MAC Address):</label>
                  <button
                    type="button"
                    onClick={() => setNewMagMac(generateMagMacAddress())}
                    className="text-[10px] text-cyan-400 hover:underline font-mono cursor-pointer"
                  >
                    + دروستکردنی ماکی نوێ
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="00:1A:79:B4:9C:2F"
                  value={newMagMac}
                  onChange={(e) => setNewMagMac(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-cyan-400/40 text-cyan-300 font-mono font-black text-sm tracking-wider outline-none"
                />
              </div>



              {/* Duration Selection */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5">ماوەی پاکێج (Duration):</label>
                <div className="grid grid-cols-3 gap-2">
                  {SUBSCRIPTION_DURATIONS.map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => {
                        setNewMagDuration(dur.id);
                        if (dur.priceIqd !== undefined) setNewMagPrice(String(dur.priceIqd));
                      }}
                      className={`p-2 rounded-xl border text-start transition-all cursor-pointer ${
                        newMagDuration === dur.id
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 font-bold ring-2 ring-cyan-500/30'
                          : 'border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{dur.labelKu}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{dur.isTrial ? 'بێبەرامبەر' : `${dur.creditCost} Cr`}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Price IQD */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">نرخی فرۆشتن بە دینار (IQD):</label>
                <input
                  type="number"
                  step="1000"
                  value={newMagPrice}
                  onChange={(e) => setNewMagPrice(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-emerald-400 font-mono font-bold"
                />
              </div>

              {/* Server Host */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">سێرڤەری سەرەکی</label>
                  <input
                    type="text"
                    value={newMagHost}
                    onChange={(e) => setNewMagHost(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-cyan-300 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">تێبینی ئەدمین</label>
                  <input
                    type="text"
                    placeholder="تێبینی..."
                    value={newMagNotes}
                    onChange={(e) => setNewMagNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMagModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 font-bold cursor-pointer"
                >
                  پاشگەزبوونەوە
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  تۆمارکردن و چالاککردنی MAG
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
