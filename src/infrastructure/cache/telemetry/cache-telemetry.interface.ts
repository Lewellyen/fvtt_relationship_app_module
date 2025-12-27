import type { CacheKey, CacheStatistics } from "../cache.interface";

/**
 * Cache telemetry operations.
 * Responsible for statistics and metrics collection.
 *
 * **Single Responsibility:**
 * - Statistics collection (hits, misses, evictions)
 * - Metrics reporting
 * - Telemetry aggregation
 *
 * **Design Benefits:**
 * - Separated from runtime operations
 * - Separated from policy decisions
 * - Testable in isolation
 * - Exchangeable telemetry implementations
 */
export interface CacheTelemetry {
  /**
   * Records a cache hit.
   *
   * @param key - Cache key that was hit
   */
  recordHit(key: CacheKey): void;

  /**
   * Records a cache miss.
   *
   * @param key - Cache key that was missed
   */
  recordMiss(key: CacheKey): void;

  /**
   * Records a cache eviction.
   *
   * @param key - Cache key that was evicted
   */
  recordEviction(key: CacheKey): void;

  /**
   * Gets current cache statistics.
   *
   * @param currentSize - Current cache size
   * @param enabled - Whether cache is enabled
   * @returns Cache statistics snapshot
   */
  getStatistics(currentSize: number, enabled: boolean): CacheStatistics;
}
