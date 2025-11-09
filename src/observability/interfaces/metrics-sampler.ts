/**
 * Interface for performance sampling decisions.
 *
 * This interface represents the minimal contract for sampling operations,
 * segregated from MetricsCollector to reduce coupling.
 *
 * **Design Rationale:**
 * - Interface Segregation Principle: Separate read from write operations
 * - Enables performance trackers to check sampling without recording capability
 * - Clearer separation of concerns
 *
 * @see MetricsCollector for full implementation
 * @see MetricsRecorder for recording interface
 */

/**
 * Minimal interface for performance sampling decisions.
 *
 * Provides method to determine if a performance operation should be measured
 * based on configured sampling rates.
 *
 * @example
 * ```typescript
 * class PerformanceTracker {
 *   static dependencies = [metricsSamplerToken] as const;
 *
 *   constructor(private sampler: MetricsSampler) {}
 *
 *   track<T>(operation: () => T): T {
 *     if (this.sampler.shouldSample()) {
 *       // Measure performance
 *     }
 *     return operation();
 *   }
 * }
 * ```
 */
export interface MetricsSampler {
  /**
   * Determines if a performance operation should be sampled based on sampling rate.
   *
   * In production mode, uses probabilistic sampling to reduce overhead.
   * In development mode, always samples (returns true).
   *
   * @returns True if the operation should be measured/recorded
   */
  shouldSample(): boolean;
}
