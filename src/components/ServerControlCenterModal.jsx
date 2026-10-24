import React, { useState } from 'react';
import { 
  Server, 
  Check, 
  Zap, 
  RefreshCw, 
  X, 
  Plus, 
  Sliders, 
  Radio, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  ExternalLink,
  ShieldAlert,
  Flame,
  ArrowRight
} from 'lucide-react';
import { 
  getStoredServers, 
  saveStoredServers, 
  getStoredServerSettings, 
  saveStoredServerSettings,
  detectServerBadge,
  parseM3uCredentialsUrl 
} from '../data/serverManager';
import { testXtreamConnection, importTargetServerChannels, resolveChannelUrlsForServer } from '../data/serverImporter';
import { savePersistentChannels } from '../data/dbStorage';
import { KURDISH_PLAYLIST_CHANNELS } from '../data/kurdishPlaylist';

export default function ServerControlCenterModal({ 
  isOpen, 
  onClose, 
  activeConfig, 
  serverMode, 
  onSetServerMode, 
  onServerApplied, 
  onNotify 
}) {
  const [servers, setServers] = useState(getStoredServers);
  const [settings, setSettings] = useState(getStoredServerSettings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testingId, setTestingId] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [refreshMessage, setRefreshMessage] = useState('');

  // Add / Edit Server Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServerForm, setNewServerForm] = useState({
    name: '',
    host: '',
    username: '',
    password: '',
    type: 'xtream'
  });
  const [formTestResult, setFormTestResult] = useState(null);
  const [isTestingForm, setIsTestingForm] = useState(false);

  if (!isOpen) return null;

  // 1. Activate Any Server (Free M3U8 or Xtream)
  const handleActivateServer = async (srv) => {
    setIsRefreshing(true);
    setRefreshMessage(`خەریکی چالاککردنی سێرڤەری "${srv.name}"...`);

    try {
      // Free M3U8 or official NNDD Free server
      if (srv.id === 'srv-nndd-free' || srv.type === 'm3u' || !srv.username) {
        setRefreshMessage('هاوردەکردنی کەناڵە فەرمییەکانی NNDD...');
        
        // Save channels & settings
        savePersistentChannels([DABIN_OFFICIAL_CHANNEL]);
        try {
          localStorage.setItem('nndd_cached_channels', JSON.stringify([DABIN_OFFICIAL_CHANNEL]));
          localStorage.removeItem('nndd_last_channel_id');
        } catch(e) {}

        const cleanConfig = {
          host: srv.serverUrl || 'https://nndd-tv.vercel.app',
          username: '',
          password: '',
          name: srv.name
        };
        localStorage.setItem('nndd_active_xtream_config', JSON.stringify(cleanConfig));

        // Update settings
        const updatedServers = servers.map(s => ({
          ...s,
          isPrimary: s.id === srv.id,
          status: s.id === srv.id ? 'active' : 'standby'
        }));
        saveStoredServers(updatedServers);
        setServers(updatedServers);

        const newSettings = { ...settings, activeServerId: srv.id };
        saveStoredServerSettings(newSettings);
        setSettings(newSettings);

        // Notify parent / app
        onServerApplied?.(cleanConfig, [DABIN_OFFICIAL_CHANNEL]);
        window.dispatchEvent(new CustomEvent('nndd_channels_updated', { detail: [DABIN_OFFICIAL_CHANNEL] }));
        window.dispatchEvent(new CustomEvent('nndd_server_switched', { detail: srv }));

        onNotify?.({
          title: 'سێرڤەری فەرمی چالاککرا 🎉',
          message: `سێرڤەری "${srv.name}" بە سەرکەوتوویی خرایە کار. کەناڵی فەرمی KOBIN TV HD چالاکە و کەناڵەکانی تر بە کاراکردنی سێرڤەر باردەبن.`,
          type: 'success'
        });
        return;
      }

      // Xtream Codes server
      const cleanConfig = {
        host: srv.serverUrl.replace(/\/+$/, '').trim(),
        username: (srv.username || '').trim(),
        password: (srv.password || '').trim(),
        name: srv.name
      };

      setRefreshMessage('پشکنینی هەژمار لە لایەن سێرڤەرەوە...');
      const auth = await testXtreamConnection({
        serverUrl: cleanConfig.host,
        username: cleanConfig.username,
        password: cleanConfig.password
      });

      if (!auth.success) {
        throw new Error(auth.error || 'پەیوەندی لەگەڵ ئەم سێرڤەرە سەرکەوتوو نەبوو. ڕەنگە هەژمارەکە بەسەرچووبێت (Expired).');
      }

            

      // 1. Fast Hybrid Channel Resolver: Map base channels to new server stream URLs instantly!
      setRefreshMessage('⚡ بەستنەوەی کەناڵەکان بە سێرڤەری نوێ (Hybrid Mode)...');
      try {
        const hybridResolved = await resolveChannelUrlsForServer(
          KURDISH_PLAYLIST_CHANNELS,
          cleanConfig,
          (prog) => setRefreshMessage(prog.phase)
        );

        if (hybridResolved && hybridResolved.length > 0) {
          savePersistentChannels(hybridResolved);
          try {
            localStorage.setItem('nndd_cached_channels', JSON.stringify(hybridResolved));
            localStorage.removeItem('nndd_last_channel_id');
          } catch(e) {}

          localStorage.setItem('nndd_active_xtream_config', JSON.stringify(cleanConfig));
          const badge = detectServerBadge(cleanConfig.host, cleanConfig.username, cleanConfig.host);
          localStorage.setItem('nndd_custom_osd_server_code', badge.serverCode);

          const updatedServers = servers.map(s => ({
            ...s,
            isPrimary: s.id === srv.id,
            status: s.id === srv.id ? 'active' : 'standby'
          }));
          saveStoredServers(updatedServers);
          setServers(updatedServers);

          const newSettings = { ...settings, activeServerId: srv.id };
          saveStoredServerSettings(newSettings);
          setSettings(newSettings);

          onServerApplied?.(cleanConfig, hybridResolved);
          window.dispatchEvent(new CustomEvent('nndd_channels_updated', { detail: hybridResolved }));
          window.dispatchEvent(new CustomEvent('nndd_server_switched', { detail: srv }));

          onNotify?.({
            title: 'سێرڤەر بە خێرایی گۆڕدرا ⚡',
            message: 'کەناڵەکانی NNDD بەستراونەوە بە سێرڤەری "' + srv.name + '" و پەخشی دەنگ و ڕەنگ نوێکرایەوە.',
            type: 'success'
          });
          return;
        }
      } catch(e) {
        console.warn('[Hybrid] Falling back to standard full import:', e);
      }

      setRefreshMessage('هاوردەکردنی کەناڵەکان لە سێرڤەری نوێوە...');
      const importedChannels = await importTargetServerChannels(
        {
          serverUrl: cleanConfig.host,
          username: cleanConfig.username,
          password: cleanConfig.password
        },
        (prog) => {
          setRefreshMessage(`هاوردەکردنی کەناڵەکان: ${prog.category} (${prog.current}/${prog.total})`);
        }
      );

      if (importedChannels && importedChannels.length > 0) {
        savePersistentChannels(importedChannels);
        try {
          localStorage.setItem('nndd_cached_channels', JSON.stringify(importedChannels));
          localStorage.removeItem('nndd_last_channel_id');
        } catch(e) {}

        localStorage.setItem('nndd_active_xtream_config', JSON.stringify(cleanConfig));

        // Auto-detect OSD code
        const badge = detectServerBadge(cleanConfig.host, cleanConfig.username, cleanConfig.host);
        localStorage.setItem('nndd_custom_osd_server_code', badge.serverCode);

        // Update stored servers
        const updatedServers = servers.map(s => ({
          ...s,
          isPrimary: s.id === srv.id,
          status: s.id === srv.id ? 'active' : 'standby'
        }));
        saveStoredServers(updatedServers);
        setServers(updatedServers);

        const newSettings = { ...settings, activeServerId: srv.id };
        saveStoredServerSettings(newSettings);
        setSettings(newSettings);

        // Notify parent / app
        onServerApplied?.(cleanConfig, importedChannels);
        window.dispatchEvent(new CustomEvent('nndd_channels_updated', { detail: importedChannels }));
        window.dispatchEvent(new CustomEvent('nndd_server_switched', { detail: srv }));

        onNotify?.({
          title: 'سێرڤەر گۆڕدرا 🎉',
          message: `بە سەرکەوتوویی ${importedChannels.length} کەناڵ لە "${srv.name}" هاوردە کران.`,
          type: 'success'
        });
      } else {
        throw new Error('سێرڤەرەکە پەیوەست بوو بەڵام هیچ کەناڵێک لەم هەژمارەدا نەدۆزرایەوە.');
      }
    } catch (err) {
      onNotify?.({
        title: 'هەڵە لە گۆڕینی سێرڤەر',
        message: err.message,
        type: 'error'
      });
    } finally {
      setIsRefreshing(false);
      setRefreshMessage('');
    }
  };

  // 2. Test Ping for a Single Server
  const handleTestPing = async (srv) => {
    setTestingId(srv.id);
    try {
      if (srv.id === 'srv-nndd-free' || srv.type === 'm3u') {
        const t0 = performance.now();
        const res = await fetch('https://nndd-tv.vercel.app/channels.json?t=' + Date.now(), { method: 'HEAD' });
        const latency = Math.round(performance.now() - t0);
        setTestResults(prev => ({
          ...prev,
          [srv.id]: { success: true, latency, message: 'سێرڤەری فەرمی کارایە • بەردەوام و بێبەرامبەر' }
        }));
        return;
      }

      const res = await testXtreamConnection({
        serverUrl: srv.serverUrl,
        username: srv.username,
        password: srv.password
      });

      setTestResults(prev => ({
        ...prev,
        [srv.id]: {
          success: res.success,
          latency: res.latencyMs || 50,
          message: res.success 
            ? `چالاکە (${res.latencyMs}ms) • بەسەرچوون: ${res.expDate || 'Unlimited'}`
            : (res.error || 'هەژمارەکە لەکارکەوتووە')
        }
      }));
    } catch (e) {
      setTestResults(prev => ({
        ...prev,
        [srv.id]: { success: false, latency: 0, message: 'پەیوەندی دروست نەبوو' }
      }));
    } finally {
      setTestingId(null);
    }
  };

  // 3. Test New Form Credentials
  const handleTestNewForm = async () => {
    if (!newServerForm.host || !newServerForm.username || !newServerForm.password) {
      setFormTestResult({ success: false, message: 'تکایە هەموو خانەکان پڕبکەرەوە' });
      return;
    }
    setIsTestingForm(true);
    setFormTestResult(null);
    try {
      const res = await testXtreamConnection({
        serverUrl: newServerForm.host,
        username: newServerForm.username,
        password: newServerForm.password
      });
      if (res.success) {
        setFormTestResult({
          success: true,
          message: `سێرڤەر کارایە! (${res.latencyMs}ms) • بەسەرچوون: ${res.expDate}`
        });
      } else {
        setFormTestResult({
          success: false,
          message: res.error || 'پەیوەندی لەگەڵ سێرڤەر سەرکەوتوو نەبوو.'
        });
      }
    } catch (e) {
      setFormTestResult({ success: false, message: e.message || 'پەیوەندی بەستن شکستی هێنا.' });
    } finally {
      setIsTestingForm(false);
    }
  };

  // 4. Save and Activate New Server
  const handleSaveAndActivateNew = async () => {
    if (!newServerForm.host || !newServerForm.username || !newServerForm.password) return;
    const newSrv = {
      id: `srv-${Date.now()}`,
      name: newServerForm.name?.trim() || 'سێرڤەری تێستی نوێ',
      type: 'xtream',
      serverUrl: newServerForm.host.trim().replace(/\/+$/, ''),
      username: newServerForm.username.trim(),
      password: newServerForm.password.trim(),
      status: 'active',
      isPrimary: true,
      channelCount: 0,
      latencyMs: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [...servers, newSrv];
    saveStoredServers(updated);
    setServers(updated);
    setShowAddForm(false);
    setNewServerForm({ name: '', host: '', username: '', password: '', type: 'xtream' });

    // Directly activate it!
    await handleActivateServer(newSrv);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-slate-950/90 border border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.9)] p-5 sm:p-6 overflow-hidden text-white animate-scale-up max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-32 bg-cyan-500/15 filter blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-white/15 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-inner">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-normal text-white flex items-center gap-2">
                <span>ناوەندی کۆنتڕۆڵی سێرڤەر</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950">
                  IPTV Core
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-light">
                سویچکردنی ڕاستەوخۆ لە نێوان سێرڤەرەکان، پشکنینی پینگ و هاوردەکردنی کەناڵ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
            title="داخستن"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Refreshing Overlay Banner */}
        {isRefreshing && (
          <div className="relative z-20 my-3 p-3 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs flex items-center gap-3 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-cyan-300" />
            <span className="font-normal">{refreshMessage || 'خەریکی پەیوەستبوون بە سێرڤەر...'}</span>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-internal-scrollbar py-3 space-y-4">
          
          {/* Mode Switcher Toggle Pill: Dedicated vs Auto */}
          <div className="p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between gap-3">
            <div className="text-start">
              <div className="text-xs font-normal text-white flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>دۆخی پەخشی سێرڤەر:</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                  serverMode === 'dedicated' 
                    ? 'bg-amber-400 text-slate-950 font-normal' 
                    : 'bg-blue-500 text-white font-normal'
                }`}>
                  {serverMode === 'dedicated' ? 'سێرڤەری تایبەتکراو (Dedicated)' : 'فرە-سێرڤەر (Auto Failover)'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-light">
                {serverMode === 'dedicated' 
                  ? 'کەناڵەکە تەنها لەسەر ئەو سێرڤەرە دەمێنێتەوە کە هەڵتبژاردووە.' 
                  : 'ئەگەر سێرڤەرەکە لەکارکەوت، سیستەم ئۆتۆماتیکی لەسەر سێرڤەری یەدەگ دەیخوێنێتەوە.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSetServerMode?.(serverMode === 'dedicated' ? 'auto' : 'dedicated')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white border border-white/15 transition-all cursor-pointer active:scale-95 shrink-0 font-normal"
            >
              گۆڕینی دۆخ
            </button>
          </div>

          {/* Configured Servers List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-normal text-slate-300">سێرڤەرە بەردەستەکان (Available Servers):</span>
              <button
                type="button"
                onClick={() => setShowAddForm(prev => !prev)}
                className="text-xs text-cyan-300 hover:text-cyan-200 flex items-center gap-1 transition-colors cursor-pointer font-normal"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddForm ? 'داخستنی فۆڕم' : 'زیادکردنی سێرڤەری تێست'}</span>
              </button>
            </div>

            {/* Server Cards */}
            {servers.map(srv => {
              const isCurrent = activeConfig?.host === srv.serverUrl || (srv.type === 'xtream' && activeConfig?.username === srv.username) || srv.isPrimary;
              const test = testResults[srv.id];

              return (
                <div 
                  key={srv.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col gap-2.5 ${
                    isCurrent
                      ? 'bg-cyan-500/15 border-cyan-400/50 shadow-lg ring-1 ring-cyan-400/30'
                      : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-normal shrink-0 ${
                        srv.id === 'srv-nndd-free' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                          : isCurrent 
                            ? 'bg-cyan-500 text-slate-950 font-normal' 
                            : 'bg-white/10 text-slate-300'
                      }`}>
                        {srv.id === 'srv-nndd-free' ? 'FREE' : srv.type === 'xtream' ? 'X' : 'M3U'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-normal text-white truncate">{srv.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-normal px-2 py-0.2 rounded-full bg-cyan-400 text-slate-950">
                              سەرەکی
                            </span>
                          )}
                          {srv.id === 'srv-nndd-free' && (
                            <span className="text-[9px] font-normal px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                              Free 24/7
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 truncate max-w-xs mt-0.5">
                          {srv.serverUrl || 'https://nndd-tv.vercel.app'} {srv.username ? `• (${srv.username})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleTestPing(srv)}
                        disabled={testingId === srv.id}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-normal text-slate-200 transition-all flex items-center gap-1 active:scale-95 cursor-pointer disabled:opacity-50"
                        title="پشکنینی خێرایی و بەسەرچوون"
                      >
                        <Zap className={`w-3 h-3 text-amber-400 ${testingId === srv.id ? 'animate-spin' : ''}`} />
                        <span>پشکنین</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActivateServer(srv)}
                        disabled={isCurrent || isRefreshing}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-normal transition-all flex items-center gap-1 active:scale-95 ${
                          isCurrent
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 cursor-default'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-normal cursor-pointer shadow-md'
                        } disabled:opacity-60`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{isCurrent ? 'چالاککراوە' : 'بیکە بە سەرەکی'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Test Ping Result */}
                  {test && (
                    <div className={`p-2 rounded-xl text-[11px] font-normal flex items-center gap-2 ${
                      test.success ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {test.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{test.message}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add / Edit New Server Form */}
          {showAddForm && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-400/30 shadow-xl space-y-3 animate-scale-up">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-normal text-cyan-300 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>زیادکردنی سێرڤەری تێستی نوێ (Xtream Codes API)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">ناوی سێرڤەر</label>
                  <input
                    type="text"
                    placeholder="نموونە: سێرڤەری تێستی دووەم"
                    value={newServerForm.name}
                    onChange={(e) => setNewServerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-normal"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">ناونیشانی سێرڤەر (Host / Port)</label>
                  <input
                    type="text"
                    placeholder="http://server-domain.com:8080"
                    value={newServerForm.host}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parsed = parseM3uCredentialsUrl(val);
                      if (parsed) {
                        setNewServerForm(prev => ({
                          ...prev,
                          type: 'xtream',
                          host: parsed.host,
                          username: parsed.username,
                          password: parsed.password,
                          name: prev.name || parsed.name
                        }));
                      } else {
                        setNewServerForm(prev => ({ ...prev, host: val }));
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono text-start"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">ناوی بەکارهێنەر (Username)</label>
                  <input
                    type="text"
                    placeholder="Username"
                    value={newServerForm.username}
                    onChange={(e) => setNewServerForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono text-start"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">تێپەڕەوشە (Password)</label>
                  <input
                    type="text"
                    placeholder="Password"
                    value={newServerForm.password}
                    onChange={(e) => setNewServerForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono text-start"
                  />
                </div>
              </div>

              {formTestResult && (
                <div className={`p-2.5 rounded-xl text-xs font-normal flex items-center gap-2 ${
                  formTestResult.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {formTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{formTestResult.message}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1 justify-end">
                <button
                  type="button"
                  onClick={handleTestNewForm}
                  disabled={isTestingForm}
                  className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-slate-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50 font-normal"
                >
                  {isTestingForm ? 'پشکنین...' : 'پشکنینی هەژمار'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndActivateNew}
                  disabled={isRefreshing}
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-normal transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  سەیڤکردن و چالاککردن
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-light">
            <span>سێرڤەری ئێستا:</span>
            <span className="text-white font-normal">{activeConfig?.name || 'سێرڤەری سەرەکی'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-normal transition-all cursor-pointer active:scale-95"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
}
