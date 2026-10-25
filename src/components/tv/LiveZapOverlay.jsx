import React from 'react';
import { Maximize2 } from 'lucide-react';
import CachedChannelLogo from '../CachedChannelLogo';
import { getLocalizedChannelName } from '../../data/translations';

export default function LiveZapOverlay({
  targetChannel,
  countdownRemaining,
  isCountdownActive,
  isFreezeFrameActive = false,
  switchRequestId,
  isRtl = true,
  language = 'ku',
  numericZapBuffer,
  gestureFeedback,
  aspectRatioToast,
  colorToast,
  serverFingerprint
}) {
  return (
    <>
      {/* Direct Numeric Remote Keypad OSD Indicator */}
      {numericZapBuffer && (
        <div className="fixed top-8 end-8 z-50 flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-slate-950/45 backdrop-blur-3xl border border-cyan-400/70 text-white shadow-[0_12px_35px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-cyan-400/30 animate-scale-up select-none pointer-events-none">
          <span className="text-xs text-white/80 font-normal uppercase tracking-wider">کەناڵی</span>
          <span className="font-mono text-2xl font-normal text-white">{numericZapBuffer}</span>
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
        </div>
      )}

      {/* Target / Upcoming Channel Change HUD with Glassmorphic Translucent Card */}
      {targetChannel && (
        <div 
          key="live_zap_target_hud"
          className={`fixed bottom-8 ${isRtl ? 'left-6 sm:left-8' : 'right-6 sm:right-8'} z-50 pointer-events-none select-none px-2 animate-fade-in`}
        >
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-3xl border border-white/25 shadow-[0_12px_40px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.25)] ring-1 ring-white/15">
            {/* Target Channel Number */}
            <span className="font-mono text-[10px] font-normal text-white bg-white/10 px-2 py-0.5 rounded-full border border-white/15 shrink-0">
              {targetChannel.number}
            </span>

            {/* White Circular Ring Encircling Channel Logo */}
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 -rotate-90 pointer-events-none" viewBox="0 0 28 28">
                {/* Background Track */}
                <circle
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="2"
                />
                {/* Active White Circular Ring: 5s animated countdown */}
                <circle
                  key={`zap_ring_${targetChannel.id}_${switchRequestId}`}
                  cx="14"
                  cy="14"
                  r="11"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className={isCountdownActive ? "animate-ring-countdown-5s" : ""}
                  style={!isCountdownActive ? { strokeDasharray: '69.1', strokeDashoffset: 0 } : undefined}
                />
              </svg>
              {/* Channel Logo Centered Directly INSIDE the White Ring */}
              <div className="absolute w-5 h-5 rounded-full overflow-hidden bg-white/10 flex items-center justify-center p-0.5 shadow-xs">
                <CachedChannelLogo channel={targetChannel} className="w-full h-full object-cover rounded-full" />
              </div>
            </div>

            {/* Target Channel Name */}
            <span className="text-xs font-normal text-white max-w-[150px] sm:max-w-[200px] truncate tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {getLocalizedChannelName(targetChannel, language)}
            </span>

            {/* 5-Second Zapping Countdown Badge */}
            {isCountdownActive && (
              <span className="font-mono text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse shrink-0">
                {countdownRemaining}s
              </span>
            )}

            {/* Seamless Single-Connection Freeze-Frame Buffering Indicator */}
            {!isCountdownActive && isFreezeFrameActive && (
              <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30 shrink-0 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>پەخش دەبێت...</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Double Tap Screen Fit/Zoom Feedback */}
      {gestureFeedback && gestureFeedback.direction === 'zoom' && (
        <div className="fixed bottom-20 inset-x-0 mx-auto w-fit z-50 pointer-events-none select-none animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-2xl">
            <Maximize2 className="w-4 h-4 text-white" />
            <span className="text-xs sm:text-sm font-normal text-white tracking-wide">
              {gestureFeedback.title}
            </span>
          </div>
        </div>
      )}

      {/* Aspect Ratio Mode HUD (Yellow Remote Key) */}
      {aspectRatioToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-scale-up select-none">
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-950/50 backdrop-blur-3xl border border-amber-400/60 shadow-[0_12px_35px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-amber-400/30 text-white font-sans">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-normal text-sm shadow-inner">
              🟡
            </div>
            <div className="text-start">
              <div className="text-[10px] text-amber-300 font-normal tracking-wider uppercase flex items-center gap-1.5">
                <span>شێوازی بینین (Aspect Ratio)</span>
                <span className="text-slate-400">• دوگمەی زەرد</span>
              </div>
              <div className="text-sm font-normal text-white tracking-wide">
                {aspectRatioToast.label}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unified Remote Color Toast Feedback */}
      {colorToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-scale-up select-none">
          <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-slate-950/50 backdrop-blur-3xl border text-white font-sans shadow-[0_12px_35px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.2)] ${
            colorToast.color === 'red' ? 'border-red-500/70 shadow-[0_0_25px_rgba(239,68,68,0.5)]' :
            colorToast.color === 'green' ? 'border-emerald-500/70 shadow-[0_0_25px_rgba(16,185,129,0.5)]' :
            colorToast.color === 'yellow' ? 'border-amber-400/70 shadow-[0_0_25px_rgba(245,158,11,0.5)]' :
            'border-blue-500/70 shadow-[0_0_25px_rgba(59,130,246,0.5)]'
          }`}>
            <span className="text-xs sm:text-sm font-normal tracking-wide">{colorToast.message}</span>
          </div>
        </div>
      )}

      {/* Discrete Server Watermark Badge */}
      {serverFingerprint && (
        <div 
          className="fixed bottom-3 end-3 z-40 pointer-events-none opacity-30 hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-mono select-none shadow-lg"
          title={`Server Code: ${serverFingerprint.code}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${serverFingerprint.dotColor} animate-pulse`} />
          <span className="text-slate-300 font-normal tracking-wider">{serverFingerprint.code}</span>
        </div>
      )}
    </>
  );
}
