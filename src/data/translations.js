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
