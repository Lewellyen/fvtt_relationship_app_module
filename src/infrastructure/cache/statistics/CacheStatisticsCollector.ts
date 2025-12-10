import type { CacheStatistics, CacheKey } from "../cache.interface";
import type { ICacheStatisticsCollector } from "./cache-statistics-collector.interface";
import type { CacheMetricsObserver } from "../cache-metrics-observer.interface";

/**
 * Collects and tracks cache statistics.
 * Responsible only for statistics tracking.
 */
export class CacheStatisticsCollector implements ICacheStatisticsCollector {
  private readonly stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(private readonly metricsObserver: CacheMetricsObserver) {}

  recordHit(key: CacheKey): void {
    this.metricsObserver.onCacheHit(key);
    this.stats.hits++;
  }

  recordMiss(key: CacheKey): void {
    this.metricsObserver.onCacheMiss(key);
    this.stats.misses++;
  }

  recordEviction(key: CacheKey): void {
    this.metricsObserver.onCacheEviction(key);
    this.stats.evictions++;
  }

  getStatistics(size: number, enabled: boolean): CacheStatistics {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size,
      enabled,
    };
  }

  reset(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
  }
}
