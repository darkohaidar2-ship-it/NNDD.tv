/**
 * EpgBar — Compact "Now Playing" bar for channel rows in the drawer.
 * Shows: current program title, progress bar, next program.
 */
import React, { useEffect, useState } from 'react';
import { getChannelEpg, formatEpgTime, isEpgLoaded } from '../../data/epgService.js';

const TICK_MS = 30_000; // refresh every 30 s

export default function EpgBar({ channel, className = '' }) {
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

  return (
    <div className={`w-full ${className}`}>
      {/* Program title + time */}
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="text-[9px] text-cyan-300/90 font-medium truncate leading-tight">
          {current.title}
        </span>
        <span className="text-[8px] text-white/50 font-mono shrink-0">
          {formatEpgTime(current.start)}–{formatEpgTime(current.stop)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-0.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Next program */}
      {next && (
        <div className="mt-0.5 text-[8px] text-white/40 truncate leading-tight">
          ▶ {formatEpgTime(next.start)} {next.title}
        </div>
      )}
    </div>
  );
}
