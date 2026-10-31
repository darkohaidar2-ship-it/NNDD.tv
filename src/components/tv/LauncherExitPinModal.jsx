import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, X, AlertTriangle, Check, ArrowRight } from 'lucide-react';

/**
 * KOBIN.tv 2FA Launcher Exit Protocol Modal
 * Factor 2: 4-Digit PIN Challenge (Default: 0000)
 * Atomic Non-Destructive Exit back to stock TV Home Launcher
 */
export default function LauncherExitPinModal({
  show,
  onClose,
  onSuccessExit,
  language = 'ku'
}) {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (show) {
      setPin('');
      setErrorMsg('');
      setIsVerifying(false);
    }
  }, [show]);

  if (!show) return null;

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const verifyPin = (codeToVerify) => {
    setIsVerifying(true);
    // 1. Verify via native bridge
    if (window.KobinTvNative?.verifyPinAndExitLauncher) {
      const ok = window.KobinTvNative.verifyPinAndExitLauncher(codeToVerify);
      if (ok) {
        onSuccessExit?.();
        onClose?.();
        return;
      }
    }

    // 2. Fallback check for web/demo mode (PIN 0000 or 1234)
    if (codeToVerify === '0000' || codeToVerify === '1234') {
      onSuccessExit?.();
      onClose?.();
    } else {
      setIsVerifying(false);
      setErrorMsg('کۆدی PIN هەڵەیە! تکایە دووبارە هەوڵبدەرەوە (بنەڕەتی: 0000)');
      setPin('');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-3xl bg-black/[0.9] backdrop-blur-2xl border border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.9)] ring-1 ring-white/15 p-6 flex flex-col items-center gap-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center shadow-lg">
          <ShieldAlert className="w-6 h-6 text-amber-400" />
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">
            چوونەدەرەوە لە لاونچەری تەلەفزیۆن
          </h3>
          <p className="text-xs text-white/60 mt-1">
            تکایە کۆدی 4-ژمارەیی بنووسە بۆ گەڕانەوە بۆ شاشەی ئاسایی تەلەفزیۆن
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-3 my-2">
          {[0, 1, 2, 3].map(idx => {
            const hasDigit = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  hasDigit
                    ? 'bg-amber-400 scale-125 shadow-[0_0_12px_rgba(251,191,36,0.8)]'
                    : 'bg-white/20 border border-white/20'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Number Pad for Remote D-Pad Navigation */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              type="button"
              tabIndex={0}
              onClick={() => handleKeyPress(num)}
              className="py-3 rounded-xl bg-white/[0.08] hover:bg-white/20 focus:bg-amber-400 focus:text-black border border-white/10 hover:border-white/30 text-white font-mono font-bold text-lg transition-all active:scale-95 outline-none shadow-sm"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            tabIndex={0}
            onClick={handleBackspace}
            className="py-3 rounded-xl bg-white/[0.04] hover:bg-white/15 focus:bg-white/25 border border-white/10 text-white/70 text-xs font-medium transition-all active:scale-95 outline-none"
          >
            سڕینەوە
          </button>
          <button
            type="button"
            tabIndex={0}
            onClick={() => handleKeyPress('0')}
            className="py-3 rounded-xl bg-white/[0.08] hover:bg-white/20 focus:bg-amber-400 focus:text-black border border-white/10 hover:border-white/30 text-white font-mono font-bold text-lg transition-all active:scale-95 outline-none shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            tabIndex={0}
            onClick={onClose}
            className="py-3 rounded-xl bg-white/[0.04] hover:bg-white/15 focus:bg-white/25 border border-white/10 text-white/70 text-xs font-medium transition-all active:scale-95 outline-none"
          >
            داخستن
          </button>
        </div>

        {/* Safety Note */}
        <p className="text-[10px] text-white/40">
          * هیچ داتایەک ناسڕدرێتەوە؛ تەلەفزیۆنەکەت 100% پارێزراوە
        </p>
      </div>
    </div>
  );
}
