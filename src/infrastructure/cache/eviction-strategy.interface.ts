import type { CacheKey } from "./cache.interface";

/**
 * Internal cache entry structure used by eviction strategies.
 */
export type InternalCacheEntry = {
  value: unknown;
  expiresAt: number | null;
  metadata: {
    key: CacheKey;
    createdAt: number;
    expiresAt: number | null;
    lastAccessedAt: number;
    hits: number;
    tags: readonly string[];
  };
};

/**
 * Strategy interface for cache eviction algorithms.
 *
 * Implementations decide which entries to evict when the cache exceeds its capacity.
 */
export interface CacheEvictionStrategy {
  /**
   * Selects entries for eviction when the cache exceeds maxEntries.
   *
   * @param entries - The current cache entries
   * @param maxEntries - The maximum number of entries allowed
   * @returns Array of cache keys to evict
   */
  selectForEviction(entries: Map<CacheKey, InternalCacheEntry>, maxEntries: number): CacheKey[];
}
