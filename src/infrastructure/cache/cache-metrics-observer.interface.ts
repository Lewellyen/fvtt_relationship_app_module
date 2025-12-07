import type { CacheKey } from "./cache.interface";

/**
 * Observer interface for cache metrics events.
 *
 * Allows decoupling metrics collection from cache operations.
 */
export interface CacheMetricsObserver {
  /**
   * Called when a cache hit occurs.
   *
   * @param key - The cache key that was hit
   */
  onCacheHit(key: CacheKey): void;

  /**
   * Called when a cache miss occurs.
   *
   * @param key - The cache key that was missed
   */
  onCacheMiss(key: CacheKey): void;

  /**
   * Called when an entry is evicted from the cache.
   *
   * @param key - The cache key that was evicted
   */
  onCacheEviction(key: CacheKey): void;
}
