/**
 * LRU Cache utility for managing script cache with size limits
 */

const MAX_CACHE_SIZE = 50;

/**
 * Set a value in the cache with LRU eviction
 * If cache exceeds MAX_CACHE_SIZE, removes the oldest entry
 */
export function setCacheValue<K, V>(
  cache: Map<K, V>,
  key: K,
  value: V,
): void {
  // If key already exists, delete it first to update position
  if (cache.has(key)) {
    cache.delete(key);
  }

  // Add new entry
  cache.set(key, value);

  // Remove oldest entries if cache exceeds limit
  if (cache.size > MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) {
      cache.delete(firstKey);
    }
  }
}

