import React, { useState } from 'react';
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
  Sliders
} from 'lucide-react';
import { INITIAL_ACTIVATION_CODES, SUBSCRIPTION_PLANS, CHANNELS_DATA, INITIAL_ACTIVATION_REQUESTS } from '../data/mockData';
import { AVAILABLE_FONTS, applyFontToDocument, getCurrentFont } from '../data/fonts';
import ChannelManagerTab from './ChannelManagerTab';
import ActivationRequestsTab from './ActivationRequestsTab';
import VodManagerTab from './VodManagerTab';

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
  onNotify
}) {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('roles'); // 'roles' | 'codes' | 'channels' | 'vod' | 'requests' | 'settings'
  const [selectedUserIds, setSelectedUserIds] = useState(['usr-1']);
  const [focusedUserId, setFocusedUserId] = useState('usr-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [draggedUserIds, setDraggedUserIds] = useState([]);
  const [dragOverRoleId, setDragOverRoleId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Activation Codes State (Reseller Engine)
  const [codes, setCodes] = useState(INITIAL_ACTIVATION_CODES);
  const [selectedPlanForCode, setSelectedPlanForCode] = useState('sub_1m');

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
    <div className="space-y-6">
      
      {/* Top Banner: Control Toolbar, Mode Tabs & Database Save (Apple Light Mode) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 text-slate-900">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/40">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-wide flex items-center gap-2">
                NNDD TV • پانێڵی بەڕێوەبردن (Admin)
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                بەڕێوەبردنی دەسەڵاتەکان، کەناڵەکان و داواکارییەکانی ئامێر
              </p>
            </div>
          </div>

          {/* Simple Clean Tabs with Icons (Apple Light Mode) */}
          <div className="flex items-center flex-wrap gap-2 mt-4">
            <button
              onClick={() => setActiveWorkspaceTab('roles')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeWorkspaceTab === 'roles'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>دەسەڵات و کارمەندان (Staff & RBAC)</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('codes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeWorkspaceTab === 'codes'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-emerald-500" />
              <span>کۆدی بریکارەکان (Reseller Codes)</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('channels')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeWorkspaceTab === 'channels'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-indigo-500" />
              <span>بەڕێوەبردنی کەناڵەکان (Channels)</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('vod')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeWorkspaceTab === 'vod'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-rose-500" />
              <span>زنجیرە و فیلمەکان (VOD Studio)</span>
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('requests')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeWorkspaceTab === 'requests'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-amber-500" />
              <span>داواکاری تێست و بەشداربوون (24h Trials)</span>
              {(requests || []).filter(r => r?.status === 'pending').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            <button
              onClick={() => setActiveWorkspaceTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeWorkspaceTab === 'settings'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-500" />
              <span>فۆنت و ڕێکخستن (Settings)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-3 w-full lg:w-auto justify-end">
          <button
            onClick={() => onOpenSandbox(focusedUser)}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm border border-purple-400/30 hover:brightness-105 active:scale-95 transition-all duration-150"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>تاقیکردنەوە لە تاقیگە (Sandbox)</span>
          </button>

          <button
            onClick={handleSaveToDatabase}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all duration-150 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'پاشەکەوتکردن...' : 'پاشەکەوتکردن لە داتابەیس'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 2: RESELLER & ACTIVATION CODES GENERATOR (Apple Light Mode)
         ======================================================== */}
      {activeWorkspaceTab === 'codes' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm animate-fade-in space-y-6 text-slate-900">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                <span>دروستکردنی کۆدی سەبسکرایب و بەشداربووان (Reseller & VIP Codes)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                کۆد بە یەک کلیک دروست بکە و بۆ کڕیاری بنێرە؛ کڕیار لە تەلەفزیۆنەکەیەوە لێیدەدات و دەستبەجێ ئەکتیڤ دەبێت.
              </p>
            </div>

            {/* Generator Box */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedPlanForCode}
                onChange={(e) => setSelectedPlanForCode(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              >
                {SUBSCRIPTION_PLANS.map(plan => (
                  <option key={plan.id} value={plan.id} className="bg-white text-slate-900">
                    {plan.name} ({plan.price})
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateCode}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>دروستکردنی کۆد</span>
              </button>
            </div>
          </div>

          {/* Codes Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-3 text-start">کۆدی چالاککردن (Code)</th>
                  <th className="py-3 text-start">پلانی بەشداری</th>
                  <th className="py-3 text-start">ماوە</th>
                  <th className="py-3 text-start">نرخ</th>
                  <th className="py-3 text-start">دۆخ</th>
                  <th className="py-3 text-start">ئامێری بەکارهێنەر</th>
                  <th className="py-3 text-end">کردار</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {codes.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                      <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">{c.code}</span>
                      <button
                        onClick={() => handleCopyCode(c.code)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        title="کۆپیکردنی کۆد"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="py-3 font-semibold text-slate-900">{c.planName}</td>
                    <td className="py-3 text-slate-500">{c.durationDays} ڕۆژ</td>
                    <td className="py-3 font-bold text-emerald-600">{c.price}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'بەردەست' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-indigo-600 text-[11px]">
                      {c.usedByMac || 'هێشتا لێنەدراوە'}
                    </td>
                    <td className="py-3 text-end">
                      <a
                        href={`https://wa.me/?text=سڵاو،%20ئەمە%20کۆدی%20بەشداریکردنی%20NNDD%20TVـە:%20${c.code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-medium transition-colors border border-emerald-200"
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
      {activeWorkspaceTab === 'roles' && (
        <>
          {/* LIVE ACTION SHOWCASE: Top interactive showcase for the currently selected/focused user */}
          <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50 text-slate-900 rounded-3xl p-6 shadow-sm border border-blue-100 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 end-0 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-slate-200 pb-5">
              <div className="flex items-center gap-4">
                <img 
                  src={focusedUser.avatar} 
                  alt={focusedUser.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-blue-400/60 shadow-sm"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      پێشبینینی ڕاستەوخۆ (Live Action Showcase)
                    </span>
                    <span className="text-xs text-slate-500">
                      {focusedUser.subPlan}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {focusedUser.name} <span className="text-sm font-normal text-slate-600">({focusedUser.role})</span>
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                    <span>MAC: {focusedUser.deviceMac}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Lock className="w-3 h-3" />
                      {focusedUser.macLocked ? 'بەستراوە بە یەک ئامێر' : 'ئازاد'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-700 bg-white/80 border border-slate-200 rounded-2xl px-3.5 py-2 shadow-xs">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>دەسەڵاتی کارا: <strong className="text-slate-900 font-bold">{focusedUser.permissions.length}</strong> لە کۆی {permissions.length}</span>
              </div>
            </div>

            {/* Dynamic Action Buttons available to this user */}
            <div className="relative z-10 mt-5">
              <p className="text-xs text-slate-700 font-medium mb-3">
                دوگمە و ئۆپەراسیۆنە فەرمییە ڕێگەپێدراوەکان بۆ ئەم بەکارهێنەرە لەسەر سیستەمی NNDD TV:
              </p>

              <div className="flex flex-wrap gap-2.5">
                {focusedUser.permissions.length === 0 ? (
                  <div className="flex items-center gap-2 text-amber-800 text-xs bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>هیچ دەسەڵاتێکی ئەدمین کارا نەکراوە بۆ ئەم بەکارهێنەرە. تکایە دەسەڵاتێکی بۆ ڕابکێشە.</span>
                  </div>
                ) : (
                  permissions
                    .filter(p => focusedUser.permissions.includes(p.id))
                    .map(role => {
                      const Icon = ICON_MAP[role.icon] || ShieldCheck;
                      return (
                        <button
                          key={role.id}
                          onClick={() => {
                            onNotify?.({
                              title: 'کرداری تاقیکراوە',
                              message: `بەکارهێنەر "${focusedUser.name}" ڕێگەی پێدراوە بە: ${role.name}`,
                              type: 'success'
                            });
                          }}
                          className={`px-3.5 py-2 rounded-xl bg-gradient-to-r ${role.colorFrom} ${role.colorTo} text-white text-xs font-semibold flex items-center gap-2 shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-150 border border-white/20`}
                          title={role.description}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{role.name}</span>
                          <Check className="w-3 h-3 text-white/80" />
                        </button>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          {/* Main Two-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-slate-900">
            
            {/* COLUMN 1: Users / Staff (بەکارهێنەران و کارمەندان) - 5 Cols on desktop */}
            <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex flex-col">
              
              {/* Header & Filter Controls */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    ستوونی یەکەم: کارمەندان و ئەندامان
                  </h3>
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {filteredUsers.length} بەردەستە
                </span>
              </div>

              {/* Search Bar */}
              <div className="mt-3 relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="گەڕان بەپێی ناو، ڕۆڵ یان MAC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-10 pe-4 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Department Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 mt-1 no-scrollbar text-xs">
                {departments.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setDepartmentFilter(dept)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all duration-150 ${
                      departmentFilter === dept
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {dept === 'all' ? 'هەموو بەشەکان' : dept}
                  </button>
                ))}
              </div>

              {/* Multi-Select Toolbar */}
              <div className="flex items-center justify-between py-2 px-1 text-xs text-slate-500 border-b border-slate-200 mb-2">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 font-medium hover:text-slate-900 transition-colors"
                >
                  {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>دیاریکردنی هەموو ({selectedUserIds.length})</span>
                </button>

                {selectedUserIds.length > 0 && (
                  <button
                    onClick={() => setSelectedUserIds([])}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    پاککردنەوە
                  </button>
                )}
              </div>

              {/* Draggable Users List */}
              <div className="space-y-2.5 max-h-[620px] overflow-y-auto pe-1">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    هیچ بەکارهێنەرێک نەدۆزرایەوە بەپێی ئەم فلتەرە.
                  </div>
                ) : (
                  filteredUsers.map(user => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const isFocused = focusedUserId === user.id;

                    return (
                      <div
                        key={user.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, user.id)}
                        onClick={() => {
                          setFocusedUserId(user.id);
                          if (!selectedUserIds.includes(user.id)) {
                            setSelectedUserIds([user.id]);
                          }
                        }}
                        className={`group relative p-3.5 rounded-2xl border transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                          isFocused 
                            ? 'border-blue-500 bg-blue-50/80 shadow-sm ring-2 ring-blue-400/30' 
                            : isSelected
                            ? 'border-slate-300 bg-slate-100 shadow-xs'
                            : 'border-slate-200/90 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Drag Handle & Checkbox */}
                          <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-600">
                            <GripVertical className="w-4 h-4 cursor-grab" />
                            <button
                              type="button"
                              onClick={(e) => toggleSelectUser(user.id, e)}
                              className="p-0.5 rounded hover:bg-slate-200/60"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>

                          {/* Avatar with Status Ring */}
                          <div className="relative flex-shrink-0">
                            <img 
                              src={user.avatar} 
                              alt={user.name}
                              className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-300"
                            />
                            <span className={`absolute -bottom-0.5 -end-0.5 w-3 h-3 rounded-full border-2 border-white ${
                              user.status === 'چالاک' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`} />
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {user.name}
                              </h4>
                              
                              {/* MAC Lock Toggle Button */}
                              <button
                                type="button"
                                onClick={(e) => toggleMacLock(user.id, e)}
                                className={`p-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                                  user.macLocked 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                                }`}
                                title="قفڵی ئامێر (MAC Lock)"
                              >
                                {user.macLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                <span>{user.macLocked ? 'قفڵکراو' : 'ئازاد'}</span>
                              </button>
                            </div>

                            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                              {user.role} • <span className="text-indigo-600 font-semibold">{user.deviceMac}</span>
                            </p>

                            {/* Current Permissions badges */}
                            <div className="flex items-center flex-wrap gap-1 mt-2">
                              {user.permissions.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">بێ دەسەڵات</span>
                              ) : (
                                user.permissions.map(permId => {
                                  const pObj = permissions.find(p => p.id === permId);
                                  if (!pObj) return null;
                                  return (
                                    <span
                                      key={permId}
                                      className="text-[9px] px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1 bg-white text-slate-700 border border-slate-200 shadow-2xs"
                                    >
                                      {pObj.name}
                                      <button
                                        type="button"
                                        onClick={(e) => removeRoleFromUser(user.id, permId, e)}
                                        className="hover:text-rose-600 font-bold"
                                        title="سەندنەوەی دەسەڵات"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>تێبینی: کلیک بکە و ڕابکێشە بۆ دەستە ڕاست</span>
                <span className="font-semibold text-slate-700">{selectedUserIds.length} هەڵبژێردراو</span>
              </div>
            </div>

            {/* COLUMN 2: Roles & Permissions (ئەرک و دەسەڵاتەکان) - 7 Cols on desktop */}
            <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm flex flex-col">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">
                    ستوونی دووەم: ئەرک و دەسەڵاتەکان (Drop Zones)
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  ئەندامەکان لێرە بەربدە تا دەسەڵاتیان پێبدرێت
                </span>
              </div>

              {/* Permissions Grid / Drop Zones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4 max-h-[660px] overflow-y-auto pe-1">
                {permissions.map(role => {
                  const Icon = ICON_MAP[role.icon] || ShieldCheck;
                  const assignedUsers = users.filter(u => u.permissions.includes(role.id));
                  const isOver = dragOverRoleId === role.id;

                  return (
                    <div
                      key={role.id}
                      onDragOver={(e) => handleDragOver(e, role.id)}
                      onDragLeave={(e) => handleDragLeave(e, role.id)}
                      onDrop={(e) => handleDrop(e, role.id)}
                      className={`relative rounded-2xl border p-4.5 transition-all duration-200 flex flex-col justify-between ${
                        isOver 
                          ? 'border-blue-500 ring-4 ring-blue-200 bg-blue-50 scale-[1.01]' 
                          : 'border-slate-200 bg-slate-50/80 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        {/* Top Header of Role */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className={`p-2 rounded-xl bg-gradient-to-r ${role.colorFrom} ${role.colorTo} text-white shadow-xs`}>
                              <Icon className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">
                                {role.name}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-500">
                                {role.code}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {assignedUsers.length} ئەندام
                          </span>
                        </div>

                        {/* Role Description */}
                        <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
                          {role.description}
                        </p>

                        {/* Drop zone placeholder */}
                        <div className={`mt-3 py-2 px-3 rounded-xl border border-dashed text-center text-[10px] transition-colors ${
                          isOver 
                            ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' 
                            : 'border-slate-300 bg-white/70 text-slate-500'
                        }`}>
                          {isOver ? 'ئێستا بەریبدە تا دەسەڵاتەکە وەربگرن!' : 'کارمەندەکان ڕابکێشە بۆ ئێرە (Drop Zone)'}
                        </div>

                        {/* Assigned Users Avatars Stack */}
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-[10px] text-slate-500">خاوەن مۆڵەتەکان:</span>
                          <div className="flex items-center -space-x-1.5 space-x-reverse overflow-hidden">
                            {assignedUsers.slice(0, 4).map(u => (
                              <img
                                key={u.id}
                                src={u.avatar}
                                alt={u.name}
                                title={u.name}
                                className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                              />
                            ))}
                            {assignedUsers.length > 4 && (
                              <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                                +{assignedUsers.length - 4}
                              </span>
                            )}
                            {assignedUsers.length === 0 && (
                              <span className="text-[10px] text-slate-400 italic">کەس دانەنراوە</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Official Gradient Button with active:scale-95 */}
                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (selectedUserIds.length > 0) {
                              assignRoleToUsers(selectedUserIds, role.id);
                            } else {
                              onNotify?.({
                                title: 'تکایە بەکارهێنەر دیاریبکە',
                                message: 'سەرەتا لە ستوونی یەکەم یەک یان چەند ئەندامێک دەستنیشان بکە.',
                                type: 'info'
                              });
                            }
                          }}
                          className={`flex-1 py-2 px-3 rounded-xl bg-gradient-to-r ${role.colorFrom} ${role.colorTo} text-white text-xs font-semibold shadow-xs hover:shadow-md active:scale-95 transition-all duration-150 flex items-center justify-center gap-1.5 border border-white/20`}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>پێدانی ئەم دەسەڵاتە</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
                <span>سیستەمی پارێزراوی NNDD TV • مۆدێرن بە ستایلی ئەپڵ</span>
                <span className="text-blue-400 font-medium">٦ دەسەڵاتی فەرمی</span>
              </div>
            </div>

          </div>
        </>
      )}

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

