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
    subPlan: 'VIP تێستی تەواو (چالاک)',
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
    subPlan: 'ساڵانە (ئەدمین)',
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
    subPlan: 'VIP شەش مانگی',
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
    subPlan: 'VIP سێ مانگی',
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
    id: 'code-vip-97',
    code: 'NNDD-97',
    planId: 'sub_vip',
    planName: 'ئەکاونتی تێستی VIP (nndd-97)',
    durationDays: 365,
    status: 'بەردەست',
    price: '0 IQD (تێست)',
    createdBy: 'ئەدمین (تێستی ڕاستەوخۆ)',
    createdAt: '2026-10-08',
    usedByMac: null
  },
  {
    id: 'code-1',
    code: 'KRD-2026-TRIAL-8821',
    planId: 'trial_24h',
    planName: 'تێستی ٢٤ کاتژمێر',
    durationDays: 1,
    status: 'بەردەست',
    price: '0 IQD',
    createdBy: 'کاروان (بریکاری هەولێر)',
    createdAt: '2026-10-08',
    usedByMac: null
  },
  {
    id: 'code-2',
    code: 'KRD-2026-1M-4920',
    planId: 'sub_1m',
    planName: 'پلانی ١ مانگی',
    durationDays: 30,
    status: 'بەردەست',
    price: '10,000 IQD',
    createdBy: 'دیاری (ئەدمین)',
    createdAt: '2026-10-08',
    usedByMac: null
  },
  {
    id: 'code-3',
    code: 'KRD-2026-3M-7714',
    planId: 'sub_3m',
    planName: 'پلانی ٣ مانگی',
    durationDays: 90,
    status: 'بەردەست',
    price: '25,000 IQD',
    createdBy: 'دیاری (ئەدمین)',
    createdAt: '2026-10-08',
    usedByMac: null
  },
  {
    id: 'code-4',
    code: 'KRD-2026-1Y-GOLD-9901',
    planId: 'sub_1y',
    planName: 'پلانی ١ ساڵی تەواو',
    durationDays: 365,
    status: 'چالاککراوە',
    price: '75,000 IQD',
    createdBy: 'دیاری (ئەدمین)',
    createdAt: '2026-10-01',
    usedByMac: '00:1A:79:A8:29:69'
  }
];

import { KURDISH_PLAYLIST_CHANNELS } from './kurdishPlaylist';

// Live Activation & Trial Requests Queue from Mobile and TV clients
export const INITIAL_ACTIVATION_REQUESTS = [
  {
    id: 'req-1',
    clientName: 'ئاراس محەمەد',
    phone: '07501234567',
    serialNumber: 'NNDD-M748-92B1-4820',
    deviceId: 'DEV-A7F9-C102',
    deviceIp: '149.255.228.45 (Erbil)',
    deviceModel: 'Samsung Smart TV (Tizen)',
    requestType: 'trial_24h',
    planName: 'تێستی ٢٤ کاتژمێر (بێ بەرامبەر)',
    status: 'pending',
    requestedAt: '2026-10-08 14:30'
  },
  {
    id: 'req-2',
    clientName: 'هێمن ئەحمەد',
    phone: '07709876543',
    serialNumber: 'NNDD-P312-55A0-1194',
    deviceId: 'DEV-B901-X882',
    deviceIp: '185.180.14.92 (Sulaymaniyah)',
    deviceModel: 'Apple iPhone 16 Pro',
    requestType: 'sub_3m',
    planName: 'پاکێجی ٣ مانگی (25,000 IQD)',
    status: 'pending',
    requestedAt: '2026-10-08 13:15'
  },
  {
    id: 'req-3',
    clientName: 'سەردار فەرهاد',
    phone: '07504443322',
    serialNumber: 'NNDD-K812-44C9-9021',
    deviceId: 'DEV-C440-E991',
    deviceIp: '149.255.228.110 (Duhok)',
    deviceModel: 'Android TV Box (Xiaomi Mi Box S)',
    requestType: 'sub_1y',
    planName: 'پلانی ١ ساڵی تەواو (75,000 IQD)',
    status: 'approved',
    requestedAt: '2026-10-07 18:20'
  }
];

// Curated 56-channel playlist with Kurdish channels prioritized first
export const CHANNELS_DATA = KURDISH_PLAYLIST_CHANNELS;

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

export const VOD_SERIES = [
  {
    id: 'ser-1',
    title: 'تەمی بابا (Tami Baba)',
    category: 'درامای کوردی, دراما',
    seasons: 2,
    episodesCount: 8,
    rating: '9.5',
    year: '2025',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    description: 'شاکاری درامی کوردی لە ناوچەکانی سلێمانی و کەرکووک؛ گێڕانەوەی ململانێی نێوان خێزانەکان لە سەردەمێکی پڕ لە ئاڵۆزی و گۆڕانکاری، بە دیمەنی کاریگەر و بەرهەمهێنانی سینەمایی پێشکەوتوو.',
    episodes: [
      { number: 1, title: 'ئەڵقەی ١: دەستپێکی گەشتەکە', duration: '12 خولەک', streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
      { number: 2, title: 'ئەڵقەی ٢: سێبەری ڕابردوو', duration: '10 خولەک', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 3, title: 'ئەڵقەی ٣: پێشبڕکێی چارەنووس', duration: '73 خولەک', streamUrl: 'https://archive.org/download/TheFastandtheFuriousJohnIreland1954goofyrip/TheFastandtheFuriousJohnIreland1954goofyrip_512kb.mp4' },
      { number: 4, title: 'ئەڵقەی ٤: نهێنیی ماڵە چۆڵەکە', duration: '75 خولەک', streamUrl: 'https://archive.org/download/house_on_haunted_hill_ipod/house_on_haunted_hill.mp4' },
      { number: 5, title: 'ئەڵقەی ٥: قووڵایی دارستان', duration: '105 خولەک', streamUrl: 'https://archive.org/download/JungleBook/Jungle_Book.mp4' },
      { number: 6, title: 'ئەڵقەی ٦: شەڕی مان و نەمان', duration: '77 خولەک', streamUrl: 'https://archive.org/download/charlie_chaplin_film_fest/charlie_chaplin_film_fest_512kb.mp4' },
      { number: 7, title: 'ئەڵقەی ٧: لێدانی ئەژدیها', duration: '82 خولەک', streamUrl: 'https://archive.org/download/Return_of_the_Kung_Fu_Dragon/Return_of_the_Kung_Fu_Dragon_512kb.mp4' },
      { number: 8, title: 'ئەڵقەی ٨: کۆتایی بەهێز', duration: '15 خولەک', streamUrl: 'https://ireplay.tv/test/blender.m3u8' }
    ]
  },
  {
    id: 'ser-2',
    title: 'گەڕەکی دادپەروەری (Judgement Alley)',
    category: 'ئاکشن و تاوان, ئاکشن',
    seasons: 1,
    episodesCount: 6,
    rating: '9.4',
    year: '2026',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80',
    description: 'ڕووداوی پڕ لە هەستبزوێنی بەدواکەوتنی باندێکی تاوانکاری مەترسیدار لە شەقام و کۆڵانە باریکەکانی پایتەخت، کە لەلایەن پۆلیس و هێزە تایبەتەکانەوە گەمارۆ دەدرێن.',
    episodes: [
      { number: 1, title: 'ئەڵقەی ١: ڕاوکردنی سێبەرەکان', duration: '73 خولەک', streamUrl: 'https://archive.org/download/TheFastandtheFuriousJohnIreland1954goofyrip/TheFastandtheFuriousJohnIreland1954goofyrip_512kb.mp4' },
      { number: 2, title: 'ئەڵقەی ٢: تۆڕی شاردراوە', duration: '82 خولەک', streamUrl: 'https://archive.org/download/Return_of_the_Kung_Fu_Dragon/Return_of_the_Kung_Fu_Dragon_512kb.mp4' },
      { number: 3, title: 'ئەڵقەی ٣: پێشڕەوی بەرەو ئامانج', duration: '12 خولەک', streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
      { number: 4, title: 'ئەڵقەی ٤: خاڵی وەرچەرخان', duration: '10 خولەک', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 5, title: 'ئەڵقەی ٥: گەمارۆی کۆتایی', duration: '75 خولەک', streamUrl: 'https://archive.org/download/house_on_haunted_hill_ipod/house_on_haunted_hill.mp4' },
      { number: 6, title: 'ئەڵقەی ٦: دادپەروەری باڵادەست', duration: '105 خولەک', streamUrl: 'https://archive.org/download/JungleBook/Jungle_Book.mp4' }
    ]
  },
  {
    id: 'ser-3',
    title: 'شازادەی باران (Rain Princess)',
    category: 'مێژوویی و ئەفسانەیی, دراما',
    seasons: 1,
    episodesCount: 5,
    rating: '9.2',
    year: '2025',
    poster: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
    description: 'چیرۆکی حەماسەت، جوانی و دەسەڵاتی میرنشینە دێرینەکان بە دۆبلاژی دەنگی شیرینی کوردی، لەگەڵ تابلۆی سینەمایی سروشتی ئەفسووناوی ناوچەکە.',
    episodes: [
      { number: 1, title: 'ئەڵقەی ١: هاتنی پاییز و کۆشک', duration: '105 خولەک', streamUrl: 'https://archive.org/download/JungleBook/Jungle_Book.mp4' },
      { number: 2, title: 'ئەڵقەی ٢: پەیمانی برایەتی', duration: '12 خولەک', streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
      { number: 3, title: 'ئەڵقەی ٣: سەمای شمشێرەکان', duration: '10 خولەک', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 4, title: 'ئەڵقەی ٤: گەمارۆی قەڵای دێرین', duration: '15 خولەک', streamUrl: 'https://ireplay.tv/test/blender.m3u8' },
      { number: 5, title: 'ئەڵقەی ٥: سەربەرزی نەتەوە', duration: '73 خولەک', streamUrl: 'https://archive.org/download/TheFastandtheFuriousJohnIreland1954goofyrip/TheFastandtheFuriousJohnIreland1954goofyrip_512kb.mp4' }
    ]
  },
  {
    id: 'ser-4',
    title: 'سێبەری چیاکان (Shadow of Mountains)',
    category: 'نهێنی و ترسناک, ترسناک',
    seasons: 1,
    episodesCount: 4,
    rating: '9.1',
    year: '2026',
    poster: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    description: 'گرووپێک لە گەنجانی شاخەوان لە بەرزایییە بەفراوییەکانی کوردستان ڕووبەڕووی نهێنییەکی نادیاری مێژوویی دەبنەوە کە هەموو بەسەرهاتەکەیان دەگۆڕێت.',
    episodes: [
      { number: 1, title: 'ئەڵقەی ١: بەرزایییە بەفراوییەکان', duration: '75 خولەک', streamUrl: 'https://archive.org/download/house_on_haunted_hill_ipod/house_on_haunted_hill.mp4' },
      { number: 2, title: 'ئەڵقەی ٢: ئەشکەوتی نادیار', duration: '73 خولەک', streamUrl: 'https://archive.org/download/TheFastandtheFuriousJohnIreland1954goofyrip/TheFastandtheFuriousJohnIreland1954goofyrip_512kb.mp4' },
      { number: 3, title: 'ئەڵقەی ٣: بەڵگەنامەی ونبوو', duration: '12 خولەک', streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
      { number: 4, title: 'ئەڵقەی ٤: زریانی چاوەڕواننەکراو', duration: '10 خولەک', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' }
    ]
  },
  {
    id: 'ser-5',
    title: 'کۆمیدیای پایتەخت (Capital Comedy)',
    category: 'کۆمیدی و خێزانی, کۆمیدی',
    seasons: 1,
    episodesCount: 4,
    rating: '9.3',
    year: '2025',
    poster: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=80',
    description: 'پێکەنین و بەسەرهاتی خۆش لەگەڵ ئەستێرە دیارەکان و بەسەرهاتی کۆمیدی ژیانی ڕۆژانەی گەنجان بە شێوازێکی پڕ لە وزە و شادی.',
    episodes: [
      { number: 1, title: 'ئەڵقەی ١: سەرەتا لە کافێ', duration: '77 خولەک', streamUrl: 'https://archive.org/download/charlie_chaplin_film_fest/charlie_chaplin_film_fest_512kb.mp4' },
      { number: 2, title: 'ئەڵقەی ٢: کێشەی هاوڕێیان', duration: '10 خولەک', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 3, title: 'ئەڵقەی ٣: پێشبڕکێی شێتانە', duration: '105 خولەک', streamUrl: 'https://archive.org/download/JungleBook/Jungle_Book.mp4' },
      { number: 4, title: 'ئەڵقەی ٤: ئاهەنگی کۆتایی', duration: '12 خولەک', streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' }
    ]
  },
  {
    id: 'ser-6',
    title: 'سروشتی کوردستان و جیهان (Wild Nature 4K)',
    category: 'دۆکیۆمێنتاری و سروشت, بەڵگەنامەیی',
    seasons: 1,
    episodesCount: 4,
    rating: '9.7',
    year: '2026',
    poster: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&auto=format&fit=crop&q=80',
    description: 'ناوازەترین بەڵگەفیلمی 4K لەسەر گیانلەبەران، کێوە بەرزەکان، ڕووبارەکان و سروشتی پاک بە وێنەگرتنی ناوازەی سینەمایی.',
    episodes: [
      { number: 1, title: 'ئەڵقەی ١: بەرزایییەکانی پیرەمەگروون', duration: '15 خولەک', streamUrl: 'https://ireplay.tv/test/blender.m3u8' },
      { number: 2, title: 'ئەڵقەی ٢: دەربەندی کۆتایی', duration: '12 خولەک', streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8' },
      { number: 3, title: 'ئەڵقەی ٣: لوتکەی چیا بەفرینەکان', duration: '10 خولەک', streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
      { number: 4, title: 'ئەڵقەی ٤: دۆڵی هاوینە', duration: '105 خولەک', streamUrl: 'https://archive.org/download/JungleBook/Jungle_Book.mp4' }
    ]
  }
];

export const VOD_MOVIES = [
  {
    id: 'mov-1',
    title: 'فرمێسکی ئاسنین (Tears of Steel)',
    genre: 'خەیاڵی زانستی, ئاکشن',
    duration: '12m (4K Remastered)',
    rating: '9.5',
    quality: '4K Ultra HD',
    year: '2025',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    streamUrl: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    description: 'فیلمێکی خەیاڵی زانستی و ناوازە بە گرافیکی پێشکەوتووی 4K دەربارەی جەنگاوەرانی ئاییندە کە هەوڵی ڕزگارکردنی مرۆڤایەتی دەدەن لە ناوەندی شارێکی کاولکراو.'
  },
  {
    id: 'mov-2',
    title: 'کەرروێشکی بەهێز (Big Buck Bunny)',
    genre: 'ئەنیمەیشن, کۆمیدی, خێزانی',
    duration: '10m (1080p 60fps)',
    rating: '9.3',
    quality: '1080p 60fps',
    year: '2026',
    poster: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&auto=format&fit=crop&q=80',
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    description: 'ئەنیمەیشنێکی سەرنجڕاکێش و بەناوبانگ بۆ هەموو تەمەنەکان بە کوالێتی هەی دێفینیشن دەربارەی کەرروێشکێکی دڵپاک کە ڕووبەڕووی شەڕانگێزانی دارستان دەبێتەوە.'
  },
  {
    id: 'mov-3',
    title: 'خێرا و تووڕە (The Fast and the Furious)',
    genre: 'ئاکشن, تاوان, پێشبڕکێ',
    duration: '1h 13m',
    rating: '8.9',
    quality: 'HD Remastered',
    year: '2024',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1600&auto=format&fit=crop&q=80',
    streamUrl: 'https://archive.org/download/TheFastandtheFuriousJohnIreland1954goofyrip/TheFastandtheFuriousJohnIreland1954goofyrip_512kb.mp4',
    description: 'یەکێک لە ناوازەترین کلاسیکەکانی ئاکشن و پێشبڕکێی ئۆتۆمبێل و هەڵاتن لە دەستی یاسا بە کوالێتی بەرز و پەخشی ڕاستەوخۆ بەبێ پچڕان.'
  },
  {
    id: 'mov-4',
    title: 'ماڵی سەر گردە جنۆکەدارەکە (House on Haunted Hill)',
    genre: 'ترسناک, نهێنی, ڕازداری',
    duration: '1h 15m',
    rating: '8.8',
    quality: 'HD Classic',
    year: '2025',
    poster: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    streamUrl: 'https://archive.org/download/house_on_haunted_hill_ipod/house_on_haunted_hill.mp4',
    description: 'شاکارێکی بواری ترس و سەرکێشی دەربارەی بانگهێشتکردنی پێنج کەس بۆ قەڵایەکی ترسناک کە هەرکەسێک شەوێکی تێدا بمێنێتەوە خەڵاتێکی ملیۆنی وەردەگرێت.'
  },
  {
    id: 'mov-5',
    title: 'کتێبی دارستان (The Jungle Book)',
    genre: 'سەرکێشی, خێزانی, ئەفسانەیی',
    duration: '1h 45m',
    rating: '9.1',
    quality: 'Full HD',
    year: '2025',
    poster: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=80',
    streamUrl: 'https://archive.org/download/JungleBook/Jungle_Book.mp4',
    description: 'داستانی بەناوبانگی ماوگلی و ئاژەڵانی ناو قووڵایی دارستانە مەترسیدارەکان بە ڕەنگ و کوالێتی دیجیتاڵی بەرز، گونجاو بۆ سەرجەم ئەندامانی خێزان.'
  },
  {
    id: 'mov-6',
    title: 'فێستیڤاڵی چارلی چاپلین (Charlie Chaplin Festival)',
    genre: 'کۆمیدی, کلاسیک, خێزانی',
    duration: '1h 17m',
    rating: '9.6',
    quality: 'HD Remastered',
    year: '2024',
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1600&auto=format&fit=crop&q=80',
    streamUrl: 'https://archive.org/download/charlie_chaplin_film_fest/charlie_chaplin_film_fest_512kb.mp4',
    description: 'کۆمەڵێک لە پێبکەنێنترین و بەچێژترین کورتەفیلم و چیرۆکە کۆمیدییەکانی کەسایەتی ئەفسانەیی سینەمای جیهانی چارلی چاپلین بە ڕوونی چاککراو.'
  },
  {
    id: 'mov-7',
    title: 'گەڕانەوەی ئەژدیهای کۆنگ فۆ (Kung Fu Dragon)',
    genre: 'ئاکشن, هونەری جەنگی',
    duration: '1h 22m',
    rating: '8.7',
    quality: 'HD Remastered',
    year: '2025',
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1600&auto=format&fit=crop&q=80',
    streamUrl: 'https://archive.org/download/Return_of_the_Kung_Fu_Dragon/Return_of_the_Kung_Fu_Dragon_512kb.mp4',
    description: 'فیلمێکی حەماسی شەڕ و هونەری جەنگی ڕۆژهەڵات لەسەر پاراستنی شەرەفی مامۆستای کۆن و تۆڵەکردنەوە لە داگیرکەران بە دیمەنی لێدان و شەڕی بێ هاوتا.'
  },
  {
    id: 'mov-8',
    title: 'سینەمای ئەنیمەیشنی جیهانی (Animation Showcase)',
    genre: 'ئەنیمەیشن, هونەری',
    duration: '15m (4K HDR)',
    rating: '9.4',
    quality: '4K HDR',
    year: '2026',
    poster: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
    streamUrl: 'https://ireplay.tv/test/blender.m3u8',
    description: 'پێشانگای نایابی ئەنیمەیشنی 4K بە بەرزترین تەکنەلۆژیای ڕووناکی و جووڵە بۆ هۆگرانی هونەری دیجیتاڵ.'
  },
  {
    id: 'mov-9',
    title: 'کەناڵی سینەمای کلاسیک (Classic Movies 24/7)',
    genre: 'سینەمای جیهانی, کلاسیک',
    duration: 'پەخشی بەردەوام',
    rating: '9.0',
    quality: '720p HD',
    year: '2026',
    poster: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&auto=format&fit=crop&q=80',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    streamUrl: 'https://30a-tv.com/feeds/pzaz/30atvmovies.m3u8',
    description: 'پەخشی ڕاستەوخۆ و بێ پچڕانی فیلمە بەناوبانگە جیهانییەکان و سینەمای هۆڵیوودی کلاسیک لە کاتی خۆیدا.'
  }
];

export const SUBSCRIPTION_PLANS = [
  {
    id: 'trial_24h',
    name: 'تێستی ٢٤ کاتژمێر (بێ بەرامبەر)',
    durationDays: 1,
    price: '0 IQD',
    badge: 'تێستی خێرا',
    color: 'from-slate-500 to-slate-700'
  },
  {
    id: 'sub_1m',
    name: 'پلانی ١ مانگی',
    durationDays: 30,
    price: '10,000 IQD',
    badge: 'مانگانە',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'sub_3m',
    name: 'پلانی ٣ مانگی',
    durationDays: 90,
    price: '25,000 IQD',
    badge: 'داشکاندن',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 'sub_6m',
    name: 'پلانی ٦ مانگی',
    durationDays: 180,
    price: '45,000 IQD',
    badge: 'باوترین',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'sub_1y',
    name: 'پلانی ١ ساڵی تەواو',
    durationDays: 365,
    price: '75,000 IQD',
    badge: 'باشترین بەها ⭐️',
    color: 'from-amber-500 to-orange-600'
  }
];

