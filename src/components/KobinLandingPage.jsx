import React from 'react';
import { 
  Zap, 
  Film, 
  Cpu, 
  Download, 
  Tv, 
  Smartphone, 
  ShieldCheck, 
  ArrowLeft, 
  Check, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

/**
 * KobinLandingPage - Standalone Marketing & APK Download Portal for "KOBIN TV"
 * 
 * Single-page marketing and product portal (NO streaming video player, NO channels, NO connection to LionOTT).
 * Exclusively for brand promotion and Android APK downloads.
 * 
 * Specifications:
 * 1. Cinematic Brand Intro (Hero Section):
 *    - Dark, luxurious cinematic backdrop with animating aqua, cyan, and deep blue glow effects.
 *    - 3D KOBIN.tv brand logo + visual "ALL VIEWS • کۆ بین".
 *    - Headline: "کۆبین تیڤی - کۆکراوەی هەموو بینینەکان لە یەک ئەپدا".
 *    - Immersive Smart TV and Mobile App mockup displays showcasing the sleek TV UI.
 * 2. Specification & Features List (Glassmorphic cards with pure-white minimalist icons):
 *    - "خێرایی بروسکە" (Zero-delay zapping and TV remote D-Pad optimization)
 *    - "سینەمای نوێ" (Latest 4K Movies and Series with native audio and subtitles)
 *    - "سیستەمی MAC" (Instant activation and automated login for TV box devices)
 * 3. APK Download CTA (Primary Purpose):
 *    - Large, glowing button: "📥 داگرتنی ڕاستەوخۆی ئەپی ئەندرۆید (APK)" linking to /downloads/kobin_tv.apk and /kobin-tv.apk
 *    - 3-step visible visual guide for installing the APK on Smart TVs and mobile devices.
 * 4. Admin Panel Access:
 *    - Discreet and secure "چوونەژوورەوەی بەڕێوەبەر" link at the bottom redirecting to minimalist backend panel.
 */
export default function KobinLandingPage({ onSwitchToAdmin, onLaunchApp }) {
  const apkDownloadPath = '/downloads/kobin_tv.apk';
  const fallbackApkPath = '/kobin-tv.apk';

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950 overflow-x-hidden relative" dir="rtl">
      
      {/* Animating Aqua, Cyan & Deep Blue Ambient Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute -top-32 start-1/4 w-[550px] h-[550px] bg-cyan-500/15 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/3 -end-32 w-[650px] h-[650px] bg-blue-600/15 rounded-full blur-[170px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-40 start-1/3 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617]/90 to-[#020617]" />
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-slate-950/70 border-b border-white/10 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-2xl blur-md opacity-50" />
              <img 
                src="/kobin-logo.png" 
                alt="KOBIN .tv Logo" 
                className="relative h-11 sm:h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(6,182,212,0.7)]" 
              />
            </div>
            <div>
              <span className="font-mono font-black text-lg sm:text-xl text-white tracking-wider block">
                KOBIN<span className="text-cyan-400 font-bold">.tv</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold tracking-widest block uppercase">
                ALL VIEWS • کۆ بین
              </span>
            </div>
          </div>

          {/* Quick APK CTA in Header */}
          <div className="flex items-center gap-3">
            {onLaunchApp && (
              <button
                type="button"
                onClick={onLaunchApp}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>کردنەوەی ئەپ (App)</span>
              </button>
            )}

            <a
              href={apkDownloadPath}
              download="kobin_tv.apk"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300/50 flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>داگرتنی APK</span>
              <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-mono">8.5MB</span>
            </a>
          </div>
        </div>
      </header>

      {/* =========================================================================
          1. CINEMATIC BRAND INTRO (HERO SECTION)
         ========================================================================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-16 text-center flex flex-col items-center">
        
        {/* Visual Brand Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-bold mb-6 backdrop-blur-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] font-mono animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>KOBIN.tv • ALL VIEWS • کۆ بین</span>
        </div>

        {/* 3D Brand Logo Highlight */}
        <div className="relative my-2 group">
          <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/40 via-sky-500/30 to-blue-600/40 rounded-full blur-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <img 
            src="/kobin-logo.png" 
            alt="KOBIN TV 3D Crest" 
            className="relative h-24 sm:h-32 w-auto object-contain mx-auto filter drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]"
          />
        </div>

        {/* Official Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mt-6 leading-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] max-w-3xl">
          کۆبین تیڤی - کۆکراوەی هەموو بینینەکان لە یەک ئەپدا
        </h1>

        {/* Concise Luxury Tagline */}
        <p className="mt-4 text-sm sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed drop-shadow-md">
          پلاتفۆرمی یەکگرتووی پەخشی هەموو کەناڵە ناوخۆیی و جیهانییەکان، سینەمای 4K و زنجیرەکان بۆ هەموو جۆرە شاشەیەکی زیرەک (Smart TV) و مۆبایلی ئەندرۆید.
        </p>

        {/* Primary Download Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full max-w-md">
          <a
            href={apkDownloadPath}
            download="kobin_tv.apk"
            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_40px_rgba(6,182,212,0.6)] border border-cyan-200/60 flex items-center justify-center gap-3 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Download className="w-5 h-5 text-slate-950" />
            <span>📥 داگرتنی ڕاستەوخۆی ئەپی ئەندرۆید (APK)</span>
          </a>
        </div>

        {/* Immersive Smart TV and Mobile App Mockup Display */}
        <div className="mt-14 w-full relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/30 via-sky-600/20 to-blue-700/30 rounded-3xl blur-2xl opacity-75 pointer-events-none" />

          <div className="relative rounded-3xl bg-slate-950/90 border border-white/20 p-3 sm:p-5 shadow-[0_30px_90px_rgba(0,0,0,0.95)] backdrop-blur-3xl overflow-hidden">
            {/* TV Mockup Frame */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-white font-bold ms-2">KOBIN TV • SMART TV & ANDROID UI</span>
              </div>
              <span className="text-cyan-300 font-bold font-mono">4K ULTRA HD</span>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center">
              <img
                src="/kobin-logo-raw.png"
                alt="KOBIN TV UI Preview"
                className="w-full h-full object-cover filter brightness-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-start" dir="rtl">
                <span className="px-3 py-1 rounded-md bg-cyan-500 text-slate-950 font-black text-xs self-start uppercase font-mono">
                  ALL VIEWS • کۆ بین
                </span>
                <h3 className="text-xl sm:text-3xl font-black text-white mt-2">
                  خێراترین ئەپی پەخشی کەناڵەکان بە سیستەمی بێ شاشەی ڕەش
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                  تایبەت بە شاشەی تەلەفزیۆنی زیرەک بە تەواوی دوگمەکانی ڕیمۆت کۆنترۆڵ و خێرایی 0.1 چرکەیی.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. SPECIFICATION & FEATURES LIST (Pure-White Minimalist Icons)
         ========================================================================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-16 border-t border-white/10">
        
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            تایبەتمەندییە سەرەکییەکانی KOBIN TV
          </h2>
        </div>

        {/* 3 Glassmorphic Feature Cards with Pure-White Minimalist Icons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: خێرایی بروسکە */}
          <div className="relative rounded-3xl bg-slate-900/60 border border-white/15 p-7 shadow-xl backdrop-blur-2xl hover:border-cyan-400/40 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black text-white">
              خێرایی بروسکە
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              زواپینگی دەستبەجێ بەبێ چرکەیەک ڕەشبوونی شاشە (Zero-Delay Zapping)، بە دوو پلەیەر لە باکگراوند و ئۆپتیمایزی تەواو بۆ دوگمەکانی ڕیمۆتی TV و D-Pad.
            </p>
          </div>

          {/* Card 2: سینەمای نوێ */}
          <div className="relative rounded-3xl bg-slate-900/60 border border-white/15 p-7 shadow-xl backdrop-blur-2xl hover:border-cyan-400/40 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
              <Film className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black text-white">
              سینەمای نوێ
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              نوێترین فلیم و زنجیرەکانی بۆکس ئۆفیس بە کوالێتی 4K Ultra HD، دەنگی سینەمایی فرە-کەناڵ، و ژێرنووس و دۆبلاژی کوردی بەردەوام نوێدەکرێنەوە.
            </p>
          </div>

          {/* Card 3: سیستەمی MAC */}
          <div className="relative rounded-3xl bg-slate-900/60 border border-white/15 p-7 shadow-xl backdrop-blur-2xl hover:border-cyan-400/40 transition-all duration-300 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-black text-white">
              سیستەمی MAC
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              ناسینەوەی خودکاری کۆدی ماک (00:1A:79...) بۆ شاشەی زیرەک و تەلەفزیۆن بۆ چوونەژوورەوەی ئۆتۆماتیکی و خێرا بەبێ پێویستی بە نووسینی ناوی بەکارهێنەر.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. APK DOWNLOAD CTA (THE PRIMARY PURPOSE) & 3-STEP GUIDE
         ========================================================================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-16 border-t border-white/10">
        
        {/* Main Glowing Download Card */}
        <div className="rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900/95 to-blue-950/80 border-2 border-cyan-400/50 p-8 sm:p-12 shadow-[0_0_60px_rgba(6,182,212,0.35)] text-center space-y-6 backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute -top-20 -start-20 w-44 h-44 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -end-20 w-44 h-44 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center text-white mx-auto shadow-lg">
            <Download className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            داگرتنی ڕاستەوخۆی KOBIN TV بۆ شاشەی زیرەک و ئەندرۆید
          </h2>

          <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            وەشانی فەرمی APK بە قەبارەی سووکی ٨.٥ مێگابایت بەبێ ڕیکلام و بەرزترین سەقامگیری لە پەخشکردندا.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
            <a
              href={apkDownloadPath}
              download="kobin_tv.apk"
              className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_35px_rgba(6,182,212,0.6)] border border-cyan-200/60 flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-5 h-5 text-slate-950" />
              <span>📥 داگرتنی ڕاستەوخۆی ئەپی ئەندرۆید (APK)</span>
            </a>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            فایل: <span className="text-cyan-300 font-bold">kobin_tv.apk</span> • قەبارە: <span className="text-cyan-300 font-bold">8.5 MB</span> • وەشانی: <span className="text-cyan-300 font-bold">2026 Official</span>
          </div>
        </div>

        {/* 3-Step Visible Visual Guide */}
        <div className="mt-12">
          <h3 className="text-lg sm:text-xl font-bold text-white text-center mb-6">
            ڕێبەری ٣ هەنگاوی بۆ دامەزراندن لەسەر Smart TV و مۆبایل
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 text-white font-mono font-bold flex items-center justify-center text-sm">
                ١
              </div>
              <h4 className="text-sm font-bold text-white">داگرتنی فایلەکە</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                کلیک لەسەر دوگمەی داگرتن بکە و فایلی kobin_tv.apk دابگرە لەسەر شاشەکەت یان مۆبایلەکەت.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 text-white font-mono font-bold flex items-center justify-center text-sm">
                ٢
              </div>
              <h4 className="text-sm font-bold text-white">دامەزراندن (Install)</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                فایلە داگیراوەکە بکەرەوە و کلیک لەسەر Install بکە بۆ دامەزراندنی ئەپەکە لەسەر شاشە.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-5 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-white/10 text-white font-mono font-bold flex items-center justify-center text-sm">
                ٣
              </div>
              <h4 className="text-sm font-bold text-white">کاراکردن و سەیرکردن</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                ئەپەکە بکەرەوە و کۆدی ماک (MAC) بنێرە بۆ چالاککردن و ڕاستەوخۆ دەست بە سەیرکردن بکە.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. ADMIN PANEL ACCESS & MINIMALIST FOOTER
         ========================================================================= */}
      <footer className="relative z-10 w-full border-t border-white/10 py-10 px-4 sm:px-8 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-start" dir="rtl">
          
          <div className="flex items-center gap-3">
            <img 
              src="/kobin-logo.png" 
              alt="KOBIN TV" 
              className="h-8 w-auto object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" 
            />
            <span className="font-mono text-slate-300 text-xs">
              KOBIN.tv • ALL VIEWS • مافی بڵاوکردنەوە پارێزراوە © 2026
            </span>
          </div>

          {/* Discreet and Secure Admin Entrance Link */}
          <div>
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer text-[11px] flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>چوونەژوورەوەی بەڕێوەبەر</span>
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
