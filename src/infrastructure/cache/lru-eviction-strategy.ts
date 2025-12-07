import type { CacheEvictionStrategy, InternalCacheEntry } from "./eviction-strategy.interface";
import type { CacheKey } from "./cache.interface";

/**
 * LRU (Least Recently Used) eviction strategy.
 *
 * Evicts entries that were accessed least recently based on lastAccessedAt timestamp.
 */
export class LRUEvictionStrategy implements CacheEvictionStrategy {
  /**
   * Selects entries for eviction using LRU algorithm.
   *
   * Sorts entries by lastAccessedAt (ascending) and selects the oldest entries
   * until the cache size is within maxEntries limit.
   *
   * @param entries - The current cache entries
   * @param maxEntries - The maximum number of entries allowed
   * @returns Array of cache keys to evict (oldest first)
   */
  selectForEviction(entries: Map<CacheKey, InternalCacheEntry>, maxEntries: number): CacheKey[] {
    const toRemove = entries.size - maxEntries;
    if (toRemove <= 0) {
      return [];
    }

    // Sort entries by lastAccessedAt (ascending - oldest first)
    const sorted = Array.from(entries.entries()).sort(
      (a, b) => a[1].metadata.lastAccessedAt - b[1].metadata.lastAccessedAt
    );

    // Return the oldest entries (first toRemove entries)
    return sorted.slice(0, toRemove).map(([key]) => key);
  }
}
