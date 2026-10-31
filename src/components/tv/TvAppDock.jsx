import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Play, 
  ShoppingBag, 
  Globe, 
  Wifi, 
  Grid, 
  LogOut, 
  ShieldCheck, 
  Sparkles,
  X,
  ExternalLink
} from 'lucide-react';

/**
 * KOBIN.tv Integrated TV App Dock
 * Renders priority pinned shortcuts (YouTube TV, Play Store, Web Browser, Wi-Fi Settings)
 * and an "All TV Apps" drawer so users never feel trapped inside the TV launcher.
 * Formatted with 13% Translucent Cinema Glass & Apple TV D-Pad Focus styling.
 */
export default function TvAppDock({
  onTriggerExitChallenge,
  language = 'ku',
  isRtl = true,
  className = ''
}) {
  const [pinnedApps, setPinnedApps] = useState([]);
  const [allApps, setAllApps] = useState([]);
  const [showAllAppsModal, setShowAllAppsModal] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Load installed TV apps from Native Bridge
  useEffect(() => {
    try {
      if (window.KobinTvNative?.getTvAppDockData) {
        const raw = window.KobinTvNative.getTvAppDockData();
        if (raw) {
          const parsed = JSON.parse(raw);
          setPinnedApps(parsed.pinned || []);
          setAllApps(parsed.all || []);
        }
      }
    } catch (e) {
      console.warn('[TvAppDock] Failed to load native dock data:', e);
    }
  }, []);

  const handleLaunch = (pkg) => {
    if (window.KobinTvNative?.launchApp) {
      window.KobinTvNative.launchApp(pkg);
    } else {
      console.log('Launch app requested:', pkg);
    }
  };

  const handleWifi = () => {
    if (window.KobinTvNative?.launchWifiSettings) {
      window.KobinTvNative.launchWifiSettings();
    }
  };

  const defaultPinned = [
    {
      id: 'yt',
      title: 'YouTube',
      packageName: 'com.google.android.youtube.tv',
      icon: Play,
      color: 'from-red-600 to-red-800'
    },
    {
      id: 'playstore',
      title: 'Play Store',
      packageName: 'com.android.vending',
      icon: ShoppingBag,
      color: 'from-emerald-600 to-teal-800'
    },
    {
      id: 'browser',
      title: 'Browser',
      packageName: 'com.android.chrome',
      icon: Globe,
      color: 'from-blue-600 to-indigo-800'
    },
    {
      id: 'wifi',
      title: 'Wi-Fi',
      isWifi: true,
      icon: Wifi,
      color: 'from-amber-600 to-orange-800'
    }
  ];

  return (
    <>
      {/* 13% Cinema Glass Dock Bar */}
      <div className={`flex items-center gap-2.5 p-2 rounded-2xl bg-black/[0.13] backdrop-blur-2xl border border-white/15 shadow-[0_15px_35px_rgba(0,0,0,0.5)] ring-1 ring-white/10 ${className}`}>
        {/* Pinned App Icons */}
        {defaultPinned.map((app, idx) => {
          const IconComp = app.icon;
          const isFocused = focusedIndex === idx;

          return (
            <button
              key={app.id}
              type="button"
              tabIndex={0}
              onFocus={() => setFocusedIndex(idx)}
              onClick={() => {
                if (app.isWifi) {
                  handleWifi();
                } else {
                  handleLaunch(app.packageName);
                }
              }}
              className={`group relative px-3 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 cursor-pointer outline-none ${
                isFocused
                  ? 'bg-white/25 border border-white text-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                  : 'bg-white/[0.05] hover:bg-white/15 border border-white/10 text-white/90 hover:text-white'
              }`}
              title={app.title}
            >
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${app.color} flex items-center justify-center shadow-sm`}>
                <IconComp className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold tracking-wide hidden sm:inline">
                {app.title}
              </span>
            </button>
          );
        })}

        {/* All TV Apps Drawer Toggle */}
        <button
          type="button"
          tabIndex={0}
          onFocus={() => setFocusedIndex(4)}
          onClick={() => setShowAllAppsModal(true)}
          className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 cursor-pointer outline-none ${
            focusedIndex === 4
              ? 'bg-white/25 border border-white text-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
              : 'bg-white/[0.05] hover:bg-white/15 border border-white/10 text-white/90 hover:text-white'
          }`}
          title="هەموو ئەپەکان (All TV Apps)"
        >
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center shadow-sm">
            <Grid className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold tracking-wide hidden sm:inline">
            ئەپەکان
          </span>
        </button>

        <div className="h-6 w-px bg-white/15 mx-0.5" />

        {/* Exit Launcher Button */}
        <button
          type="button"
          tabIndex={0}
          onFocus={() => setFocusedIndex(5)}
          onClick={onTriggerExitChallenge}
          className={`px-2.5 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer outline-none ${
            focusedIndex === 5
              ? 'bg-red-500/30 border border-red-400 text-red-200 scale-105 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
              : 'bg-white/[0.05] hover:bg-red-500/20 border border-white/10 text-white/70 hover:text-red-200'
          }`}
          title="چوونەدەرەوە لە لاونچەر (Exit Launcher)"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium hidden md:inline">
            دەرچوون
          </span>
        </button>
      </div>

      {/* Modal: All Installed TV Apps Grid */}
      {showAllAppsModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowAllAppsModal(false)}
        >
          <div 
            className="w-full max-w-2xl max-h-[80vh] rounded-3xl bg-black/[0.85] backdrop-blur-2xl border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/15 p-6 flex flex-col overflow-hidden select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                  <Grid className="w-4 h-4 text-purple-300" />
                </div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  هەموو ئەپەکانی تەلەفزیۆن (All TV Apps)
                </h3>
              </div>
              <button
                type="button"
                tabIndex={0}
                onClick={() => setShowAllAppsModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Apps Grid */}
            <div className="flex-1 overflow-y-auto scrollbar-none grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
              {allApps.length === 0 ? (
                <div className="col-span-full py-12 text-center text-white/50 text-xs">
                  هیچ ئەپێکی دەرەکی نەدۆزرایەوە
                </div>
              ) : (
                allApps.map((app) => (
                  <button
                    key={app.id || app.packageName}
                    type="button"
                    tabIndex={0}
                    onClick={() => {
                      handleLaunch(app.packageName);
                      setShowAllAppsModal(false);
                    }}
                    className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/15 focus:bg-white/25 border border-white/10 hover:border-white/40 focus:border-white focus:scale-105 flex flex-col items-center gap-2 text-center transition-all cursor-pointer outline-none group"
                  >
                    {app.iconBase64 ? (
                      <img 
                        src={app.iconBase64} 
                        alt={app.title} 
                        className="w-12 h-12 rounded-xl object-contain shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                        <Tv className="w-6 h-6 text-white/70" />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-white/90 group-hover:text-white truncate w-full">
                      {app.title}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
