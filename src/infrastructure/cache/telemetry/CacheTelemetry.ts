import type { CacheKey, CacheStatistics } from "../cache.interface";
import type { CacheTelemetry as ICacheTelemetry } from "./cache-telemetry.interface";
import type { ICacheStatisticsCollector } from "../statistics/cache-statistics-collector.interface";

/**
 * Cache telemetry implementation.
 * Delegates to ICacheStatisticsCollector for statistics tracking.
 */
export class CacheTelemetry implements ICacheTelemetry {
  constructor(private readonly statisticsCollector: ICacheStatisticsCollector) {}

  recordHit(key: CacheKey): void {
    this.statisticsCollector.recordHit(key);
  }

  recordMiss(key: CacheKey): void {
    this.statisticsCollector.recordMiss(key);
  }

  recordEviction(key: CacheKey): void {
    this.statisticsCollector.recordEviction(key);
  }

  getStatistics(currentSize: number, enabled: boolean): CacheStatistics {
    return this.statisticsCollector.getStatistics(currentSize, enabled);
  }
}
