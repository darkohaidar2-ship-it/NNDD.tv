import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Tv, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  RotateCw, 
  Play, 
  Sparkles,
  Info
} from 'lucide-react';
import { getChannelFullSchedule, formatEpgTime, refreshEpg, isEpgLoaded } from '../../data/epgService.js';
import CachedChannelLogo from '../CachedChannelLogo';
import { getLocalizedChannelName } from '../../data/translations';

const DAY_LABELS_KU = ['ئەمڕۆ', 'سبەی', 'دووسبەی', '٤ ڕۆژ تر', '٥ ڕۆژ تر', '٦ ڕۆژ تر', '٧ ڕۆژ تر'];
const DAY_LABELS_AR = ['اليوم', 'غداً', 'بعد غد', 'بعد ٤ أيام', 'بعد ٥ أيام', 'بعد ٦ أيام', 'بعد ٧ أيام'];
const DAY_LABELS_EN = ['Today', 'Tomorrow', 'Day +2', 'Day +3', 'Day +4', 'Day +5', 'Day +6'];

export default function EpgScheduleModal({
  show,
  onClose,
  channel,
  language = 'ku',
  isRtl = true,
  onSelectChannel = null
}) {
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [currentTimeMs, setCurrentTimeMs] = useState(Date.now());

  // Update current time every 30s
  useEffect(() => {
    const id = setInterval(() => setCurrentTimeMs(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  // Load schedule for channel and selected day
  useEffect(() => {
    if (!show || !channel) return;
    const progs = getChannelFullSchedule(channel, selectedDayOffset);
    setSchedule(progs);
  }, [show, channel?.id, selectedDayOffset]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshEpg();
      if (channel) {
        setSchedule(getChannelFullSchedule(channel, selectedDayOffset));
      }
    } catch (e) {
      console.warn('[EpgScheduleModal] Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!show || !channel) return null;

  const dayLabels = language === 'ar' ? DAY_LABELS_AR : language === 'en' ? DAY_LABELS_EN : DAY_LABELS_KU;
  const channelDisplayName = getLocalizedChannelName(channel, language);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-2xl animate-fade-in select-none"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] rounded-3xl bg-slate-950/95 border border-white/20 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Channel Logo */}
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 p-1 flex items-center justify-center shrink-0">
              <CachedChannelLogo channel={channel} className="w-full h-full object-cover rounded-lg" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">
                  {channelDisplayName}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  EPG 7-Day
                </span>
              </div>
              <p className="text-[11px] text-white/50 truncate">
                {channel.category || 'کەناڵی گشتی'} • خشتەی هەفتانەی پرۆگرامەکان
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white active:scale-95 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
              title="نوێکردنەوەی EPG"
            >
              <RotateCw className="w-4 h-4 text-cyan-300" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white active:scale-95 transition-all"
              title="داخستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Day Selector Bar */}
        <div className="px-4 py-2.5 border-b border-white/10 bg-black/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {dayLabels.map((lbl, idx) => {
            const isSelected = selectedDayOffset === idx;
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + idx);
            const dateStr = `${targetDate.getDate()}/${targetDate.getMonth() + 1}`;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDayOffset(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_15px_rgba(56,189,248,0.4)] border border-cyan-400'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
                }`}
              >
                <span>{lbl}</span>
                <span className="text-[10px] font-mono opacity-60">({dateStr})</span>
              </button>
            );
          })}
        </div>

        {/* Schedule List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {schedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-white/50 space-y-3">
              <Calendar className="w-12 h-12 text-white/20" />
              <p className="text-sm font-medium">
                {isEpgLoaded() 
                  ? 'خشتەی پرۆگرامەکان بۆ ئەم بەروارە لە سێرفەر تۆمار نەکراوە'
                  : 'داتای EPG هێشتا بارنەکراوە یان سێرفەر XMLTV پشتگیری ناکات'}
              </p>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-bold hover:bg-cyan-500/30 transition-all cursor-pointer"
              >
                دووبارە داواکردنەوەی EPG
              </button>
            </div>
          ) : (
            schedule.map((prog, pIdx) => {
              const isPast = prog.stop <= currentTimeMs;
              const isNow = prog.start <= currentTimeMs && currentTimeMs < prog.stop;
              const isUpcoming = prog.start > currentTimeMs;
              const progress = isNow
                ? Math.min(100, Math.max(0, ((currentTimeMs - prog.start) / (prog.stop - prog.start)) * 100))
                : 0;

              return (
                <div
                  key={`${prog.start}_${pIdx}`}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isNow
                      ? 'bg-cyan-950/40 border-cyan-400/60 shadow-[0_0_20px_rgba(56,189,248,0.2)] ring-1 ring-cyan-400/50'
                      : isPast
                      ? 'bg-white/[0.02] border-white/5 opacity-60'
                      : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Badge & Time */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          {formatEpgTime(prog.start)} – {formatEpgTime(prog.stop)}
                        </span>
                        {isNow && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/40 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            ئێستا پەخش دەکرێت
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[10px] text-white/40 font-mono">
                            تەواوبوو
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="text-[10px] text-white/60 font-mono">
                            داهاتوو
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-semibold text-white leading-snug">
                        {prog.title}
                      </h4>

                      {/* Description / Synopsis */}
                      {prog.desc && (
                        <p className="text-xs text-white/60 mt-1 line-clamp-2 leading-relaxed">
                          {prog.desc}
                        </p>
                      )}

                      {/* Progress Bar for Current Show */}
                      {isNow && (
                        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mt-2">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-1000"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-white/60">
          <span>{schedule.length} پرۆگرام لەم ڕۆژەدا دۆزرایەوە</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all cursor-pointer"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
}
