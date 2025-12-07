import type { CacheEvictionStrategy, InternalCacheEntry } from "./eviction-strategy.interface";
import type { CacheKey } from "./cache.interface";

/**
 * Manages cache capacity by enforcing maxEntries limit through eviction.
 *
 * Delegates eviction logic to a CacheEvictionStrategy (e.g., LRU, FIFO, LFU).
 */
export class CacheCapacityManager {
  constructor(
    private readonly strategy: CacheEvictionStrategy,
    private readonly store: Map<CacheKey, InternalCacheEntry>
  ) {}

  /**
   * Enforces capacity limit by evicting entries using the configured strategy.
   *
   * @param maxEntries - The maximum number of entries allowed
   * @returns Number of entries evicted
   */
  enforceCapacity(maxEntries: number): number {
    if (this.store.size <= maxEntries) {
      return 0;
    }

    const keysToEvict = this.strategy.selectForEviction(this.store, maxEntries);
    for (const key of keysToEvict) {
      this.store.delete(key);
    }

    return keysToEvict.length;
  }
}
