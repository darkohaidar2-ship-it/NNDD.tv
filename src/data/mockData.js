// Data store for NNDD TV TV & Permissions System

export const INITIAL_PERMISSIONS = [
  {
    id: 'manage_channels',
    name: 'بەڕێوەبردنی کەناڵەکان',
    code: 'PERM_CHANNELS',
    category: 'ناوەڕۆک',
    description: 'توانای زیادکردن، سڕینەوە، دەستکاریکردنی ناو و لۆگۆی کەناڵەکان بە شێوەی لینک یان فایل',
    colorFrom: 'from-blue-600',
    colorTo: 'to-indigo-600',
    border: 'border-blue-200',
    bgLight: 'bg-blue-50/70',
    badgeText: 'text-blue-700',
    actions: ['create_channel', 'edit_channel_logo', 'delete_channel', 'sort_channels'],
    icon: 'Tv'
  },
  {
    id: 'manage_streams',
    name: 'سەرپەرشتی M3U8 و لقی یەدەگ (Failover)',
    code: 'PERM_STREAMS',
    category: 'تەکنیکی',
    description: 'نوێکردنەوەی سێرڤەرەکانی ستریم، لینکی M3U8، پۆڕتاڵی Stalker MAC و گۆڕینی لقی یەدەگ',
    colorFrom: 'from-violet-600',
    colorTo: 'to-purple-600',
    border: 'border-violet-200',
    bgLight: 'bg-violet-50/70',
    badgeText: 'text-violet-700',
    actions: ['update_m3u', 'update_xtream', 'rotate_tokens', 'test_stream_health'],
    icon: 'Radio'
  },
  {
    id: 'manage_subscriptions',
    name: 'کۆدی بەشداربوون و بریکارەکان (Reseller)',
    code: 'PERM_SUBS',
    category: 'ژمێریاری',
    description: 'دروستکردنی کۆدی تێستی ٢٤ کاتژمێر، کارتی باڵانسی ١، ٣، ٦ مانگ و ساڵانە و بەستنەوە بە MAC',
    colorFrom: 'from-emerald-600',
    colorTo: 'to-teal-600',
    border: 'border-emerald-200',
    bgLight: 'bg-emerald-50/70',
    badgeText: 'text-emerald-700',
    actions: ['generate_trial', 'extend_sub_1m', 'extend_sub_1y', 'bind_mac_device', 'terminate_sub'],
    icon: 'CreditCard'
  },
  {
    id: 'manage_vod',
    name: 'سەرپەرشتی فلیم و زنجیرەکان VOD',
    code: 'PERM_VOD',
    category: 'ناوەڕۆک',
    description: 'بەڕێوەبردنی بەشەکانی سینەما، زیادکردنی ئەڵقە و وەرزەکان، پۆستەر و کورتەی فلیمەکان',
    colorFrom: 'from-amber-500',
    colorTo: 'to-orange-600',
    border: 'border-amber-200',
    bgLight: 'bg-amber-50/70',
    badgeText: 'text-amber-800',
    actions: ['upload_vod', 'edit_posters', 'manage_episodes', 'update_imdb_meta'],
    icon: 'Film'
  },
  {
    id: 'system_settings',
    name: 'ڕێکخستنی سیستەم و ئاسایش',
    code: 'PERM_SYSTEM',
    category: 'ئەدمین',
    description: 'دەستکاری کۆنتڕۆڵ پانێڵ بە بێ دەستکاری کۆد، بەڕێوەبردنی کاش، و دیارییکردنی لۆگۆی گشتی ئەپ',
    colorFrom: 'from-rose-600',
    colorTo: 'to-red-600',
    border: 'border-rose-200',
    bgLight: 'bg-rose-50/70',
    badgeText: 'text-rose-700',
    actions: ['change_app_branding', 'clear_cache', 'toggle_maintenance', 'manage_roles'],
    icon: 'ShieldCheck'
  },
  {
    id: 'view_analytics',
    name: 'چاودێری و بینینی ئامارەکان',
    code: 'PERM_ANALYTICS',
    category: 'چاودێری',
    description: 'بینینی ژمارەی بینەرانی ڕاستەوخۆ، کەناڵە پڕبینەرەکان، داخوازی تێست و هێڵی باندویسی سێرڤەر',
    colorFrom: 'from-cyan-600',
    colorTo: 'to-blue-600',
    border: 'border-cyan-200',
    bgLight: 'bg-cyan-50/70',
    badgeText: 'text-cyan-700',
    actions: ['view_live_watchers', 'export_financials', 'view_traffic_graphs'],
    icon: 'BarChart3'
  }
];

export const INITIAL_USERS = [
  {
    id: 'usr-free-client',
    username: 'free-user',
    password: 'free',
    name: 'ئەکاونتی بێبەرامبەر (Free)',
    email: 'free.user@nnddtv.com',
    role: 'بینەری بێبەرامبەر',
    department: 'بینەران',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'چالاک',
    deviceMac: '00:1A:79:FREE:NNDD',
    macLocked: false,
    subPlan: 'فری (FREE Base)',
    planTier: 'free',
    creditsAllocated: 0,
    creditsConsumed: 0,
    creditsSaved: 0,
    planExpiryDate: Date.now() + (3650 * 86400000),
    serverCycleExpiryDate: Date.now() + (3650 * 86400000),
    jitStatus: 'active',
    currentIp: '149.255.226.78',
    deviceType: 'mobile',
    activeDevicesCount: '1/1',
    isIpLocked: false,
    permissions: []
  },
  {
    id: 'usr-test-97',
    username: 'nndd-97',
    password: '97971997',
    name: 'تێستەری تایبەت (nndd-97)',
    email: 'nndd-97@nnddtv.com',
    role: 'تێستەری سەرەکی VIP',
    department: 'تێست و کوالێتی',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'چالاک',
    deviceMac: '00:1A:79:97:97:97',
    macLocked: false,
    subPlan: 'دایمۆند (DIAMOND VIP • 12M)',
    planTier: 'ultra',
    creditsAllocated: 12,
    creditsConsumed: 1,
    creditsSaved: 11,
    planExpiryDate: Date.now() + (365 * 86400000),
    serverCycleExpiryDate: Date.now() + (30 * 86400000),
    jitStatus: 'active',
    currentIp: '37.237.142.10',
    deviceType: 'tv',
    activeDevicesCount: '1/1',
    isIpLocked: false,
    permissions: ['manage_channels', 'manage_streams', 'manage_subscriptions', 'manage_vod', 'system_settings', 'view_analytics']
  },
  {
    id: 'usr-1',
    name: 'دیاری دارا (سەرپەرشتیاری گشتی)',
    email: 'dario.admin@nnddtv.com',
    role: 'ئەدمینی باڵا',
    department: 'ئەدمین',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'چالاک',
    deviceMac: '00:1A:79:A8:29:69',
    macLocked: true,
    subPlan: 'دایمۆند (DIAMOND VIP • 12M)',
    planTier: 'ultra',
    creditsAllocated: 12,
    creditsConsumed: 2,
    creditsSaved: 10,
    planExpiryDate: Date.now() + (305 * 86400000),
    serverCycleExpiryDate: Date.now() + (22 * 86400000),
    jitStatus: 'active',
    currentIp: '185.193.18.94',
    deviceType: 'tv',
    activeDevicesCount: '1/1',
    isIpLocked: true,
    permissions: ['manage_channels', 'manage_streams', 'manage_subscriptions', 'manage_vod', 'system_settings', 'view_analytics']
  },
  {
    id: 'usr-2',
    name: 'ئاشتی نەجمەدین',
    email: 'ashti.tech@nnddtv.com',
    role: 'ئەندازیاری ستریم و پەخش',
    department: 'تەکنیکی',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'چالاک',
    deviceMac: '00:1A:79:B5:18:70',
    macLocked: true,
    subPlan: 'پڕۆ ماکس (PRO MAX • 6M)',
    planTier: 'pro_plus',
    creditsAllocated: 6,
    creditsConsumed: 1,
    creditsSaved: 5,
    planExpiryDate: Date.now() + (150 * 86400000),
    serverCycleExpiryDate: Date.now() - (2 * 86400000),
    jitStatus: 'standby',
    currentIp: '185.193.19.120',
    deviceType: 'tv',
    activeDevicesCount: '1/1',
    isIpLocked: true,
    permissions: ['manage_channels', 'manage_streams', 'view_analytics']
  },
  {
    id: 'usr-3',
    name: 'سۆما ڕەحمان',
    email: 'soma.vod@nnddtv.com',
    role: 'بەڕێوەبەری سینەما و زنجیرە',
    department: 'ناوەڕۆک',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'چالاک',
    deviceMac: '00:1A:79:27:82:95',
    macLocked: true,
    subPlan: 'پڕۆ (PRO • 3M)',
    planTier: 'pro',
    creditsAllocated: 3,
    creditsConsumed: 1,
    creditsSaved: 2,
    planExpiryDate: Date.now() + (70 * 86400000),
    serverCycleExpiryDate: Date.now() + (15 * 86400000),
    jitStatus: 'active',
    currentIp: '151.236.170.44',
    deviceType: 'web',
    activeDevicesCount: '2/1',
    isIpLocked: false,
    permissions: ['manage_channels', 'manage_vod']
  },
  {
    id: 'usr-4',
    name: 'کاروان قادر (بریکاری هەولێر)',
    email: 'karwan.reseller@nnddtv.com',
    role: 'بریکاری باوەڕپێکراو',
    department: 'فرۆش و بریکار',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'چالاک',
    deviceMac: '00:1A:79:45:11:82',
    macLocked: false,
    subPlan: 'بریکاری ١ ساڵ',
    permissions: ['manage_subscriptions', 'view_analytics']
  },
  {
    id: 'usr-5',
    name: 'دانا سەردار',
    email: 'dana.support@nnddtv.com',
    role: 'پشتیوانی بەکارهێنەران',
    department: 'پشتیوانی',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'چالاک',
    deviceMac: '00:1A:79:C2:90:14',
    macLocked: true,
    subPlan: 'تێستی ٢٤ کاتژمێر',
    permissions: ['manage_subscriptions']
  },
  {
    id: 'usr-6',
    name: 'ڕێباز شێروانی (بەشداربوو)',
    email: 'rebaz.subscriber@gmail.com',
    role: 'بینەری ئاسایی',
    department: 'بەشداربووان',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    status: 'بەسەرچوو',
    deviceMac: '00:1A:79:99:32:01',
    macLocked: false,
    subPlan: 'بەسەرچوو (پێویستی بە نوێکردنەوەیە)',
    permissions: []
  }
];

// Activation Codes Store for Resellers & Subscriptions
export const INITIAL_ACTIVATION_CODES = [
  {
    id: 'code-diamond',
    code: 'DIAMOND-1Y-2026',
    planId: 'plan_ultra',
    planName: 'دایمۆند (DIAMOND VIP • 12M)',
    durationDays: 365,
    credits: 12,
    status: 'بەردەست',
    price: '45,000 IQD',
    createdBy: 'دیاری (ئەدمین)',
    createdAt: '2026-10-17',
    usedByMac: null
  },
  {
    id: 'code-vip-97',
    code: 'NNDD-97',
    planId: 'plan_ultra',
    planName: 'دایمۆند (DIAMOND VIP • 12M)',
    durationDays: 365,
    credits: 12,
    status: 'بەردەست',
    price: '0 IQD (تێست)',
    createdBy: 'ئەدمین (تێستی ڕاستەوخۆ)',
    createdAt: '2026-10-08',
    usedByMac: null
  },
  {
    id: 'code-max',
    code: 'MAX-6M-2026',
    planId: 'plan_pro_plus',
    planName: 'پڕۆ ماکس (PRO MAX • 6M)',
    durationDays: 180,
    credits: 6,
    status: 'بەردەست',
    price: '25,000 IQD',
    createdBy: 'دیاری (ئەدمین)',
    createdAt: '2026-10-17',
    usedByMac: null
  },
  {
    id: 'code-pro-3m',
    code: 'PRO-3M-2026',
    planId: 'plan_pro',
    planName: 'پڕۆ (PRO • 3M)',
    durationDays: 90,
    credits: 3,
    status: 'بەردەست',
    price: '15,000 IQD',
    createdBy: 'دیاری (ئەدمین)',
    createdAt: '2026-10-17',
    usedByMac: null
  },
  {
    id: 'code-pro-legacy',
    code: 'PRO-2026-KRD',
    planId: 'plan_pro',
    planName: 'پڕۆ (PRO • 3M)',
    durationDays: 90,
    credits: 3,
    status: 'بەردەست',
    price: '15,000 IQD',
    createdBy: 'دیاری (ئەدمین)',
    createdAt: '2026-10-17',
    usedByMac: null
  }
];

import { DABIN_OFFICIAL_CHANNEL } from './dbStorage';

// Live Activation & Trial Requests Queue from Mobile and TV clients
export const INITIAL_ACTIVATION_REQUESTS = [];

// Curated 56-channel playlist with Kurdish channels prioritized first
// Strict Server-Only Architecture: Channel 1 is DABIN.TV Channel; all others load exclusively from server
export const CHANNELS_DATA = [DABIN_OFFICIAL_CHANNEL];

// Legacy channel backup definitions retained for backward compatibility
const LEGACY_CHANNELS_DATA = [
  // General Kurdish
  {
    id: 'ch-1',
    number: 1,
    name: 'Kurdmax HD Sorani',
    category: 'کەناڵە گشتییەکان',
    is4K: true,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/1356.jpg?51826',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=kurdmax',
    url: 'https://stream.shams.tv/hls/0/stream.m3u8',
    backupUrl: 'https://iko-live.akamaized.net/KurdsatTV/master_2.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=201893&extension=ts&play_token=Yjj2KvRbbn',
    quality: '1080p 50fps',
    description: 'کەناڵی گشتی خێزانی، دراما، کۆمیدیا و بەرنامەی جۆراوجۆر',
    epg: {
      currentShow: 'درامای شەوانی هەولێر (ئەڵقەی ١٤)',
      nextShow: 'بەرنامەی شەوانەی کوردماکس - میوانداری تایبەت',
      timeSlot: '20:00 - 21:15',
      progress: 68
    }
  },
  {
    id: 'ch-2',
    number: 2,
    name: 'Kurd Max 4K ◉',
    category: 'کەناڵە گشتییەکان',
    is4K: true,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/1351.jpg?25331',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=kurdmax4k',
    url: 'https://stream.shams.tv/hls/0/stream.m3u8',
    backupUrl: 'https://media.streambrothers.com:1936/8226/8226/playlist.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=283208&extension=ts&play_token=ZilY25wZT4',
    quality: '4K Ultra HD',
    description: 'پەخشی سەرەکی کوردماکس بە بەرزترین کوالێتی 4K',
    epg: {
      currentShow: 'فیلمی سینەمایی: پاڵەوانانی چیا (4K HDR)',
      nextShow: 'کلیپ و گۆرانی کوردی 4K',
      timeSlot: '21:00 - 23:00',
      progress: 45
    }
  },
  {
    id: 'ch-3',
    number: 3,
    name: 'Kurdmax Show HD',
    category: 'کەناڵە گشتییەکان',
    is4K: false,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/1352.jpg?81583',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=kurdmaxshow',
    url: 'https://stream.shams.tv/hls/0/stream.m3u8',
    backupUrl: 'https://live.channel8.com/Channel8-Kurdish/tracks-v4a1/mono.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=7174&extension=ts&play_token=e2V89pGw5N',
    quality: '1080p HD',
    description: 'کەناڵی تایبەت بە زنجیرە دراماکان و فیلمە دۆبلاژکراوەکان',
    epg: {
      currentShow: 'زنجیرەی خێزانی: ڕۆژانی ڕووناکی',
      nextShow: 'درامای دۆبلاژکراوی تورکی',
      timeSlot: '19:30 - 20:45',
      progress: 82
    }
  },
  {
    id: 'ch-4',
    number: 4,
    name: 'Net TV HD',
    category: 'کەناڵە گشتییەکان',
    is4K: false,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/1346.jpg?15540',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=nettv',
    url: 'https://stream.shams.tv/hls/0/stream.m3u8',
    backupUrl: 'https://d1x82nydcxndze.cloudfront.net/live/index_720p25.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=201898&extension=ts&play_token=59g9yqxN9Y',
    quality: '1080p HD',
    description: 'کەناڵی کات بەسەربردن، میوانداری و بەرنامەی جەماوەری',
    epg: {
      currentShow: 'بەرنامەی نێت گرام (ڕاستەوخۆ)',
      nextShow: 'گۆرانییە هەڵبژێردراوەکانی ٢٠٢٦',
      timeSlot: '20:15 - 22:00',
      progress: 30
    }
  },
  {
    id: 'ch-5',
    number: 5,
    name: 'Baboly HD',
    category: 'کەناڵە گشتییەکان',
    is4K: false,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/3207.png?9804',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=baboly',
    url: 'https://stream.shams.tv/hls/0/stream.m3u8',
    backupUrl: 'https://stream.shams.tv/hls/0/stream.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=202070&extension=ts&play_token=3hYSh1ecJB',
    quality: '1080p HD',
    description: 'کەناڵی تایبەتی بابۆلی بە پەخشی فول ئێچ دی',
    epg: {
      currentShow: 'بەرنامەی کۆمیدی و کەشخە',
      nextShow: 'کورتە فیلمی ناوخۆیی',
      timeSlot: '20:00 - 21:00',
      progress: 50
    }
  },

  // News Kurdish
  {
    id: 'ch-6',
    number: 6,
    name: 'Kurdistan 24 HD',
    category: 'هەواڵ و زانیاری',
    is4K: false,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/966.jpg?30760',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=k24',
    url: 'https://d1x82nydcxndze.cloudfront.net/live/index_720p25.m3u8',
    backupUrl: 'https://iko-live.akamaized.net/KurdsatTV/master_2.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=201890&extension=ts&play_token=ezrVg6CQAY',
    quality: '720p/1080p Live',
    description: 'پەخشی ڕاستەوخۆی کوردستان ٢٤ لە هەولێرەوە',
    epg: {
      currentShow: 'ژووری هەواڵی سەرەکی کاتژمێر ٨:٠٠',
      nextShow: 'بەرنامەی باسی ڕۆژ - شیکاری سیاسی',
      timeSlot: '20:00 - 21:00',
      progress: 75
    }
  },
  {
    id: 'ch-7',
    number: 7,
    name: 'Kurdsat TV HD',
    category: 'هەواڵ و زانیاری',
    is4K: true,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/1354.jpg?1957',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=kurdsat',
    url: 'https://iko-live.akamaized.net/KurdsatTV/master_2.m3u8',
    backupUrl: 'https://media.streambrothers.com:1936/8226/8226/playlist.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=272291&extension=ts&play_token=Myy8Ge4MoS',
    quality: '1080p Akamai HLS',
    description: 'کەناڵی نیشتمانی کوردسات - سلێمانی',
    epg: {
      currentShow: 'بەرنامەی کلتوور و مێژووی کورد',
      nextShow: 'دەنگوباسی ئابووری کوردستان',
      timeSlot: '20:30 - 21:30',
      progress: 40
    }
  },
  {
    id: 'ch-8',
    number: 8,
    name: 'NRT 1 TV 4K',
    category: 'هەواڵ و زانیاری',
    is4K: true,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/980.jpg?20015',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=nrt1',
    url: 'https://media.streambrothers.com:1936/8226/8226/playlist.m3u8',
    backupUrl: 'https://live.channel8.com/Channel8-Kurdish/tracks-v4a1/mono.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=272569&extension=ts&play_token=lWXiU6JNS5',
    quality: '4K Ultra News',
    description: 'ئێن ئاڕ تی هەواڵ و ڕووداوە سیاسی و مەیدانییەکان',
    epg: {
      currentShow: 'ڕاگەیاندنی پەیامنێران لە شارەکانەوە',
      nextShow: 'دیبەیتی تاوتوێی شەو',
      timeSlot: '21:00 - 22:30',
      progress: 25
    }
  },
  {
    id: 'ch-9',
    number: 9,
    name: 'Channel 8 Kurdish',
    category: 'هەواڵ و زانیاری',
    is4K: true,
    logo: 'https://live.channel8.com/favicon.ico',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=channel8',
    url: 'https://live.channel8.com/Channel8-Kurdish/tracks-v4a1/mono.m3u8',
    backupUrl: 'https://d1x82nydcxndze.cloudfront.net/live/index_720p25.m3u8',
    quality: '1080p Premium HLS',
    description: 'کەناڵ ٨ - میدیای بێلایەن و ڕاستەوخۆ',
    epg: {
      currentShow: 'بەڵگەفیلمی زانستی و ژینگەیی',
      nextShow: 'کۆتا هەواڵەکانی جیهان',
      timeSlot: '20:00 - 21:00',
      progress: 60
    }
  },

  // Sports
  {
    id: 'ch-11',
    number: 11,
    name: 'Duhok Sport 4K',
    category: 'وەرزشی',
    is4K: true,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/13454.jpg?30401',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=duhok',
    url: 'https://live.teleradiocom.tj:443/5/3m.m3u8',
    backupUrl: 'https://dmitwlvvll.cdn.mangomolo.com:443/dubaisportshd5/smil:dubaisportshd5.smil/chunklist_b1600000.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=381104&extension=ts&play_token=cmrTYM0CfR',
    quality: '4K 60fps',
    description: 'کەناڵی دهۆک سپۆرت پەخشی یارییە گەرمەکانی خولە ئەوروپییەکان',
    epg: {
      currentShow: 'خولی یانە پاڵەوانەکانی ئەوروپا (ڕاستەوخۆ)',
      nextShow: 'ستۆدیۆی شیکاری یارییەکان',
      timeSlot: '21:45 - 23:45',
      progress: 55
    }
  },
  {
    id: 'ch-12',
    number: 12,
    name: 'Astera Sport HD',
    category: 'وەرزشی',
    is4K: false,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/8464.png?60084',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=asterasport',
    url: 'https://dmitwlvvll.cdn.mangomolo.com:443/dubaisportshd5/smil:dubaisportshd5.smil/chunklist_b1600000.m3u8',
    backupUrl: 'https://live.teleradiocom.tj:443/5/3m.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=201937&extension=ts&play_token=TeB9sCo7el',
    quality: '1080p 50fps',
    description: 'ئەستێرە سپۆرت بە کۆمێنتاری کوردی',
    epg: {
      currentShow: 'کورتەی گۆڵە جوانەکانی هەفتە',
      nextShow: 'خولی ئینگلیزی پریمیەرلیگ',
      timeSlot: '19:00 - 20:30',
      progress: 90
    }
  },
  {
    id: 'ch-13',
    number: 13,
    name: 'beIN SPORTS 1 Premium',
    category: 'وەرزشی',
    is4K: true,
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/BeIN_Sports_1.svg/300px-BeIN_Sports_1.svg.png',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=beinsport1',
    url: 'https://stream.shams.tv/hls/0/stream.m3u8',
    backupUrl: 'https://live.teleradiocom.tj:443/5/3m.m3u8',
    tsUrl: 'http://d4k4u.com:80/play/live.php?mac=00:1A:79:B5:18:70&stream=3854&extension=ts&play_token=p1uzKUv4Xs',
    quality: '1080p 60fps / 4K',
    description: 'پەخشی سەرەکی بین سپۆرت بۆ خولەکانی پاڵەوانان و ئینگلیزی',
    epg: {
      currentShow: 'کلاسیکۆی گەورە: ڕیاڵ مەدرید vs بەرشلۆنە',
      nextShow: 'بەرنامەی هەڵسەنگاندنی ناوبژیوانان',
      timeSlot: '21:00 - 23:30',
      progress: 62
    }
  },

  // Kids
  {
    id: 'ch-15',
    number: 15,
    name: 'Afarin TV 4K',
    category: 'منداڵان',
    is4K: true,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/8462.jpg?69318',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=afarin',
    url: 'http://afarintv.flashmediacast.com:1935/afarinTV/livestream/chunklist_w1505309502.m3u8?nimblesessionid=574377&',
    backupUrl: 'https://zindikurmanci.zaroktv.com.tr/hls/0/stream.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=328428&extension=ts&play_token=mvNBmrtDRO',
    quality: '4K Ultra Kids',
    description: 'کەناڵی پەروەردەیی و گۆرانی و چیرۆکی منداڵان بە کوردی',
    epg: {
      currentShow: 'گۆرانییە فێرکارییەکانی ئەلفوبێی کوردی',
      nextShow: 'چیرۆکەکانی کاکە ئافەرین',
      timeSlot: '18:00 - 19:30',
      progress: 70
    }
  },
  {
    id: 'ch-16',
    number: 16,
    name: 'Zarok TV HD',
    category: 'منداڵان',
    is4K: false,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/3905.jpg?42651',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=zarok',
    url: 'https://zindikurmanci.zaroktv.com.tr/hls/0/stream.m3u8',
    backupUrl: 'https://stream.shams.tv/hls/0/stream.m3u8',
    quality: '1080p HLS',
    description: 'زارۆک تیڤی - ئەنیمەیشن و کارتۆنی جیهانی بە زاراوەکانی کوردی',
    epg: {
      currentShow: 'کارتۆنی شێرۆکە و برادەرانی',
      nextShow: 'سەرکێشییەکانی پڵنگ',
      timeSlot: '19:00 - 20:15',
      progress: 45
    }
  },

  // Movies & VOD
  {
    id: 'ch-18',
    number: 18,
    name: 'Kurd Movies 4K',
    category: 'سینەما و فیلم',
    is4K: true,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/8548.jpg?78160',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=kurdmovies',
    url: 'https://stream.shams.tv/hls/0/stream.m3u8',
    backupUrl: 'https://media.streambrothers.com:1936/8226/8226/playlist.m3u8',
    tsUrl: 'http://delta8k.xyz:80/play/live.php?mac=00:1A:79:A8:29:69&stream=380731&extension=ts&play_token=8XmRMQKHlj',
    quality: '4K Ultra Cinema',
    description: 'باشترین فیلمە نوێ و دۆبلاژکراوەکانی ٢٠٢٥ و ٢٠٢٦',
    epg: {
      currentShow: 'فیلمی هۆلیوود: جەنگاوەری چارەنووس (دۆبلاژ)',
      nextShow: 'فیلمی کۆری دۆبلاژکراوی کوردی',
      timeSlot: '21:30 - 23:45',
      progress: 35
    }
  },

  // Islamic & Quran
  {
    id: 'ch-20',
    number: 20,
    name: 'قورئانی پیرۆز (مەکە مکرمە)',
    category: 'ئایینی و قورئان',
    is4K: true,
    logo: 'http://icon-tmdb.me/stalker_portal/misc/logos/320/10825.png?97657',
    fallbackLogo: 'https://api.dicebear.com/7.x/identicon/svg?seed=quran',
    url: 'https://media2.streambrothers.com:1936/8122/8122/chunklist_w300559019.m3u8',
    backupUrl: 'https://stream.shams.tv/hls/0/stream.m3u8',
    quality: '1080p Makkah Live',
    description: 'پەخشی ڕاستەوخۆی مزگەوتی حەرام لە مەککەی پیرۆز',
    epg: {
      currentShow: 'تەوافی کەعبەی پیرۆز و خوێندنەوەی قورئان',
      nextShow: 'نوێژی بەیانی لە حەرەمی مەککە',
      timeSlot: '20:00 - 24:00',
      progress: 50
    }
  }
];

export const VOD_SERIES = [];

export const VOD_MOVIES = [];

export const SUBSCRIPTION_PLANS = [
  {
    id: 'plan_trial',
    tier: 'trial',
    name: 'تێستی ٢٤ کاتژمێر (Free Trial)',
    durationDays: 1,
    creditsAllocated: 0.0,
    price: '0 IQD',
    priceIqdNum: 0,
    priceUsd: '$0',
    iconName: 'Tv',
    badge: 'FREE • 24H',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
    description: 'تێستی بێبەرامبەری ٢٤ کاتژمێر بۆ بینەرانی نوێ',
    color: 'from-slate-600 to-slate-800'
  },
  {
    id: 'plan_1m',
    tier: 'month1',
    name: '١ مانگ (1 Month)',
    durationDays: 30,
    creditsAllocated: 0.1,
    price: '5,000 IQD',
    priceIqdNum: 5000,
    priceUsd: '$3.80',
    iconName: 'Zap',
    badge: '1M • 0.1 Cr',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    description: '١ مانگ (0.1 کرێدیت) + تەواوی کەناڵەکان و فیلم و دراما',
    color: 'from-sky-600 to-blue-700'
  },
  {
    id: 'plan_pro',
    tier: 'month3',
    name: '٣ مانگ (3 Months)',
    durationDays: 90,
    creditsAllocated: 0.3,
    price: '9,000 IQD',
    priceIqdNum: 9000,
    priceUsd: '$6.80',
    iconName: 'Sparkles',
    badge: '3M • 0.3 Cr',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    description: '٣ مانگ (0.3 کرێدیت) بە داشکاندنی تایبەت',
    color: 'from-cyan-600 to-teal-700'
  },
  {
    id: 'plan_pro_plus',
    tier: 'month6',
    name: '٦ مانگ (6 Months)',
    durationDays: 180,
    creditsAllocated: 0.6,
    price: '15,000 IQD',
    priceIqdNum: 15000,
    priceUsd: '$11.50',
    iconName: 'Flame',
    badge: '6M • 0.6 Cr',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    description: '٦ مانگ (0.6 کرێدیت) + کواڵیتی 4K و سینەمای تایبەت',
    color: 'from-purple-600 to-violet-800'
  },
  {
    id: 'plan_ultra',
    tier: 'year1',
    name: '١ ساڵ دایمۆند (1 Year Diamond)',
    durationDays: 365,
    creditsAllocated: 1.0,
    price: '28,000 IQD',
    priceIqdNum: 28000,
    priceUsd: '$21.50',
    iconName: 'Crown',
    badge: 'DIAMOND • 1.0 Cr',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    description: '١ ساڵی تەواو دایمۆند VIP (1.0 کرێدیت) بە باشترین نرخ',
    color: 'from-amber-500 to-orange-600'
  }
];


