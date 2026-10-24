import { supabase } from './supabaseClient';

export const HARDCODED_UPSTREAM_SERVER = 'http://line.liondnscloud.ru:80';
export const HARDCODED_TEST_USER = '292c8215';
export const HARDCODED_TEST_PASS = 'adef5d6e';

const STORAGE_KEY_OVERRIDES = 'dabin_category_overrides_v1';
const STORAGE_KEY_CUSTOM_BOUQUETS = 'dabin_custom_categories_v1';
const STORAGE_KEY_CHANNELS_OVERRIDE = 'dabin_channel_overrides_v1';
const STORAGE_KEY_UPSTREAM_CACHE = 'dabin_upstream_categories_cache_v1';

// Initial default seed category overrides
export const DEFAULT_SEED_OVERRIDES = [
  {
    id: 'seed-override-818',
    category_type: 'live',
    upstream_category_id: '818',
    original_name: '[KU] KURDISTAN',
    custom_name: 'کەناڵە کوردییەکان (Kurdish)',
    is_visible: true,
    sort_order: 1
  },
  {
    id: 'seed-override-1164',
    category_type: 'live',
    upstream_category_id: '1164',
    original_name: '[AR] BEIN SPORTS',
    custom_name: 'بین سپۆرت (beIN Sports)',
    is_visible: true,
    sort_order: 2
  },
  {
    id: 'seed-override-1488',
    category_type: 'live',
    upstream_category_id: '1488',
    original_name: '[AR] BEIN SPORTS AFC',
    custom_name: 'بین سپۆرت ئاسیا (beIN AFC)',
    is_visible: true,
    sort_order: 3
  },
  {
    id: 'seed-override-1478',
    category_type: 'live',
    upstream_category_id: '1478',
    original_name: '[AR] BEIN SPORTS G 8K',
    custom_name: 'وەرزشی بەرزترین کوالێتی (8K Sports)',
    is_visible: true,
    sort_order: 4
  },
  {
    id: 'seed-override-1577',
    category_type: 'live',
    upstream_category_id: '1577',
    original_name: '[AR] DAZN PPV',
    custom_name: 'دازن و مۆبایلی PPV',
    is_visible: true,
    sort_order: 5
  }
];

// Initial default custom bouquets (Virtual Bouquets)
export const DEFAULT_SEED_CUSTOM_BOUQUETS = [
  {
    id: 'custom-bouquet-vip',
    category_type: 'live',
    name: 'DABIN VIP 👑',
    icon: '👑',
    is_visible: true,
    sort_order: 0,
    stream_ids: [682184, 673660, 588449, 588446]
  },
  {
    id: 'custom-bouquet-kurd',
    category_type: 'live',
    name: 'کوردستان ڕاستەوخۆ ☀️',
    icon: '☀️',
    is_visible: true,
    sort_order: 1,
    stream_ids: [682184, 673660, 588449]
  }
];

// Initial channel overrides (Rename & custom logo)
export const DEFAULT_SEED_CHANNEL_OVERRIDES = [
  {
    id: 'override-ch-682184',
    stream_id: '682184',
    original_name: '[KU] AZHIN TV',
    custom_name: 'ئەژین تیڤی HD',
    custom_logo: '',
    is_hidden: false
  }
];

/**
 * Fetch raw categories from LionOTT upstream server
 */
export async function fetchUpstreamLionOttCategories(type = 'live', config = null) {
  const host = (config?.serverUrl || config?.host || HARDCODED_UPSTREAM_SERVER).replace(/\/+$/, '');
  const username = config?.username || HARDCODED_TEST_USER;
  const password = config?.password || HARDCODED_TEST_PASS;

  const action = type === 'movie' || type === 'vod' 
    ? 'get_vod_categories' 
    : type === 'series' 
    ? 'get_series_categories' 
    : 'get_live_categories';

  const url = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'IPTVSmartersPro/3.1.5.1 (Linux; Android 12)',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) {
      throw new Error(`Upstream server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      try {
        const cacheObj = JSON.parse(localStorage.getItem(STORAGE_KEY_UPSTREAM_CACHE) || '{}');
        cacheObj[type] = data;
        localStorage.setItem(STORAGE_KEY_UPSTREAM_CACHE, JSON.stringify(cacheObj));
      } catch (e) {}
      return data;
    }
    return [];
  } catch (err) {
    console.warn(`[BouquetService] Direct fetch failed, trying proxy or cache: ${err.message}`);
    // Check localStorage cache
    try {
      const cacheObj = JSON.parse(localStorage.getItem(STORAGE_KEY_UPSTREAM_CACHE) || '{}');
      if (Array.isArray(cacheObj[type]) && cacheObj[type].length > 0) {
        return cacheObj[type];
      }
    } catch (e) {}

    // Fallback: fetch via backend proxy
    try {
      const proxyUrl = `/api/xtream/DA:B1:24:97:88:12/${action}`;
      const pres = await fetch(proxyUrl);
      if (pres.ok) {
        const pdata = await pres.json();
        if (Array.isArray(pdata)) return pdata;
      }
    } catch (pe) {
      console.warn('[BouquetService] Proxy fetch also failed:', pe.message);
    }

    return [];
  }
}

/**
 * Fetch raw streams for a specific category from LionOTT
 */
export async function fetchUpstreamCategoryStreams(type = 'live', categoryId, config = null) {
  const host = (config?.serverUrl || config?.host || HARDCODED_UPSTREAM_SERVER).replace(/\/+$/, '');
  const username = config?.username || HARDCODED_TEST_USER;
  const password = config?.password || HARDCODED_TEST_PASS;

  const action = type === 'movie' || type === 'vod' 
    ? 'get_vod_streams' 
    : type === 'series' 
    ? 'get_series' 
    : 'get_live_streams';

  let url = `${host}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=${action}`;
  if (categoryId) {
    url += `&category_id=${encodeURIComponent(categoryId)}`;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'IPTVSmartersPro/3.1.5.1 (Linux; Android 12)',
        'Cache-Control': 'no-cache'
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`[BouquetService] Fetch category streams failed: ${err.message}`);
    return [];
  }
}

/**
 * Get all category overrides (from Supabase or local cache)
 */
export async function getCategoryOverrides(categoryType = 'live') {
  try {
    const { data, error } = await supabase
      .from('category_overrides')
      .select('*')
      .eq('category_type', categoryType)
      .order('sort_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      localStorage.setItem(`${STORAGE_KEY_OVERRIDES}_${categoryType}`, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[BouquetService] Supabase getCategoryOverrides fallback:', err.message);
  }

  // Fallback to localStorage
  try {
    const local = localStorage.getItem(`${STORAGE_KEY_OVERRIDES}_${categoryType}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return DEFAULT_SEED_OVERRIDES.filter(o => o.category_type === categoryType);
}

/**
 * Save or update a single category override
 */
export async function saveCategoryOverride(override) {
  const payload = {
    category_type: override.category_type || 'live',
    upstream_category_id: String(override.upstream_category_id),
    original_name: override.original_name || '',
    custom_name: override.custom_name ?? '',
    is_visible: override.is_visible !== false,
    sort_order: parseInt(override.sort_order, 10) || 100,
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('category_overrides')
      .upsert(payload, { onConflict: 'category_type,upstream_category_id' })
      .select()
      .maybeSingle();

    if (!error && data) {
      updateLocalOverrideCache(payload.category_type, data);
      notifyBouquetChange();
      return data;
    }
  } catch (err) {
    console.warn('[BouquetService] Supabase saveCategoryOverride fallback:', err.message);
  }

  // Local fallback
  const mockSaved = {
    ...payload,
    id: override.id || `loc-override-${Date.now()}`
  };
  updateLocalOverrideCache(payload.category_type, mockSaved);
  notifyBouquetChange();
  return mockSaved;
}

/**
 * Bulk save category overrides (e.g. after mass hide or reorder)
 */
export async function bulkSaveCategoryOverrides(overridesList, categoryType = 'live') {
  const prepared = overridesList.map(o => ({
    category_type: categoryType,
    upstream_category_id: String(o.upstream_category_id),
    original_name: o.original_name || '',
    custom_name: o.custom_name ?? '',
    is_visible: o.is_visible !== false,
    sort_order: parseInt(o.sort_order, 10) || 100,
    updated_at: new Date().toISOString()
  }));

  try {
    const { data, error } = await supabase
      .from('category_overrides')
      .upsert(prepared, { onConflict: 'category_type,upstream_category_id' })
      .select();

    if (!error && Array.isArray(data)) {
      localStorage.setItem(`${STORAGE_KEY_OVERRIDES}_${categoryType}`, JSON.stringify(data));
      notifyBouquetChange();
      return data;
    }
  } catch (err) {
    console.warn('[BouquetService] Bulk save fallback to local:', err.message);
  }

  localStorage.setItem(`${STORAGE_KEY_OVERRIDES}_${categoryType}`, JSON.stringify(prepared));
  notifyBouquetChange();
  return prepared;
}

function updateLocalOverrideCache(categoryType, item) {
  try {
    const key = `${STORAGE_KEY_OVERRIDES}_${categoryType}`;
    const raw = localStorage.getItem(key);
    let list = raw ? JSON.parse(raw) : [...DEFAULT_SEED_OVERRIDES.filter(o => o.category_type === categoryType)];
    const idx = list.findIndex(o => String(o.upstream_category_id) === String(item.upstream_category_id));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.push(item);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {}
}

/**
 * Get Custom Virtual Bouquets
 */
export async function getCustomCategories(categoryType = 'live') {
  try {
    const { data, error } = await supabase
      .from('custom_categories')
      .select('*')
      .eq('category_type', categoryType)
      .order('sort_order', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      localStorage.setItem(`${STORAGE_KEY_CUSTOM_BOUQUETS}_${categoryType}`, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[BouquetService] Supabase getCustomCategories fallback:', err.message);
  }

  try {
    const local = localStorage.getItem(`${STORAGE_KEY_CUSTOM_BOUQUETS}_${categoryType}`);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return DEFAULT_SEED_CUSTOM_BOUQUETS.filter(b => b.category_type === categoryType);
}

/**
 * Save or update a Custom Category (Virtual Bouquet)
 */
export async function saveCustomCategory(bouquet) {
  const payload = {
    category_type: bouquet.category_type || 'live',
    name: bouquet.name.trim(),
    icon: bouquet.icon || '📺',
    is_visible: bouquet.is_visible !== false,
    sort_order: parseInt(bouquet.sort_order, 10) || 10,
    stream_ids: Array.isArray(bouquet.stream_ids) ? bouquet.stream_ids : [],
    updated_at: new Date().toISOString()
  };

  if (bouquet.id && !bouquet.id.startsWith('loc-')) {
    payload.id = bouquet.id;
  }

  try {
    const { data, error } = await supabase
      .from('custom_categories')
      .upsert(payload)
      .select()
      .maybeSingle();

    if (!error && data) {
      updateLocalCustomBouquetCache(payload.category_type, data);
      notifyBouquetChange();
      return data;
    }
  } catch (err) {
    console.warn('[BouquetService] Supabase saveCustomCategory fallback:', err.message);
  }

  const mockSaved = {
    ...payload,
    id: bouquet.id || `loc-custom-${Date.now()}`
  };
  updateLocalCustomBouquetCache(payload.category_type, mockSaved);
  notifyBouquetChange();
  return mockSaved;
}

/**
 * Delete a Custom Category
 */
export async function deleteCustomCategory(id, categoryType = 'live') {
  try {
    await supabase
      .from('custom_categories')
      .delete()
      .eq('id', id);
  } catch (err) {
    console.warn('[BouquetService] Delete fallback:', err.message);
  }

  try {
    const key = `${STORAGE_KEY_CUSTOM_BOUQUETS}_${categoryType}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list = JSON.parse(raw).filter(b => b.id !== id);
      localStorage.setItem(key, JSON.stringify(list));
    }
  } catch (e) {}

  notifyBouquetChange();
  return true;
}

function updateLocalCustomBouquetCache(categoryType, item) {
  try {
    const key = `${STORAGE_KEY_CUSTOM_BOUQUETS}_${categoryType}`;
    const raw = localStorage.getItem(key);
    let list = raw ? JSON.parse(raw) : [...DEFAULT_SEED_CUSTOM_BOUQUETS.filter(b => b.category_type === categoryType)];
    const idx = list.findIndex(b => b.id === item.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.push(item);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {}
}

/**
 * Channel Overrides (Rename specific channel, custom logo URL, hide channel)
 */
export async function getChannelOverrides() {
  try {
    const { data, error } = await supabase
      .from('channel_overrides')
      .select('*');

    if (!error && Array.isArray(data) && data.length > 0) {
      localStorage.setItem(STORAGE_KEY_CHANNELS_OVERRIDE, JSON.stringify(data));
      return data;
    }
  } catch (err) {
    console.warn('[BouquetService] Supabase getChannelOverrides fallback:', err.message);
  }

  try {
    const local = localStorage.getItem(STORAGE_KEY_CHANNELS_OVERRIDE);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  return DEFAULT_SEED_CHANNEL_OVERRIDES;
}

export async function saveChannelOverride(override) {
  const payload = {
    stream_id: String(override.stream_id),
    original_name: override.original_name || '',
    custom_name: override.custom_name ?? '',
    custom_logo: override.custom_logo ?? '',
    is_hidden: override.is_hidden === true,
    custom_category_id: override.custom_category_id || '',
    updated_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('channel_overrides')
      .upsert(payload, { onConflict: 'stream_id' })
      .select()
      .maybeSingle();

    if (!error && data) {
      updateLocalChannelOverrideCache(data);
      notifyBouquetChange();
      return data;
    }
  } catch (err) {
    console.warn('[BouquetService] Supabase saveChannelOverride fallback:', err.message);
  }

  const mockSaved = {
    ...payload,
    id: override.id || `loc-chan-${Date.now()}`
  };
  updateLocalChannelOverrideCache(mockSaved);
  notifyBouquetChange();
  return mockSaved;
}

export async function deleteChannelOverride(streamId) {
  try {
    await supabase
      .from('channel_overrides')
      .delete()
      .eq('stream_id', String(streamId));
  } catch (err) {}

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHANNELS_OVERRIDE);
    if (raw) {
      const list = JSON.parse(raw).filter(c => String(c.stream_id) !== String(streamId));
      localStorage.setItem(STORAGE_KEY_CHANNELS_OVERRIDE, JSON.stringify(list));
    }
  } catch (e) {}

  notifyBouquetChange();
  return true;
}

function updateLocalChannelOverrideCache(item) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CHANNELS_OVERRIDE);
    let list = raw ? JSON.parse(raw) : [...DEFAULT_SEED_CHANNEL_OVERRIDES];
    const idx = list.findIndex(c => String(c.stream_id) === String(item.stream_id));
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.push(item);
    }
    localStorage.setItem(STORAGE_KEY_CHANNELS_OVERRIDE, JSON.stringify(list));
  } catch (e) {}
}

/**
 * Dispatch local custom event across tabs & components
 */
function notifyBouquetChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dabin_bouquets_updated'));
  }
}

/**
 * Subscribe to Supabase Realtime pub/sub across all 3 tables
 */
export function subscribeToBouquetsRealtime(onUpdate) {
  const channel = supabase
    .channel('dabin-bouquets-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'category_overrides' }, () => {
      onUpdate?.();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_categories' }, () => {
      onUpdate?.();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_overrides' }, () => {
      onUpdate?.();
    })
    .subscribe();

  const handleLocal = () => onUpdate?.();
  if (typeof window !== 'undefined') {
    window.addEventListener('dabin_bouquets_updated', handleLocal);
  }

  return () => {
    supabase.removeChannel(channel);
    if (typeof window !== 'undefined') {
      window.removeEventListener('dabin_bouquets_updated', handleLocal);
    }
  };
}

/**
 * Composite Processor: Takes raw upstream categories, applies overrides, filters, renames,
 * sort order, and injects custom categories.
 */
export function processProcessedCategories(rawCategories = [], overrides = [], customCategories = []) {
  const overrideMap = new Map();
  overrides.forEach(o => {
    overrideMap.set(String(o.upstream_category_id), o);
  });

  const processed = [];

  // 1. Process Upstream Categories
  for (const cat of rawCategories) {
    const ov = overrideMap.get(String(cat.category_id));
    if (ov && ov.is_visible === false) {
      // Filter out hidden category
      continue;
    }

    processed.push({
      category_id: String(cat.category_id),
      category_name: (ov && ov.custom_name && ov.custom_name.trim()) ? ov.custom_name.trim() : cat.category_name,
      original_name: cat.category_name,
      parent_id: cat.parent_id || 0,
      is_custom: false,
      is_visible: true,
      sort_order: ov?.sort_order !== undefined ? ov.sort_order : 100
    });
  }

  // 2. Add Visible Custom Categories (Virtual Bouquets)
  for (const b of customCategories) {
    if (b.is_visible === false) continue;
    processed.push({
      category_id: `custom_${b.id}`,
      category_name: `${b.icon ? b.icon + ' ' : ''}${b.name}`,
      original_name: b.name,
      parent_id: 0,
      is_custom: true,
      is_visible: true,
      sort_order: b.sort_order !== undefined ? b.sort_order : 10,
      stream_ids: b.stream_ids || []
    });
  }

  // 3. Sort by sort_order ASC, then category_name
  processed.sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.category_name.localeCompare(b.category_name);
  });

  return processed;
}
