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
 * High-Level Importer: Automatically pulls live channels
 * and formats them into NNDD TV Channels schema classified into the user's defined categories.
 */
export async function importTargetServerChannels(config = DEFAULT_SERVER_CONFIG, onProgress = null) {
  const base = resolveXtreamHost(config.serverUrl || config.host || '');
  const username = (config.username || '').trim();
  const password = (config.password || '').trim();
  const importedChannels = [];
  const seenStreamIds = new Set();

  // 1. Fetch live categories dynamically from the Xtream server
  let categoriesToFetch = [];
  try {
    const allCategories = await getXtreamCategories(config, 'live');
    if (Array.isArray(allCategories) && allCategories.length > 0) {
      // Prioritize: Kurdish, Sports (beIN, SSC, 4K), Kids, Islamic, OSN/Cinema, News/Iraq
      const kurd = allCategories.filter(cat => /kurd/i.test(cat.category_name || ''));
      const sports = allCategories.filter(cat => /bein|ssc|sport|4k|uhd/i.test(cat.category_name || '') && !/kurd/i.test(cat.category_name || ''));
      const kids = allCategories.filter(cat => /kid|child|cartoon|اطفال/i.test(cat.category_name || ''));
      const islamic = allCategories.filter(cat => /islam|quran|ديني/i.test(cat.category_name || ''));
      const cinema = allCategories.filter(cat => /osn|cinema|movie|film|دراما/i.test(cat.category_name || ''));
      const newsIraq = allCategories.filter(cat => /iraq|news|اخبار/i.test(cat.category_name || ''));

      const prioritized = [
        ...kurd,
        ...sports.slice(0, 5),
        ...kids.slice(0, 2),
        ...islamic.slice(0, 2),
        ...cinema.slice(0, 2),
        ...newsIraq.slice(0, 2)
      ];

      categoriesToFetch = (prioritized.length > 0 ? prioritized : allCategories.slice(0, 12)).map(c => ({
        id: String(c.category_id),
        label: c.category_name
      }));
    }
  } catch(e) {}

  if (categoriesToFetch.length === 0) {
    // Default fallback category IDs for Lion 4K / Xtream standard panels
    categoriesToFetch = [
      { id: '818', label: '[KU] KURDISTAN' },
      { id: '789', label: '[AR] BEIN SPORTS 4K' },
      { id: '1164', label: '[AR] BEIN SPORTS' },
      { id: '1488', label: '[AR] BEIN SPORTS AFC' },
      { id: '796', label: '[AR] ARABIC KIDS' },
      { id: '795', label: '[AR] ISLAMIC' },
      { id: '799', label: '[AR] OSN' },
      { id: '1145', label: '[AR] IRAQ' }
    ];
  }

  let currentNumber = 1;

  for (let i = 0; i < categoriesToFetch.length; i++) {
    const cat = categoriesToFetch[i];
    onProgress?.({
      category: cat.label,
      current: i + 1,
      total: categoriesToFetch.length
    });

    try {
      const streams = await getXtreamLiveStreams(config, cat.id);
      for (const s of streams) {
        if (!s || !s.stream_id || seenStreamIds.has(s.stream_id)) continue;
        seenStreamIds.add(s.stream_id);

        // Default live stream to raw MPEG-TS (.ts) or .m3u8
        const streamUrl = `${base}/live/${username}/${password}/${s.stream_id}.ts`;
        const backupUrl = `${base}/live/${username}/${password}/${s.stream_id}.m3u8`;

        // Format clean channel name
        let rawName = s.name || 'کەناڵ';
        let cleanName = rawName.replace(/^(\[KU\]|\[AR\]|\[EN\]|KU:|KU|AR:|AR|BEIN:)\s*/i, '').trim();

        // Classify into user's predefined categories
        const assignedCategory = classifyChannelCategory(rawName, cat.label);

        const is4K = rawName.toUpperCase().includes('4K') || rawName.toUpperCase().includes('UHD');

        importedChannels.push({
          id: `xtream-${s.stream_id}`,
          number: currentNumber++,
          name: cleanName,
          nameEn: rawName,
          category: assignedCategory,
          rawCategory: cat.label,
          url: streamUrl,
          backupUrl: backupUrl,
          logo: s.stream_icon || '',
          fallbackLogo: s.stream_icon || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(cleanName)}`,
          quality: is4K ? '4K Ultra HD' : '1080p HD',
          is4K: is4K,
          isLocked: false,
          isFavorite: false,
          epg: {
            currentShow: 'بەرنامەی پەخشی ڕاستەوخۆ',
            nextShow: 'پەخشی بەردەوامی سێرڤەر',
            timeSlot: '24/7 Live Stream',
            progress: 45
          }
        });
      }
    } catch (e) {
      console.warn(`[Xtream Importer] Failed to load category ${cat.id}:`, e);
    }
  }

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
