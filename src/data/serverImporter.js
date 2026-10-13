/**
 * NNDD TV - Xtream Codes API Server Importer & Sync Engine
 * Fully integrated with NINJA OTT Server (Cloudflare SSL + CORS support)
 */

export const DEFAULT_SERVER_CONFIG = {
  serverUrl: 'https://s1.1234.ninja',
  username: '22794645',
  password: '67879152',
  serverName: 'NINJA OTT Server (Ultra 4K)'
};

/**
 * Test authentication and fetch account status from Xtream server
 */
export async function testXtreamConnection(config = DEFAULT_SERVER_CONFIG) {
  const base = config.serverUrl.replace(/\/+$/, '');
  const url = `${base}/player_api.php?username=${config.username}&password=${config.password}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();

    if (data.user_info && data.user_info.auth === 1) {
      return {
        success: true,
        user: data.user_info,
        server: data.server_info,
        status: data.user_info.status,
        expDate: data.user_info.exp_date ? new Date(parseInt(data.user_info.exp_date) * 1000).toLocaleDateString() : 'N/A',
        maxConnections: data.user_info.max_connections || 1
      };
    } else {
      throw new Error(data.user_info?.message || 'Authentication failed (یوزەرنەیم یان پاسۆرد هەڵەیە)');
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Fetch all categories (live, vod, or series)
 */
export async function getXtreamCategories(config = DEFAULT_SERVER_CONFIG, type = 'live') {
  const base = config.serverUrl.replace(/\/+$/, '');
  const action = type === 'vod' ? 'get_vod_categories' : type === 'series' ? 'get_series_categories' : 'get_live_categories';
  const url = `${base}/player_api.php?username=${config.username}&password=${config.password}&action=${action}`;

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
  const base = config.serverUrl.replace(/\/+$/, '');
  let url = `${base}/player_api.php?username=${config.username}&password=${config.password}&action=get_live_streams`;
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
 * High-Level Importer: Automatically pulls Kurdistan UHD/4K and beIN Sports channels
 * and formats them into NNDD TV Channels schema ready for the app and Supabase.
 */
export async function importTargetServerChannels(config = DEFAULT_SERVER_CONFIG, onProgress = null) {
  const base = config.serverUrl.replace(/\/+$/, '');
  const importedChannels = [];

  // Target high-value Kurdish & Sports categories
  const targetCategoryIds = [
    { id: '1704', label: 'کوردی 4K / UHD' },
    { id: '1459', label: 'کوردستان' },
    { id: '1742', label: 'بین سپۆرت (beIN Sports)' },
    { id: '1053', label: 'عێراق و گشتی' }
  ];

  let currentNumber = 1;

  for (let i = 0; i < targetCategoryIds.length; i++) {
    const cat = targetCategoryIds[i];
    onProgress?.({
      category: cat.label,
      current: i + 1,
      total: targetCategoryIds.length
    });

    try {
      const streams = await getXtreamLiveStreams(config, cat.id);
      for (const s of streams) {
        // Default live stream to raw MPEG-TS (.ts) to bypass HLS manifest-parsing latency
        const streamUrl = `${base}/live/${config.username}/${config.password}/${s.stream_id}.ts`;
        const backupUrl = `${base}/live/${config.username}/${config.password}/${s.stream_id}.m3u8`;

        // Format clean channel name
        let cleanName = s.name || 'کەناڵ';
        cleanName = cleanName.replace(/^(KU:|KU|AR:|AR|BEIN:)\s*/i, '').trim();

        const is4K = s.name.toUpperCase().includes('4K') || s.name.toUpperCase().includes('UHD');

        importedChannels.push({
          id: `xtream-${s.stream_id}`,
          number: currentNumber++,
          name: cleanName,
          nameEn: s.name,
          category: cat.label,
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
            nextShow: 'درامای شەوانە',
            timeSlot: '20:00 - 21:00',
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
