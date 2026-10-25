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
  Sparkles,
  Layers,
  Check,
  Star,
  Eye,
  Radio,
  Clock,
  Compass,
  Cpu,
  Globe,
  Wifi,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Play,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

/**
 * KobinLandingPage - Official Master Product Showcase & APK Distribution Website
 * 
 * Exclusively active on web deployment (Vercel / web browsers):
 * - Comprehensive Kurdish landing page completely explaining the KOBIN TV project from top to bottom.
 * - Deep dive into the 5 Core Pillars: Cinema Dashboard, Zero-Black-Screen Live TV, Series Hub, 4K Movies, & Smart Settings.
 * - Direct 1-click APK download (8.5 MB) for Smart TV & Android.
 * - Interactive screenshot gallery, device compatibility matrix, subscription packages, and Port 80 MAC engine guide.
 */
export default function KobinLandingPage({ onSwitchToAdmin }) {
  const [activeGalleryTab, setActiveGalleryTab] = useState('dashboard');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaqIndex(prev => prev === index ? null : index);
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // The 5 Core Pillars of the KOBIN TV Project
  const corePillars = [
    {
      id: 'dashboard',
      num: '٠١',
      title: 'داشبۆردی سینەمایی زیرەک',
      subTitle: 'Cinema Apple TV Glassmorphism',
      icon: LayoutGrid,
      color: 'from-cyan-500 to-blue-600',
      badgeColor: 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10',
      description: 'ڕووکارێکی ناوازەی شێوازی Apple TV بە دیزاینی شووشەی تاریک (Dark Cinema Glassmorphism). پیشاندانی کەشوهەوای کاتی ڕاستەقینەی شارەکانی کوردستان بە خێرایی با و شێ و کاتژمێری ورد. بە خەوتنی داهێنەرانەی دوگمەکان بۆ ٥ خاڵی شەپۆلداری سپی پاش ٣٠ چرکە بۆ پاراستنی شاشە لە سووتان (OLED Screen Saver).',
      highlights: [
        'دیزاینی Apple TV Glassmorphism',
        'کەشوهەوای زیندوو و کاتژمێری سینەمایی',
        'خەوتنی دوگمەکان بۆ ٥ خاڵی شەپۆلدار پاش ٣٠ چرکە',
        'ناسینەوەی خودکاری ئامێری تەلەفزیۆن'
      ]
    },
    {
      id: 'live',
      num: '٠٢',
      title: 'پەخشی ڕاستەوخۆ بە زواپینگی سفر-ڕەش',
      subTitle: 'Zero-Black-Screen Dual-Player Zapping',
      icon: Radio,
      color: 'from-amber-500 to-orange-600',
      badgeColor: 'border-amber-400/40 text-amber-300 bg-amber-500/10',
      description: 'پەخشی زیاتر لە ١٥,٠٠٠ کەناڵی کوردی، وەرزشی (beIN Sports, SSC)، هەواڵ، بەڵگەنامەیی و جیهانی بە کوالێتی 4K و Full HD. تەکنەلۆژیای داهێنەرانەی بارکردنی دوو پلەیەر لە باکگراوند (Dual-Player Preload) بە سووڕانەوەی ٥ چرکەیی و لۆگۆی کەناڵ لە ناوەڕاستی ئەڵقەی ژمێرەردا، و کردنەوەی یەکسەر بە یەکەم فرەیم بەبێ چرکەیەک ڕەشبوونی شاشە.',
      highlights: [
        '١٥,٠٠٠+ کەناڵی کوردی، وەرزشی و جیهانی',
        'سیستەمی Dual-Player Preload لە باکگراوند',
        'ژمێرەری ٥ چرکەیی بە لۆگۆی کەناڵ لە ناوەڕاست',
        'کردنەوە بە یەکەم فرەیمی ڤیدیۆ بەبێ ڕەشبوون'
      ]
    },
    {
      id: 'series',
      num: '٠٣',
      title: 'ئەرشیفی دەوڵەمەندی زنجیرەکان',
      subTitle: 'TV Series Streaming Hub',
      icon: Film,
      color: 'from-indigo-500 to-purple-600',
      badgeColor: 'border-indigo-400/40 text-indigo-300 bg-indigo-500/10',
      description: 'بەشێکی تایبەتمەند بە نوێترین زنجیرە کوردییەکان، تورکییە دۆبلاژکراوەکان، کۆری، عەرەبی و جیهانییەکان لەسەر پلاتفۆرمە بەناوبانگەکان (Netflix, HBO, Apple TV+, Amazon Prime). هەموو ئەڵقە و وەرزەکان بە تەواوی ڕێکخراون بە وەرگێڕانی کوردی و نوێکردنەوەی بەردەوامی کاتی پەخش.',
      highlights: [
        'زنجیرە کوردی، دۆبلاژکراو و جیهانییەکان',
        'ڕێکخستنی وردی وەرز و ئەڵقەکان',
        'کوالێتی فرە-ئاست (1080p, 720p, 480p)',
        'پاشەکەوتکردنی کاتی سەیرکردن و بەردەوامی'
      ]
    },
    {
      id: 'movies',
      num: '٠٤',
      title: 'سینەمای فلیمە 4Kیەکان و مۆدی پاشەکەوت',
      subTitle: '4K Cinema Movies & Data Saver',
      icon: Sparkles,
      color: 'from-rose-500 to-pink-600',
      badgeColor: 'border-rose-400/40 text-rose-300 bg-rose-500/10',
      description: 'سینەمایەکی بێسنوور لە هەزاران فلیمی بۆکس ئۆفیسی جیهانی بە کوالێتی 4K Ultra HD و دەنگی فرە-کەناڵی سینەمایی. مۆدی تایبەتی پاشەکەوتکردنی ئینتەرنێت (Data Saver Mode) دەستنیشانکراوە بۆ کەمکردنەوەی مەسروفی ئینتەرنێتی 4G/5G لە کاتی گەشتکردن یان بەکارهێنانی مۆبایل بەبێ لەدەستدانی جوانی و ڕوونی فلیمەکان.',
      highlights: [
        'فلیمە نوێیەکانی سینەما و بۆکس ئۆفیس',
        'مۆدی Data Saver بۆ کەمکردنەوەی بەکارهێنانی نێت',
        'دەنگی سینەمایی فرە-کەناڵ (Dolby Atmos / 5.1)',
        'دەستەی فلیمە دۆبلاژکراو و ژێرنووسکراوەکان'
      ]
    },
    {
      id: 'settings',
      num: '٠٥',
      title: 'ڕێکخستنی پێشکەوتوو و پاراستنی ئامێر',
      subTitle: 'Advanced TV Control & PIN Lock',
      icon: Sliders,
      color: 'from-emerald-500 to-teal-600',
      badgeColor: 'border-emerald-400/40 text-emerald-300 bg-emerald-500/10',
      description: 'کۆنترۆڵی تەواو بەسەر ڕووکاردا: قوفڵکردنی شاشە لەسەر لاندسکەیپ (Landscape Lock)، گۆڕینی قەبارەی ڕووکار (UI Scale) بۆ داشبۆرد و لیستی کەناڵەکان بە ڕێژەی لە 70% تا 130%، تەختەکلیلی سەر شاشەی ٣-زمانی (کوردی، ئینگلیزی، عەرەبی) بۆ ڕیمۆتی تەلەفزیۆن، و پاراستنی دەستکاریکردن یان سڕینەوەی کەناڵەکان بە کۆدی نهێنی PIN 0000.',
      highlights: [
        'قوفڵی هەمیشەیی لاندسکەیپ (Landscape Lock)',
        'کۆنترۆڵی قەبارەی داشبۆرد و لیستی کەناڵەکان (UI Scale)',
        'تەختەکلیلی سەر شاشەی کوردی، ئینگلیزی و عەرەبی',
        'پاراستنی کەناڵەکان بە کۆدی نهێنی PIN 0000'
      ]
    }
  ];

  // Gallery Visual Previews
  const galleryItems = [
    {
      id: 'dashboard',
      label: 'داشبۆردی سینەمایی',
      title: 'داشبۆردی سەرەکی KOBIN TV',
      subtitle: 'کەشوهەوای زیندوو، کاتژمێری سینەمایی، و ٥ بەشی سەرەکی ئەپەکە بە دیزاینی Apple TV',
      tag: 'CINEMA DASHBOARD',
      features: ['دیزاینی Glassmorphic', 'کەشوهەوای هەولێر و شارەکان', '٥ خاڵی شەپۆلداری خەوتوو دوای ٣٠ چرکە', 'گەیشتنی خێرا بە بەشەکان']
    },
    {
      id: 'live',
      label: 'پەخشی ڕاستەوخۆ',
      title: 'پلەیەر و زواپینگی دەستبەجێ',
      subtitle: 'پەخشی ڕاستەوخۆ بە ژمێرەری ٥ چرکەیی، لۆگۆی کەناڵ لە ناو ئەڵقەدا، و دەستبەجێ بە یەکەم فرەیم',
      tag: 'ZERO-DELAY LIVE STREAM',
      features: ['Dual-Player Preload Engine', 'ژمێرەری بازنەیی ٥ چرکە', 'دەرچەی کەناڵەکان بە دوو جار ئۆکەی', 'مۆدی Data Saver بە 720p و 480p']
    },
    {
      id: 'series',
      label: 'زنجیرەکان',
      title: 'ناوەندی زنجیرە تەلەفزیۆنییەکان',
      subtitle: 'نوێترین زنجیرە بیانی، کوردی، و تورکییەکان بە وەرگێڕان و دۆبلاژی کوالێتی بەرز',
      tag: 'SERIES CATALOG',
      features: ['پۆلێنکردنی وەرز و ئەڵقەکان', 'کوالیتی 1080p Full HD', 'سێرڤەری پرۆکسی پارێزراو', 'نوێکردنەوەی ڕۆژانەی ئەڵقەکان']
    },
    {
      id: 'movies',
      label: 'سینەما و فلیمەکان',
      title: 'سینەمای ماڵەوە بە کوالێتی 4K',
      subtitle: 'هەزاران فلیمی بۆکس ئۆفیس بە کوالێتی سینەمایی و دەنگی فرە-کەناڵ',
      tag: '4K CINEMA VOD',
      features: ['فلیمە نوێیەکانی سینەما', 'ژێرنووس و دۆبلاژی کوردی', 'مۆدی کەمکردنەوەی مەسروفی ئینتەرنێت', 'کۆنترۆڵی خێرایی و پێش/پاش']
    },
    {
      id: 'mac',
      label: 'ناسینەوەی ماک (Smart TV)',
      title: 'سیستەمی ناسینەوەی خودکاری ماک ئەدرەس',
      subtitle: 'بەستنەوەی ڕاستەوخۆی Smart TV بە پۆڕتی 80 بەبێ پێویستی بە نووسینی ناوی بەکارهێنەر بە ڕیمۆت',
      tag: 'PORT 80 MAC ENGINE',
      features: ['ماکی ستانداردی MAG (00:1A:79:XX:XX:XX)', 'بەستنەوەی ڕاستەوخۆ لەگەڵ LionOTT Port 80', 'کۆپیکردنی ١-کلیک بۆ واتسئاپ', 'پارێزراوی تەواو و هەمیشەیی']
    }
  ];

  // Subscription Packages
  const packages = [
    {
      id: 'trial',
      name: 'تاقیکاری (Trial)',
      duration: '٢٤ کاتژمێر',
      price: 'بێبەرامبەر',
      badge: 'تاقیکردنەوە',
      badgeColor: 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10',
      description: 'بۆ تاقیکردنەوەی خێرایی و کوالێتی کەناڵەکان و سینەما پێش بەشداریکردن.',
      features: [
        '١٥,٠٠٠+ کەناڵی ڕاستەوخۆ',
        'سینەمای فلیم و زنجیرەکان',
        'زواپینگی دەستبەجێ بەبێ شاشەی ڕەش',
        'کوالێتی Full HD / 4K',
        'پشتیوانی ٢٤/٧ لە واتسئاپ'
      ],
      ctaText: 'داواکردنی تێستی ٢٤ کاتژمێر',
      popular: false
    },
    {
      id: 'monthly',
      name: 'پاکێجی مانگانە (Silver)',
      duration: '١ مانگ',
      price: '٧,٠٠٠ دینار',
      badge: 'ستاندارد',
      badgeColor: 'border-slate-400/40 text-slate-300 bg-slate-500/10',
      description: 'گونجاوترین هەڵبژاردن بۆ تاقیکردنەوەی تەواوی مانگێک لەسەر مۆبایل و Smart TV.',
      features: [
        'هەموو کەناڵە ناوخۆیی و وەرزشییەکان',
        'ئەرشیفی تەواوی فلیم و زنجیرەکان',
        'کارکردن لەسەر Smart TV و ئەندرۆید',
        'سیستەمی ناسینەوەی خودکاری ماک (MAC)',
        'پشتیوانی تەکنیکی بەردەوام'
      ],
      ctaText: 'بەشداریکردن بۆ ١ مانگ',
      popular: false
    },
    {
      id: 'semi_annual',
      name: 'پاکێجی ٦ مانگە (Gold)',
      duration: '٦ مانگ',
      price: '٣٥,٠٠٠ دینار',
      badge: 'پاشەکەوت',
      badgeColor: 'border-amber-400/40 text-amber-300 bg-amber-500/10',
      description: 'داشکاندنی تایبەت بۆ بەشداریکردنی ٦ مانگی بەردەوام بە خێرایی بەرز.',
      features: [
        'دەستگەیشتن بە هەموو بەشەکانی ئەپەکە',
        'کەناڵەکانی 4K بە بەرزترین بیتڕەیت',
        'ئۆتۆ-نوێبوونەوەی ئەڵقەی زنجیرەکان',
        'کارکردن لەسەر دوو ئامێر بە نۆرە',
        'پشتیوانی ڤی ئای پی لە واتسئاپ'
      ],
      ctaText: 'بەشداریکردن بۆ ٦ مانگ',
      popular: false
    },
    {
      id: 'annual',
      name: 'پاکێجی ساڵانەی VIP (Diamond)',
      duration: '١٢ مانگ (١ ساڵ)',
      price: '٦٠,٠٠٠ دینار',
      badge: 'پڕفرۆشترین ★',
      badgeColor: 'border-cyan-300 text-cyan-200 bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
      description: 'باشترین داشکاندن و تەواوترین ئەزموون بۆ ساڵێکی تەواوی خێزانی و بێ بڕانەوە.',
      features: [
        '١ ساڵی تەواو بەبێ بڕانەوە و کاڵبوونەوە',
        'سێرڤەری تایبەتی VIP بە کەمترین لۆد',
        'سیستەمی ناسینەوەی خودکاری ماک بۆ شاشەی زیرەک',
        'سینەمای 4K و نوێترین فلیمە جیهانییەکان',
        'پشتیوانی یەکەمی تایبەت بە کڕیارانی VIP'
      ],
      ctaText: 'بەشداریکردنی ساڵانەی VIP',
      popular: true
    }
  ];

  // Frequently Asked Questions
  const faqs = [
    {
      q: 'ئەپی KOBIN TV لەسەر چ جۆرە ئامێرێک کار دەکات؟',
      a: 'KOBIN TV بە تایبەتی دیزاین کراوە بۆ شاشەی زیرەکی تەلەفزیۆن (Android TV, Google TV, Xiaomi TV Stick, Amazon Fire TV)، هەروەها لەسەر هەموو مۆبایل و تابلێتێکی ئەندرۆید بە قەبارەی زۆر کەم (٨.٥ مێگابایت) بەبێ کێشە کار دەکات. لە ڕێگەی وێبگەڕیشەوە دەتوانرێت لەسەر کۆمپیوتەر و ئایفۆن بەکاربهێنرێت.'
    },
    {
      q: 'سیستەمی ناسینەوەی ماک (MAC Address) بە پۆڕتی 80 چۆن کار دەکات؟',
      a: 'کاتی کردنەوەی ئەپەکە لەسەر شاشەی زیرەک، کۆدی تایبەتی ماک ئەدرەس (بە شێوازی ستانداردی 00:1A:79:XX:XX:XX) پیشان دەدرێت. پێویست ناکات بە ڕیمۆت ناوی بەکارهێنەر و پاسوۆرد بنووسیت؛ تەنها ئەو کۆدە دەنێریت بۆ تیمی KOBIN TV لە ڕێگەی واتسئاپ و ڕاستەوخۆ بە پۆڕتی 80 هێڵەکەت لەسەر سێرڤەر کارا دەبێت.'
    },
    {
      q: 'تەکنەلۆژیای زواپینگی بێ شاشەی ڕەش (Zero-Black-Screen) چییە؟',
      a: 'لە کاتی گۆڕینی کەناڵ، تەکنەلۆژیای KOBIN TV وێنەی کۆتا فرەیم لەسەر شاشە ڕادەگرێت و لە باکگراونددا کەناڵی داهاتوو بار دەکات (Dual-Player Preload). لەگەڵ گەیشتنی یەکەم فرەیمی کەناڵە نوێیەکە بەبێ چرکەیەک ڕەشبوونی شاشە یەکسەر دەگوازرێتەوە بۆ بەر دیدەی بینەر.'
    },
    {
      q: 'ئایا ئەپەکە لەسەر ئینتەرنێتی لاواز کار دەکات؟',
      a: 'بەڵێ! لە ڕێکخستنەکاندا مۆدی کەمکردنەوەی مەسروفی ئینتەرنێت (Data Saver Mode) دانراوە کە ڕێگەت پێدەدات کوالێتی کەناڵەکان بخەیتە سەر 720p یان 480p بۆ کەمکردنەوەی خەرجی ئینتەرنێت و کارکردنی پارێزراو لەسەر تۆڕی 4G/LTE.'
    },
    {
      q: 'چۆن فایلی ئەپەکە (kobin-tv.apk) لەسەر شاشەی زیرەک دابمەزرێنم؟',
      a: 'زۆر ئاسانە! دەتوانیت لە ڕێگەی وێبگەڕی ناو شاشەکەت (وەک Downloader یان Chrome) ئەم ماڵپەڕە بکەیتەوە و کلیک لەسەر دوگمەی داگرتن بکەیت، یان لە مۆبایلەکەتەوە فایلی kobin-tv.apk بنێریت بۆ شاشەکەت لە ڕێگەی ئەپی Send Files to TV و دایمەزرێنیت.'
    },
    {
      q: 'ئایا دەتوانم پێش بەشداریکردن تێستی بکەم؟',
      a: 'بەڵێ، دەتوانیت لە ڕێگەی واتسئاپەوە داوای تێستی ٢٤ کاتژمێری بکەیت بەبێ هیچ تێچوویەک بۆ تاقیکردنەوەی خێرایی کەناڵەکان و بینینی کوالێتی سینەما.'
    }
  ];

  const handleWhatsAppContact = (packageName = '') => {
    const text = packageName
      ? `سڵاو بەڕێزم 🌷\nداواکاری بەشداریکردنی KOBIN TV:\n💎 پاکێجی دیاریکراو: ${packageName}\n📱 مۆدێلی ئامێر: Smart TV / Android\nتکایە زانیاری و شێوازی چالاککردنم بۆ بنێرن. سوپاس!`
      : `سڵاو بەڕێزم 🌷\nدەخوازم زانیاری وەربگرم لەسەر ئەپی فەرمی KOBIN TV و شێوازی بەشداریکردن. سوپاس!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden relative" dir="rtl">
      
      {/* Dynamic Ambient Background Beams */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute -top-32 start-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/3 -end-32 w-[700px] h-[700px] bg-blue-600/10 rounded-full blur-[180px]" />
        <div className="absolute top-2/3 start-1/6 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 end-1/3 w-[650px] h-[650px] bg-cyan-600/10 rounded-full blur-[170px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-[#020617]/90 to-[#020617]" />
      </div>

      {/* =========================================================================
          TOP NAVBAR (Classic Frosted Glass)
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-slate-950/75 border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3.5">
            <div className="relative group cursor-pointer flex items-center">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur-md opacity-40 group-hover:opacity-75 transition duration-300" />
              <img 
                src="/kobin-logo.png" 
                alt="KOBIN .tv Logo" 
                className="relative h-11 sm:h-12 w-auto object-contain filter drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-lg sm:text-xl text-white tracking-wider">
                  KOBIN<span className="text-cyan-400 font-bold">.tv</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                  PREMIUM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                پلاتفۆرمی یەکگرتووی پەخشی کەناڵەکان و سینەما
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-slate-300">
            <button 
              type="button" 
              onClick={() => scrollToSection('pillars-section')} 
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              ٥ کۆڵەکەی سەرەکی
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('gallery-section')} 
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              پێشانگای ئەپ
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('mac-section')} 
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              ناسینەوەی ماک (Smart TV)
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('packages-section')} 
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              پاکێجەکان
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('install-section')} 
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              ڕێبەری دامەزراندن
            </button>
            <button 
              type="button" 
              onClick={() => scrollToSection('faq-section')} 
              className="hover:text-cyan-300 transition-colors cursor-pointer"
            >
              پرسیارە باوەکان
            </button>
          </nav>

          {/* Direct CTA Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/kobin-tv.apk"
              download="kobin-tv.apk"
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-300/40 flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-950" />
              <span>داگرتنی APK</span>
              <span className="hidden sm:inline-block text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded-md font-mono">
                8.5 MB
              </span>
            </a>

            {/* Secret Admin Panel Entrance Button (Discreet) */}
            <button
              onClick={onSwitchToAdmin}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="چوونەژوورەوەی بەڕێوەبەر (Admin)"
            >
              <ShieldCheck className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION (Cinema Backdrop, Logo Display & 3D TV Showcase)
         ========================================================================= */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 pb-16 text-center flex flex-col items-center">
        
        {/* Release Tag Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-6 backdrop-blur-xl animate-fade-in shadow-[0_0_20px_rgba(6,182,212,0.25)]">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>وەشانی فەرمی 2026 • KOBIN TV • پلاتفۆرمی یەکگرتووی کەناڵەکان و سینەما</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight max-w-4xl leading-tight sm:leading-snug drop-shadow-[0_4px_25px_rgba(0,0,0,0.85)]">
          خێراترین ئەپی پەخشی کەناڵەکان بە سیستەمی بێ شاشەی ڕەش
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-sm sm:text-lg text-slate-300 max-w-3xl font-normal leading-relaxed drop-shadow-md">
          ئەم ماڵپەڕە گەلەری و ناوەندی فەرمی ناساندنی پڕۆژەی <strong className="text-cyan-300 font-bold">KOBIN TV</strong>یە. تەماشاکردنی ڕاستەوخۆی کەناڵە کوردی و وەرزشییەکان، سینەمای 4K و زنجیرەکان لە ڕێگەی ئەپی تایبەت بۆ شاشەی زیرەک (Smart TV) و ئەندرۆید بەردەستە بە زواپینگی دەستبەجێ بەبێ چرکەیەک پچڕان.
        </p>

        {/* Primary CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full max-w-lg">
          <a
            href="/kobin-tv.apk"
            download="kobin-tv.apk"
            className="w-full sm:flex-1 px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_40px_rgba(6,182,212,0.55)] border border-cyan-300/50 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Download className="w-5 h-5 text-slate-950" />
            <span>داگرتنی ئەپی فەرمی (APK)</span>
            <span className="text-xs bg-slate-950/20 px-2 py-0.5 rounded-md font-mono">
              8.5 MB
            </span>
          </a>

          <button
            type="button"
            onClick={() => handleWhatsAppContact('تاقیکاری')}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/40 hover:border-emerald-400 text-emerald-300 font-bold text-sm backdrop-blur-xl flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <MessageCircle className="w-5 h-5 text-emerald-400" />
            <span>داواکردنی تێست لە واتسئاپ</span>
          </button>
        </div>

        {/* Key App Highlights Quick Bar */}
        <div className="mt-8 flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Android TV & Smart Box</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>0.1s Zero-Black Zapping</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>Port 80 MAC Sync</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-rose-400" />
            <span>Data Saver 480p/720p</span>
          </span>
        </div>

        {/* 3D Smart TV App Frame Preview */}
        <div className="mt-14 w-full max-w-5xl relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500/40 via-sky-600/30 to-blue-700/40 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative rounded-3xl bg-slate-950/90 border border-white/20 p-3 sm:p-5 shadow-[0_25px_80px_rgba(0,0,0,0.95)] backdrop-blur-3xl overflow-hidden">
            {/* Top Device Window Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 mb-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-white font-bold ms-2 font-mono">KOBIN TV CINEMA ENGINE</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-cyan-300 font-bold">SMART TV • LIVE PREVIEW</span>
              </div>
            </div>

            {/* Video / Artwork Display */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center">
              <img
                src="/kobin-logo-raw.png"
                alt="KOBIN TV Cinema Interface"
                className="w-full h-full object-cover filter brightness-105 transform-gpu group-hover:scale-[1.01] transition-transform duration-700"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6 sm:p-10 text-start" dir="rtl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-0.5 rounded-md bg-cyan-500 text-slate-950 font-black text-[11px] tracking-wider uppercase animate-pulse">
                    OFFICIAL RELEASE
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    KOBIN .tv • ALL VIEWS • کۆ بین
                  </span>
                </div>

                <h3 className="text-xl sm:text-3xl font-black text-white drop-shadow-lg">
                  پەخشی کەناڵە ناوخۆیی و جیهانییەکان بە بەرزترین کوالێتی
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
                  ئەزموونی خێراترین پەخش بە سیستەمی Apple TV Dark Cinema، زواپینگی دەستبەجێ، کۆنترۆڵی زیرەکی تەلەفزیۆن و ناسینەوەی خودکاری ماک.
                </p>

                <div className="mt-4 flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>0.1s Zapping Speed</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Tv className="w-4 h-4 text-cyan-400" />
                    <span>Smart TV Remote Control</span>
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <Film className="w-4 h-4 text-indigo-400" />
                    <span>4K Cinema & Series</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: THE 5 CORE ARCHITECTURAL PILLARS (٥ کۆڵەکەی سەرەکی پرۆژەکە)
         ========================================================================= */}
      <section id="pillars-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t border-white/10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-4 font-mono">
            <span>CORE ARCHITECTURE • ٥ بەشە سەرەکییەکە</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            ٥ کۆڵەکەی سەرەکی پڕۆژەی KOBIN TV
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            سیستەمی KOBIN TV لەسەر پێنج بەشی سەرەکی و پڕ لە داهێنان بنیادنراوە بۆ دابینکردنی بێوێنەترین ئەزموونی پەخش بۆ بینەران:
          </p>
        </div>

        {/* 5 Pillar Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {corePillars.map((pillar) => {
            const IconComponent = pillar.icon;
            return (
              <div 
                key={pillar.id}
                className="relative rounded-3xl bg-slate-900/60 border border-white/10 hover:border-cyan-400/40 p-6 sm:p-7 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${pillar.color} text-white shadow-lg`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-2xl font-black text-slate-600 group-hover:text-cyan-400/80 transition-colors">
                      {pillar.num}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white mb-1 group-hover:text-cyan-300 transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 mb-4">
                    {pillar.subTitle}
                  </p>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                    {pillar.description}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  {pillar.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Bonus 6th Card: Universal Hardware & Remote Control */}
          <div className="relative rounded-3xl bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-blue-950/40 border border-cyan-500/30 p-6 sm:p-7 shadow-xl backdrop-blur-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-lg">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="font-mono text-2xl font-black text-cyan-400">
                  +
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-black text-white mb-1 text-cyan-300">
                هاوئاهەنگی تەواو لەگەڵ ڕیمۆتی TV
              </h3>
              <p className="text-[11px] font-mono text-slate-400 mb-4">
                Smart TV Remote & D-Pad Navigation
              </p>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5">
                تەواوی دوگمەکانی ڕیمۆت (سەرەوە، خوارەوە، چەپ، ڕاست، OK، دوگمەی ڕەنگەکان، و پاشگەزبوونەوە) بە شێوەیەکی سروشتی نەخشێندراون بۆ خێراترین جووڵە بەبێ پێویستی بە ماوس.
              </p>
            </div>

            <div className="pt-4 border-t border-cyan-500/20">
              <a
                href="/kobin-tv.apk"
                download="kobin-tv.apk"
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                <Download className="w-4 h-4 text-slate-950" />
                <span>داگرتنی ڕاستەوخۆ بۆ شاشەکەت</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: INTERACTIVE SCREENSHOT GALLERY (پێشانگای کارلێکەری بەشەکان)
         ========================================================================= */}
      <section id="gallery-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t border-white/10">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-4 font-mono">
            <span>INTERFACE GALLERY • پێشانگای ئەپ</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            ڕووکاری سەردەمیانەی ئەپەکە لە نزیکەوە ببینە
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300">
            کلیک لەسەر بەشەکان بکە بۆ بینینی وردەکاری و شێوازی کارکردنی ئەپەکە لەسەر شاشەی زیرەک:
          </p>
        </div>

        {/* Gallery Tab Switcher */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {galleryItems.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveGalleryTab(tab.id)}
              className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer border ${
                activeGalleryTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Tab Preview Card */}
        {(() => {
          const current = galleryItems.find(g => g.id === activeGalleryTab) || galleryItems[0];
          return (
            <div className="rounded-3xl bg-slate-900/80 border border-white/15 p-6 sm:p-10 shadow-2xl backdrop-blur-3xl animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Visual Mockup Showcase */}
              <div className="lg:col-span-7 rounded-2xl overflow-hidden aspect-video bg-black relative border border-white/10 shadow-2xl group">
                <img
                  src="/kobin-logo-raw.png"
                  alt={current.title}
                  className="w-full h-full object-cover filter brightness-105 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-6" dir="rtl">
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[10px] font-mono font-bold self-start mb-2">
                    {current.tag}
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-white">
                    {current.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    {current.subtitle}
                  </p>
                </div>
              </div>

              {/* Right Column: Features and Breakdown */}
              <div className="lg:col-span-5 space-y-6 text-start" dir="rtl">
                <div>
                  <span className="text-[11px] font-mono text-cyan-300 tracking-wider uppercase font-bold block mb-1">
                    تایبەتمەندی بەشەکە
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    {current.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                    {current.subtitle}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {current.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                      <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <a
                    href="/kobin-tv.apk"
                    download="kobin-tv.apk"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  >
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>داگرتنی ئەم بەشە لەناو ئەپەکەدا</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* =========================================================================
          SECTION 4: SMART TV MAC AUTHENTICATION VIA PORT 80 (سیستەمی ناسینەوەی خودکاری ماک)
         ========================================================================= */}
      <section id="mac-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t border-white/10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold font-mono">
              <span>PORT 80 DIRECT ENGINE • بەستنەوەی ڕاستەوخۆ</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-snug">
              ناسینەوەی خودکاری شاشە بە کۆدی ماک (MAC Address)
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              لەسەر تەلەفزیۆنی زیرەک (Smart TV)، نووسینی ناوی بەکارهێنەر و پاسوۆرد بە ڕیمۆت کارێکی بێزارکەرە. لە <strong className="text-cyan-300 font-bold">KOBIN TV</strong>دا، سیستەمەکە ڕاستەوخۆ بە کۆدی ماکی ئامێرەکەت بەستراوەتەوە بە سێرڤەری پۆڕتی 80:
            </p>

            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">کۆدی ماکی ستانداردی MAG (00:1A:79:XX:XX:XX)</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    بە فۆرماتی دروستی شازدەیی (Hexadecimal) کە لەسەر هەموو پۆڕتاڵێکی LionOTT و سیستەمەکانی جیهان بەبێ هەڵە قبوڵ دەکرێت.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">پشکنینی خێرای پێش پەخش (Silent Pre-Flight Check)</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    لەگەڵ کردنەوەی ئەپ، پەیوەندی بە پۆڕتی 80ی سێرڤەرەوە دەکرێت و بە شێوەیەکی خۆکارانە و بەبێ دەستتێوەردان کەناڵەکانت بۆ دەکرێتەوە.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">پاشەکەوتکردنی هەمیشەیی و سەربەخۆ لە سڕینەوە</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    تەنانەت ئەگەر ئەپەکە بسڕیتەوە و سەرلەنوێ دایبمەزرێنیتەوە، کۆدی ماکەکەت نەگۆڕ دەمێنێتەوە و پێویست بە کاراکردنەوە ناکات.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: MAC Visual Badge Display */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl bg-slate-900/90 border-2 border-cyan-400/40 p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-5 text-center relative overflow-hidden backdrop-blur-3xl">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500" />
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>MAG PORTAL ACTIVE</span>
              </div>

              <h3 className="text-lg font-black text-white">
                نموونەی کۆدی شاشەی Smart TV
              </h3>

              {/* Glowing Monospace MAC Display */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-400/50 space-y-1 shadow-inner">
                <span className="text-[10px] text-slate-400 font-mono block uppercase">
                  MAC ADDRESS (کۆدی شاشە)
                </span>
                <div className="font-mono text-2xl sm:text-3xl font-black text-cyan-300 tracking-widest drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                  00:1A:79:B4:9C:2F
                </div>
                <div className="pt-1 flex items-center justify-center gap-2">
                  <span className="text-[10px] text-slate-400">Device PIN:</span>
                  <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    1234
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                ئەپەکە بکەرەوە لەسەر تەلەفزیۆنەکەت، کۆدی ماکەکەت ببینە و یەکسەر بە کلیکێک لە واتسئاپەوە بینێرە بۆ چالاککردنی خێرا!
              </p>

              <button
                type="button"
                onClick={() => handleWhatsAppContact('کۆدی ماک')}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-slate-950" />
                <span>ناردنی کۆدی ماک بۆ واتسئاپ</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: SUBSCRIPTION PACKAGES (پاکێجەکانی بەشداریکردن)
         ========================================================================= */}
      <section id="packages-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t border-white/10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-4 font-mono">
            <span>PACKAGES & PRICING • پاکێج و نرخەکان</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            پاکێجەکانی بەشداریکردنی KOBIN TV
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300">
            باشترین نرخ بەرزترین کوالێتی. هەڵبژاردن بکە و بە ١-کلیک لە واتسئاپەوە پەیوەندی بکە:
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 backdrop-blur-2xl ${
                pkg.popular
                  ? 'bg-gradient-to-b from-cyan-950/60 via-slate-900/90 to-slate-950 border-2 border-cyan-400/60 shadow-[0_0_40px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-900/60 border border-white/10 hover:border-white/20 shadow-xl'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${pkg.badgeColor}`}>
                    {pkg.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-bold">
                    {pkg.duration}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white mb-2">
                  {pkg.name}
                </h3>
                <div className="mb-4">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {pkg.price}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-6">
                  {pkg.description}
                </p>

                {/* Features List */}
                <div className="space-y-2.5 pt-4 border-t border-white/10">
                  {pkg.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action CTA Button */}
              <div className="pt-6 mt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => handleWhatsAppContact(pkg.name)}
                  className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{pkg.ctaText}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: HOW TO INSTALL (ڕێبەری دامەزراندن لەسەر شاشەی زیرەک)
         ========================================================================= */}
      <section id="install-section" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-20 border-t border-white/10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-4 font-mono">
            <span>INSTALLATION GUIDE • ڕێبەری دامەزراندن</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            چۆن ئەپەکە لەسەر شاشەی زیرەک و مۆبایل دابنێم؟
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300">
            تەنها بە چەند هەنگاوێکی زۆر سادە ئەپی KOBIN TV ئامادەی پەخش دەبێت:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Step 1 */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-7 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono font-black text-lg border border-cyan-400/30">
              ١
            </div>
            <h3 className="text-base font-black text-white">
              داگرتنی فایلی APK
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              لە وێبگەڕی شاشەکەت (وەک Downloader یان Chrome) یان لە مۆبایلەکەتەوە فایلی <strong className="text-cyan-300">kobin-tv.apk</strong> دابگرە بە قەبارەی تەنها ٨.٥ مێگابایت.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-7 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-mono font-black text-lg border border-blue-400/30">
              ٢
            </div>
            <h3 className="text-base font-black text-white">
              دامەزراندن لەسەر ئامێر
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              کلیک لەسەر فایلەکە بکە و Install هەڵبژێرە. ئەپەکە بە تەواوی ئۆپتیمایز کراوە بۆ Smart TV و بە شێوەیەکی ئۆتۆماتیکی لەسەر لاندسکەیپ دەکرێتەوە.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-3xl bg-slate-900/60 border border-white/10 p-6 sm:p-7 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono font-black text-lg border border-emerald-400/30">
              ٣
            </div>
            <h3 className="text-base font-black text-white">
              کاراکردن بە ماک (MAC)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              ئەپەکە بکەرەوە، کۆدی ماک (00:1A:79:...) کە لەسەر شاشەکەت دەردەکەوێت بنێرە بۆ واتسئاپ. لە چەند چرکەیەکدا پەخشەکە بەتەواوی دەستپێدەکات!
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: FAQ (پرسیارە دووبارەبووەکان)
         ========================================================================= */}
      <section id="faq-section" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-20 border-t border-white/10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-4 font-mono">
            <span>FAQ • وەڵامی پرسیارەکان</span>
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            پرسیارە باوەکان
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300">
            هەموو ئەو پرسیارانەی کە بینەرانمان زۆرجار دەیپرسن:
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div 
                key={index}
                className="rounded-2xl bg-slate-900/70 border border-white/10 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-start flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-white flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <div className="p-1 rounded-lg bg-white/5 text-slate-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 bg-black/20">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: DIRECT DOWNLOAD BANNER
         ========================================================================= */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-14">
        <div className="rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900/95 to-blue-950/80 border-2 border-cyan-400/40 p-8 sm:p-12 shadow-[0_0_60px_rgba(6,182,212,0.3)] text-center space-y-6 relative overflow-hidden backdrop-blur-3xl">
          <div className="absolute -top-24 -start-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -end-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-center">
            <img 
              src="/kobin-logo.png" 
              alt="KOBIN TV" 
              className="h-16 w-auto object-contain filter drop-shadow-[0_0_20px_rgba(6,182,212,0.8)]" 
            />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            ئێستا ئەپی KOBIN TV دابگرە و چێژ لە پەخشی خێرا وەربگرە!
          </h2>

          <p className="text-xs sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            وەشانی فەرمی بۆ هەموو جۆرە شاشەیەکی زیرەک و مۆبایلی ئەندرۆید. خاوەنی خێراترین پلەیەر و زواپینگی دەستبەجێ بەبێ شاشەی ڕەش.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto pt-2">
            <a
              href="/kobin-tv.apk"
              download="kobin-tv.apk"
              className="w-full sm:flex-1 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_35px_rgba(6,182,212,0.6)] border border-cyan-300/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5 text-slate-950" />
              <span>داگرتنی ڕاستەوخۆ (kobin-tv.apk)</span>
            </a>

            <button
              type="button"
              onClick={() => handleWhatsAppContact()}
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <span>پشتیوانی ٢٤/٧</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER (Classic Dark Cinema)
         ========================================================================= */}
      <footer className="relative z-10 w-full border-t border-white/10 py-12 px-4 sm:px-8 bg-slate-950/90 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start" dir="rtl">
          
          {/* Logo & Copyright */}
          <div className="flex items-center gap-3">
            <img 
              src="/kobin-logo.png" 
              alt="KOBIN TV" 
              className="h-9 w-auto object-contain filter drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" 
            />
            <div>
              <span className="font-mono font-bold text-white text-sm">
                KOBIN<span className="text-cyan-400 font-bold">.tv</span>
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                مافی بڵاوکردنەوە پارێزراوە بۆ KOBIN TV © 2026
              </p>
            </div>
          </div>

          {/* Server Engine Status Badge */}
          <div className="flex items-center gap-3 font-mono text-[11px] bg-slate-900/80 px-4 py-2 rounded-xl border border-white/10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">سێرڤەری LionOTT Port 80:</span>
            <span className="text-emerald-400 font-bold">ONLINE (100%)</span>
          </div>

          {/* Quick Links */}
          <div className="flex items-center gap-5 text-xs">
            <a 
              href="/kobin-tv.apk" 
              download="kobin-tv.apk" 
              className="text-cyan-400 hover:text-cyan-300 font-bold"
            >
              داگرتنی APK
            </a>
            <button 
              onClick={() => handleWhatsAppContact()} 
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              پەیوەندی لە واتسئاپ
            </button>
            <button 
              onClick={onSwitchToAdmin} 
              className="text-slate-600 hover:text-slate-400 transition-colors cursor-pointer text-[10px]"
            >
              بەڕێوەبەر (Admin)
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
