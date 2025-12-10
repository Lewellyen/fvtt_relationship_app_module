import type { CacheEvictionStrategy, InternalCacheEntry } from "./eviction-strategy.interface";
import type { CacheKey } from "./cache.interface";
import type { ICacheStore } from "./store/cache-store.interface";

/**
 * Manages cache capacity by enforcing maxEntries limit through eviction.
 *
 * Delegates eviction logic to a CacheEvictionStrategy (e.g., LRU, FIFO, LFU).
 */
export class CacheCapacityManager {
  constructor(
    private readonly strategy: CacheEvictionStrategy,
    private readonly store: ICacheStore
  ) {}

  /**
   * Enforces capacity limit by evicting entries using the configured strategy.
   *
   * @param maxEntries - The maximum number of entries allowed
   * @returns Array of cache keys that were evicted
   */
  enforceCapacity(maxEntries: number): CacheKey[] {
    if (this.store.size <= maxEntries) {
      return [];
    }

    // Build a Map from store entries for the eviction strategy
    // (EvictionStrategy interface requires Map, but we use ICacheStore)
    const entriesMap = new Map<CacheKey, InternalCacheEntry>();
    for (const [key, entry] of this.store.entries()) {
      entriesMap.set(key, entry);
    }

    const keysToEvict = this.strategy.selectForEviction(entriesMap, maxEntries);
    for (const key of keysToEvict) {
      this.store.delete(key);
    }

    return keysToEvict;
  }
}
