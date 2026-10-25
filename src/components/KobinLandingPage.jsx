import React, { useState } from 'react';
import { 
  Tv, 
  Download, 
  ShieldCheck, 
  Film, 
  Zap, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  ArrowLeft, 
  MessageCircle, 
  Send, 
  Phone,
  Sliders,
  Lock,
  Sparkles
} from 'lucide-react';

/**
 * KobinLandingPage - Official Product Showcase & APK Download Website
 * 
 * Exclusively active on web deployment (Vercel):
 * - 100% focused on product showcase, features, packages, and APK installation.
 * - Live streaming is strictly designated for native mobile/TV APK apps.
 * - Includes secure Admin Portal entrance.
 */
export default function KobinLandingPage({ onSwitchToAdmin }) {
  const packages = [
    {
      name: 'پاکێجی ١ مانگ',
      price: '10,000 IQD',
      duration: '١ مانگ تەواو',
      tag: 'تێست و مانگانە',
      features: [
        '+10,000 کەناڵی جیهانی و کوردی',
        'کوالێتی Full HD و 4K',
        'بەشی فیلم و زنجیرە نوێیەکان',
        'پشتیوانی ٢٤ کاتژمێری'
      ],
      isPopular: false
    },
    {
      name: 'پاکێجی ٣ مانگ',
      price: '25,000 IQD',
      duration: '٣ مانگ بەردەوام',
      tag: 'داشکاندنی وەرز',
      features: [
        'تەواوی کەناڵە وەرزشی و خولەکان',
        'سیستەمی Zero-Black-Screen Zapping',
        'تەواوی فیلم و زنجیرەی VOD',
        'ڕێکخستنی خێرای MAC لەسەر TV'
      ],
      isPopular: false
    },
    {
      name: 'پاکێجی ٦ مانگ',
      price: '45,000 IQD',
      duration: '٦ مانگ تەواو',
      tag: 'نیوەی ساڵ',
      features: [
        'تەواوی کەناڵە VIP و دۆبلاژکراوەکان',
        'سێرڤەری تایبەت بە کەمترین لۆد',
        'مۆدی Data Saver بۆ 4G مۆبایل',
        'سێرڤەری یەدەگی کاتی یارییەکان'
      ],
      isPopular: false
    },
    {
      name: 'پاکێجی ١ ساڵە (VIP)',
      price: '75,000 IQD',
      duration: '١٢ مانگ + دیاری',
      tag: 'باشترین نرخ ⭐',
      features: [
        'تەواوی خولەکانی ئەوروپا بە 4K 60FPS',
        'تەواوی فیلم و زنجیرەکانی 2025 و 2026',
        'پشتگیری تەواوی Smart TV و Android Box',
        'پشتیوانی VIP و گرەنتی تا دوا ڕۆژ'
      ],
      isPopular: true
    }
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-cyan-400" />,
      title: 'Zero-Black-Screen Zapping',
      subtitle: 'گواستنەوەی بێ دەنگ و بێ ڕەشبوون',
      desc: 'تەکنەلۆژیای پێشکەوتووی دوو پلەیەر بە شێوەی هاوکات ڤیدیۆی دواتر لە باکگراونددا لۆد دەکات و لەگەڵ یەکەم فرەیم بەبێ شاشەی ڕەش پەخشەکەت پێشان دەدات.'
    },
    {
      icon: <Film className="w-6 h-6 text-amber-400" />,
      title: 'کتێبخانەی فیلم و زنجیرەی 4K',
      subtitle: 'نوێترین بەرهەمەکانی 2025 و 2026',
      desc: 'هەزاران فیلمی سینەمایی جیهانی و زنجیرە دراماکان بە کوالێتی بەرز، ژێرنووس و دۆبلاژی کوردی بەبێ پچڕان لە سەرچاوەی دەوڵەمەندی سێرڤەرەوە.'
    },
    {
      icon: <Tv className="w-6 h-6 text-sky-400" />,
      title: 'گونجاو بۆ Android TV و کۆنتڕۆڵ',
      subtitle: 'D-Pad Remote & Leanback',
      desc: 'دیزاین کراوە بۆ ئەوەی بە کۆنتڕۆڵی تەلەفزیۆن (سەرەوە، خوارەوە، ئۆکەی، دوگمە ڕەنگاوڕەنگەکان) زۆر بە نەرمی و خێرایی کەناڵەکان بگۆڕیت.'
    },
    {
      icon: <Sliders className="w-6 h-6 text-emerald-400" />,
      title: 'مۆدی Data Saver و ٣ تەختەکلیل',
      subtitle: 'کۆنترۆڵی بەکارهێنانی ئینتەرنێت',
      desc: 'کۆنتڕۆڵی کوالێتی پەخش بکە (480p, 720p, 4K) تا بە کەمترین ئینتەرنێت سەیری بکەیت، لەگەڵ تەختەکلیلی شاشەی کوردی، ئینگلیزی و عەرەبی.'
    }
  ];

  const scrollToPackages = () => {
    document.getElementById('packages-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden relative font-sans" dir="rtl">
      
      {/* Ambient Aurora Glow Lights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[15%] -right-[10%] w-[60vw] h-[60vw] max-w-[850px] max-h-[850px] rounded-full bg-gradient-to-br from-cyan-600/25 via-sky-800/15 to-transparent blur-[130px] animate-pulse" />
        <div className="absolute top-[40%] -left-[15%] w-[65vw] h-[65vw] max-w-[900px] max-h-[900px] rounded-full bg-gradient-to-tr from-blue-700/20 via-indigo-900/15 to-transparent blur-[140px]" />
        <div className="absolute -bottom-[20%] right-[20%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full bg-gradient-to-tl from-amber-600/15 via-orange-950/10 to-transparent blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,transparent_10%,rgba(3,7,18,0.85)_80%)]" />
      </div>

      {/* Header / Navbar */}
      <header className="relative z-30 w-full px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between border-b border-white/10 backdrop-blur-2xl bg-slate-950/40">
        <div className="flex items-center gap-3">
          <img
            src="/kobin-logo.png"
            alt="KOBIN TV"
            className="h-10 sm:h-12 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]"
          />
          <div>
            <span className="text-base sm:text-lg font-black tracking-wider text-white font-mono block">
              KOBIN TV
            </span>
            <span className="text-[10px] font-mono text-cyan-300 font-bold tracking-widest uppercase">
              PREMIUM IPTV SOLUTIONS
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="px-3.5 sm:px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/15 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            title="چوونەژوورەوەی بەڕێوەبەر"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">ئەدمین پانێڵ</span>
          </button>

          <a
            href="/kobin-tv.apk"
            download="kobin-tv.apk"
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] border border-cyan-300/40 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>داگرتنی ئەپ (APK)</span>
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-16 text-center flex flex-col items-center">
        
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-6 backdrop-blur-xl animate-fade-in shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>وەشانی فەرمی 2026 - تایبەت بە Smart TV و مۆبایل</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight max-w-4xl leading-tight sm:leading-snug drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
          پلاتفۆرمی یەکگرتووی پەخشی کەناڵەکان و سینەما
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-sm sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed drop-shadow-md">
          ئەزموونی خێراترین پەخشی Ultra HD 4K بکە. ئەپی KOBIN TV بە تایبەت بۆ Smart TV، تەلەفزیۆنی ئەندرۆید، و مۆبایل بە زواپینگی خێرای سفڕ چرکە و سیستەمی زیرەکی کۆنتڕۆڵ دروستکراوە.
        </p>

        {/* Primary Download CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md">
          <a
            href="/kobin-tv.apk"
            download="kobin-tv.apk"
            className="w-full sm:flex-1 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_35px_rgba(6,182,212,0.5)] border border-cyan-300/50 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Download className="w-5 h-5 text-slate-950" />
            <span>داگرتنی ئەپی ئەندرۆید (APK)</span>
          </a>

          <button
            type="button"
            onClick={scrollToPackages}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-cyan-400/50 text-white font-bold text-sm backdrop-blur-xl flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-95 cursor-pointer shadow-lg"
          >
            <span>پاکێجەکان</span>
            <ArrowLeft className="w-4 h-4 text-cyan-300" />
          </button>
        </div>

        {/* 3D Smart TV App Mockup Frame */}
        <div className="mt-14 w-full max-w-5xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 via-sky-600/30 to-blue-700/40 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative rounded-3xl bg-slate-950/90 border border-white/20 p-3 sm:p-4 shadow-[0_25px_80px_rgba(0,0,0,0.9)] backdrop-blur-3xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-white font-bold ms-2">KOBIN TV CINEMA DASHBOARD</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-300 font-bold">SMART TV COMPATIBLE</span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center">
              <img
                src="/dabin-logo.png"
                alt="KOBIN TV Interface"
                className="w-full h-full object-cover filter brightness-90 transform-gpu group-hover:scale-102 transition-transform duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-8 text-start" dir="rtl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-red-600/80 text-white font-black text-[10px] tracking-wider uppercase animate-pulse">
                    LIVE 4K
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    KOBIN TV OFFICIAL BROADCAST
                  </span>
                </div>

                <h3 className="text-lg sm:text-2xl font-black text-white drop-shadow-lg">
                  پەخشی کەناڵە ناوخۆیی و جیهانییەکان بە بەرزترین کوالێتی
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                  ئەزموونی خێراترین پەخش بە سیستەمی Apple TV Dark Cinema، زواپینگی دەستبەجێ و کۆنترۆڵی زیرەکی تەلەفزیۆن.
                </p>

                <div className="mt-4 flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>0.1s Zapping Speed</span>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Tv className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+10,000 Live Channels</span>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Film className="w-3.5 h-3.5 text-purple-400" />
                    <span>VOD Cinema 4K</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold text-cyan-400 tracking-widest uppercase block mb-2">
            WHY KOBIN TV?
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            تایبەتمەندییە ناوازە و پێشکەوتووەکانی ئەپەکە
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-slate-900/50 hover:bg-slate-900/75 border border-white/10 hover:border-cyan-500/40 backdrop-blur-2xl transition-all duration-300 shadow-xl group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 group-hover:border-cyan-400/50 transition-all duration-300 shrink-0">
                  {feat.icon}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                    {feat.title}
                  </h3>
                  <span className="text-xs text-cyan-400 font-medium block mt-0.5 font-mono">
                    {feat.subtitle}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Packages & Pricing */}
      <section id="packages-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase block mb-2">
            PACKAGES & PRICING
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            پاکێجەکانی بەشداریکردن و نرخەکان
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg mx-auto">
            نرخی گونجاو و پشتگیری تەواو بۆ کاراکردنی کۆدی MAC لەسەر تەلەفزیۆنەکەت
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {packages.map((pkg, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-6 backdrop-blur-2xl border transition-all duration-300 flex flex-col justify-between relative ${
                pkg.isPopular
                  ? 'bg-gradient-to-b from-amber-500/20 via-slate-900/90 to-slate-950 border-amber-400/80 shadow-[0_0_35px_rgba(251,146,60,0.3)] ring-1 ring-amber-400/50 scale-[1.02]'
                  : 'bg-slate-900/60 hover:bg-slate-900/80 border-white/10 hover:border-cyan-400/40 shadow-xl'
              }`}
            >
              {pkg.isPopular && (
                <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md">
                  داواکراوترین ⭐
                </span>
              )}

              <div>
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide block mb-1">
                  {pkg.tag}
                </span>
                <h3 className="text-lg font-black text-white">{pkg.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-cyan-300 font-mono tracking-tight">
                    {pkg.price}
                  </span>
                </div>
                <span className="text-xs text-slate-400 block mt-0.5">{pkg.duration}</span>

                <div className="mt-5 space-y-2.5 pt-4 border-t border-white/10">
                  {pkg.features.map((item, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="https://wa.me/9647500004444?text=%D8%B3%D9%84%D8%A7%D9%88%D8%8C%20%D8%AF%D9%87%D9%85%D9%87%D9%88%DB%8E%D8%AA%20%D8%A8%D9%87%D8%B4%D8%AF%D8%A7%D8%B1%DB%8C%20%D9%84%D9%87%20KOBIN%20TV%20%D8%A8%DA%A9%D9%87%D9%85"
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-6 w-full py-2.5 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  pkg.isPopular
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                }`}
              >
                <span>پەیوەندی بۆ بەشداریکردن</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Device Support & Direct APK Download Banner */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-12">
        <div className="rounded-3xl bg-gradient-to-br from-cyan-950/60 via-slate-900/90 to-blue-950/80 border border-cyan-400/40 p-6 sm:p-10 shadow-[0_20px_60px_rgba(6,182,212,0.25)] flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-2xl">
          <div className="space-y-2 text-center md:text-start">
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[11px] font-bold font-mono uppercase inline-block">
              DOWNLOAD & INSTALL APK
            </span>
            <h3 className="text-xl sm:text-3xl font-black text-white">
              ئەپەکە ڕاستەوخۆ لەسەر تەلەفزیۆنەکەت دابمەزرێنە
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              گونجاو بۆ تەلەفزیۆنی ئەندرۆید، Xiaomi Mi Box، مۆبایل، تابلێت و FireStick بە قەبارەی سووکی ٨.٥ مێگابایت.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            <a
              href="/kobin-tv.apk"
              download="kobin-tv.apk"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>داگرتنی فایلی APK</span>
            </a>
          </div>
        </div>
      </section>

      {/* Classic Minimalist Footer */}
      <footer className="relative z-10 w-full border-t border-white/10 py-10 px-4 sm:px-8 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start">
          
          <div className="flex items-center gap-3">
            <img
              src="/kobin-logo.png"
              alt="KOBIN TV"
              className="h-9 w-auto object-contain filter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
            />
            <div>
              <span className="text-sm font-black text-white tracking-wider font-mono">
                KOBIN TV
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                © 2026 KOBIN TV. هەموو مافەکان پارێزراون. پەخشی کەناڵەکان بە تایبەت لەسەر ئەپی ئەندرۆید کار دەکات.
              </p>
            </div>
          </div>

          {/* Social / Contact Links & Admin Portal */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <a
              href="https://wa.me/9647500004444"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold font-mono hover:bg-emerald-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>واتسئاپ: +964 750 0004444</span>
            </a>

            <a
              href="https://t.me/kobin_tv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold font-mono hover:bg-sky-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 text-sky-400" />
              <span>تێلیگرام: @kobin_tv</span>
            </a>

            {/* Classic Admin Portal Access */}
            <button
              type="button"
              onClick={onSwitchToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              title="چوونەژوورەوەی ئەدمین"
            >
              <Lock className="w-3 h-3 text-cyan-400" />
              <span>ئەدمین پانێڵ</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
