import type { IRawMetrics } from "./raw-metrics.interface";
import type { MetricsSnapshot } from "../metrics-types";

/**
 * Interface for aggregating raw metrics into snapshots.
 */
export interface IMetricsAggregator {
  /**
   * Aggregates raw metrics into a snapshot.
   *
   * @param metrics - Raw metrics data
   * @returns Aggregated metrics snapshot
   */
  aggregate(metrics: IRawMetrics): MetricsSnapshot;

  /**
   * Calculates the average of resolution times.
   *
   * @param times - Array of resolution times
   * @param count - Number of valid entries in the array
   * @returns Average time in milliseconds
   */
  calculateAverage(times: Float64Array, count: number): number;

  /**
   * Calculates the cache hit rate as a percentage.
   *
   * @param hits - Number of cache hits
   * @param misses - Number of cache misses
   * @returns Cache hit rate (0-100)
   */
  calculateCacheHitRate(hits: number, misses: number): number;
}
