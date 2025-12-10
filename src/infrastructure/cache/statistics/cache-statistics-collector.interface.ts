import type { CacheStatistics, CacheKey } from "../cache.interface";

/**
 * Interface for cache statistics collection.
 * Responsible only for tracking and reporting statistics.
 */
export interface ICacheStatisticsCollector {
  /**
   * Records a cache hit.
   *
   * @param key - The cache key that was hit
   */
  recordHit(key: CacheKey): void;

  /**
   * Records a cache miss.
   *
   * @param key - The cache key that was missed
   */
  recordMiss(key: CacheKey): void;

  /**
   * Records a cache eviction.
   *
   * @param key - The cache key that was evicted
   */
  recordEviction(key: CacheKey): void;

  /**
   * Gets current statistics.
   *
   * @param size - Current cache size
   * @param enabled - Whether the cache is enabled
   * @returns Current cache statistics
   */
  getStatistics(size: number, enabled: boolean): CacheStatistics;

  /**
   * Resets all statistics.
   */
  reset(): void;
}
