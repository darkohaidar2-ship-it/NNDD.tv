/**
 * KOBIN TV - Central UI & Dashboard Theme Customizer Engine
 * Provides two-way real-time sync between:
 * - Dashboard Top Edit Modal
 * - Admin Panel (Dabin Studio)
 * - Settings Tab
 * - Android APK / Web App runtime
 */

import { postKobinSyncMessage, subscribeToKobinBroadcastChannel } from '../data/dabinBroadcastManager';

export const FONT_OPTIONS = [
  { id: 'ibm-plex', label: 'ئای بی ئێم (IBM Plex)', family: "'IBM Plex Sans Arabic', sans-serif", previewText: 'کۆبین تیڤی شیک' },
  { id: 'vazirmatn', label: 'وەزیر مەتن (Vazirmatn)', family: "'Vazirmatn', sans-serif", previewText: 'کۆبین تیڤی مۆدێرن' },
  { id: 'cairo', label: 'کایرۆ ئەپڵ (Cairo)', family: "'Cairo', sans-serif", previewText: 'کۆبین تیڤی فەرمی' },
  { id: 'noto-sans', label: 'نۆتۆ سانز (Noto Sans)', family: "'Noto Sans Arabic', sans-serif", previewText: 'کۆبین تیڤی ڕوون' },
  { id: 'readex-pro', label: 'ڕیدێکس پرۆ (Readex)', family: "'Readex Pro', sans-serif", previewText: 'کۆبین تیڤی تەکنۆ' },
  { id: 'system', label: 'سیستەم (System Clean)', family: 'system-ui, -apple-system, sans-serif', previewText: 'کۆبین تیڤی ستاندارد' }
];

export const DOCK_STYLE_OPTIONS = [
  { id: 'glass-blur', label: 'شووشەی ئەپڵ تیڤی (Apple Glass)', desc: 'شووشەی بێگەردی سپی بە ڕوونی 4K' },
  { id: 'neon-cyan', label: 'کۆبین نێۆن (Cyan & Amber Glow)', desc: 'درەوشاوەی تیشکی براندی کۆبین' },
  { id: 'minimal-slate', label: 'سادەی مۆدێرن (Matte Slate)', desc: 'دیزاینی ئارام و تاریکی شیک' },
  { id: 'deep-black', label: 'ڕەشی قووڵ (OLED Pure Black)', desc: 'ڕەشی تەواو بۆ شاشەی OLED' }
];

export const DRAWER_STYLE_OPTIONS = [
  { id: 'glass-frosted', label: 'شووشەی بەستوو (Frosted Glass)', desc: 'بەستووی تاریک و شەفاف' },
  { id: 'glass-crystal', label: 'کریستاڵی تەنک (Ultra Crystal)', desc: 'شووشەی کریستاڵی زۆر شەفاف' },
  { id: 'glass-smoked', label: 'دووکەڵی سینەمایی (Smoked Glass)', desc: 'شەفافیەتی کەم و تاریک' },
  { id: 'pure-black', label: 'ڕەشی تەواو (Pure OLED Black)', desc: 'تاریکی تەواو بەبێ شووشە' }
];

export const CLOCK_TIMEOUT_OPTIONS = [
  { value: 15000, label: '١٥ چرکە (خێرا)' },
  { value: 30000, label: '٣٠ چرکە (ستاندارد)' },
  { value: 60000, label: '١ خولەک' },
  { value: 120000, label: '٢ خولەک' },
  { value: 0, label: 'هەمیشە بەخەبەر (بێ خەوتن)' }
];

export const DEFAULT_THEME_CONFIG = {
  dockScale: 1.0,
  dockStyle: 'glass-blur',
  clockNormalScale: 1.0,
  clockSleepScale: 1.0,
  clockIdleTimeout: 30000,
  drawerScale: 'standard',
  drawerStyle: 'glass-frosted',
  appFont: 'ibm-plex'
};

const THEME_STORAGE_KEY = 'kobin_customizer_theme';

export function getSavedThemeConfig() {
  if (typeof window === 'undefined') return DEFAULT_THEME_CONFIG;
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    const legacyDockScale = localStorage.getItem('nndd_dock_scale');
    const legacyDrawerScale = localStorage.getItem('nndd_drawer_scale');

    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...DEFAULT_THEME_CONFIG,
      ...parsed,
      dockScale: parsed.dockScale ?? (legacyDockScale ? parseFloat(legacyDockScale) : 1.0),
      drawerScale: parsed.drawerScale ?? (legacyDrawerScale || 'standard')
    };
  } catch (e) {
    return DEFAULT_THEME_CONFIG;
  }
}

export function applyAppFont(fontId) {
  if (typeof document === 'undefined') return;
  const match = FONT_OPTIONS.find(f => f.id === fontId) || FONT_OPTIONS[0];
  document.documentElement.style.setProperty('--app-font', match.family);
}

export function saveThemeConfig(newConfig, broadcast = true) {
  if (typeof window === 'undefined') return;
  try {
    const current = getSavedThemeConfig();
    const merged = { ...current, ...newConfig };
    
    // Save to master key
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(merged));
    
    // Backward compatibility for existing listeners
    if (merged.dockScale !== undefined) {
      localStorage.setItem('nndd_dock_scale', merged.dockScale.toString());
    }
    if (merged.drawerScale !== undefined) {
      localStorage.setItem('nndd_drawer_scale', merged.drawerScale);
    }
    if (merged.appFont) {
      applyAppFont(merged.appFont);
    }

    // Local in-window dispatch for immediate reaction
    window.dispatchEvent(new CustomEvent('kobin-theme-changed', { detail: merged }));

    // Real-time broadcast to all windows / tabs / connected devices
    if (broadcast) {
      postKobinSyncMessage('UPDATE_CUSTOMIZER_THEME', merged);
    }
  } catch (e) {
    console.error('[kobinThemeService] save error:', e);
  }
}

export function subscribeToThemeChanges(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e) => {
    if (e?.detail) callback(e.detail);
  };

  const handleStorageEvent = (e) => {
    if (e.key === THEME_STORAGE_KEY || e.key === 'nndd_dock_scale' || e.key === 'nndd_drawer_scale') {
      callback(getSavedThemeConfig());
    }
  };

  window.addEventListener('kobin-theme-changed', handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  const unsubBroadcast = subscribeToKobinBroadcastChannel((msg) => {
    if (msg?.type === 'UPDATE_CUSTOMIZER_THEME' && msg?.payload) {
      saveThemeConfig(msg.payload, false);
      callback(msg.payload);
    }
  });

  return () => {
    window.removeEventListener('kobin-theme-changed', handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
    unsubBroadcast?.();
  };
}
