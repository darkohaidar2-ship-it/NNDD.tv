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

  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `http://${clean}`;
  }

  // Auto-resolve known blocked zones to live working cluster
  if (clean.includes('lion4k.vip') || clean.includes('lionsmart.cc') || clean.includes('lionott.com')) {
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
 * Test authentication and fetch account status from Xtream server
 */
export async function testXtreamConnection(config = DEFAULT_SERVER_CONFIG) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  const url = `${base}/player_api.php?username=${username}&password=${password}`;

  const t0 = performance.now();
  try {
    const res = await fetch(url);
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
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cats = await res.json();
    return Array.isArray(cats) ? cats : [];
  } catch (err) {
    console.error(`[Xtream] Error fetching ${type} categories:`, err);
    return [];
  }
}

/**
 * Fetch streams for a specific category
 */
export async function getXtreamLiveStreams(config = DEFAULT_SERVER_CONFIG, categoryId = null) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  let url = `${base}/player_api.php?username=${username}&password=${password}&action=get_live_streams`;
  if (categoryId) url += `&category_id=${categoryId}`;

  try {
    const res = await fetch(url);
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
    const res = await fetch(url);
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
    const res = await fetch(url);
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
    const [allCategories, allStreams] = await Promise.all([
      getXtreamCategories(config, 'live'),
      getXtreamLiveStreams(config)
    ]);

    const catCounts = {};
    if (Array.isArray(allStreams)) {
      for (const s of allStreams) {
        if (s && s.category_id) {
          catCounts[s.category_id] = (catCounts[s.category_id] || 0) + 1;
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
 * High-Performance Server Importer:
 * Pulls live channels and formats them into NNDD TV schema with full classification.
 * Supports:
 * - mode: 'comprehensive' -> ~2,500 regional (Kurdish, Arabic, Sports, News, Kids, OSN, MBC) channels
 * - mode: 'all' -> All 20,188 channels in a single rapid batch fetch (~1.5s)
 * - mode: 'categories' -> Only channels matching selectedCategoryIds
 */
export async function importTargetServerChannels(config = DEFAULT_SERVER_CONFIG, onProgress = null, options = {}) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  const mode = options.mode || 'comprehensive'; // 'comprehensive' | 'all' | 'categories'
  const selectedCategoryIds = options.categoryIds ? new Set(Array.from(options.categoryIds).map(String)) : null;
  const defaultHidden = options.defaultHidden || false;

  onProgress?.({
    category: 'داگرتنی داتای کەناڵەکان لە سێرڤەر...',
    current: 1,
    total: 3
  });

  // 1. Fetch categories & all streams concurrently in rapid single requests
  let categories = [];
  let streams = options.cachedStreams || null;

  try {
    if (!streams) {
      const [catsRes, streamsRes] = await Promise.all([
        getXtreamCategories(config, 'live'),
        getXtreamLiveStreams(config)
      ]);
      categories = catsRes || [];
      streams = streamsRes || [];
    } else {
      categories = await getXtreamCategories(config, 'live') || [];
    }
  } catch (err) {
    console.error('[Xtream Importer] Failed to fetch streams/categories:', err);
    streams = [];
  }

  onProgress?.({
    category: `پۆلێنکردنی ${streams.length} کەناڵ...`,
    current: 2,
    total: 3
  });

  // Map category IDs to category names & regional flags
  const categoryMap = new Map();
  const regionalCategoryIds = new Set();

  for (const c of categories) {
    const id = String(c.category_id);
    const name = c.category_name || '';
    categoryMap.set(id, name);

    const lower = name.toLowerCase();
    const isRegional = 
      lower.includes('kurd') || 
      lower.includes('کورد') ||
      /bein|ssc|sport|dazn|ad sport|starzplay|champions|uefa|fifa/i.test(lower) ||
      lower.includes('[ar]') || 
      /عرب|عراق|مصر|سعود|خليج|مغرب|تونس|جزائر|شام|لبنان/i.test(lower) ||
      /news|kids|islam|quran|cinema|movie|film|osn|mbc|shahid/i.test(lower);

    if (isRegional) {
      regionalCategoryIds.add(id);
    }
  }

  // 2. Filter streams according to selected mode
  let targetStreams = streams;
  if (mode === 'categories' && selectedCategoryIds && selectedCategoryIds.size > 0) {
    targetStreams = streams.filter(s => selectedCategoryIds.has(String(s.category_id)));
  } else if (mode === 'comprehensive') {
    // If comprehensive, take all streams belonging to regional categories
    targetStreams = streams.filter(s => regionalCategoryIds.has(String(s.category_id)));
    // Fallback if none matched
    if (targetStreams.length === 0) {
      targetStreams = streams.slice(0, 3000);
    }
  }
  // If mode === 'all', keep all targetStreams (all 20,188 streams!)

  // 3. Map into NNDD TV Channels schema
  const importedChannels = [];
  const seenStreamIds = new Set();
  let currentNumber = 1;

  for (let i = 0; i < targetStreams.length; i++) {
    const s = targetStreams[i];
    if (!s || !s.stream_id || seenStreamIds.has(s.stream_id)) continue;
    seenStreamIds.add(s.stream_id);

    const catId = String(s.category_id || '');
    const catLabel = categoryMap.get(catId) || '[General]';

    const streamUrl = `${base}/live/${username}/${password}/${s.stream_id}.ts`;
    const backupUrl = `${base}/live/${username}/${password}/${s.stream_id}.m3u8`;

    let rawName = s.name || 'کەناڵ';
    let cleanName = rawName.replace(/^(\[KU\]|\[AR\]|\[EN\]|KU:|KU|AR:|AR|BEIN:)\s*/i, '').trim();

    const assignedCategory = classifyChannelCategory(rawName, catLabel);
    const is4K = rawName.toUpperCase().includes('4K') || rawName.toUpperCase().includes('UHD');

    // Decide whether to hide by default
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
      logo: s.stream_icon || '',
      fallbackLogo: s.stream_icon || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanName)}`,
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
  }

  onProgress?.({
    category: `تەواوبوو! ئامادەکردنی ${importedChannels.length} کەناڵ...`,
    current: 3,
    total: 3
  });

  return importedChannels;
}

/**
 * High-Level VOD Importer: Pulls Movies & Series from Xtream Codes server
 */
export async function importTargetServerVod(config = DEFAULT_SERVER_CONFIG, onProgress = null) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();

  const importedMovies = [];
  const importedSeries = [];

  // 1. Fetch VOD Categories & Top Movies
  try {
    onProgress?.({ stage: 'movies', label: 'هاوردەکردنی فیلمەکانی 4K و سینەما...', current: 1, total: 2 });
    const vodCats = await getXtreamCategories(config, 'vod');
    
    // Pick high priority movie categories (2025/2026, Netflix, 4K, Cinema, Action, Kurdish)
    const priorityVodCats = (vodCats || []).filter(c => {
      const n = (c.category_name || '').toLowerCase();
      return n.includes('kurd') || n.includes('4k') || n.includes('netflix') || 
             n.includes('2025') || n.includes('2026') || n.includes('action') ||
             n.includes('أفلام') || n.includes('cinema');
    });

    const targetVodCats = (priorityVodCats.length > 0 ? priorityVodCats : (vodCats || [])).slice(0, 8);

    for (let i = 0; i < targetVodCats.length; i++) {
      const cat = targetVodCats[i];
      try {
        const streams = await getXtreamVodStreams(config, cat.category_id);
        const topStreams = (streams || []).slice(0, 30); // 30 top movies per category = up to 240 movies
        for (const m of topStreams) {
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
            category: assignedMovieCat
          });
        }
      } catch(e) {}
    }
  } catch(e) {
    console.warn('[VOD Importer] Error fetching movies:', e);
  }

  // 2. Fetch Series Categories & Series
  try {
    onProgress?.({ stage: 'series', label: 'هاوردەکردنی زنجیرەکان...', current: 2, total: 2 });
    const seriesCats = await getXtreamCategories(config, 'series');

    const prioritySeriesCats = (seriesCats || []).filter(c => {
      const n = (c.category_name || '').toLowerCase();
      return n.includes('kurd') || n.includes('netflix') || n.includes('ترك') || 
             n.includes('عراق') || n.includes('مسلسلات') || n.includes('2025') || n.includes('2026');
    });

    const targetSeriesCats = (prioritySeriesCats.length > 0 ? prioritySeriesCats : (seriesCats || [])).slice(0, 6);

    for (let i = 0; i < targetSeriesCats.length; i++) {
      const cat = targetSeriesCats[i];
      try {
        const seriesList = await getXtreamSeries(config, cat.category_id);
        const topSeries = (seriesList || []).slice(0, 15); // 15 series per category = 90 series
        for (const s of topSeries) {
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
            episodes: [] // Loaded on demand when clicked
          });
        }
      } catch(e) {}
    }
  } catch(e) {
    console.warn('[VOD Importer] Error fetching series:', e);
  }

  return {
    movies: importedMovies,
    series: importedSeries
  };
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
    const res = await fetch(url);
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
