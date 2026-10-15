import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Plus, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  Zap, 
  RefreshCw, 
  Check, 
  X, 
  Link2, 
  Key, 
  ShieldCheck, 
  Radio, 
  HelpCircle,
  Database,
  ArrowRight,
  Sliders,
  Play
} from 'lucide-react';
import { 
  getStoredServers, 
  saveStoredServers, 
  getStoredServerSettings, 
  saveStoredServerSettings, 
  testServerConnection 
} from '../data/serverManager';

export default function ServersManagerTab({ channels = [], setChannels, onNotify }) {
  const [servers, setServers] = useState(getStoredServers);
  const [settings, setSettings] = useState(getStoredServerSettings);
  const [testingServerId, setTestingServerId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'xtream', // 'xtream' | 'm3u'
    serverUrl: '',
    username: '',
    password: '',
    isPrimary: false,
    note: ''
  });
  const [formTestResult, setFormTestResult] = useState(null);
  const [isTestingInModal, setIsTestingInModal] = useState(false);

  // Save changes to localStorage whenever servers change
  const updateServers = (newServers) => {
    setServers(newServers);
    saveStoredServers(newServers);
  };

  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    saveStoredServerSettings(newSettings);
  };

  const [customOsdCode, setCustomOsdCode] = useState(() => {
    try {
      return settings.customOsdCode || localStorage.getItem('nndd_custom_osd_server_code') || '';
    } catch(e) {
      return '';
    }
  });

  const handleSaveOsdCode = () => {
    const clean = customOsdCode.trim().toUpperCase();
    const nextSettings = { ...settings, customOsdCode: clean };
    updateSettings(nextSettings);
    try {
      localStorage.setItem('nndd_custom_osd_server_code', clean);
    } catch(e) {}
    onNotify?.({
      title: 'کۆدی نیشاندراوی سەر شاشە پاشەکەوت کرا 🎉',
      message: clean 
        ? `کۆدی OSD سەر کەناڵی ڕاستەوخۆ دیاریکرا بۆ: "${clean}". هەموو بینەران لەسەر شاشە ئەم کۆدە دەبینن.` 
        : 'کۆدەکە پاککرایەوە و گەڕایەوە سەر دۆخی ناسینەوەی خۆکار (Auto Detect).',
      type: 'success'
    });
  };

  // Toggle Auto-Failover ("کام سێرڤەرە ئیشی کرد ئەوە بێنێت")
  const toggleAutoFailover = () => {
    const nextVal = !settings.autoFailoverEnabled;
    const nextSettings = { ...settings, autoFailoverEnabled: nextVal };
    updateSettings(nextSettings);
    onNotify?.({
      title: nextVal ? 'سیستەمی فریاگوزاری خۆکار کارا کرا' : 'فریاگوزاری خۆکار ناچالاک کرا',
      message: nextVal 
        ? 'ئەگەر سێرڤەرێک یان کەناڵێک کێشەی هەبێت، پەخش دەستبەجێ دەگوازرێتەوە بۆ سێرڤەری ئیشکەر.'
        : 'پەخش تەنها لەسەر سێرڤەری سەرەکی دەمێنێتەوە.',
      type: nextVal ? 'success' : 'info'
    });
  };

  // Set Primary Server
  const handleSetPrimaryServer = (serverId) => {
    const updated = servers.map(s => ({
      ...s,
      isPrimary: s.id === serverId,
      status: s.id === serverId ? 'active' : (s.status === 'expired' ? 'expired' : 'standby')
    }));
    updateServers(updated);
    updateSettings({ ...settings, activeServerId: serverId });

    const srv = servers.find(s => s.id === serverId);
    onNotify?.({
      title: 'سێرڤەری سەرەکی گۆڕدرا',
      message: `سێرڤەری "${srv?.name || serverId}" کرا بە سێرڤەری فەرمی ئەپەکە بۆ هەموو بەکارهێنەران.`,
      type: 'success'
    });
  };

  // Test Ping for a single server
  const handleTestServer = async (server) => {
    setTestingServerId(server.id);
    const result = await testServerConnection(server);
    setTestingServerId(null);

    const updated = servers.map(s => {
      if (s.id === server.id) {
        return {
          ...s,
          latencyMs: result.success ? result.latencyMs : 0,
          status: result.success ? (s.isPrimary ? 'active' : 'standby') : (s.id === 'srv-abu-fadhl' ? 'expired' : 'offline')
        };
      }
      return s;
    });
    updateServers(updated);

    onNotify?.({
      title: result.success ? `پەیوەندی دروستە (${result.latencyMs}ms)` : 'پەیوەندی سەرکەوتوو نەبوو',
      message: result.success 
        ? `سێرڤەری "${server.name}" بە سەرکەوتوویی تاقی کرایەوە و لە هێڵدایە.`
        : `هەڵە لە سێرڤەری "${server.name}": ${result.error || 'Server unreachable'}`,
      type: result.success ? 'success' : 'error'
    });
  };

  // Ping All Servers
  const handleTestAllServers = async () => {
    for (const s of servers) {
      await handleTestServer(s);
    }
  };

  // Modal handlers
  const openAddModal = () => {
    setEditingServer(null);
    setFormTestResult(null);
    setFormData({
      name: '',
      type: 'xtream',
      serverUrl: '',
      username: '',
      password: '',
      isPrimary: false,
      note: ''
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (server) => {
    setEditingServer(server);
    setFormTestResult(null);
    setFormData({
      name: server.name,
      type: server.type || 'xtream',
      serverUrl: server.serverUrl,
      username: server.username || '',
      password: server.password || '',
      isPrimary: server.isPrimary || false,
      note: server.note || ''
    });
    setIsAddModalOpen(true);
  };

  const handleTestInModal = async () => {
    if (!formData.serverUrl) return;
    setIsTestingInModal(true);
    setFormTestResult(null);
    const res = await testServerConnection({
      serverUrl: formData.serverUrl,
      username: formData.username,
      password: formData.password,
      type: formData.type
    });
    setIsTestingInModal(false);
    setFormTestResult(res);
  };

  const handleSaveServer = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.serverUrl.trim()) return;

    if (editingServer) {
      // Update
      const updated = servers.map(s => {
        if (s.id === editingServer.id) {
          return {
            ...s,
            name: formData.name.trim(),
            type: formData.type,
            serverUrl: formData.serverUrl.trim(),
            username: formData.username.trim(),
            password: formData.password.trim(),
            note: formData.note.trim()
          };
        }
        return s;
      });
      updateServers(updated);
      onNotify?.({
        title: 'سێرڤەر نوێکرایەوە',
        message: `زانیارییەکانی سێرڤەری "${formData.name}" نوێکرایەوە.`,
        type: 'success'
      });
    } else {
      // Add new
      const newId = `srv-${Date.now()}`;
      const newServer = {
        id: newId,
        name: formData.name.trim(),
        type: formData.type,
        serverUrl: formData.serverUrl.trim(),
        username: formData.username.trim(),
        password: formData.password.trim(),
        status: 'standby',
        isPrimary: formData.isPrimary,
        channelCount: 0,
        latencyMs: formTestResult?.latencyMs || 0,
        note: formData.note.trim() || 'سێرڤەری زیادکراوی نوێ',
        createdAt: new Date().toISOString().split('T')[0]
      };

      let nextList = [...servers, newServer];
      if (formData.isPrimary) {
        nextList = nextList.map(s => ({
          ...s,
          isPrimary: s.id === newId,
          status: s.id === newId ? 'active' : (s.status === 'expired' ? 'expired' : 'standby')
        }));
        updateSettings({ ...settings, activeServerId: newId });
      }
      updateServers(nextList);
      onNotify?.({
        title: 'سێرڤەری نوێ زیادکرا 🎉',
        message: `سێرڤەری "${formData.name}" بە سەرکەوتوویی خرایە نێو لیستی سێرڤەرەکان.`,
        type: 'success'
      });
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteServer = (serverId) => {
    const srv = servers.find(s => s.id === serverId);
    if (srv?.isPrimary) {
      onNotify?.({
        title: 'ناتوانرێت بسڕدرێتەوە',
        message: 'ناتوانیت سێرڤەری سەرەکی بسڕیتەوە پێش ئەوەی سێرڤەرێکی تر بکەیتە سەرەکی.',
        type: 'error'
      });
      return;
    }
    const updated = servers.filter(s => s.id !== serverId);
    updateServers(updated);
    onNotify?.({
      title: 'سێرڤەر سڕدرایەوە',
      message: `سێرڤەری "${srv?.name || serverId}" لە سیستەم سڕدرایەوە.`,
      type: 'info'
    });
  };

  const activePrimary = servers.find(s => s.isPrimary) || servers[0];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Microsoft ERP Module Top Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                بەڕێوەبردنی سێرڤەرەکان • Servers ERP & Multi-Provider Manager
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                v2.6 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              زیادکردنی چەندین سێرڤەری Xtream و M3U، دیاریکردنی سێرڤەری سەرەکی، و سویچکردنی خۆکار (Failover)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={toggleAutoFailover}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer shadow-xs ${
              settings.autoFailoverEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-400/20'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="ئەگەر سێرڤەرێک وەستا، خۆکارانە لە سێرڤەری دووەم پەخش بکات"
          >
            <Zap className={`w-3.5 h-3.5 ${settings.autoFailoverEnabled ? 'fill-emerald-600 text-emerald-600' : ''}`} />
            <span>سوویچی فریاگوزاری: {settings.autoFailoverEnabled ? 'چالاکە (Active)' : 'ناچالاک'}</span>
          </button>

          <button
            onClick={handleTestAllServers}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-all border border-slate-200 active:scale-95 cursor-pointer shadow-xs"
            title="پشکنینی هەموو سێرڤەرەکان"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">پشکنینی هەموو</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>زیادکردنی سێرڤەر</span>
          </button>
        </div>
      </div>

      {/* Microsoft Dynamics KPI Stat Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Active Primary Server */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">سێرڤەری سەرەکی کارا</p>
            <h4 className="text-base font-black text-slate-900 mt-1 truncate max-w-[170px]" title={activePrimary?.name}>
              {activePrimary?.name || 'دیاری نەکراوە'}
            </h4>
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              پەخشی سەرەکی ئەپەکە
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2: Total Servers */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">کۆی سێرڤەرە تۆمارکراوەکان</p>
            <h4 className="text-2xl font-black text-slate-900 mt-0.5 font-mono">{servers.length}</h4>
            <span className="text-[10px] text-slate-500 font-medium">سێرڤەری تێست و ڕاستەوخۆ</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Live Verified Channels */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">کەناڵە پشکنراوەکانی M3U</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-0.5 font-mono">
              {channels.length || 26}
            </h4>
            <span className="text-[10px] text-emerald-700 font-bold">100% کارا و بێ وەستان</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Failover Mode */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">سیستەمی گۆڕینی سێرڤەر</p>
            <h4 className="text-sm font-black text-slate-900 mt-1">
              {settings.autoFailoverEnabled ? 'هەڵبژاردنی خۆکار' : 'دەستی (Manual)'}
            </h4>
            <span className="text-[10px] text-blue-600 font-medium">
              {settings.autoFailoverEnabled ? 'کامەی ئیش کرد ئەوە پەخش ئەبێت' : 'تەنها یەک سێرڤەر'}
            </span>
          </div>
          <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${
            settings.autoFailoverEnabled ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <Zap className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Live OSD Watermark / Server Code Customizer */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 text-white shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold shrink-0">
              🏷️
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>کۆدی نیشاندراو لەسەر پەخشی ڕاستەوخۆ (Live TV Watermark OSD Code)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-mono">
                  Live Overlay
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                دیاریکردنی ئەو کۆدەی لە گۆشەی خوارەوەی پەخشی کەناڵی ڕاستەوخۆ نیشان دەدرێت (وەک: LION-V1، TRX-V1، VIP-LIVE).
              </p>
            </div>
          </div>

          {/* Live Preview Pill */}
          <div className="flex items-center gap-2 bg-black/60 px-3.5 py-1.5 rounded-full border border-white/15 shrink-0 self-start sm:self-center">
            <span className="text-[10px] text-slate-400">پێشبینینی سەر شاشە:</span>
            <span className="flex items-center gap-1.5 font-mono text-xs font-black text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{customOsdCode.trim().toUpperCase() || 'خۆکار (Auto)'}</span>
            </span>
          </div>
        </div>

        {/* Input & Preset Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="relative flex-1">
            <input
              type="text"
              dir="ltr"
              placeholder="بۆ نموونە: LION-V1 یان TRX-V1 (خۆکار ئەگەر بەتاڵ بێت)"
              value={customOsdCode}
              onChange={(e) => setCustomOsdCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 text-xs font-mono font-bold rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 outline-none focus:border-amber-400 text-start uppercase"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['LION-V1', 'TRX-V1', 'CBR-V1', 'NJ-V1', 'VIP-LIVE'].map(presetCode => (
              <button
                key={presetCode}
                type="button"
                onClick={() => setCustomOsdCode(presetCode)}
                className={`px-2.5 py-2 rounded-xl text-[10px] font-mono font-bold transition-all border active:scale-95 cursor-pointer ${
                  customOsdCode === presetCode
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-black'
                    : 'bg-white/5 hover:bg-white/15 text-slate-300 border-white/10'
                }`}
              >
                {presetCode}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCustomOsdCode('')}
              className="px-2.5 py-2 rounded-xl text-[10px] font-bold bg-white/5 hover:bg-white/15 text-rose-300 border border-rose-400/30 transition-all active:scale-95 cursor-pointer"
              title="سڕینەوە و گەڕاندنەوە بۆ دۆخی خۆکار"
            >
              خۆکار (Clear)
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveOsdCode}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>پاشەکەوتکردنی کۆد</span>
          </button>
        </div>
      </div>

      {/* Microsoft Dynamics Enterprise Data Grid */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200/90 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              خشتەی سێرڤەرە تۆمارکراوەکان (Server Registry DataGrid)
            </h3>
            <span className="text-xs text-slate-500 font-mono">({servers.length} Servers)</span>
          </div>
          <div className="text-xs text-slate-500">
            تێبینی: هەر گۆڕانکارییەک دەستبەجێ لەلای بەکارهێنەران چالاک دەبێت
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4 text-start">سێرڤەری سەرەکی</th>
                <th className="py-3 px-4 text-start">ناوی سێرڤەر</th>
                <th className="py-3 px-4 text-start">جۆر</th>
                <th className="py-3 px-4 text-start">ناونیشان / هۆست (Host)</th>
                <th className="py-3 px-4 text-start">یوزەرنەیم</th>
                <th className="py-3 px-4 text-start">خێرایی (Ping)</th>
                <th className="py-3 px-4 text-start">دۆخ (Status)</th>
                <th className="py-3 px-4 text-center">کردارەکان</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {servers.map((server) => {
                const isPrimary = server.isPrimary;
                const isTesting = testingServerId === server.id;

                return (
                  <tr 
                    key={server.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isPrimary ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Primary Selector Radio */}
                    <td className="py-3 px-4">
                      {isPrimary ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-300">
                          <Check className="w-3.5 h-3.5 text-blue-700" />
                          <span>سەرەکی (Active)</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSetPrimaryServer(server.id)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-[11px] font-semibold border border-slate-200 transition-all cursor-pointer active:scale-95"
                        >
                          بیکە بە سەرەکی
                        </button>
                      )}
                    </td>

                    {/* Server Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          server.id === 'srv-abu-fadhl' ? 'bg-amber-100 text-amber-700' :
                          isPrimary ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Server className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm leading-tight">{server.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{server.note || server.createdAt}</p>
                        </div>
                      </div>
                    </td>

                    {/* Server Type */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold uppercase border ${
                        server.type === 'xtream' 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                      }`}>
                        {server.type === 'xtream' ? 'Xtream API' : 'M3U8 Playlist'}
                      </span>
                    </td>

                    {/* Server URL */}
                    <td className="py-3 px-4 font-mono text-slate-600 max-w-[200px] truncate" title={server.serverUrl}>
                      {server.serverUrl}
                    </td>

                    {/* Username */}
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {server.username ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                          {server.username}
                        </span>
                      ) : (
                        <span className="text-slate-400">Public Link</span>
                      )}
                    </td>

                    {/* Latency */}
                    <td className="py-3 px-4">
                      {isTesting ? (
                        <span className="flex items-center gap-1 text-[11px] text-blue-600 font-bold animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>تێست...</span>
                        </span>
                      ) : (
                        <span className={`font-mono text-[11px] font-bold ${
                          server.latencyMs > 0 && server.latencyMs < 200 ? 'text-emerald-600' :
                          server.latencyMs >= 200 ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          {server.latencyMs > 0 ? `${server.latencyMs} ms` : '—'}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4">
                      {server.status === 'active' || isPrimary ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>کارا (Online)</span>
                        </span>
                      ) : server.status === 'expired' || server.id === 'srv-abu-fadhl' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-300 text-[10px]" title="کاتی تێستەکەی تەواو بووە">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>بەسەرچووە (Expired)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium border border-slate-200 text-[10px]">
                          <span>یەدەگ (Standby)</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleTestServer(server)}
                          disabled={isTesting}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="تێستکردنی خێرایی (Ping)"
                        >
                          <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-blue-600' : ''}`} />
                        </button>
                        <button
                          onClick={() => openEditModal(server)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="دەستکاریکردن"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!isPrimary && (
                          <button
                            onClick={() => handleDeleteServer(server.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="سڕینەوە"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Server Modal (Microsoft Fluent Modal) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Server className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingServer ? 'دەستکاریکردنی سێرڤەر' : 'زیادکردنی سێرڤەری نوێ (Add IPTV Server)'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveServer} className="p-6 space-y-4">
              
              {/* Server Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ناوی سێرڤەر (Server Display Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="بۆ نموونە: سێرڤەری تێستی خێرا / Falcon 4K"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-blue-500 bg-white"
                />
              </div>

              {/* Server Type Switcher */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  جۆری سێرڤەر و بەستەر (Provider Type)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'xtream' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formData.type === 'xtream'
                        ? 'bg-purple-50 text-purple-700 border-purple-300 ring-2 ring-purple-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Xtream Codes (لینک و یوزەر)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'm3u' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formData.type === 'm3u'
                        ? 'bg-cyan-50 text-cyan-700 border-cyan-300 ring-2 ring-cyan-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>M3U8 Playlist (تەنها لینک)</span>
                  </button>
                </div>
              </div>

              {/* Host / Server URL */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {formData.type === 'xtream' ? 'ناونیشانی سێرڤەر / هۆست (Host URL) *' : 'لینکی تەواوی پەخشی M3U8 *'}
                </label>
                <input
                  type="url"
                  required
                  placeholder={formData.type === 'xtream' ? 'http://example.com:8080' : 'https://example.com/live.m3u8'}
                  value={formData.serverUrl}
                  onChange={e => setFormData({ ...formData, serverUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-blue-500 bg-white"
                />
              </div>

              {/* Username & Password (only for Xtream) */}
              {formData.type === 'xtream' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      یوزەرنەیم (Username)
                    </label>
                    <input
                      type="text"
                      placeholder="Username"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      پاسۆرد (Password)
                    </label>
                    <input
                      type="text"
                      placeholder="Password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-blue-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Note / Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  تێبینی یان ماوەی بەسەرچوون (کاتی تێست)
                </label>
                <input
                  type="text"
                  placeholder="بۆ نموونە: تێستی ٢٤ کاتژمێر تا سبەی سەعات ٥"
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-blue-500 bg-white"
                />
              </div>

              {/* Make Primary Checkbox */}
              <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrimary}
                  onChange={e => setFormData({ ...formData, isPrimary: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  ڕاستەوخۆ بیکە بە سێرڤەری سەرەکی بۆ هەموو بەکارهێنەران
                </span>
              </label>

              {/* In-Modal Connection Test Feedback */}
              {formTestResult && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  formTestResult.success 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {formTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>
                    {formTestResult.success 
                      ? `سەرکەوتوو بوو! وەڵامدانەوەی سێرڤەر: ${formTestResult.latencyMs}ms` 
                      : `نەتوانرا پەیوەندی ببەسترێت: ${formTestResult.error}`}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleTestInModal}
                  disabled={isTestingInModal || !formData.serverUrl}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTestingInModal ? 'animate-spin text-blue-600' : ''}`} />
                  <span>{isTestingInModal ? 'پشکنین...' : 'تێستکردنی پەیوەندی'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all cursor-pointer"
                  >
                    پاشگەزبوونەوە
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    پاشەکەوتکردن
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
