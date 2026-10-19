// Localization & Translation Matrix for NNDD TV
// Supports: Kurdish (ku), Arabic (ar), and English (en)

export const SUPPORTED_LANGUAGES = [
  { id: 'ku', label: 'کوردی', nativeName: 'کوردی (Kurdish)', dir: 'rtl', flag: '☀️' },
  { id: 'ar', label: 'العربية', nativeName: 'العربية (Arabic)', dir: 'rtl', flag: '🌙' },
  { id: 'en', label: 'English', nativeName: 'English (US)', dir: 'ltr', flag: '🌐' }
];

export const TRANSLATIONS = {
  ku: {
    // Navigation Dock
    dashboard: 'داشبۆرد',
    dashboardSub: 'سەرەکی',
    live: 'ڕاستەوخۆ',
    liveSub: 'کەناڵەکان',
    movies: 'فیلمەکان',
    moviesSub: 'سینەما',
    series: 'زنجیرەکان',
    seriesSub: 'دراماکان',
    settings: 'ڕێکخستن',
    settingsSub: 'سیستەم',
    about: 'دەربارە',
    aboutSub: 'زانیاری',

    // Channel Drawer & Controls
    channels: 'کەناڵەکان',
    favorites: 'دڵخوازەکان',
    filter: 'فلتەر',
    edit: 'دەستکاری کەناڵەکان',
    search: 'گەڕان',
    close: 'داخستن',
    noChannelsFound: 'هیچ کەناڵێک نەدۆزرایەوە',
    changeFilterQuery: 'تکایە وشەی گەڕان یان فلتەرەکەت بگۆڕە',
    channelLabel: 'کەناڵی',
    all: 'هەموو',
    categories: 'کەتەگۆرییەکان',
    selectCategory: 'هەڵبژاردنی کەتەگۆری',
    
    // Remote Color Keys
    redKey: 'سوور: کەتەگۆرییەکان',
    greenKey: 'سەوز: گەڕان',
    yellowKey: 'زەرد: شێوازی قاڵب',
    blueKey: 'شین: فلتەر',

    // Virtual Keyboard
    searchPlaceholder: 'گەڕان...',
    spaceKey: '␣ بۆشایی',
    backKey: '⌫ سڕینەوە',
    clearKey: '✕ پاککردن',
    doneKey: '✓ تەواو',

    // Aspect Ratio
    aspectRatio: 'شێوازی بینین (Aspect Ratio)',
    fitScreen: 'پڕاوپڕی شاشە (Fit Screen)',
    cinema169: 'ڕەهەندی سینەمایی (16:9 Cinema)',
    nativeRatio: 'قەبارەی ئەسڵی پەخش (Original Native)',
    classic43: 'قاڵبی کلاسیک (4:3 Classic)',

    // Categories
    catAll: 'هەموو',
    catRudaw: 'ڕووداو',
    catKurdishNews: 'هەواڵەکان کوردی',
    catKurdish: 'کوردی',
    catReligious: 'ئاینی',
    catKids: 'منداڵان',
    catSports: 'وەرزش',
    catMovies: 'سینەما',
    catOthers: 'کەناڵەکانی تر',

    // Dashboard & Idle
    screenCode: 'کۆدی شاشە:',
    copyScreenLink: 'کلیک بکە بۆ کۆپیکردنی لینکی ڕاستەوخۆی ئەم شاشەیە',
    screenLinkCopied: 'لینکی تایبەتی شاشە کۆپیکرا! 📋',
    clickToOpenSections: 'کلیک بکە بۆ کردنەوەی بەشەکان',
    humidity: 'شێ',
    weatherCondition: 'کەشوهەوا',
    pleaseWait: 'تکایە چاوەڕوانبە...',
    serverUpdatingWait: 'تکایە چاوەڕوانبە کاتێک کە سێرڤەر نوێ دەکرێتەوە...',

    // Admin Panel Trilingual Channel Fields
    channelNameKu: 'ناوی کەناڵ بە کوردی (Kurdish Name)',
    channelNameAr: 'ناوی کەناڵ بە عەرەبی (Arabic Name)',
    channelNameEn: 'ناوی کەناڵ بە ئینگلیزی (English Name)',

    // Settings
    settingsTitle: 'ڕێکخستن',
    settingsSubtitle: 'ڕێکخستنی سیستەم و هەژمار',
    languageSection: 'زمان (Language)',
    languageDesc: 'زمانی بەرنامەکە و ئاڕاستەی نیشاندانی کەناڵەکان دیاری بکە:',
    screenCodeTitle: 'کۆدی تایبەتی شاشە (Screen Device Code)',
    screenCodeDesc: 'ئەم کۆدە ناسنامەی تایبەتی ئەم شاشەیەیە. لە کاتی کڕینی پاکێج ئەم کۆدە بدە بە ڕیسێلەر.',
    copyCode: 'کۆپیکردنی کۆد',
    activationTitle: 'لێدانی کۆدی بەشداری (Activation)',
    activationDesc: 'کۆدی بەشداریکردنەکەت لێرە بنووسە بۆ چالاککردن:',
    activationPlaceholder: 'کۆدی بەشداری...',
    activateBtn: 'چالاککردن',
    accountDetails: 'زانیاری هەژمار',
    username: 'ناوی بەکارهێنەر:',
    plan: 'پلان:',
    deviceMac: 'ئایدی / ماک:',
    statusDays: 'دۆخ / ڕۆژەکان:',
    freePlan: 'خۆڕایی (Free Live) • 509 کەناڵ',
    daysRemaining: '{days} ڕۆژ ماوە',
    serverSettings: 'ڕێکخستنی سێرڤەری سەرەکی (Xtream Codes Server)',
    serverMode: 'دۆخی هەڵبژاردنی سێرڤەر (Server Selection Mode):',
    serverLabel: 'ناوی سێرڤەر (Server Label):',
    hostUrl: 'ناونیشانی سێرڤەر (Host URL & Port):',
    password: 'تێپەڕەوشە (Password):',
    liveOsdCode: 'کۆدی نیشاندراو لەسەر شاشەی پەخشی ڕاستەوخۆ (Live OSD Server Code):',
    testConnection: 'پشکنینی پەیوەندی (Test)',
    testingConnection: 'خەریکی پشکنینە...',
    saveAndClearCache: 'سەیڤکردن و پاککردنەوەی تەواوی کاش (Save & Clear Cache)',
    channelsSource: 'سەرچاوەی کەناڵەکان و لۆکاڵ هۆست (Channels Source)',
    channelsSourceDesc: 'دەتوانیت ناونیشانی سێرڤەری لۆکاڵ هۆست یان فایلی JSON دیاری بکەیت:',
    channelsActive: '{count} کەناڵ چالاکە',
    reloadFromSource: 'نوێکردنەوە لە سەرچاوە',
    restoreDefaultSource: 'گەڕانەوە بۆ فایلی بنەڕەتی (/channels.json)',
    logoCacheTitle: 'سەیڤکردنی لۆگۆکان لە ناو ئەپ (LocalStorage Logo Cache)',
    logoCacheDesc: 'هەموو لۆگۆی کەناڵەکان لە ناو لۆکاڵ ستۆریج سەیڤ دەبن تاوەکو بە خێرایی سفر چرکە لۆد ببن:',
    saveAllLogos: 'سەیڤکردنی هەموو لۆگۆکان لە لۆکاڵ ستۆریج',
    clearCache: 'سڕینەوەی کاش',
    playerEngine: 'بزوێنەری پەخش (Player Engine):',
    typography: 'فۆنت و شێوازی نووسین (Typography):',

    // VOD Series & Movies
    searchSeries: 'گەڕان لە دراماکان...',
    searchMovies: 'گەڕان لە فیلمەکان...',
    allSeries: 'هەموو دراماکان',
    allMovies: 'هەموو فیلمەکان',
    watchNow: 'سەیرکردن',
    back: 'گەڕانەوە',
    season: 'وەرزی',
    episode: 'ئەڵقەی',
    episodes: 'ئەڵقەکان',
    year: 'ساڵ',
    rating: 'هەڵسەنگاندن',

    // About
    aboutTitle: 'دەربارەی NNDD TV',
    version: 'وەشان',
    poweredBy: 'گەشەپێدراوە بۆ پێشکەشکردنی باشترین خزمەتگوزاری پەخشی تەلەفزیۆنی و سینەمایی'
  },

  ar: {
    // Navigation Dock
    dashboard: 'الرئيسية',
    dashboardSub: 'الرئيسية',
    live: 'بث مباشر',
    liveSub: 'القنوات',
    movies: 'الأفلام',
    moviesSub: 'السينما',
    series: 'المسلسلات',
    seriesSub: 'دراما',
    settings: 'الإعدادات',
    settingsSub: 'النظام',
    about: 'حول',
    aboutSub: 'معلومات',

    // Channel Drawer & Controls
    channels: 'القنوات',
    favorites: 'المفضلة',
    filter: 'تصفية',
    edit: 'تعديل القنوات',
    search: 'بحث',
    close: 'إغلاق',
    noChannelsFound: 'لم يتم العثور على أي قناة',
    changeFilterQuery: 'يرجى تغيير كلمة البحث أو التصفية',
    channelLabel: 'قناة',
    all: 'الكل',
    categories: 'التصنيفات',
    selectCategory: 'اختر التصنيف',

    // Remote Color Keys
    redKey: 'أحمر: التصنيفات',
    greenKey: 'أخضر: بحث',
    yellowKey: 'أصفر: نسبة العرض',
    blueKey: 'أزرق: تصفية',

    // Virtual Keyboard
    searchPlaceholder: 'بحث...',
    spaceKey: '␣ مسافة',
    backKey: '⌫ حذف',
    clearKey: '✕ مسح',
    doneKey: '✓ تم',

    // Aspect Ratio
    aspectRatio: 'نسبة العرض والشاشة (Aspect Ratio)',
    fitScreen: 'ملء الشاشة (Fit Screen)',
    cinema169: '16:9 سينمائي (Cinema)',
    nativeRatio: 'الحجم الأصلي (Original Native)',
    classic43: '4:3 كلاسيكي (Classic)',

    // Categories
    catAll: 'الكل',
    catRudaw: 'رووداو',
    catKurdishNews: 'الأخبار الكردية',
    catKurdish: 'كردية',
    catReligious: 'إسلامية ودينية',
    catKids: 'أطفال',
    catSports: 'رياضية',
    catMovies: 'سينما',
    catOthers: 'قنوات أخرى',

    // Dashboard & Idle
    screenCode: 'رمز الشاشة:',
    copyScreenLink: 'انقر لنسخ الرابط المباشر لهذه الشاشة',
    screenLinkCopied: 'تم نسخ رابط الشاشة المباشر! 📋',
    clickToOpenSections: 'انقر لفتح الأقسام',
    humidity: 'رطوبة',
    weatherCondition: 'الطقس',
    pleaseWait: 'يرجى الانتظار...',
    serverUpdatingWait: 'يرجى الانتظار أثناء تحديث الخادم...',

    // Admin Panel Trilingual Channel Fields
    channelNameKu: 'اسم القناة بالكردية (Kurdish Name)',
    channelNameAr: 'اسم القناة بالعربية (Arabic Name)',
    channelNameEn: 'اسم القناة بالإنجليزية (English Name)',

    // Settings
    settingsTitle: 'الإعدادات',
    settingsSubtitle: 'تفضيلات التطبيق والحساب',
    languageSection: 'اللغة (Language)',
    languageDesc: 'اختر لغة التطبيق واتجاه عرض قائمة القنوات:',
    screenCodeTitle: 'رمز تعريف الشاشة (Screen Device Code)',
    screenCodeDesc: 'هذا الرمز هو الهوية الفريدة لهذه الشاشة. قدم هذا الرمز للموزع عند الشراء.',
    copyCode: 'نسخ الرمز',
    activationTitle: 'تفعيل الاشتراك (Activation)',
    activationDesc: 'أدخل رمز الاشتراك الخاص بك للتفعيل:',
    activationPlaceholder: 'رمز الاشتراك...',
    activateBtn: 'تفعيل',
    accountDetails: 'تفاصيل الحساب',
    username: 'اسم المستخدم:',
    plan: 'الخطة:',
    deviceMac: 'معرف الجهاز / MAC:',
    statusDays: 'الحالة / الأيام المتبقية:',
    freePlan: 'مجاني (Free Live) • 509 قناة',
    daysRemaining: 'متبقي {days} يوم',
    serverSettings: 'إعدادات خادم Xtream Codes الرئيسي',
    serverMode: 'وضع اختيار الخادم (Server Selection Mode):',
    serverLabel: 'اسم الخادم (Server Label):',
    hostUrl: 'عنوان الخادم (Host URL & Port):',
    password: 'كلمة المرور (Password):',
    liveOsdCode: 'رمز الخادم الظاهر على شاشة البث (Live OSD Code):',
    testConnection: 'فحص الاتصال (Test)',
    testingConnection: 'جارٍ الفحص...',
    saveAndClearCache: 'حفظ ومسح الذاكرة المؤقتة (Save & Clear Cache)',
    channelsSource: 'مصدر القنوات والخادم المحلي (Channels Source)',
    channelsSourceDesc: 'يمكنك تحديد عنوان الخادم المحلي أو ملف JSON لتحديث القنوات تلقائياً:',
    channelsActive: '{count} قناة نشطة',
    reloadFromSource: 'تحديث من المصدر',
    restoreDefaultSource: 'العودة إلى الملف الافتراضي (/channels.json)',
    logoCacheTitle: 'حفظ الشعارات محلياً (LocalStorage Logo Cache)',
    logoCacheDesc: 'يتم حفظ جميع شعارات القنوات في التخزين المحلي للتحميل بسرعة صفر ثانية وبدون إنترنت:',
    saveAllLogos: 'حفظ جميع الشعارات محلياً',
    clearCache: 'مسح الكاش',
    playerEngine: 'محرك المشغل (Player Engine):',
    typography: 'الخط ونمط النص (Typography):',

    // VOD Series & Movies
    searchSeries: 'البحث في المسلسلات...',
    searchMovies: 'البحث في الأفلام...',
    allSeries: 'جميع المسلسلات',
    allMovies: 'جميع الأفلام',
    watchNow: 'مشاهدة الآن',
    back: 'رجوع',
    season: 'الموسم',
    episode: 'الحلقة',
    episodes: 'الحلقات',
    year: 'السنة',
    rating: 'التقييم',

    // About
    aboutTitle: 'حول NNDD TV',
    version: 'الإصدار',
    poweredBy: 'تم تطويره لتقديم أفضل تجربة مشاهدة تلفزيونية وسينمائية فائقة السرعة'
  },

  en: {
    // Navigation Dock
    dashboard: 'Dashboard',
    dashboardSub: 'Home',
    live: 'Live TV',
    liveSub: 'Channels',
    movies: 'Movies',
    moviesSub: 'Cinema',
    series: 'Series',
    seriesSub: 'Dramas',
    settings: 'Settings',
    settingsSub: 'System',
    about: 'About',
    aboutSub: 'Info',

    // Channel Drawer & Controls
    channels: 'Channels',
    favorites: 'Favorites',
    filter: 'Filter',
    edit: 'Edit Channels',
    search: 'Search',
    close: 'Close',
    noChannelsFound: 'No channels found',
    changeFilterQuery: 'Please adjust your search or category filter',
    channelLabel: 'Channel',
    all: 'All',
    categories: 'Categories',
    selectCategory: 'Select Category',

    // Remote Color Keys
    redKey: 'Red: Categories',
    greenKey: 'Green: Search',
    yellowKey: 'Yellow: Aspect Ratio',
    blueKey: 'Blue: Filter',

    // Virtual Keyboard
    searchPlaceholder: 'Search...',
    spaceKey: '␣ Space',
    backKey: '⌫ Delete',
    clearKey: '✕ Clear',
    doneKey: '✓ Done',

    // Aspect Ratio
    aspectRatio: 'Aspect Ratio',
    fitScreen: 'Fit Screen',
    cinema169: '16:9 Cinema',
    nativeRatio: 'Original Native',
    classic43: '4:3 Classic',

    // Categories
    catAll: 'All',
    catRudaw: 'Rudaw',
    catKurdishNews: 'Kurdish News',
    catKurdish: 'Kurdish',
    catReligious: 'Religious',
    catKids: 'Kids',
    catSports: 'Sports',
    catMovies: 'Cinema',
    catOthers: 'Other Channels',

    // Dashboard & Idle
    screenCode: 'Screen Code:',
    copyScreenLink: 'Click to copy direct link for this screen',
    screenLinkCopied: 'Direct screen link copied! 📋',
    clickToOpenSections: 'Click to open navigation',
    humidity: 'Humidity',
    weatherCondition: 'Weather',
    pleaseWait: 'Please wait...',
    serverUpdatingWait: 'Please wait while server is updating...',

    // Admin Panel Trilingual Channel Fields
    channelNameKu: 'Kurdish Name (ناوی کوردی)',
    channelNameAr: 'Arabic Name (الاسم بالعربية)',
    channelNameEn: 'English Name (ناوی ئینگلیزی)',

    // Settings
    settingsTitle: 'Settings',
    settingsSubtitle: 'Application preferences & account',
    languageSection: 'Language',
    languageDesc: 'Choose application language and channel list orientation:',
    screenCodeTitle: 'Screen Device Code',
    screenCodeDesc: 'This code is the unique identity of this screen. Provide it to your reseller when activating.',
    copyCode: 'Copy Code',
    activationTitle: 'Subscription Activation',
    activationDesc: 'Enter your subscription activation code below:',
    activationPlaceholder: 'Activation code...',
    activateBtn: 'Activate',
    accountDetails: 'Account Details',
    username: 'Username:',
    plan: 'Plan:',
    deviceMac: 'Device MAC:',
    statusDays: 'Status / Days:',
    freePlan: 'Free Live (509 Channels)',
    daysRemaining: '{days} Days Remaining',
    serverSettings: 'Xtream Codes Server Settings',
    serverMode: 'Server Selection Mode:',
    serverLabel: 'Server Label:',
    hostUrl: 'Host URL & Port:',
    password: 'Password:',
    liveOsdCode: 'Live OSD Server Code:',
    testConnection: 'Test Connection',
    testingConnection: 'Testing connection...',
    saveAndClearCache: 'Save & Clear Cache',
    channelsSource: 'Channels Source & Localhost',
    channelsSourceDesc: 'Set localhost endpoint or JSON URL to synchronize channels:',
    channelsActive: '{count} channels active',
    reloadFromSource: 'Reload from Source',
    restoreDefaultSource: 'Reset to default (/channels.json)',
    logoCacheTitle: 'LocalStorage Logo Cache',
    logoCacheDesc: 'Store all channel logos offline for instant 0ms rendering without internet:',
    saveAllLogos: 'Save All Logos Locally',
    clearCache: 'Clear Cache',
    playerEngine: 'Player Engine:',
    typography: 'Typography:',

    // VOD Series & Movies
    searchSeries: 'Search series...',
    searchMovies: 'Search movies...',
    allSeries: 'All Series',
    allMovies: 'All Movies',
    watchNow: 'Watch Now',
    back: 'Back',
    season: 'Season',
    episode: 'Episode',
    episodes: 'Episodes',
    year: 'Year',
    rating: 'Rating',

    // About
    aboutTitle: 'About NNDD TV',
    version: 'Version',
    poweredBy: 'Engineered to deliver premier ultra-fast TV and cinema streaming experience'
  }
};

const LANG_STORAGE_KEY = 'nndd_selected_language';

/**
 * Retrieve active language from localStorage or default to Kurdish
 */
export function getSavedLanguage() {
  if (typeof window === 'undefined') return 'ku';
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'ckb') return 'ku';
    if (saved && (saved === 'ku' || saved === 'ar' || saved === 'en')) {
      return saved;
    }
  } catch(e) {}
  return 'ku';
}

/**
 * Persist active language and update DOM direction & language attributes
 */
export function saveLanguage(lang) {
  if (typeof window === 'undefined') return;
  const valid = (lang === 'ar' || lang === 'en') ? lang : 'ku';
  try {
    localStorage.setItem(LANG_STORAGE_KEY, valid);
  } catch(e) {}

  const isRtl = valid !== 'en';
  try {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = valid;
    window.dispatchEvent(new CustomEvent('nndd_language_changed', { detail: { lang: valid, isRtl } }));
  } catch(e) {}
  return valid;
}

/**
 * Translation helper function
 */
export function translate(lang, key, params = {}) {
  const currentLang = (lang === 'ar' || lang === 'en') ? lang : 'ku';
  let str = TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['ku']?.[key] || TRANSLATIONS['en']?.[key] || key;

  if (typeof str === 'string') {
    Object.keys(params).forEach(p => {
      str = str.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });
  }
  return str;
}

/**
 * Trilingual Channel Dictionary by Channel ID
 * Guarantees zero-mixed language text across all languages
 */
export const CHANNEL_LOCALIZATION_DICTIONARY = {
  'ch-rudaw-hd': { ku: 'ڕووداو', ar: 'رووداو', en: 'Rudaw TV HD' },
  'ch-k24-hd': { ku: 'کوردستان ٢٤', ar: 'كوردستان 24', en: 'Kurdistan 24 HD' },
  'ch-kurdsatnews-hd': { ku: 'کوردسات نیوز', ar: 'كوردسات نيوز', en: 'Kurdsat News HD' },
  'ch-channel8-hd': { ku: 'چەناڵ ٨', ar: 'تشانيل 8', en: 'Channel 8 HD' },
  'ch-kurdistantv-hd': { ku: 'کوردستان تیڤی', ar: 'كوردستان TV', en: 'Kurdistan TV HD' },
  'ch-zagrostv-hd': { ku: 'زاگرۆس', ar: 'زاغروس', en: 'Zagros TV HD' },
  'ch-payamtv-hd': { ku: 'پەیام', ar: 'بيام', en: 'Payam TV HD' },
  'ch-galikurdistan-hd': { ku: 'گەلی کوردستان', ar: 'شعب كوردستان', en: 'Gali Kurdistan TV' },
  'ch-rojavatv-hd': { ku: 'ڕۆژئاڤا', ar: 'روج آفا', en: 'Rojava TV HD' },
  'ch-ronahitv-hd': { ku: 'ڕۆناهی', ar: 'روناهي', en: 'Ronahi TV HD' },
  'ch-sterktv-hd': { ku: 'ستێرک', ar: 'ستيرك', en: 'Sterk TV HD' },
  'ch-komalatv-hd': { ku: 'کۆمەڵە', ar: 'كوملة', en: 'Komala TV HD' },
  'ch-kurdsat-hd': { ku: 'کوردسات', ar: 'كوردسات', en: 'Kurdsat TV HD' },
  'ch-avatv-hd': { ku: 'ئاڤا', ar: 'آفا', en: 'AVA TV HD' },
  'ch-waartv-hd': { ku: 'وار', ar: 'وار', en: 'Waar TV HD' },
  'ch-khaktv-hd': { ku: 'خاک', ar: 'خاك', en: 'Khak TV HD' },
  'ch-trtkurdi-hd': { ku: 'تی ئاڕ تی کوردی', ar: 'تي آر تي كوردي', en: 'TRT Kurdi TV' },
  'ch-4kurd-hd': { ku: '٤کورد مۆسیقا', ar: 'فور كورد ميوزك', en: '4Kurd Music HD' },
  'ch-medmuzik-hd': { ku: 'مید موزیک', ar: 'ميد ميوزك', en: 'Med Muzik TV' },
  'ch-iraqia-kurdish-hd': { ku: 'عێراقییە کوردی', ar: 'العراقية الكردية', en: 'Al Iraqia Kurdish' },
  'ch-avamedia-hd': { ku: 'ئاڤا میدیا', ar: 'آفا ميديا', en: 'AVA Media HD' },
  'ch-avafamily-hd': { ku: 'ئاڤا فامیلی', ar: 'آفا عائلي', en: 'AVA Family HD' },
  'ch-avartv-hd': { ku: 'ئاڤار', ar: 'آفار', en: 'Avar TV HD' },
  'ch-ciratv-hd': { ku: 'چرا تیڤی', ar: 'جيرا TV', en: 'Cira TV HD' },
  'ch-kurdchannel-hd': { ku: 'کورد چەناڵ', ar: 'قناة كورد', en: 'Kurd Channel HD' },
  'ch-mixkurdy-hd': { ku: 'میکس کوردی', ar: 'ميكس كوردي', en: 'Mix Kurdy HD' },
  'ch-farmodatv-hd': { ku: 'فەرموودە', ar: 'فرمودة', en: 'Farmoda TV HD' },
  'ch-jintv-hd': { ku: 'ژن تیڤی', ar: 'جين TV', en: 'Jin TV HD' },
  'ch-urmia-hd': { ku: 'مەهاباد و ورمێ', ar: 'مهاباد وأورمية', en: 'Mahabad & Urmia TV' },
  'ch-makkahlive-hd': { ku: 'مەککەی پیرۆز', ar: 'مكة المكرمة', en: 'Makkah Live' },
  'ch-amozhgary-hd': { ku: 'ئامۆژگاری', ar: 'آموزكاري', en: 'Amozhgary TV' },
  'ch-alquran-hd': { ku: 'قورئانی پیرۆز', ar: 'القرآن الكريم مباشر', en: 'Holy Quran Live HD' },
  'ch-emantv-hd': { ku: 'ئیمان', ar: 'إيمان TV', en: 'Eman TV HD' },
  'ch-samarratv-hd': { ku: 'سامەڕا', ar: 'سامراء', en: 'Samarra TV HD' },
  'ch-karbaladoc-hd': { ku: 'کەربەلا بەڵگەفیلم', ar: 'كربلاء الوثائقية', en: 'Karbala Documentary HD' },
  'ch-zaroktv-hd': { ku: 'زارۆک', ar: 'زاروك TV', en: 'Zarok TV Kurmanci' },
  'ch-afarintv-hd': { ku: 'ئافەرین', ar: 'آفرين HD', en: 'Afarin TV HD' },
  'ch-afarinbaxcha-hd': { ku: 'ئافەرین باخچە', ar: 'آفرين باخجة', en: 'Afarin Baxcha' },
  'ch-afarinkids-hd': { ku: 'ئافەرین منداڵان', ar: 'آفرين أطفال', en: 'Afarin Kids TV' },
  'ch-trtcocuk-hd': { ku: 'تی ئاڕ تی منداڵان', ar: 'تي آر تي أطفال', en: 'TRT Cocuk HD' },
  'ch-aljazeeradoc-hd': { ku: 'جەزیرە بەڵگەنامەیی', ar: 'الجزيرة الوثائقية', en: 'Al Jazeera Documentary' },
  'ch-aljazeeraar-hd': { ku: 'جەزیرە عەرەبی', ar: 'الجزيرة الإخبارية', en: 'Al Jazeera Arabic' },
  'ch-skynewsarabia-hd': { ku: 'سکای نیوز', ar: 'سكاي نيوز عربية', en: 'Sky News Arabia' },
  'ch-aliraqia-sport-hd': { ku: 'وەرزشی عێراقییە', ar: 'العراقية الرياضية', en: 'Al Iraqia Sports HD' },
  'ch-france24-hd': { ku: 'فرانس ٢٤', ar: 'فرانس 24', en: 'France 24 HD' },
  'ch-dweng-hd': { ku: 'دۆیچە ڤێلە', ar: 'دويتشه فيله', en: 'DW News' },
  'ch-rtnews-hd': { ku: 'ئاڕ تی (ڕووسیا)', ar: 'روسيا اليوم (RT)', en: 'RT News' },
  'ch-mbciraq-hd': { ku: 'ئێم بی سی عێراق', ar: 'إم بي سي العراق', en: 'MBC Iraq HD' },
  'ch-alsharqiya-hd': { ku: 'ئەلشەرقیە', ar: 'الشرقية', en: 'Al Sharqiya HD' },
  'ch-utviraq-hd': { ku: 'یو تیڤی عێراق', ar: 'يو تي في (UTV)', en: 'UTV Iraq HD' },
  'ch-dijlahtv-hd': { ku: 'دیجلە', ar: 'دجلة', en: 'Dijlah TV HD' },
  'ch-startv-hd': { ku: 'ستار تیڤی', ar: 'ستار تيفي', en: 'Star TV HD' },
  'ch-teve2-hd': { ku: 'تیڤی ٢', ar: 'تيفي 2', en: 'Teve2 HD' }
};

/**
 * Keyword-based dictionary for Xtream/M3U imported channels
 */
export const CHANNEL_KEY_DICTIONARY = {
  'rudaw': { ku: 'ڕووداو', ar: 'رووداو', en: 'Rudaw' },
  'rudawtv': { ku: 'ڕووداو', ar: 'رووداو', en: 'Rudaw TV' },
  'rudawhd': { ku: 'ڕووداو', ar: 'رووداو', en: 'Rudaw HD' },
  'kurdistan24': { ku: 'کوردستان ٢٤', ar: 'كوردستان 24', en: 'Kurdistan 24' },
  'kurdsat': { ku: 'کوردسات', ar: 'كوردسات', en: 'Kurdsat' },
  'kurdsatnews': { ku: 'کوردسات نیوز', ar: 'كوردسات نيوز', en: 'Kurdsat News' },
  'channel8': { ku: 'چەناڵ ٨', ar: 'تشانيل 8', en: 'Channel 8' },
  'kurdistantv': { ku: 'کوردستان تیڤی', ar: 'كوردستان TV', en: 'Kurdistan TV' },
  'zagros': { ku: 'زاگرۆس', ar: 'زاغروس', en: 'Zagros TV' },
  'payam': { ku: 'پەیام', ar: 'بيام', en: 'Payam TV' },
  'galikurdistan': { ku: 'گەلی کوردستان', ar: 'شعب كوردستان', en: 'Gali Kurdistan' },
  'nrt': { ku: 'ئێن ئاڕ تی', ar: 'إن آر تي', en: 'NRT' },
  'nrt2': { ku: 'ئێن ئاڕ تی ٢', ar: 'إن آر تي 2', en: 'NRT 2' },
  'speda': { ku: 'سپێدە', ar: 'سبيدة', en: 'Speda' },
  'ava': { ku: 'ئاڤا', ar: 'آفا', en: 'AVA TV' },
  'waar': { ku: 'وار', ar: 'وار', en: 'Waar TV' },
  'khak': { ku: 'خاک', ar: 'خاك', en: 'Khak TV' },
  'trtkurdi': { ku: 'تی ئاڕ تی کوردی', ar: 'تي آر تي كوردي', en: 'TRT Kurdi' },
  '4kurd': { ku: '٤کورد', ar: 'فور كورد', en: '4Kurd' },
  'afarin': { ku: 'ئافەرین', ar: 'آفرين', en: 'Afarin TV' },
  'zarok': { ku: 'زارۆک', ar: 'زاروك', en: 'Zarok TV' },
  'makkah': { ku: 'مەککە', ar: 'مكة المكرمة', en: 'Makkah Live' },
  'aljazeera': { ku: 'جەزیرە', ar: 'الجزيرة', en: 'Al Jazeera' },
  'skynews': { ku: 'سکای نیوز', ar: 'سكاي نيوز عربية', en: 'Sky News' },
  'mbc': { ku: 'ئێم بی سی', ar: 'إم بي سي', en: 'MBC' }
};

/**
 * Intelligent helper to convert Kurdish typography characters to proper Arabic
 */
function convertKurdishToStandardArabic(str) {
  if (!str) return '';
  return str
    .replace(/ڕ/g, 'ر')
    .replace(/ڤ/g, 'ف')
    .replace(/ۆ/g, 'و')
    .replace(/ێ/g, 'ي')
    .replace(/ڵ/g, 'ل')
    .replace(/پ/g, 'ب')
    .replace(/چ/g, 'ج')
    .replace(/ژ/g, 'ز')
    .replace(/گ/g, 'ك')
    .replace(/ک/g, 'ك')
    .replace(/ی/g, 'ي')
    .replace(/ە/g, 'ة');
}

/**
 * getLocalizedChannelName:
 * Resolves strictly single-language channel title.
 * - In English ('en'): Returns ONLY English Latin characters (No Kurdish or Arabic text).
 * - In Kurdish ('ku'): Returns ONLY Kurdish script (No English title mixed).
 * - In Arabic ('ar'): Returns ONLY Arabic script (No English title mixed).
 */
export function getLocalizedChannelName(channel, lang = 'ku') {
  if (!channel) return '';
  const currentLang = (lang === 'ar' || lang === 'en') ? lang : 'ku';

  // Handle if string passed instead of channel object
  if (typeof channel === 'string') {
    channel = { name: channel };
  }

  // 1. Explicit properties on the channel object
  if (currentLang === 'ku' && channel.nameKu && typeof channel.nameKu === 'string' && channel.nameKu.trim()) {
    return channel.nameKu.trim();
  }
  if (currentLang === 'ar' && channel.nameAr && typeof channel.nameAr === 'string' && channel.nameAr.trim()) {
    return channel.nameAr.trim();
  }
  if (currentLang === 'en') {
    const enProp = channel.nameEn || channel.name_en;
    if (enProp && typeof enProp === 'string' && enProp.trim()) {
      return enProp.trim();
    }
  }

  // 2. Dictionary match by channel ID
  const chId = channel.id || '';
  if (chId && CHANNEL_LOCALIZATION_DICTIONARY[chId]) {
    const entry = CHANNEL_LOCALIZATION_DICTIONARY[chId];
    if (entry[currentLang]) return entry[currentLang];
  }

  // 3. Keyword dictionary match by normalized name
  const rawName = (channel.name || channel.nameEn || '').trim();
  const normalizedKey = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const key of Object.keys(CHANNEL_KEY_DICTIONARY)) {
    if (normalizedKey.includes(key)) {
      const entry = CHANNEL_KEY_DICTIONARY[key];
      if (entry[currentLang]) return entry[currentLang];
    }
  }

  // 4. Intelligent Regex splitting & purification (Strict Single Language)
  if (currentLang === 'en') {
    // English mode: Strip any Arabic/Kurdish script in parentheses or standalone
    let enPure = rawName
      .replace(/\s*\([\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\s\d\-_./]+\)/g, '')
      .replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (enPure.length >= 2) return enPure;
    return rawName;
  }

  // Kurdish or Arabic mode:
  // Check if there is Kurdish/Arabic inside parentheses: e.g. "Makkah Live (مەککەی پیرۆز)"
  const parenMatch = rawName.match(/\(([\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\s\d\-_.]+)\)/);
  if (parenMatch && parenMatch[1].trim().length >= 2) {
    let result = parenMatch[1].trim();
    if (currentLang === 'ar') {
      result = convertKurdishToStandardArabic(result);
    }
    return result;
  }

  // Check if there are Arabic/Kurdish words in the string e.g. "RUDAW ڕووداو"
  const arabicWords = rawName.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+(?:\s+[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]+)*/g);
  if (arabicWords && arabicWords.length > 0) {
    let arabicSegment = arabicWords.join(' ').trim();
    if (arabicSegment.length >= 2) {
      if (currentLang === 'ar') {
        arabicSegment = convertKurdishToStandardArabic(arabicSegment);
      }
      return arabicSegment;
    }
  }

  return rawName;
}
