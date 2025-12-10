import type { IRawMetrics } from "./interfaces/raw-metrics.interface";
import type { IMetricsAggregator } from "./interfaces/metrics-aggregator.interface";
import type { MetricsSnapshot } from "./metrics-types";

/**
 * Aggregates raw metrics into snapshots.
 *
 * Follows Single Responsibility Principle: Only responsible for aggregation.
 */
export class MetricsAggregator implements IMetricsAggregator {
  /**
   * Aggregates raw metrics into a snapshot.
   *
   * @param metrics - Raw metrics data
   * @returns Aggregated metrics snapshot
   */
  aggregate(metrics: IRawMetrics): MetricsSnapshot {
    const avgTime = this.calculateAverage(metrics.resolutionTimes, metrics.resolutionTimesCount);
    const cacheHitRate = this.calculateCacheHitRate(metrics.cacheHits, metrics.cacheMisses);

    return {
      containerResolutions: metrics.containerResolutions,
      resolutionErrors: metrics.resolutionErrors,
      avgResolutionTimeMs: avgTime,
      portSelections: Object.fromEntries(metrics.portSelections),
      portSelectionFailures: Object.fromEntries(metrics.portSelectionFailures),
      cacheHitRate,
    };
  }

  /**
   * Calculates the average of resolution times.
   *
   * @param times - Array of resolution times
   * @param count - Number of valid entries in the array
   * @returns Average time in milliseconds
   */
  calculateAverage(times: Float64Array, count: number): number {
    if (count === 0) {
      return 0;
    }

    const slice = times.slice(0, count);
    const sum = slice.reduce((acc, time) => acc + time, 0);
    return sum / count;
  }

  /**
   * Calculates the cache hit rate as a percentage.
   *
   * @param hits - Number of cache hits
   * @param misses - Number of cache misses
   * @returns Cache hit rate (0-100)
   */
  calculateCacheHitRate(hits: number, misses: number): number {
    const totalAccess = hits + misses;
    if (totalAccess === 0) {
      return 0;
    }
    return (hits / totalAccess) * 100;
  }
}
