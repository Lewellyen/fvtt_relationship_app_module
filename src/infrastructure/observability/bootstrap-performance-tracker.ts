/**
 * Lightweight performance tracker for bootstrap phase.
 *
 * This implementation is used during container initialization to avoid circular dependencies.
 * Unlike PerformanceTrackingService, it does NOT use dependency injection and can be
 * instantiated directly with its dependencies.
 *
 * **Design Rationale:**
 * - ServiceResolver needs performance tracking during bootstrap
 * - PerformanceTrackingService cannot be used (circular dependency)
 * - Solution: Lightweight tracker that extends shared implementation
 *
 * **Usage:**
 * - Bootstrap phase only (ServiceContainer.createRoot)
 * - Direct instantiation (no DI)
 * - Same behavior as PerformanceTrackingService
 *
 * @see PerformanceTracker interface
 * @see PerformanceTrackingService for full-featured DI-based implementation
 * @see PerformanceTrackerImpl for shared implementation
 */

import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { MetricsSampler } from "./interfaces/metrics-sampler";
import { PerformanceTrackerImpl } from "@/infrastructure/observability/performance-tracker-impl";

/**
 * Bootstrap-phase implementation of PerformanceTracker.
 *
 * Extends the shared PerformanceTrackerImpl base class to eliminate code duplication.
 *
 * @example
 * ```typescript
 * // During bootstrap (no DI available yet)
 * const tracker = new BootstrapPerformanceTracker(env, metricsCollector);
 * const resolver = new ServiceResolver(registry, cache, null, "root", tracker);
 * ```
 */
export class BootstrapPerformanceTracker extends PerformanceTrackerImpl {
  /**
   * Creates a bootstrap performance tracker.
   *
   * @param env - Environment configuration for tracking settings
   * @param sampler - Optional metrics sampler for sampling decisions (null during early bootstrap)
   */
  constructor(config: RuntimeConfigService, sampler: MetricsSampler | null) {
    super(config, sampler);
  }
}
