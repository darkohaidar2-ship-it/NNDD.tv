import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Tv, 
  Radio, 
  CreditCard, 
  Film, 
  Settings, 
  BarChart3, 
  Terminal, 
  AlertTriangle,
  Play,
  RotateCcw,
  Check,
  UserCheck
} from 'lucide-react';

export default function SimulationSandboxModal({ 
  isOpen, 
  onClose, 
  users, 
  permissions,
  initialUser 
}) {
  const [selectedUser, setSelectedUser] = useState(initialUser || users[0]);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [lastResult, setLastResult] = useState(null);

  if (!isOpen) return null;

  // Sandbox action definitions
  const TEST_ACTIONS = [
    {
      id: 'act_add_channel',
      name: 'زیادکردنی کەناڵی ناوخۆیی نوێ',
      category: 'کەناڵەکان',
      requiredPerm: 'manage_channels',
      icon: Tv,
      color: 'blue'
    },
    {
      id: 'act_edit_logo',
      name: 'گۆڕینی لۆگۆی کەناڵ (Upload Logo)',
      category: 'کەناڵەکان',
      requiredPerm: 'manage_channels',
      icon: Tv,
      color: 'blue'
    },
    {
      id: 'act_update_m3u',
      name: 'نوێکردنەوەی لینکی M3U8 و سێرڤەر',
      category: 'ستریم و تەکنیکی',
      requiredPerm: 'manage_streams',
      icon: Radio,
      color: 'purple'
    },
    {
      id: 'act_xtream_code',
      name: 'گۆڕینی کلیلی Xtream API',
      category: 'ستریم و تەکنیکی',
      requiredPerm: 'manage_streams',
      icon: Radio,
      color: 'purple'
    },
    {
      id: 'act_create_trial',
      name: 'پێدانی تێستی ٢٤ کاتژمێری بۆ کڕیار',
      category: 'بەشداری و فرۆش',
      requiredPerm: 'manage_subscriptions',
      icon: CreditCard,
      color: 'emerald'
    },
    {
      id: 'act_extend_plan',
      name: 'درێژکردنەوەی پلانی ١ ساڵی لە سیستەم',
      category: 'بەشداری و فرۆش',
      requiredPerm: 'manage_subscriptions',
      icon: CreditCard,
      color: 'emerald'
    },
    {
      id: 'act_add_movie',
      name: 'زیادکردنی فیلمی سینەمایی نوێ (VOD)',
      category: 'سینەما و زنجیرە',
      requiredPerm: 'manage_vod',
      icon: Film,
      color: 'amber'
    },
    {
      id: 'act_change_brand',
      name: 'گۆڕینی لۆگۆی سەرەکی ئەپڵیکەیشن',
      category: 'سیستەم و ئاسایش',
      requiredPerm: 'system_settings',
      icon: Settings,
      color: 'rose'
    },
    {
      id: 'act_view_revenue',
      name: 'دەرهێنانی داتای دارایی و فرۆش',
      category: 'ئامار و دارایی',
      requiredPerm: 'view_analytics',
      icon: BarChart3,
      color: 'cyan'
    }
  ];

  const handleExecuteAction = (action) => {
    const hasPermission = selectedUser.permissions.includes(action.requiredPerm);
    const permObj = permissions.find(p => p.id === action.requiredPerm);
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

    const outcome = {
      id: Date.now(),
      time: timestamp,
      user: selectedUser.name,
      action: action.name,
      success: hasPermission,
      requiredPerm: permObj?.name || action.requiredPerm,
      details: hasPermission 
        ? `کردارەکە بە سەرکەوتوویی لە دۆخی تاقیکاری جێبەجێکرا (Mock Success). داتای سەرەکی دەستکاری نەکراوە.`
        : `دەسەڵاتت نییە! پێویستت بە مۆڵەتی "${permObj?.name || action.requiredPerm}" هەیە.`
    };

    setLastResult(outcome);
    setSimulationLogs(prev => [outcome, ...prev.slice(0, 20)]);
  };

  const clearLogs = () => {
    setSimulationLogs([]);
    setLastResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up text-slate-900">
        
        {/* Modal Header (Apple Light Mode) */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  تاقیگەی تاقیکردنەوەی دەسەڵاتەکان (Interactive Simulation Sandbox)
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  Sandbox v2.0
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                تاقیکردنەوەی کرداری دەسەڵاتەکانی هەر کارمەندێک بە شێوەی ڕاستەوخۆ بەبێ دەستکاریکردنی داتابەیس
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* User Selector Bar */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={selectedUser.avatar} 
                alt={selectedUser.name}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-300 shadow-xs"
              />
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-0.5">
                  تاقیکردنەوە وەک (Simulate as User):
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedUser.id}
                    onChange={(e) => {
                      const found = users.find(u => u.id === e.target.value);
                      if (found) {
                        setSelectedUser(found);
                        setLastResult(null);
                      }
                    }}
                    className="text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-xl px-3 py-1.5 focus:border-purple-500 outline-none"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id} className="bg-white text-slate-900">
                        {u.name} — ({u.role})
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500 font-mono">
                    MAC: {selectedUser.deviceMac}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>{selectedUser.permissions.length} دەسەڵاتی کارا</span>
              </span>
            </div>
          </div>

          {/* Active Permission Badges */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-xs text-slate-500 font-medium me-1">دەسەڵاتە پێدراوەکان:</span>
            {selectedUser.permissions.length === 0 ? (
              <span className="text-xs text-rose-700 font-medium bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                هیچ دەسەڵاتێکی ئەدمینی نییە (بینەری ئاسایی)
              </span>
            ) : (
              selectedUser.permissions.map(pid => {
                const p = permissions.find(item => item.id === pid);
                if (!p) return null;
                return (
                  <span 
                    key={pid}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium border border-purple-200 bg-purple-50 text-purple-700 flex items-center gap-1 shadow-2xs"
                  >
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>{p.name}</span>
                  </span>
                );
              })
            )}
          </div>

          {/* Last Result Banner */}
          {lastResult && (
            <div className={`p-4 rounded-2xl border transition-all animate-fade-in ${
              lastResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-start gap-3">
                {lastResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold">
                      {lastResult.success ? 'ڕێگەپێدراوە (ACCESS GRANTED)' : 'دەسەڵات ڕەتکرایەوە (ACCESS DENIED)'}
                    </h4>
                    <span className="text-[10px] font-mono opacity-70">
                      {lastResult.time}
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed">
                    <strong>{lastResult.action}:</strong> {lastResult.details}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Test Action Buttons Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                کردارە کردارییەکان بۆ تاقیکردنەوە (کلیک بکە بۆ تاقیکردنەوە):
              </h4>
              <span className="text-[11px] text-slate-500">
                سیستەم دەستبەجێ مۆڵەتەکە دەپشکنێت
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {TEST_ACTIONS.map(action => {
                const Icon = action.icon;
                const hasPerm = selectedUser.permissions.includes(action.requiredPerm);

                return (
                  <button
                    key={action.id}
                    onClick={() => handleExecuteAction(action)}
                    className={`p-3.5 rounded-xl border text-start flex items-center justify-between gap-2.5 transition-all duration-150 active:scale-95 ${
                      hasPerm
                        ? 'border-slate-200 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50/60 hover:border-rose-400 hover:bg-rose-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-2 rounded-lg ${
                        hasPerm ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-200 text-slate-600 border border-slate-300'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {action.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {action.category}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                      hasPerm ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                    }`}>
                      {hasPerm ? 'دەسەڵاتی هەیە' : 'قەدەغەیە'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audit Logs Console (Sleek Dark Terminal) */}
          <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-purple-400">
                <Terminal className="w-4 h-4" />
                <span>تۆماری کردارە تاقیکراوەکان (Live Simulation Log Feed)</span>
              </div>
              {simulationLogs.length > 0 && (
                <button
                  onClick={clearLogs}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>سڕینەوە</span>
                </button>
              )}
            </div>

            {simulationLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 font-mono">
                کلیک لە یەکێک لە دوگمەکانی سەرەوە بکە بۆ دەستپێکردنی تاقیکردنەوە...
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pe-1 font-mono text-xs">
                {simulationLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between gap-2 py-1 border-b border-slate-800/80 last:border-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-slate-500">[{log.time}]</span>
                      <span className={`w-2 h-2 rounded-full ${log.success ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                      <span className="text-slate-300 font-semibold">{log.user}:</span>
                      <span className="text-slate-400 truncate">{log.action}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      log.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {log.success ? 'ڕێگەپێدراو' : 'ڕەتکرایەوە'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            NNDD TV • تاقیگەی پێشکەوتووی دەسەڵاتەکان
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium text-xs active:scale-95 transition-all border border-slate-300"
          >
            داخستنی تاقیگە
          </button>
        </div>

      </div>
    </div>
  );
}

