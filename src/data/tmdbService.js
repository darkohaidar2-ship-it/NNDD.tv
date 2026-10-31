/**
 * KOBIN TV — TMDB (The Movie Database) Metadata Enrichment Service
 * Automatically fetches rich poster art, backdrop banners, synopsis, cast,
 * ratings, and release year for VOD movies and series.
 * Caches results in IndexedDB / localStorage for instant offline access.
 */

const TMDB_API_KEY = 'e6459392226359f193eb778ec719c282'; // Public read-only IPTV proxy key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

const CACHE_PREFIX = 'kobin_tmdb_cache_';

/**
 * Clean title by removing quality tags, years, and provider brackets
 */
export function cleanMediaTitle(rawTitle = '') {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .replace(/\b(4K|UHD|FHD|HD|SD|1080p|720p|2160p|WEB-DL|BluRay|WEBRip|HDR|HEVC|x264|x265)\b/gi, '')
    .replace(/\b(19\d\d|20\d\d)\b/g, '')
    .replace(/[._\-]/g, ' ')
    .trim();
}

/**
 * Search TMDB for a movie or TV show and return rich metadata.
 * @param {string} title - raw title of movie or series
 * @param {'movie'|'tv'} type - media type
 * @returns {Promise<Object|null>}
 */
export async function fetchTmdbMetadata(title, type = 'movie') {
  if (!title) return null;
  const cleaned = cleanMediaTitle(title);
  if (!cleaned) return null;

  const cacheKey = `${CACHE_PREFIX}${type}_${cleaned.toLowerCase()}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  try {
    const endpoint = type === 'tv' ? 'search/tv' : 'search/movie';
    const url = `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleaned)}&language=ar`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return null;

    const metadata = {
      id: result.id,
      title: result.title || result.name || cleaned,
      originalTitle: result.original_title || result.original_name || '',
      overview: result.overview || '',
      poster: result.poster_path ? `${TMDB_IMAGE_BASE}${result.poster_path}` : null,
      backdrop: result.backdrop_path ? `${TMDB_BACKDROP_BASE}${result.backdrop_path}` : null,
      rating: result.vote_average ? result.vote_average.toFixed(1) : null,
      releaseDate: result.release_date || result.first_air_date || '',
      year: (result.release_date || result.first_air_date || '').slice(0, 4)
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(metadata));
    } catch (e) {}

    return metadata;
  } catch (err) {
    return null;
  }
}
