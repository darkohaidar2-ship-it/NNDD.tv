import { ensureDabinChannelFirst } from './dbStorage';

/**
 * NNDD TV - Xtream Codes API Server Importer & Sync Engine
 * Fully integrated with Lion 4K OTT, NINJA OTT, TREX and Custom IPTV Providers
 */

export const DEFAULT_SERVER_CONFIG = {
  serverUrl: 'http://line.liondnscloud.ru',
  username: '914cd705',
  password: '6c86e923',
  serverName: 'Lion 4K OTT'
};

/**
 * Intelligent DNS Resolver & Fallback Engine
 * Automatically routes blocked Cloudflare domains (e.g. vpn.lion4k.vip or lionsmart.cc)
 * directly to the provider's active working cluster (line.liondnscloud.ru).
 */
export function resolveXtreamHost(host = '') {
  let clean = (host || '').trim().replace(/\/+$/, '');
  if (!clean) return 'http://line.liondnscloud.ru';

  // Strip accidental API endpoints or query strings if user pasted full URL
  clean = clean.replace(/\/player_api\.php.*$/i, '').replace(/\/get\.php.*$/i, '').trim();

  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `http://${clean}`;
  }

  // Auto-resolve known blocked Cloudflare / parked zones to live working cluster
  if (clean.includes('lion4k') || clean.includes('lionsmart') || clean.includes('lionott')) {
    return 'http://line.liondnscloud.ru';
  }

  return clean;
}

/**
 * Classify stream into NNDD TV predefined categories:
 * 'هەموو', 'ڕووداو', 'هەواڵەکان کوردی', 'کوردی', 'وەرزش', 'منداڵان', 'ئاینی', 'سینەما', 'کەناڵەکانی تر'
 */
export function classifyChannelCategory(streamName = '', categoryLabel = '') {
  const name = (streamName || '').toLowerCase();
  const cat = (categoryLabel || '').toLowerCase();

  // 1. Rudaw
  if (name.includes('rudaw') || name.includes('ڕووداو')) {
    return 'ڕووداو';
  }

  // 2. Religious / Islamic
  if (
    cat.includes('islam') || cat.includes('quran') || cat.includes('دین') || cat.includes('دینی') ||
    name.includes('quran') || name.includes('payam') || name.includes('speda') || name.includes('sunnah') ||
    name.includes('islam') || name.includes('huda') || name.includes('ئیسلام') || name.includes('ئاینی') ||
    name.includes('قورئان') || name.includes('پەیام') || name.includes('سپێدە')
  ) {
    return 'ئاینی';
  }

  // 3. Kids / Children
  if (
    cat.includes('kid') || cat.includes('child') || cat.includes('منداڵ') || cat.includes('اطفال') || cat.includes('أطفال') ||
    name.includes('kids') || name.includes('cartoon') || name.includes('afarin') || name.includes('zarok') ||
    name.includes('spacetoon') || name.includes('disney') || name.includes('منداڵ') || name.includes('ئافەرین') ||
    name.includes('nrt 3') || name.includes('nrt3')
  ) {
    return 'منداڵان';
  }

  // 4. Sports
  if (
    cat.includes('sport') || cat.includes('bein') || cat.includes('ssc') || cat.includes('ad sport') ||
    cat.includes('starzplay') || cat.includes('وەرزش') ||
    name.includes('sport') || name.includes('bein') || name.includes('ssc') || name.includes('kass') ||
    name.includes('champions') || name.includes('ad sports') || name.includes('uefa') || name.includes('fifa') ||
    name.includes('وەرزش')
  ) {
    return 'وەرزش';
  }

  // 5. Cinema / Movies / Drama / OSN
  if (
    cat.includes('cinema') || cat.includes('movie') || cat.includes('osn') || cat.includes('film') ||
    cat.includes('drama') || cat.includes('سینەما') || cat.includes('دراما') ||
    name.includes('cinema') || name.includes('movie') || name.includes('osn') || name.includes('box office') ||
    name.includes('action') || name.includes('drama') || name.includes('سینەما')
  ) {
    return 'سینەما';
  }

  // 6. Kurdish News
  if (
    (name.includes('k24') || name.includes('kurdistan 24') || name.includes('kurdistan24') ||
     name.includes('nrt 1') || name.includes('nrt1') || name.includes('waar news') ||
     name.includes('waarnews') || name.includes('ava news') || name.includes('هەواڵ') ||
     name.includes('کوردستان ٢٤')) &&
    (cat.includes('kurd') || name.includes('kurd'))
  ) {
    return 'هەواڵەکان کوردی';
  }

  // 7. Kurdish General
  if (
    cat.includes('kurd') || name.includes('[ku]') || name.includes('kurd') || name.includes('kurdistan') ||
    name.includes('nrt') || name.includes('waar') || name.includes('zagros') || name.includes('gali') ||
    name.includes('kirkuk') || name.includes('slemani') || name.includes('hawler') || name.includes('dohuk') ||
    name.includes('badinan') || name.includes('soran') || name.includes('ronahi')
  ) {
    return 'کوردی';
  }

  // 8. Default fallback
  return 'کەناڵەکانی تر';
}

/**
 * Classify VOD into NNDD TV 7 standard categories:
 * 'کوردی', 'سینەما و ئاکشن', 'دراما و کۆمیدی', 'منداڵان و ئەنیمەیشن', 'ترسناک و نهێنی', 'خەیاڵی زانستی و سەرکێشی', 'دۆکیۆمێنتاری و بەڵگەنامەیی'
 */
export function classifyVodCategory(streamName = '', categoryLabel = '') {
  const name = (streamName || '').toLowerCase();
  const cat = (categoryLabel || '').toLowerCase();

  // 1. Kurdish
  if (cat.includes('kurd') || name.includes('kurd') || cat.includes('کورد') || name.includes('کورد') || cat.includes('دۆبلاژ') || name.includes('دۆبلاژ')) {
    return 'کوردی';
  }
  // 2. Kids / Animation
  if (cat.includes('kid') || cat.includes('child') || cat.includes('cartoon') || cat.includes('anime') || cat.includes('animation') || cat.includes('disney') || cat.includes('منداڵ') || cat.includes('اطفال')) {
    return 'منداڵان و ئەنیمەیشن';
  }
  // 3. Horror / Mystery
  if (cat.includes('horror') || cat.includes('thriller') || cat.includes('mystery') || cat.includes('ترسناک') || cat.includes('رعب')) {
    return 'ترسناک و نهێنی';
  }
  // 4. Sci-Fi & Adventure
  if (cat.includes('sci') || cat.includes('science') || cat.includes('fantasy') || cat.includes('adventure') || cat.includes('خەیاڵی') || cat.includes('سەرکێشی')) {
    return 'خەیاڵی زانستی و سەرکێشی';
  }
  // 5. Documentary & History
  if (cat.includes('doc') || cat.includes('history') || cat.includes('بەڵگەنامەیی') || cat.includes('مێژوو') || cat.includes('وثائقي')) {
    return 'دۆکیۆمێنتاری و بەڵگەنامەیی';
  }
  // 6. Cinema & Action
  if (cat.includes('action') || cat.includes('4k') || cat.includes('cinema') || cat.includes('film') || cat.includes('war') || cat.includes('ئاکشن') || cat.includes('سینەما') || cat.includes('جەنگ')) {
    return 'سینەما و ئاکشن';
  }
  // 7. Drama & Comedy
  return 'دراما و کۆمیدی';
}

/**
 * Multi-Tier Resilient Fetcher for Xtream API:
 * Solves:
 * 1. Mixed Content (HTTPS websites trying to call HTTP IPTV servers)
 * 2. CORS blockers (IPTV servers missing Access-Control-Allow-Origin)
 * 3. Android WebView vs Web browser platform differences
 */
export async function smartXtreamFetch(targetUrl, options = {}) {
  const isBrowser = typeof window !== 'undefined';
  const isHttps = isBrowser && window.location.protocol === 'https:';
  const isTargetHttp = targetUrl.startsWith('http://');

  const candidateUrls = [];

  // If in browser on HTTPS while target is HTTP, browser enforces Mixed Content blocking.
  // Prioritize internal proxy and public proxy before raw URL
  if (isHttps && isTargetHttp) {
    candidateUrls.push(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
    candidateUrls.push(`https://nndd-tv.vercel.app/api/proxy?url=${encodeURIComponent(targetUrl)}`);
    candidateUrls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
    candidateUrls.push(targetUrl);
  } else {
    // Android APK (with cleartext allowed) or localhost or matching protocols
    candidateUrls.push(targetUrl);
    candidateUrls.push(`/api/proxy?url=${encodeURIComponent(targetUrl)}`);
    candidateUrls.push(`https://nndd-tv.vercel.app/api/proxy?url=${encodeURIComponent(targetUrl)}`);
    candidateUrls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`);
  }

  let lastError = null;

  for (const fetchUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutMs = options.timeout || 25000;
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*'
        }
      });
      clearTimeout(timer);

      if (res.ok) {
        return res;
      } else if (res.status === 403 || res.status === 502) {
        lastError = new Error(`HTTP Error ${res.status}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Failed to fetch from ${targetUrl}`);
}

/**
 * Test authentication and fetch account status from Xtream server
 */
export async function testXtreamConnection(config = DEFAULT_SERVER_CONFIG) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  const url = `${base}/player_api.php?username=${username}&password=${password}`;

  const t0 = performance.now();
  try {
    const res = await smartXtreamFetch(url, { timeout: 15000 });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();

    const latency = Math.round(performance.now() - t0);

    if (data.user_info && data.user_info.auth === 1) {
      let expFormatted = 'هەمیشەیی (Unlimited)';
      if (data.user_info.exp_date && data.user_info.exp_date !== 'null') {
        const expTime = parseInt(data.user_info.exp_date, 10);
        if (!isNaN(expTime) && expTime > 0) {
          expFormatted = new Date(expTime * 1000).toLocaleDateString();
        }
      }

      return {
        success: true,
        user: data.user_info,
        server: data.server_info,
        status: data.user_info.status || 'Active',
        isTrial: data.user_info.is_trial === '1',
        expDate: expFormatted,
        maxConnections: data.user_info.max_connections || 1,
        activeCons: data.user_info.active_cons || 0,
        latencyMs: latency,
        resolvedHost: base
      };
    } else {
      throw new Error(data.user_info?.message || 'Authentication failed (یوزەرنەیم یان پاسۆرد هەڵەیە)');
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      resolvedHost: base
    };
  }
}

/**
 * Fetch all categories (live, vod, or series)
 */
export async function getXtreamCategories(config = DEFAULT_SERVER_CONFIG, type = 'live') {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  const action = type === 'vod' ? 'get_vod_categories' : type === 'series' ? 'get_series_categories' : 'get_live_categories';
  const url = `${base}/player_api.php?username=${username}&password=${password}&action=${action}`;

  try {
    const res = await smartXtreamFetch(url, { timeout: 20000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cats = await res.json();
    return Array.isArray(cats) ? cats : [];
  } catch (err) {
    console.error(`[Xtream] Error fetching ${type} categories:`, err);
    return [];
  }
}

/**
 * Fetch streams for a specific category or all streams if categoryId is omitted
 */
export async function getXtreamLiveStreams(config = DEFAULT_SERVER_CONFIG, categoryId = null) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  let url = `${base}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
  if (categoryId) url += `&category_id=${categoryId}`;

  try {
    const res = await smartXtreamFetch(url, { timeout: 35000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const streams = await res.json();
    return Array.isArray(streams) ? streams : [];
  } catch (err) {
    console.error('[Xtream] Error fetching live streams:', err);
    return [];
  }
}

/**
 * Fetch VOD streams for a specific category
 */
export async function getXtreamVodStreams(config = DEFAULT_SERVER_CONFIG, categoryId = null) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  let url = `${base}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`;
  if (categoryId) url += `&category_id=${categoryId}`;

  try {
    const res = await smartXtreamFetch(url, { timeout: 25000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const streams = await res.json();
    return Array.isArray(streams) ? streams : [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetch Series for a specific category
 */
export async function getXtreamSeries(config = DEFAULT_SERVER_CONFIG, categoryId = null) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  let url = `${base}/player_api.php?username=${username}&password=${password}&action=get_series`;
  if (categoryId) url += `&category_id=${categoryId}`;

  try {
    const res = await smartXtreamFetch(url, { timeout: 25000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const series = await res.json();
    return Array.isArray(series) ? series : [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetch all categories enriched with stream counts & regional classification tags
 */
export async function fetchServerCategoriesWithCounts(config = DEFAULT_SERVER_CONFIG) {
  try {
    const allCategories = await getXtreamCategories(config, 'live') || [];
    
    // Quick probe of streams to calculate counts
    let allStreams = [];
    try {
      allStreams = await getXtreamLiveStreams(config) || [];
    } catch(e) {
      allStreams = [];
    }

    const catCounts = {};
    if (Array.isArray(allStreams)) {
      for (const s of allStreams) {
        if (s && s.category_id) {
          catCounts[String(s.category_id)] = (catCounts[String(s.category_id)] || 0) + 1;
        }
      }
    }

    const enriched = (allCategories || []).map(c => {
      const id = String(c.category_id);
      const name = c.category_name || '';
      const count = catCounts[id] || 0;
      const lower = name.toLowerCase();

      const isKurdish = lower.includes('kurd') || lower.includes('کورد');
      const isSports = /bein|ssc|sport|dazn|ad sport|starzplay|champions|uefa|fifa/i.test(lower);
      const isArabic = lower.includes('[ar]') || lower.includes('arabic') || /عرب|عراق|مصر|سعود|خليج|مغرب|تونس|جزائر|شام|لبنان/i.test(lower);
      const isRegional = isKurdish || isSports || isArabic || /news|kids|islam|quran|cinema|movie|film|osn|mbc|shahid/i.test(lower);

      return {
        id,
        name,
        count,
        isKurdish,
        isSports,
        isArabic,
        isRegional
      };
    });

    return {
      success: true,
      categories: enriched,
      totalStreams: Array.isArray(allStreams) ? allStreams.length : 0,
      cachedStreams: allStreams
    };
  } catch (err) {
    console.error('[Xtream] Failed to fetch server categories with counts:', err);
    return { success: false, categories: [], totalStreams: 0, cachedStreams: [] };
  }
}

/**
 * High-Performance Server Importer (41,000+ Channels & Streams):
 * 1. Dynamically fetches ALL live categories (`action=get_live_categories`).
 * 2. Iterates through all category IDs to pull all live streams (`action=get_live_streams&category_id=ID`).
 * 3. Formats clean `.ts` stream URLs (`${serverUrl}/live/${username}/${password}/${stream_id}.ts`).
 * 4. Pulls without UI freezing via chunked asynchronous batching and event-loop yielding.
 */
export async function importTargetServerChannels(config = DEFAULT_SERVER_CONFIG, onProgress = null, options = {}) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  const concurrency = options.concurrency || 6;
  const defaultHidden = options.defaultHidden || false;
  const selectedCategoryIds = options.categoryIds ? new Set(Array.from(options.categoryIds).map(String)) : null;

  onProgress?.({
    category: 'پشکنینی گەتەگۆرییەکانی سێرڤەر (Fetching Live Categories)...',
    current: 0,
    total: 100,
    loadedCount: 0
  });

  // 1. Dynamically fetch ALL live categories
  let categories = await getXtreamCategories(config, 'live');
  if (!Array.isArray(categories) || categories.length === 0) {
    // Fallback if provider returns no categories
    const fallbackStreams = await getXtreamLiveStreams(config);
    if (fallbackStreams.length > 0) {
      categories = [{ category_id: 'all', category_name: 'گشتی (General)' }];
    }
  }

  // Filter if user selected specific categories, otherwise fetch ALL categories
  let targetCategories = categories;
  if (selectedCategoryIds && selectedCategoryIds.size > 0) {
    targetCategories = categories.filter(c => selectedCategoryIds.has(String(c.category_id)));
  }

  const categoryMap = new Map();
  categories.forEach(c => {
    categoryMap.set(String(c.category_id), c.category_name || 'کەناڵەکان');
  });

  const allRawStreams = [];
  const seenStreamIds = new Set();
  const totalCategories = targetCategories.length;

  // 2. Iterate through ALL category IDs in concurrent batches
  for (let i = 0; i < totalCategories; i += concurrency) {
    const batch = targetCategories.slice(i, i + concurrency);

    await Promise.all(batch.map(async (cat) => {
      try {
        const catId = cat.category_id === 'all' ? null : cat.category_id;
        const streams = await getXtreamLiveStreams(config, catId);
        if (Array.isArray(streams)) {
          for (let s of streams) {
            if (s && s.stream_id && !seenStreamIds.has(s.stream_id)) {
              seenStreamIds.add(s.stream_id);
              if (!s.category_id || s.category_id === '0') {
                s.category_id = cat.category_id;
              }
              s._categoryName = cat.category_name;
              allRawStreams.push(s);
            }
          }
        }
      } catch (err) {
        console.warn(`[Xtream Importer] Failed to fetch category ${cat.category_id}:`, err);
      }
    }));

    // Update Progress
    const processed = Math.min(i + concurrency, totalCategories);
    onProgress?.({
      category: `هاوردەکردنی گەتەگۆری: ${batch[batch.length - 1]?.category_name || 'کەناڵەکان'}`,
      current: processed,
      total: totalCategories,
      loadedCount: allRawStreams.length
    });

    // Yield to the browser event loop to avoid UI freezing
    await new Promise(r => setTimeout(r, 0));
  }

  // 3. Fallback: if category-based iteration yielded 0 streams, try global stream fetch
  if (allRawStreams.length === 0) {
    try {
      const globalStreams = await getXtreamLiveStreams(config);
      if (Array.isArray(globalStreams)) {
        for (let s of globalStreams) {
          if (s && s.stream_id && !seenStreamIds.has(s.stream_id)) {
            seenStreamIds.add(s.stream_id);
            allRawStreams.push(s);
          }
        }
      }
    } catch (e) {}
  }

  // 4. Format clean .ts stream URLs & map to NNDD TV Channels schema
  // Channels from server start from #2 because Channel #1 is permanently DABIN.Tv Channel
  const importedChannels = [];
  let currentNumber = 2;

  for (let i = 0; i < allRawStreams.length; i++) {
    const s = allRawStreams[i];
    const catId = String(s.category_id || '');
    const catLabel = s._categoryName || categoryMap.get(catId) || '[General]';

    // Format clean .m3u8 stream URL & backup .ts
    const streamUrl = `${base}/live/${username}/${password}/${s.stream_id}.m3u8`;
    const backupUrl = `${base}/live/${username}/${password}/${s.stream_id}.ts`;

    let rawName = s.name || 'کەناڵ';
    let cleanName = rawName.replace(/^(\[KU\]|\[AR\]|\[EN\]|KU:|KU|AR:|AR|BEIN:)\s*/i, '').trim();

    const assignedCategory = classifyChannelCategory(rawName, catLabel);
    const is4K = rawName.toUpperCase().includes('4K') || rawName.toUpperCase().includes('UHD');

    let isHidden = false;
    if (defaultHidden) {
      const isCore = assignedCategory === 'کوردی' || assignedCategory === 'ڕووداو' || assignedCategory === 'هەواڵەکان کوردی' || assignedCategory === 'وەرزش';
      if (!isCore) isHidden = true;
    }

    importedChannels.push({
      id: `xtream-${s.stream_id}`,
      number: currentNumber++,
      name: cleanName,
      nameKu: cleanName,
      nameAr: cleanName,
      nameEn: rawName,
      category: assignedCategory,
      rawCategory: catLabel,
      url: streamUrl,
      backupUrl: backupUrl,
      tsUrl: streamUrl,
      logo: s.stream_icon || '/nndd_logo.png',
      fallbackLogo: '/nndd_logo.png',
      quality: is4K ? '4K Ultra HD' : '1080p HD',
      is4K: is4K,
      isLocked: false,
      isFavorite: false,
      isHidden: isHidden,
      epg: {
        currentShow: 'بەرنامەی پەخشی ڕاستەوخۆ',
        nextShow: 'پەخشی بەردەوامی سێرڤەر',
        timeSlot: '24/7 Live Stream',
        progress: 45
      }
    });

    // Yield every 500 items to keep thread responsive
    if (i % 500 === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  onProgress?.({
    category: `سەرکەوتوو بوو! تەواوی ${importedChannels.length} کەناڵ هاوردەکران.`,
    current: totalCategories,
    total: totalCategories,
    loadedCount: importedChannels.length
  });

  return ensureDabinChannelFirst(importedChannels);
}

/**
 * High-Performance VOD Importer (Movies & Series):
 * Dynamically iterates through all VOD movie & series categories from Xtream Codes server
 * without arbitrary capping or UI locking.
 */
export async function importTargetServerVod(config = DEFAULT_SERVER_CONFIG, onProgress = null, options = {}) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  const concurrency = options.concurrency || 5;
  const maxMoviesPerCat = options.maxMoviesPerCategory || null;
  const maxSeriesPerCat = options.maxSeriesPerCategory || null;

  const importedMovies = [];
  const importedSeries = [];
  const seenMovieIds = new Set();
  const seenSeriesIds = new Set();

  // 1. Dynamically fetch ALL VOD Movie categories & streams
  try {
    onProgress?.({ stage: 'movies', label: 'داگرتنی گەتەگۆرییەکانی فیلم...', current: 0, total: 100, count: 0 });
    const vodCats = await getXtreamCategories(config, 'vod');
    const totalVodCats = Array.isArray(vodCats) ? vodCats.length : 0;

    for (let i = 0; i < totalVodCats; i += concurrency) {
      const batch = vodCats.slice(i, i + concurrency);

      await Promise.all(batch.map(async (cat) => {
        try {
          const streams = await getXtreamVodStreams(config, cat.category_id);
          if (Array.isArray(streams)) {
            const list = maxMoviesPerCat ? streams.slice(0, maxMoviesPerCat) : streams;
            for (let m of list) {
              if (m && m.stream_id && !seenMovieIds.has(m.stream_id)) {
                seenMovieIds.add(m.stream_id);
                const ext = m.container_extension || 'mp4';
                const streamUrl = `${base}/movie/${username}/${password}/${m.stream_id}.${ext}`;
                let cleanTitle = (m.name || 'فیلم').replace(/^(VOD|NF|AR|KU|EN|4K)\s*[-:]?\s*/i, '').trim();
                const assignedMovieCat = classifyVodCategory(m.name, cat.category_name);

                importedMovies.push({
                  id: `xtream-movie-${m.stream_id}`,
                  title: cleanTitle,
                  titleEn: m.name,
                  genre: assignedMovieCat,
                  rating: m.rating_5based ? String((m.rating_5based * 2).toFixed(1)) : (m.rating ? String(m.rating) : '8.6'),
                  year: m.year ? String(m.year) : '2025',
                  duration: m.duration || '118 خولەک',
                  poster: m.stream_icon || '',
                  backdropUrl: m.stream_icon || '',
                  description: m.plot || `فیلمی سینەمایی ${cleanTitle} لە سێرڤەری Lion 4K بە کوالێتی بەرز.`,
                  streamUrl: streamUrl,
                  category: assignedMovieCat,
                  rawCategory: cat.category_name
                });
              }
            }
          }
        } catch (e) {
          console.warn(`[VOD Importer] Error in movie category ${cat.category_id}:`, e);
        }
      }));

      const processed = Math.min(i + concurrency, totalVodCats);
      onProgress?.({
        stage: 'movies',
        label: `هاوردەکردنی فیلمەکان: ${batch[batch.length - 1]?.category_name || ''}`,
        current: processed,
        total: totalVodCats,
        count: importedMovies.length
      });

      // Yield to event loop to keep UI smooth
      await new Promise(r => setTimeout(r, 0));
    }
  } catch (err) {
    console.warn('[VOD Importer] Error fetching movies:', err);
  }

  // 2. Dynamically fetch ALL Series categories & series
  try {
    onProgress?.({ stage: 'series', label: 'داگرتنی گەتەگۆرییەکانی زنجیرە...', current: 0, total: 100, count: 0 });
    const seriesCats = await getXtreamCategories(config, 'series');
    const totalSeriesCats = Array.isArray(seriesCats) ? seriesCats.length : 0;

    for (let i = 0; i < totalSeriesCats; i += concurrency) {
      const batch = seriesCats.slice(i, i + concurrency);

      await Promise.all(batch.map(async (cat) => {
        try {
          const seriesList = await getXtreamSeries(config, cat.category_id);
          if (Array.isArray(seriesList)) {
            const list = maxSeriesPerCat ? seriesList.slice(0, maxSeriesPerCat) : seriesList;
            for (let s of list) {
              if (s && s.series_id && !seenSeriesIds.has(s.series_id)) {
                seenSeriesIds.add(s.series_id);
                let cleanTitle = (s.name || 'زنجیرە').replace(/^(SRS|NF|AR|KU|EN)\s*[-:]?\s*/i, '').trim();
                const assignedSeriesCat = classifyVodCategory(s.name, cat.category_name);

                importedSeries.push({
                  id: `xtream-series-${s.series_id}`,
                  seriesId: s.series_id,
                  title: cleanTitle,
                  titleEn: s.name,
                  category: assignedSeriesCat,
                  genre: assignedSeriesCat,
                  seasons: 1,
                  episodesCount: 10,
                  rating: s.rating_5based ? String((s.rating_5based * 2).toFixed(1)) : (s.rating ? String(s.rating) : '8.9'),
                  year: s.releaseDate ? s.releaseDate.split('-')[0] : '2025',
                  poster: s.cover || '',
                  backdropUrl: s.backdrop_path?.[0] || s.cover || '',
                  description: s.plot || `زنجیرەی ${cleanTitle} لە سێرڤەری تایبەت.`,
                  episodes: [],
                  rawCategory: cat.category_name
                });
              }
            }
          }
        } catch (e) {
          console.warn(`[VOD Importer] Error in series category ${cat.category_id}:`, e);
        }
      }));

      const processed = Math.min(i + concurrency, totalSeriesCats);
      onProgress?.({
        stage: 'series',
        label: `هاوردەکردنی زنجیرەکان: ${batch[batch.length - 1]?.category_name || ''}`,
        current: processed,
        total: totalSeriesCats,
        count: importedSeries.length
      });

      // Yield to event loop to keep UI smooth
      await new Promise(r => setTimeout(r, 0));
    }
  } catch (err) {
    console.warn('[VOD Importer] Error fetching series:', err);
  }

  return {
    movies: importedMovies,
    series: importedSeries
  };
}

/**
 * NNDD TV - Hybrid Channel URL Resolver
 * 
 * Resolves the correct stream URL for a base NNDD channel from any Xtream server.
 * Strategy:
 *  1. Fetch ALL live streams from the Xtream server (single API call, cached)
 *  2. For each base channel, find the best matching stream by alias scoring
 *  3. Return updated channels with resolved Xtream URLs (or keep base URL as fallback)
 * 
 * This is FAST (no category iteration needed) because we fetch ALL streams once.
 */
export async function resolveChannelUrlsForServer(baseChannels, xtreamConfig, onProgress = null) {
  if (!xtreamConfig || !xtreamConfig.host || !xtreamConfig.username || !xtreamConfig.password) {
    return baseChannels; // No Xtream config — return base channels unchanged
  }

  const base = resolveXtreamHost(xtreamConfig.host);
  const { username, password } = xtreamConfig;

  onProgress?.({ phase: 'هاوردەکردنی ئیندێکسی کەناڵەکان لە سێرڤەرەوە...', percent: 10 });

  // Fetch all live streams at once (much faster than per-category)
  let allStreams = [];
  try {
    const url = `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`;
    const res = await smartXtreamFetch(url, { timeout: 30000 });
    if (res.ok) {
      const data = await res.json();
      allStreams = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn('[HybridResolver] Failed to fetch all streams, keeping base URLs:', e.message);
    return baseChannels;
  }

  if (allStreams.length === 0) return baseChannels;

  onProgress?.({ phase: `یاریکردنی ${allStreams.length} کەناڵ لە سێرڤەر...`, percent: 50 });

  // Build a searchable index: normalized name → stream
  const streamIndex = new Map();
  for (const s of allStreams) {
    if (!s.stream_id || !s.name) continue;
    const key = normalizeStreamName(s.name);
    if (!streamIndex.has(key)) streamIndex.set(key, s);
  }

  // Helper: score a base channel against a stream name
  function scoreMatch(aliases, streamName) {
    const snorm = normalizeStreamName(streamName);
    let best = 0;
    for (const alias of aliases) {
      const anorm = normalizeStreamName(alias);
      if (snorm === anorm) return 100;           // exact
      if (snorm.includes(anorm) || anorm.includes(snorm)) best = Math.max(best, 80); // contains
      if (snorm.startsWith(anorm) || anorm.startsWith(snorm)) best = Math.max(best, 60);
    }
    return best;
  }

  const resolved = baseChannels.map(ch => {
    const aliases = ch.xtreamSearchAliases || [];
    if (aliases.length === 0) {
      // No aliases defined — try matching by channel name itself
      aliases.push(ch.name, ch.nameEn || '', ch.nameKu || '');
    }

    // 1. Try exact index lookup first (fastest)
    let bestStream = null;
    for (const alias of aliases) {
      const key = normalizeStreamName(alias);
      if (streamIndex.has(key)) {
        bestStream = streamIndex.get(key);
        break;
      }
    }

    // 2. If no exact match, score all streams and pick best
    if (!bestStream) {
      let bestScore = 0;
      for (const s of allStreams) {
        const score = scoreMatch(aliases, s.name || '');
        if (score > bestScore) {
          bestScore = score;
          bestStream = s;
        }
        if (bestScore === 100) break; // perfect match, stop early
      }
      if (bestScore < 55) bestStream = null; // below threshold — keep base URL
    }

    if (!bestStream) return ch; // fallback: keep base channel as-is

    // Resolve clean Xtream stream URLs
    const xtreamUrl = `${base}/live/${username}/${password}/${bestStream.stream_id}.m3u8`;
    const xtreamBackup = `${base}/live/${username}/${password}/${bestStream.stream_id}.ts`;

    return {
      ...ch,
      url: xtreamUrl,
      backupUrl: xtreamBackup,
      tsUrl: xtreamBackup,
      // Keep original logo if Xtream logo is missing
      logo: bestStream.stream_icon || ch.logo,
      xtreamStreamId: bestStream.stream_id,
      resolvedFromServer: xtreamConfig.host,
    };
  });

  onProgress?.({ phase: 'تەواوبوو!', percent: 100 });
  return resolved;
}

/**
 * Normalize a stream name for fuzzy matching:
 * Lowercases, removes brackets/flags like [KU], [4K], HD, FHD, etc.
 */
export function normalizeStreamName(name = '') {
  return (name || '')
    .toLowerCase()
    .replace(/\[.*?\]/g, '')           // remove [KU], [AR], [4K] etc.
    .replace(/\b(hd|fhd|uhd|4k|sd|live|tv|channel|ch|ar:|ku:|en:)\b/gi, '')
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, ' ')  // keep Arabic/Kurdish chars
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Merge newly imported server channels with NNDD base channels (53 Kurdish core channels).
 * Keeps base channels at top (resolving stream URLs from new server if matched).
 * Appends new channels from selected categories without duplicates.
 */
export function mergeChannelsWithBasePlaylist(baseChannels, newServerChannels, serverHost = '') {
  if (!Array.isArray(newServerChannels) || newServerChannels.length === 0) {
    return baseChannels || [];
  }
  if (!Array.isArray(baseChannels) || baseChannels.length === 0) {
    return newServerChannels;
  }

  // 1. Index new server streams by normalized name
  const streamMap = new Map();
  for (const s of newServerChannels) {
    const key = normalizeStreamName(s.name);
    if (key && !streamMap.has(key)) streamMap.set(key, s);
  }

  const matchedStreamIds = new Set();

  // 2. Resolve base channels with new server URLs
  const updatedBaseChannels = baseChannels.map((baseCh) => {
    const aliases = baseCh.xtreamSearchAliases || [baseCh.name, baseCh.nameKu, baseCh.nameEn].filter(Boolean);
    let matchedStream = null;
    
    // Exact lookup first
    for (const a of aliases) {
      const k = normalizeStreamName(a);
      if (k && streamMap.has(k)) {
        matchedStream = streamMap.get(k);
        break;
      }
    }

    // Fuzzy contains lookup if not matched
    if (!matchedStream) {
      for (const s of newServerChannels) {
        const snorm = normalizeStreamName(s.name);
        for (const a of aliases) {
          const anorm = normalizeStreamName(a);
          if (anorm && anorm.length > 2 && (snorm.includes(anorm) || anorm.includes(snorm))) {
            matchedStream = s;
            break;
          }
        }
        if (matchedStream) break;
      }
    }

    if (matchedStream) {
      matchedStreamIds.add(String(matchedStream.stream_id || matchedStream.id));
      return {
        ...baseCh,
        url: matchedStream.url || baseCh.url,
        backupUrl: matchedStream.backupUrl || baseCh.backupUrl,
        tsUrl: matchedStream.tsUrl || baseCh.tsUrl,
        logo: baseCh.logo || matchedStream.logo || '/nndd_logo.png',
        fallbackLogo: '/nndd_logo.png',
        xtreamStreamId: matchedStream.stream_id || matchedStream.xtreamStreamId,
        resolvedFromServer: serverHost
      };
    }
    return {
      ...baseCh,
      fallbackLogo: '/nndd_logo.png',
      logo: baseCh.logo || '/nndd_logo.png'
    };
  });

  // 3. Append additional channels (excluding those already matched to base channels)
  let nextNumber = baseChannels.length + 1;
  const additionalChannels = [];
  const seenNames = new Set();

  for (const ch of newServerChannels) {
    const sId = String(ch.stream_id || ch.id);
    const key = normalizeStreamName(ch.name);
    if (!matchedStreamIds.has(sId) && (!key || !seenNames.has(key))) {
      if (key) seenNames.add(key);
      additionalChannels.push({
        ...ch,
        number: nextNumber++,
        logo: ch.logo || '/nndd_logo.png',
        fallbackLogo: '/nndd_logo.png'
      });
    }
  }

  return ensureDabinChannelFirst([...updatedBaseChannels, ...additionalChannels]);
}

/**
 * Fetch on-demand episodes for a specific series from Xtream API
 */
export async function fetchSeriesEpisodes(config = DEFAULT_SERVER_CONFIG, seriesId) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  const url = `${base}/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${seriesId}`;

  try {
    const res = await smartXtreamFetch(url, { timeout: 20000 });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const episodes = [];

    if (data && data.episodes) {
      const seasonKeys = Object.keys(data.episodes);
      seasonKeys.forEach(sNum => {
        const seasonEps = data.episodes[sNum] || [];
        seasonEps.forEach((ep, idx) => {
          const ext = ep.container_extension || 'mp4';
          const epUrl = `${base}/series/${username}/${password}/${ep.id}.${ext}`;
          episodes.push({
            number: ep.episode_num || idx + 1,
            season: parseInt(sNum) || 1,
            title: ep.title || `ئەڵقەی ${ep.episode_num || idx + 1}`,
            duration: ep.info?.duration ? `${Math.round((ep.info.duration_secs || 2700) / 60)} خولەک` : '45 خولەک',
            streamUrl: epUrl
          });
        });
      });
    }

    return {
      success: true,
      info: data.info || {},
      episodes
    };
  } catch(err) {
    console.error('[Xtream] Failed to fetch series episodes:', err);
    return { success: false, episodes: [] };
  }
}
