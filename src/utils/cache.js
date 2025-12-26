import NodeCache from "node-cache";

/**
 * In-Memory Cache Layer
 *
 * Reduces database load by caching frequently accessed data.
 * Uses TTL (Time-To-Live) to ensure data freshness.
 *
 * Cache Strategy:
 * - Tracks list: 5 minutes TTL (data changes infrequently)
 * - Search results: 1 minute TTL (need fresher results)
 * - Single track: 10 minutes TTL
 * - Podcasts: 5 minutes TTL
 */

// Create cache instance with automatic cleanup
const cache = new NodeCache({
  stdTTL: 300, // Default 5 minutes
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // Better performance, objects are mutable
  deleteOnExpire: true,
});

// Cache key prefixes for organization
const CACHE_KEYS = {
  TRACKS_LIST: "tracks:list",
  TRACK_SINGLE: "track:",
  PODCASTS_LIST: "podcasts:list",
  PODCAST_SINGLE: "podcast:",
  SEARCH: "search:",
  GENRES: "genres",
  STATS: "stats:",
};

// TTL values in seconds
const TTL = {
  TRACKS_LIST: 300, // 5 minutes
  TRACK_SINGLE: 600, // 10 minutes
  SEARCH: 60, // 1 minute
  PODCASTS: 300, // 5 minutes
  GENRES: 3600, // 1 hour (rarely changes)
  STATS: 120, // 2 minutes
};

/**
 * Get cached data or execute callback and cache result
 * @param {string} key - Cache key
 * @param {Function} callback - Async function to get data if not cached
 * @param {number} ttl - TTL in seconds (optional)
 * @returns {Promise<any>} - Cached or fresh data
 */
const getOrSet = async (key, callback, ttl = 300) => {
  const cached = cache.get(key);

  if (cached !== undefined) {
    console.log(`[Cache] HIT: ${key}`);
    return cached;
  }

  console.log(`[Cache] MISS: ${key}`);
  const data = await callback();

  if (data !== null && data !== undefined) {
    cache.set(key, data, ttl);
  }

  return data;
};

/**
 * Set a value in cache
 */
const set = (key, value, ttl = 300) => {
  cache.set(key, value, ttl);
};

/**
 * Get a value from cache
 */
const get = (key) => {
  return cache.get(key);
};

/**
 * Delete a specific key or pattern
 */
const del = (key) => {
  if (key.includes("*")) {
    // Pattern delete - clear all matching keys
    const keys = cache.keys().filter((k) => k.startsWith(key.replace("*", "")));
    keys.forEach((k) => cache.del(k));
    return keys.length;
  }
  return cache.del(key);
};

/**
 * Clear all cache
 */
const flush = () => {
  cache.flushAll();
  console.log("[Cache] Flushed all cache");
};

/**
 * Invalidate cache for a specific entity type
 */
const invalidate = (type) => {
  switch (type) {
    case "tracks":
      del(CACHE_KEYS.TRACKS_LIST + "*");
      del(CACHE_KEYS.SEARCH + "*");
      break;
    case "podcasts":
      del(CACHE_KEYS.PODCASTS_LIST + "*");
      break;
    case "all":
      flush();
      break;
    default:
      del(type);
  }
};

/**
 * Get cache statistics
 */
const getStats = () => {
  return cache.getStats();
};

export {
  cache,
  CACHE_KEYS,
  TTL,
  getOrSet,
  set,
  get,
  del,
  flush,
  invalidate,
  getStats,
};

export default {
  getOrSet,
  set,
  get,
  del,
  flush,
  invalidate,
  getStats,
  CACHE_KEYS,
  TTL,
};
