import type { CacheMetricsObserver } from "./cache-metrics-observer.interface";
import type { CacheKey } from "./cache.interface";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";

/**
 * Collects cache metrics by observing cache events.
 *
 * Delegates to MetricsCollector for actual metric recording.
 */
export class CacheMetricsCollector implements CacheMetricsObserver {
  constructor(private readonly metricsCollector?: MetricsCollector) {}

  /**
   * Records a cache hit.
   *
   * @param _key - The cache key that was hit
   */
  onCacheHit(_key: CacheKey): void {
    this.metricsCollector?.recordCacheAccess(true);
  }

  /**
   * Records a cache miss.
   *
   * @param _key - The cache key that was missed
   */
  onCacheMiss(_key: CacheKey): void {
    this.metricsCollector?.recordCacheAccess(false);
  }

  /**
   * Records a cache eviction.
   *
   * @param _key - The cache key that was evicted
   */
  onCacheEviction(_key: CacheKey): void {
    // Optional: Future eviction-specific metrics could be added here
    // For now, evictions are tracked via stats.evictions in CacheService
  }
}
