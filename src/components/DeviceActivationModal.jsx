import React, { useState } from 'react';
import { 
  Key, 
  Smartphone, 
  ShieldCheck, 
  Copy, 
  Check, 
  Send, 
  Clock, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  User, 
  Share2, 
  ExternalLink,
  Laptop,
  Tv,
  X,
  Lock,
  LogIn,
  KeyRound
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, INITIAL_ACTIVATION_CODES } from '../data/mockData';
import { submitActivationRequest, saveDeviceIdentity, authenticateTestAccount, TEST_ACCOUNTS } from '../data/deviceManager';

export default function DeviceActivationModal({ 
  isOpen, 
  onClose, 
  device, 
  deviceIdentity,
  setDevice, 
  onActivationSuccess,
  onRequestSubmitted,
  onNotify,
  onUnlockApp 
}) {
  const currentDevice = device || deviceIdentity;
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'trial' | 'packages' | 'code'
  const [copied, setCopied] = useState(false);
  
  // Test Account Login State (nndd-97 / 97971997)
  const [loginUsername, setLoginUsername] = useState('nndd-97');
  const [loginPassword, setLoginPassword] = useState('97971997');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Trial form state
  const [clientName, setClientName] = useState(currentDevice?.clientName || '');
  const [clientPhone, setClientPhone] = useState(currentDevice?.clientPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Package purchase state
  const [selectedPlanId, setSelectedPlanId] = useState('sub_1m');

  // Instant code redeem state
  const [activationCode, setActivationCode] = useState('');
  const [codeError, setCodeError] = useState('');

  if (!isOpen) return null;

  const handleCopySerial = () => {
    navigator.clipboard?.writeText(currentDevice?.serialNumber || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    onNotify?.({
      title: 'ژمارەی نهێنی کۆپیکرا',
      message: `ژمارەی سریاڵی ${currentDevice?.serialNumber} کۆپیکرا؛ دەتوانیت بۆ ئەدمینی بنێریت.`,
      type: 'info'
    });
  };

  const handleAccountLogin = (e) => {
    if (e) e.preventDefault();
    setLoginError('');

    const res = authenticateTestAccount(loginUsername, loginPassword);
    if (res.success) {
      setLoginSuccess(true);
      const updated = res.device;
      setDevice?.(updated);
      onActivationSuccess?.(updated);
      onUnlockApp?.(res.account.durationDays || 365);

      onNotify?.({
        title: 'چوونەژوورەوەی تێست سەرکەوتوو بوو! 🎉',
        message: `ئەکاونتی (${res.account.username}) چالاککرا بەبێ پێویستی بە ئەدمین.`,
        type: 'success'
      });

      setTimeout(() => {
        onClose?.();
      }, 500);
    } else {
      setLoginError(res.error || 'ناوی بەکارهێنەر یان پاسۆرد هەڵەیە. تکایە nndd-97 و 97971997 بنووسە.');
    }
  };

  const handleRequestTrial = (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      onNotify?.({
        title: 'تکایە زانیارییەکان پڕبکەرەوە',
        message: 'ناو و ژمارەی مۆبایلەکەت بنووسە بۆ داواکردنی تێستی بێ بەرامبەر.',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newReq = submitActivationRequest({
        clientName,
        clientPhone,
        requestType: 'trial_24h',
        planName: 'تێستی ٢٤ کاتژمێری (بێ بەرامبەر)'
      });
      onRequestSubmitted?.(newReq);
      setIsSubmitting(false);
      setRequestSent(true);
      onNotify?.({
        title: 'داواکاریەکەت نێردرا 🎉',
        message: 'داواکاری تێستی ٢٤ کاتژمێر گەیشتە کۆنتڕۆڵ پانێڵی ئەدمین. دوای پەسەندکردنی دەستبەجێ ئەپەکەت کارا دەبێت.',
        type: 'success'
      });
    }, 600);
  };

  const handleRequestPackage = (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      onNotify?.({
        title: 'تکایە زانیارییەکان پڕبکەرەوە',
        message: 'ناو و ژمارەی مۆبایلەکەت بنووسە بۆ ناردنی داواکاری کڕین.',
        type: 'error'
      });
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlanId) || SUBSCRIPTION_PLANS[1];
    setIsSubmitting(true);
    setTimeout(() => {
      const newReq = submitActivationRequest({
        clientName,
        clientPhone,
        requestType: plan.id,
        planName: plan.name
      });
      onRequestSubmitted?.(newReq);
      setIsSubmitting(false);
      setRequestSent(true);
      onNotify?.({
        title: 'داواکاری کڕین نێردرا 🎉',
        message: `داواکاری پلانی "${plan.name}" گەیشتە ئەدمین. بریکار یان ئەدمین پەیوەندیت پێوە دەکات بۆ چالاککردنی.`,
        type: 'success'
      });
    }, 600);
  };

  const handleRedeemInstantCode = (e) => {
    e.preventDefault();
    setCodeError('');
    const entered = activationCode.trim().toUpperCase();

    if (!entered) {
      setCodeError('تکایە کۆدی چالاککردن بنووسە.');
      return;
    }

    // Direct check for test account credentials used as code
    if (entered === 'NNDD-97' || entered === '97971997') {
      const res = authenticateTestAccount('nndd-97', '97971997');
      if (res.success) {
        setDevice?.(res.device);
        onActivationSuccess?.(res.device);
        onUnlockApp?.(365);
        onNotify?.({
          title: 'ئەکاونتی تێست کارا کرا! 🎉',
          message: 'کۆدی تێست (nndd-97) بە سەرکەوتوویی قبوڵکرا بەبێ پێویستی بە ئەدمین.',
          type: 'success'
        });
        onClose?.();
        return;
      }
    }

    const matched = INITIAL_ACTIVATION_CODES.find(c => c.code.toUpperCase() === entered);
    if (matched) {
      // Activate device!
      const updated = {
        ...currentDevice,
        status: 'active',
        activePlan: matched.planName,
        expiresAt: new Date(Date.now() + matched.durationDays * 86400000).toISOString()
      };
      setDevice?.(updated);
      saveDeviceIdentity(updated);
      onActivationSuccess?.(updated);

      onNotify?.({
        title: 'ئەپەکە چالاککرا! پیرۆزە 🎉',
        message: `کۆدی "${matched.planName}" بە سەرکەوتوویی قبوڵکرا. بەخێربێن بۆ NNDD TV.`,
        type: 'success'
      });

      onUnlockApp?.(matched.durationDays);
      onClose?.();
    } else {
      setCodeError('کۆدەکە هەڵەیە یان پێشتر بەکارهاتووە. تکایە دڵنیابەرەوە لە کۆدەکە.');
    }
  };

  const handleDemoBypass = () => {
    onUnlockApp?.(7); // unlock for demo session
    onClose();
    onNotify?.({
      title: 'چوونەژوورەوەی تاقیکاری (Demo)',
      message: 'ئێستا وەک میوان دەتوانیت سەیری تەواوی کەناڵەکان و ئەپەکە بکەیت.',
      type: 'info'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fade-in text-slate-800" dir="rtl">
      <div className="bg-white rounded-3xl shadow-apple-lg border border-slate-200/90 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-slide-up">
        
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center font-black text-white text-base shadow-apple-sm">
                4K
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>تۆمارکردن و ئەکتیڤکردنی NNDD TV</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    بەستنەوە بە ئامێر
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  هەر مۆبایل یان تیڤییەک خاوەنی ژمارەی سریاڵی نهێنی و ئایپی تایبەت بەخۆیەتی
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hardware Serial Key Showcase Card */}
          <div className="mt-4 p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-blue-300 font-medium block">
                ژمارەی نهێنی ئامێرەکەت (Hardware Serial Key):
              </span>
              <div className="font-mono text-sm sm:text-base font-black text-emerald-400 tracking-wider mt-0.5 flex items-center gap-2">
                <span>{currentDevice?.serialNumber}</span>
                <button
                  type="button"
                  onClick={handleCopySerial}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
                  title="کۆپیکردنی کۆد"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                IP: {currentDevice?.deviceIp} • {currentDevice?.deviceModel}
              </div>
            </div>

            <div className="text-end">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                currentDevice?.status === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {currentDevice?.status === 'active' ? 'چالاککراوە ✓' : 'چاوەڕێی چالاککردنە'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Tabs Switcher */}
        <div className="flex flex-wrap border-b border-slate-200/80 bg-slate-50/70 p-1.5 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow-apple-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>🔑 ئەکاونتی تێست (nndd-97)</span>
          </button>

          <button
            onClick={() => setActiveTab('trial')}
            className={`flex-1 min-w-[125px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'trial'
                ? 'bg-blue-600 text-white shadow-apple-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>١. داوای تێستی ٢٤ کاتژمێر</span>
          </button>

          <button
            onClick={() => setActiveTab('packages')}
            className={`flex-1 min-w-[95px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'packages'
                ? 'bg-slate-900 text-white shadow-apple-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>٢. کڕینی پاکێج</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 min-w-[95px] py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-purple-600 text-white shadow-apple-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>٣. داخڵکردنی کۆد</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* TAB 0: Direct Account Login for Testing Without Admin */}
          {activeTab === 'login' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900 text-xs flex items-center gap-2">
                    <span>چوونەژوورەوەی تێست بەبێ گەڕانەوە بۆ ئەدمین</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-black">VIP TEST</span>
                  </h4>
                  <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                    دەتوانیت ئەکاونتی تێستی <strong className="underline font-mono">nndd-97</strong> داخڵ بکەیت و دەستبەجێ بەبێ چاوەڕوانی ئەدمین تەواوی کەناڵەکان و ئەپەکە بۆت چالاک دەبێت.
                  </p>
                </div>
              </div>

              {/* 1-Click Fast Autofill & Test Button */}
              <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-[11px] text-amber-900 font-semibold">ئەکاونتی ئامادەکراوی تێست:</span>
                  <code className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    nndd-97
                  </code>
                  <span className="text-slate-400">•</span>
                  <code className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    97971997
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername('nndd-97');
                    setLoginPassword('97971997');
                    setLoginError('');
                    handleAccountLogin();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs active:scale-95 transition-all shadow-xs flex items-center justify-center gap-1.5 self-end sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>تێستی ڕاستەوخۆ بە یەک کلیک ⚡</span>
                </button>
              </div>

              <form onSubmit={handleAccountLogin} className="space-y-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">ناوی بەکارهێنەر / ئەکاونت (Username):</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="nndd-97"
                      value={loginUsername}
                      onChange={(e) => {
                        setLoginUsername(e.target.value);
                        setLoginError('');
                      }}
                      className="w-full ps-9 pe-3 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">وشەی نهێنی / پاسۆرد (Password):</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="97971997"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setLoginError('');
                      }}
                      className="w-full ps-9 pe-3 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none text-slate-900"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {loginSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>بە سەرکەوتوویی چووە ژوورەوە! ئەپەکە چالاککرا...</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-apple-md active:scale-95 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>چوونەژوورەوە و چالاککردنی تێست (Login)</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 1: 24h Free Trial */}
          {activeTab === 'trial' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 text-xs">تێستی ٢٤ کاتژمێری بێ بەرامبەر</h4>
                  <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                    تەواوی ٥٦ کەناڵە کوردی و جیهانییەکان، سینەما و دراماکان تاقی بکەرەوە. پاش پڕکردنەوە، داواکاریەکەت یەکسەر دەگاتە ئەدمین و بۆت چالاک دەکرێت.
                  </p>
                </div>
              </div>

              {requestSent ? (
                <div className="p-5 text-center space-y-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-900 text-sm">داواکاریەکەت بە سەرکەوتوویی نێردرا!</h4>
                  <p className="text-xs text-emerald-700">
                    ئێستا دەتوانیت لە ڕێگەی وەتسئەپەوە پەیوەندی بکەیت یان چاوەڕێ بکەیت ئەدمین پەسەندی بکات.
                  </p>
                  <a
                    href={`https://wa.me/9647709709346?text=سڵاو،%20داوای%20تێستی%20٢٤%20کاتژمێرم%20کردووە%20بۆ%20ئامێری:%20${device?.serialNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-sm hover:bg-emerald-500"
                  >
                    <span>کردنەوەی لە WhatsApp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <form onSubmit={handleRequestTrial} className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ناوی سیانی:</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="بۆ نموونە: دیاری ئەحمەد"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ژمارەی مۆبایل (واتسئەپ):</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="0750 000 0000"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        className="w-full ps-9 pe-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'لە ناردندایە...' : 'ناردنی داواکاری بۆ ئەدمین'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Purchase Package */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <p className="text-slate-500 text-xs">
                پاکێجی دڵخوازی خۆت هەڵبژێرە، پاشان زانیارییەکانت بنووسە بۆ ناردن بۆ ئەدمین:
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {SUBSCRIPTION_PLANS.filter(p => p.id !== 'trial_24h').map(plan => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-3 rounded-2xl border text-start transition-all ${
                      selectedPlanId === plan.id
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{plan.name}</span>
                      {selectedPlanId === plan.id && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <div className="text-xs font-black text-emerald-600 mt-1 font-mono">
                      {plan.price}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {plan.durationDays} ڕۆژ سەیرکردنی بێ بڕانەوە
                    </span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleRequestPackage} className="space-y-3 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ناوی کڕیار:</label>
                    <input
                      type="text"
                      required
                      placeholder="ناوەکەت لێرە بنووسە..."
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ژمارەی مۆبایل:</label>
                    <input
                      type="tel"
                      required
                      placeholder="0770 000 0000"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isSubmitting ? 'لە ناردندایە...' : 'ناردنی داواکاری کڕین بۆ ئەدمین'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: Instant Activation Code */}
          {activeTab === 'code' && (
            <form onSubmit={handleRedeemInstantCode} className="space-y-4">
              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl">
                <h4 className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-purple-600" />
                  <span>کۆدی کارت یان بریکارت پێیە؟</span>
                </h4>
                <p className="text-[11px] text-purple-700 mt-1 leading-relaxed">
                  ئەگەر کۆدی سەبسکرایبت لە بریکار وەرگرتووە، لێرەدا بینووسە تا دەستبەجێ ئەپەکەت بۆ بکرێتەوە.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">کۆدی چالاککردن (Code):</label>
                <input
                  type="text"
                  required
                  placeholder="بۆ نموونە: KRD-2026-1Y-GOLD-9901"
                  value={activationCode}
                  onChange={(e) => {
                    setActivationCode(e.target.value);
                    setCodeError('');
                  }}
                  className="w-full px-4 py-2.5 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-purple-500 outline-none"
                />
                {codeError && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{codeError}</span>
                  </p>
                )}
              </div>

              {/* Sample Code Helper */}
              <div className="p-2.5 bg-slate-100 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
                <span>کۆدی تاقیکاری بەردەست:</span>
                <code 
                  onClick={() => setActivationCode('KRD-2026-TRIAL-8821')}
                  className="bg-white px-2 py-0.5 rounded border border-slate-200 cursor-pointer font-bold text-purple-700 hover:bg-purple-50"
                  title="کلیک بکە بۆ دانان"
                >
                  KRD-2026-TRIAL-8821
                </code>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>چالاککردنی دەستبەجێ (Instant Unlock)</span>
              </button>
            </form>
          )}

        </div>

        {/* Modal Bottom Footer with Demo Bypass button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDemoBypass}
            className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
          >
            تێستی خێرا وەک میوان (Demo Preview)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
}
