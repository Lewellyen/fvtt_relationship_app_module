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

import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { MetricsSampler } from "@/infrastructure/observability/interfaces/metrics-sampler";
import { metricsSamplerToken } from "@/infrastructure/shared/tokens/observability.tokens";
import { runtimeConfigToken } from "@/infrastructure/shared/tokens/core.tokens";
import { PerformanceTrackerImpl } from "@/infrastructure/observability/performance-tracker-impl";

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
  constructor(config: RuntimeConfigService, sampler: MetricsSampler) {
    super(config, sampler);
  }
}

export class DIPerformanceTrackingService extends PerformanceTrackingService {
  static dependencies = [runtimeConfigToken, metricsSamplerToken] as const;

  constructor(config: RuntimeConfigService, sampler: MetricsSampler) {
    super(config, sampler);
  }
}
