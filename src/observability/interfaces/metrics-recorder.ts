/**
 * Interface for recording performance metrics.
 *
 * This interface represents the minimal contract for metric recording operations,
 * segregated from MetricsCollector to reduce coupling and prevent circular dependencies.
 *
 * **Design Rationale:**
 * - Interface Segregation Principle: Clients depend only on methods they use
 * - Enables services to depend on recording capability without full MetricsCollector
 * - Breaks circular dependency chains (e.g., PerformanceTrackingService → MetricsCollector)
 *
 * @see MetricsCollector for full implementation
 * @see MetricsSampler for sampling interface
 */

import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";

/**
 * Minimal interface for recording performance metrics.
 *
 * Provides methods to record various performance-related events without
 * requiring access to snapshot or sampling functionality.
 *
 * @example
 * ```typescript
 * class MyService {
 *   static dependencies = [metricsRecorderToken] as const;
 *
 *   constructor(private metrics: MetricsRecorder) {}
 *
 *   doWork() {
 *     const start = performance.now();
 *     // ... work ...
 *     this.metrics.recordResolution(token, performance.now() - start, true);
 *   }
 * }
 * ```
 */
export interface MetricsRecorder {
  /**
   * Records a service resolution attempt.
   *
   * @param token - The injection token that was resolved
   * @param durationMs - Time taken to resolve in milliseconds
   * @param success - Whether resolution succeeded
   */
  recordResolution(token: InjectionToken<ServiceType>, durationMs: number, success: boolean): void;

  /**
   * Records a port selection event.
   *
   * @param version - The Foundry version for which a port was selected
   */
  recordPortSelection(version: number): void;

  /**
   * Records a port selection failure.
   *
   * Useful for tracking when no compatible port is available for a version.
   *
   * @param version - The Foundry version for which port selection failed
   */
  recordPortSelectionFailure(version: number): void;

  /**
   * Records a cache access (hit or miss).
   *
   * @param hit - True if cache hit, false if cache miss
   */
  recordCacheAccess(hit: boolean): void;
}
