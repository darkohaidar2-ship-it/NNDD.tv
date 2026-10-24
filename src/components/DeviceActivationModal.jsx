import React, { useState } from 'react';
import { 
  Tv, 
  Copy, 
  Check, 
  Share2, 
  X, 
  Key, 
  Camera, 
  Sparkles, 
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';
import DabinLogo from './DabinLogo';
import { INITIAL_ACTIVATION_CODES } from '../data/mockData';
import { saveDeviceIdentity, getOrCreateDeviceIdentity } from '../data/deviceManager';

export default function DeviceActivationModal({ 
  isOpen, 
  onClose, 
  device, 
  deviceIdentity,
  setDevice, 
  onActivationSuccess,
  onNotify,
  onUnlockApp 
}) {
  const currentDevice = device || deviceIdentity || getOrCreateDeviceIdentity();
  const [copiedMac, setCopiedMac] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);
  
  // Instant code redemption
  const [activationCode, setActivationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const macAddress = currentDevice?.macAddress || '00:1A:79:B4:9C:2F';
  const portalUrl = currentDevice?.portalUrl || 'http://line.liondnscloud.ru/c/';

  const handleCopyMac = () => {
    navigator.clipboard?.writeText(macAddress);
    setCopiedMac(true);
    setTimeout(() => setCopiedMac(false), 2500);
    onNotify?.({
      title: 'کۆدی MAC کۆپیکرا 📋',
      message: `کۆدی ماگ: ${macAddress} کۆپیکرا بۆ کلیپبۆرد.`,
      type: 'info'
    });
  };

  const handleCopyPortal = () => {
    navigator.clipboard?.writeText(portalUrl);
    setCopiedPortal(true);
    setTimeout(() => setCopiedPortal(false), 2500);
    onNotify?.({
      title: 'پۆڕتاڵ کۆپیکرا 🌐',
      message: `${portalUrl} کۆپیکرا.`,
      type: 'info'
    });
  };

  const handleWhatsAppShareMag = () => {
    const text = `سڵاو بەڕێزم 🌷
داواکاری چالاککردنی پاکێجی پەخش (DABIN.tv):
📺 کۆدی ماگ (MAC): ${macAddress}
🌐 پۆڕتاڵ (Portal URL): ${portalUrl}
📱 مۆدێل: ${currentDevice?.deviceModel || 'Smart TV'}

تکایە پاکێجەکەم بۆ دیاری بکەن و کەناڵەکانم بۆ کارا بکەن. زۆر سوپاس!`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleRedeemCode = (e) => {
    e.preventDefault();
    setCodeError('');
    const entered = activationCode.trim().toUpperCase();

    if (!entered) {
      setCodeError('تکایە کۆدی کاراکردن داخڵ بکە.');
      return;
    }

    const matched = INITIAL_ACTIVATION_CODES.find(c => c.code.toUpperCase() === entered);
    if (matched) {
      const updated = {
        ...currentDevice,
        status: 'active',
        activePlan: matched.planName,
        expiresAt: new Date(Date.now() + (matched.durationDays || 30) * 86400000).toISOString()
      };
      setDevice?.(updated);
      saveDeviceIdentity(updated);
      setIsSuccess(true);
      onActivationSuccess?.(updated);
      onUnlockApp?.(matched.durationDays || 30);

      onNotify?.({
        title: 'ئەپەکە چالاککرا! پیرۆزە 🎉',
        message: `کۆدی "${matched.planName}" بە سەرکەوتوویی قبوڵکرا.`,
        type: 'success'
      });

      setTimeout(() => {
        onClose?.();
      }, 1000);
    } else {
      setCodeError('کۆدەکە هەڵەیە یان بەسەرچووە. تکایە دڵنیابەرەوە لە کۆدەکە.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-2xl animate-fade-in text-slate-100" dir="rtl">
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[94vh] animate-slide-up backdrop-blur-md">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950 p-5 border-b border-cyan-500/20 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <DabinLogo className="h-8 w-auto" glow={true} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>ناسنامەی ئامێر (MAG MAC Portal)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                    STB MAG
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تەنها کۆدی MAC ئەکاونتی تایبەتی ئەم شاشەیەیە لە سێرڤەر
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Camera Notice */}
          <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center gap-3 shadow-inner">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
              <Camera className="w-5 h-5 text-cyan-300" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs text-cyan-200 flex items-center gap-2">
                <span>📸 وێنەی ئەم شاشەیە بە مۆبایل بنێرە بۆ بەڕێوەبەر</span>
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                بەڕێوەبەر بەپێی کۆدی MAC پاکێجەکەت بۆ هەڵدەبژێرێت و ڕاستەوخۆ کەناڵەکان دەکرێنەوە.
              </p>
            </div>
          </div>

          {/* High-Contrast MAG Box Display */}
          <div className="p-5 rounded-3xl bg-slate-950/95 border-2 border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.2)] space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400" />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-xs text-slate-300 tracking-wide font-mono">DABIN.tv • MAG ACCOUNT</span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                currentDevice?.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {currentDevice?.status === 'active' ? 'چالاککراوە ✓' : 'چاوەڕوانی کاراکردن'}
              </span>
            </div>

            {/* Glowing Monospace MAC Address */}
            <div className="bg-slate-900/90 border border-cyan-400/40 rounded-2xl p-4 text-center space-y-1">
              <span className="text-[11px] text-slate-400 font-medium block">
                MAC ADDRESS (کۆدی ئامێر / ئەکاونت)
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-black text-cyan-300 tracking-widest py-1 drop-shadow-[0_0_15px_rgba(6,182,212,0.7)] select-all">
                {macAddress}
              </div>
              <p className="text-[10px] text-slate-400">
                ئەم ماکە جێگیرە لەسەر ئەم ئامێرە و ناگۆڕێت تەنانەت بە سڕینەوە و دابەزاندنەوە
              </p>
            </div>

            {/* Portal URL & Model */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">ناونیشانی پۆڕتاڵ (Portal URL):</span>
                  <span className="text-amber-300 font-bold break-all select-all text-[11px]">
                    {portalUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPortal}
                  className="mt-2 text-[10px] text-cyan-300 hover:text-cyan-200 self-start flex items-center gap-1 cursor-pointer"
                >
                  {copiedPortal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPortal ? 'کۆپیکرا' : 'کۆپیکردن'}</span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">مۆدێلی ئامێر:</span>
                  <span className="text-slate-200 text-[11px]">
                    {currentDevice?.deviceModel || 'Smart TV / Android Box'}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  {currentDevice?.deviceIp || '149.255.228.84'}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleWhatsAppShareMag}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>ناردنی ماک بۆ وەتسئەپ 📲</span>
              </button>

              <button
                type="button"
                onClick={handleCopyMac}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedMac ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedMac ? 'کۆپیکرا ✓' : 'کۆپیکردنی MAC'}</span>
              </button>
            </div>
          </div>

          {/* Instant Code Redemption */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-xs">کۆدی کاراکردنت پێیە؟ لێرە داخڵی بکە:</span>
            </div>

            <form onSubmit={handleRedeemCode} className="flex gap-2">
              <input
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value)}
                placeholder="کۆدی بەشداربوون داخڵ بکە..."
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>چالاککردن</span>
              </button>
            </form>

            {codeError && (
              <p className="text-[11px] text-rose-400 font-medium">{codeError}</p>
            )}
            {isSuccess && (
              <p className="text-[11px] text-emerald-400 font-medium">ئەپەکەت بە سەرکەوتوویی چالاککرا!</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950/80 p-3.5 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>سیستەمی ناسنامەی فەرمی DABIN.tv</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
}
