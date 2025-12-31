/**
 * Shared performance tracker implementation.
 *
 * This base class contains the common logic used by both:
 * - BootstrapPerformanceTracker (bootstrap phase, no DI)
 * - PerformanceTrackingService (production phase, with DI)
 *
 * **Design Rationale:**
 * - Eliminates code duplication between bootstrap and production trackers
 * - Both implementations share identical tracking logic
 * - Only difference is how they're instantiated (direct vs DI)
 *
 * @see PerformanceTracker interface
 * @see BootstrapPerformanceTracker for bootstrap usage
 * @see PerformanceTrackingService for DI-based usage
 */

import type { PerformanceTracker } from "@/infrastructure/observability/performance-tracker.interface";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { MetricsSampler } from "./interfaces/metrics-sampler";

/**
 * Base implementation of PerformanceTracker with shared logic.
 *
 * @example
 * ```typescript
 * // Extend in subclasses
 * export class MyTracker extends PerformanceTrackerImpl {
 *   static dependencies = [envToken, metricsToken] as const;
 *   // DI dependencies handled by subclass
 * }
 * ```
 */
export class PerformanceTrackerImpl implements PerformanceTracker {
  /**
   * Creates a performance tracker implementation.
   *
   * @param env - Environment configuration for tracking settings
   * @param sampler - Optional metrics sampler for sampling decisions (null during early bootstrap)
   */
  constructor(
    protected readonly config: PlatformRuntimeConfigPort,
    protected readonly sampler: MetricsSampler | null
  ) {}

  /**
   * Tracks synchronous operation execution time.
   *
   * Only measures when:
   * 1. Performance tracking is enabled (env.enablePerformanceTracking)
   * 2. MetricsCollector is available
   * 3. Sampling check passes (metricsCollector.shouldSample())
   *
   * @template T - Return type of the operation
   * @param operation - Function to execute and measure
   * @param onComplete - Optional callback invoked with duration and result
   * @returns Result of the operation
   */
  track<T>(operation: () => T, onComplete?: (duration: number, result: T) => void): T {
    // Early exit if performance tracking is disabled or sampling fails
    if (!this.config.get("enablePerformanceTracking") || !this.sampler?.shouldSample()) {
      return operation();
    }

    const startTime = performance.now();
    const result = operation();
    const duration = performance.now() - startTime;

    if (onComplete) {
      onComplete(duration, result);
    }

    return result;
  }

  /**
   * Tracks asynchronous operation execution time.
   *
   * Only measures when:
   * 1. Performance tracking is enabled (env.enablePerformanceTracking)
   * 2. MetricsCollector is available
   * 3. Sampling check passes (metricsCollector.shouldSample())
   *
   * @template T - Return type of the async operation
   * @param operation - Async function to execute and measure
   * @param onComplete - Optional callback invoked with duration and result
   * @returns Promise resolving to the operation result
   */
  async trackAsync<T>(
    operation: () => Promise<T>,
    onComplete?: (duration: number, result: T) => void
  ): Promise<T> {
    // Early exit if performance tracking is disabled or sampling fails
    if (!this.config.get("enablePerformanceTracking") || !this.sampler?.shouldSample()) {
      return operation();
    }

    const startTime = performance.now();
    const result = await operation();
    const duration = performance.now() - startTime;

    if (onComplete) {
      onComplete(duration, result);
    }

    return result;
  }
}
