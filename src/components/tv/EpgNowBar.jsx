/**
 * EpgNowBar — Full-width "Now on Air" bar shown in Live TV view (bottom of player).
 * Shows channel name, current program, progress, next program.
 */
import React, { useEffect, useState } from 'react';
import { getChannelEpg, formatEpgTime, isEpgLoaded } from '../../data/epgService.js';
import { Tv2, ChevronRight } from 'lucide-react';

const TICK_MS = 15_000;

export default function EpgNowBar({ channel, className = '' }) {
  const [epg, setEpg] = useState(() => getChannelEpg(channel));

  useEffect(() => {
    if (!channel) return;
    const refresh = () => setEpg(getChannelEpg(channel));
    refresh();
    const id = setInterval(refresh, TICK_MS);
    return () => clearInterval(id);
  }, [channel?.id]);

  if (!isEpgLoaded() || !epg.current) return null;

  const { current, next, progress } = epg;
  const durationMin = current
    ? Math.round((current.stop - current.start) / 60000)
    : 0;
  const elapsedMin = current
    ? Math.round((Date.now() - current.start) / 60000)
    : 0;

  return (
    <div className={`w-full px-4 py-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent backdrop-blur-sm ${className}`}>
      <div className="flex items-end gap-3 max-w-3xl">
        {/* Icon */}
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 mb-0.5">
          <Tv2 className="w-3.5 h-3.5 text-cyan-400" />
        </div>

        {/* Program info */}
        <div className="flex-1 min-w-0">
          {/* Current program */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-white truncate leading-tight">
              {current.title}
            </span>
            <span className="text-[10px] text-white/50 font-mono shrink-0">
              {formatEpgTime(current.start)} – {formatEpgTime(current.stop)}
            </span>
            <span className="text-[10px] text-white/40 shrink-0">
              {elapsedMin}/{durationMin}م
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_6px_rgba(56,189,248,0.6)] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Next program */}
          {next && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-white/45">
              <ChevronRight className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {formatEpgTime(next.start)} — {next.title}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
