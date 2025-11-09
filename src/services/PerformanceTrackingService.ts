/**
 * Service for performance tracking with sampling support.
 * Provides centralized performance measurement with configurable sampling rates.
 *
 * This service wraps the performance tracking logic that was previously
 * implemented as utility functions, making it easier to:
 * - Inject via DI instead of passing ENV and MetricsCollector as parameters
 * - Test with mocks
 * - Configure centrally
 * - Add logging and metrics without modifying call sites
 *
 * **Design:**
 * Extends the shared PerformanceTrackerImpl base class to enable polymorphic usage
 * alongside BootstrapPerformanceTracker. This allows the same interface
 * to be used during bootstrap (no DI) and production (with DI).
 */

import type { EnvironmentConfig } from "@/config/environment";
import type { MetricsSampler } from "@/observability/interfaces/metrics-sampler";
import { environmentConfigToken, metricsSamplerToken } from "@/tokens/tokenindex";
import { PerformanceTrackerImpl } from "@/observability/performance-tracker-impl";

/**
 * Service for tracking performance of operations.
 *
 * Extends the shared PerformanceTrackerImpl base class to eliminate code duplication
 * with BootstrapPerformanceTracker.
 *
 * @example
 * ```typescript
 * const perfService = container.resolve(performanceTrackingServiceToken);
 *
 * // Track sync operation
 * const result = perfService.track(
 *   () => expensiveOperation(),
 *   (duration, result) => {
 *     console.log(`Operation took ${duration}ms`);
 *   }
 * );
 *
 * // Track async operation
 * const result = await perfService.trackAsync(
 *   async () => await fetchData(),
 *   (duration, result) => {
 *     metricsCollector.recordOperation(duration, result.ok);
 *   }
 * );
 * ```
 */
export class PerformanceTrackingService extends PerformanceTrackerImpl {
  static dependencies = [environmentConfigToken, metricsSamplerToken] as const;

  constructor(env: EnvironmentConfig, sampler: MetricsSampler) {
    super(env, sampler);
  }
}
