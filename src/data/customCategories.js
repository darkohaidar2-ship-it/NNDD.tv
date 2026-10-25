/**
 * KOBIN TV - Custom Categories & Playlist Builder Engine
 * Manages user-created custom categories stored in localStorage ('kobin_tv_custom_categories').
 * Seamlessly integrates with Live TV Channels, VOD Movies, and Series.
 */

export const CUSTOM_CATEGORIES_STORAGE_KEY = 'kobin_tv_custom_categories';

/**
 * Fetch all user custom categories from localStorage
 * @returns {Array<{ id: string, name: string, channelIds: string[], vodMovieIds: string[], vodSeriesIds: string[], createdAt: number }>}
 */
export function getCustomCategories() {
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(c => ({
          id: c.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: (c.name || '').trim(),
          channelIds: Array.isArray(c.channelIds) ? c.channelIds : [],
          vodMovieIds: Array.isArray(c.vodMovieIds) ? c.vodMovieIds : [],
          vodSeriesIds: Array.isArray(c.vodSeriesIds) ? c.vodSeriesIds : [],
          createdAt: c.createdAt || Date.now()
        })).filter(c => c.name.length > 0);
      }
    }
  } catch (e) {
    console.warn('[CustomCategories] Failed to load from localStorage:', e);
  }
  return [];
}

/**
 * Persist custom categories to localStorage and notify the application
 */
export function saveCustomCategories(categories) {
  try {
    const valid = Array.isArray(categories) ? categories : [];
    localStorage.setItem(CUSTOM_CATEGORIES_STORAGE_KEY, JSON.stringify(valid));
    window.dispatchEvent(new CustomEvent('kobin_custom_categories_updated', { detail: valid }));
    return true;
  } catch (e) {
    console.error('[CustomCategories] Failed to save to localStorage:', e);
    return false;
  }
}

/**
 * Create a new custom category
 * @param {string} name - User specified category name
 * @returns {Array} Updated custom categories array
 */
export function createCustomCategory(name = '') {
  const cleanName = (name || '').trim();
  if (!cleanName) return getCustomCategories();

  const current = getCustomCategories();
  // Check if name already exists
  const existing = current.find(c => c.name.toLowerCase() === cleanName.toLowerCase());
  if (existing) return current;

  const newCat = {
    id: `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: cleanName,
    channelIds: [],
    vodMovieIds: [],
    vodSeriesIds: [],
    createdAt: Date.now()
  };

  const updated = [newCat, ...current];
  saveCustomCategories(updated);
  return updated;
}

/**
 * Delete a custom category by ID
 * @param {string} id - Category ID to delete
 * @returns {Array} Updated custom categories array
 */
export function deleteCustomCategory(id) {
  if (!id) return getCustomCategories();
  const current = getCustomCategories();
  const updated = current.filter(c => c.id !== id);
  saveCustomCategories(updated);
  return updated;
}

/**
 * Check if an item (channel / movie / series) belongs to a custom category
 */
export function isItemInCustomCategory(cat, { type = 'channel', id }) {
  if (!cat || !id) return false;
  if (type === 'channel') return (cat.channelIds || []).includes(id);
  if (type === 'movie') return (cat.vodMovieIds || []).includes(id);
  if (type === 'series') return (cat.vodSeriesIds || []).includes(id);
  return false;
}

/**
 * Toggle an item (channel, movie, or series) inside a custom category
 * If already inside, removes it; if not inside, adds it.
 * @param {string} catId
 * @param {{ type: 'channel'|'movie'|'series', id: string }} item
 * @returns {Array} Updated categories list
 */
export function toggleItemInCustomCategory(catId, { type = 'channel', id }) {
  if (!catId || !id) return getCustomCategories();
  const current = getCustomCategories();

  const updated = current.map(cat => {
    if (cat.id !== catId) return cat;

    let targetKey = 'channelIds';
    if (type === 'movie') targetKey = 'vodMovieIds';
    if (type === 'series') targetKey = 'vodSeriesIds';

    const arr = [...(cat[targetKey] || [])];
    const existsIdx = arr.indexOf(id);

    if (existsIdx !== -1) {
      arr.splice(existsIdx, 1);
    } else {
      arr.push(id);
    }

    return {
      ...cat,
      [targetKey]: arr
    };
  });

  saveCustomCategories(updated);
  return updated;
}
