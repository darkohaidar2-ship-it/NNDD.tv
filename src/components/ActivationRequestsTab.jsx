import React, { useState } from 'react';
import { 
  Key, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ExternalLink, 
  MessageSquare, 
  Copy, 
  Check, 
  Filter,
  Tv,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { approveRequest } from '../data/deviceManager';

export default function ActivationRequestsTab({ requests, setRequests, onNotify }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved'
  const [copiedSerial, setCopiedSerial] = useState(null);

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.phone?.includes(searchQuery) ||
                          req.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          req.deviceIp?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (reqId) => {
    approveRequest(reqId, requests, setRequests);
    const target = requests.find(r => r.id === reqId);
    onNotify?.({
      title: 'داواکاری پەسەندکرا و ئەکتیڤکرا 🎉',
      message: `ئامێری "${target?.clientName}" بە سەرکەوتوویی ئەکتیڤکرا و بەسترایەوە بە سێرڤەر.`,
      type: 'success'
    });
  };

  const handleReject = (reqId) => {
    setRequests(requests.map(r => r.id === reqId ? { ...r, status: 'rejected' } : r));
    onNotify?.({
      title: 'داواکاری ڕەتکرایەوە',
      message: 'ئەم داواکارییە ڕەتکرایەوە لە سیستمدا.',
      type: 'info'
    });
  };

  const handleCopy = (serial) => {
    navigator.clipboard?.writeText(serial);
    setCopiedSerial(serial);
    setTimeout(() => setCopiedSerial(null), 2000);
    onNotify?.({
      title: 'ژمارەی نهێنی کۆپیکرا',
      message: `${serial} کۆپیکرا.`,
      type: 'info'
    });
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5 animate-fade-in text-xs text-slate-900">
      
      {/* Top Banner (Apple Light Mode) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              داواکارییەکانی بەشداربوون و تێستی ٢٤ کاتژمێر (Activation Requests Queue)
            </h3>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs animate-pulse">
                {pendingCount} چاوەڕوانە
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1">
            ئەو کڕیارانەی ئەپەکەیان دابەزاندووە و داوای تێستی ٢٤ کاتژمێری یان کڕینی پاکێج دەکەن بە سریاڵی نهێنی و ئایپی ئامێرەکەیان
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="گەڕان بەپێی ناوی کڕیار، تەلەفۆن، یان ژمارەی نهێنی ئامێر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: `هەموو (${requests.length})` },
            { id: 'pending', label: `چاوەڕوان (${pendingCount})` },
            { id: 'approved', label: 'پەسەندکراوەکان' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                filterStatus === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-start">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-medium">
              <th className="py-2.5 text-start">ناوی کڕیار</th>
              <th className="py-2.5 text-start">ژمارەی تەلەفۆن</th>
              <th className="py-2.5 text-start">ژمارەی نهێنی ئامێر (Serial)</th>
              <th className="py-2.5 text-start">ئایپی و مۆدێلی ئامێر</th>
              <th className="py-2.5 text-start">داواکاری / پاکێج</th>
              <th className="py-2.5 text-start">کاتی داواکاری</th>
              <th className="py-2.5 text-start">دۆخ</th>
              <th className="py-2.5 text-end">کردارەکان</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-10 text-center text-slate-400">
                  هیچ داواکارییەک بەپێی ئەم فلتەرە نەدۆزرایەوە.
                </td>
              </tr>
            ) : (
              filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 font-bold text-slate-900">
                    {req.clientName}
                  </td>
                  <td className="py-3 font-mono text-slate-700">
                    <a
                      href={`https://wa.me/${req.phone?.replace(/[^0-9]/g, '')}?text=سڵاو%20بەڕێز%20${encodeURIComponent(req.clientName)}،%20لە%20NNDD%20TVـەوە%20پەیوەندیت%20پێوە%20دەکەین.`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>{req.phone}</span>
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                    </a>
                  </td>
                  <td className="py-3 font-mono font-bold text-amber-900">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-amber-50 px-2 py-0.5 rounded text-[11px] text-amber-900 border border-amber-200 shadow-2xs">
                        {req.serialNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(req.serialNumber)}
                        className="text-slate-400 hover:text-slate-700 p-0.5"
                        title="کۆپیکردن"
                      >
                        {copiedSerial === req.serialNumber ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 text-[11px] text-slate-700 font-mono">
                    <div>{req.deviceIp}</div>
                    <div className="text-[10px] text-slate-500">{req.deviceModel}</div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req.requestType === 'trial_24h'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {req.planName}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 text-[11px]">
                    {req.requestedAt}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {req.status === 'approved' ? 'پەسەندکراو ✓' :
                       req.status === 'rejected' ? 'ڕەتکراوە ✕' : 'چاوەڕوان...'}
                    </span>
                  </td>
                  <td className="py-3 text-end">
                    <div className="flex items-center justify-end gap-1.5">
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-all shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>پەسەندکردن</span>
                          </button>

                          <button
                            onClick={() => handleReject(req.id)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200 text-[11px] transition-colors"
                          >
                            ڕەتکردنەوە
                          </button>
                        </>
                      )}

                      <a
                        href={`https://wa.me/${req.phone?.replace(/[^0-9]/g, '')}?text=سڵاو%20${encodeURIComponent(req.clientName)}،%20ئەپەکەت%20بۆ%20ئامێری%20(${req.serialNumber})%20بە%20سەرکەوتوویی%20لە%20NNDD%20TV%20چالاککرا.`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-emerald-700 border border-slate-200 transition-colors"
                        title="ناردنی نامەی وەتسئەپ"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
