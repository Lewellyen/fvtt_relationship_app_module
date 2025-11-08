import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import { METRICS_CONFIG } from "@/constants";
import type { EnvironmentConfig } from "@/config/environment";
import { environmentConfigToken } from "@/tokens/tokenindex";

/**
 * Snapshot of current metrics data.
 * Provides read-only access to collected performance metrics.
 */
export interface MetricsSnapshot {
  /** Total number of container service resolutions */
  containerResolutions: number;
  /** Number of failed resolution attempts */
  resolutionErrors: number;
  /** Average resolution time in milliseconds (rolling window) */
  avgResolutionTimeMs: number;
  /** Count of port selections by Foundry version */
  portSelections: Record<number, number>;
  /** Count of port selection failures by Foundry version */
  portSelectionFailures: Record<number, number>;
  /** Cache hit rate as percentage (0-100) */
  cacheHitRate: number;
}

/**
 * Metrics collector for observability and performance tracking.
 *
 * Collects performance metrics for:
 * - Container service resolutions
 * - Port selections
 * - Cache hit/miss rates
 *
 * Metrics are only collected when ENV.enablePerformanceTracking is true.
 *
 * Now managed via Dependency Injection as a Singleton service.
 *
 * @example
 * ```typescript
 * const collector = container.resolve(metricsCollectorToken);
 * collector.recordResolution(token, 2.5, true);
 *
 * const snapshot = collector.getSnapshot();
 * console.log(`Avg resolution time: ${snapshot.avgResolutionTimeMs}ms`);
 * ```
 */
export class MetricsCollector {
  static dependencies = [environmentConfigToken] as const;

  private metrics = {
    containerResolutions: 0,
    resolutionErrors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    portSelections: new Map<number, number>(),
    portSelectionFailures: new Map<number, number>(),
  };

  // Circular buffer for resolution times (more efficient than array shift)
  private resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
  private resolutionTimesIndex = 0;
  private resolutionTimesCount = 0;
  private readonly MAX_RESOLUTION_TIMES = METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE;

  constructor(private readonly env: EnvironmentConfig) {
    // ENV injected via DI for better testability and DIP compliance
  }

  /**
   * Records a service resolution attempt.
   *
   * @param token - The injection token that was resolved
   * @param durationMs - Time taken to resolve in milliseconds
   * @param success - Whether resolution succeeded
   */
  recordResolution(token: InjectionToken<ServiceType>, durationMs: number, success: boolean): void {
    this.metrics.containerResolutions++;

    if (!success) {
      this.metrics.resolutionErrors++;
    }

    // Circular buffer: O(1) instead of O(n) with array shift
    this.resolutionTimes[this.resolutionTimesIndex] = durationMs;
    this.resolutionTimesIndex = (this.resolutionTimesIndex + 1) % this.MAX_RESOLUTION_TIMES;
    this.resolutionTimesCount = Math.min(this.resolutionTimesCount + 1, this.MAX_RESOLUTION_TIMES);
  }

  /**
   * Records a port selection event.
   *
   * @param version - The Foundry version for which a port was selected
   */
  recordPortSelection(version: number): void {
    const count = this.metrics.portSelections.get(version) ?? 0;
    this.metrics.portSelections.set(version, count + 1);
  }

  /**
   * Records a port selection failure.
   *
   * Useful for tracking when no compatible port is available for a version.
   *
   * @param version - The Foundry version for which port selection failed
   */
  recordPortSelectionFailure(version: number): void {
    const count = this.metrics.portSelectionFailures.get(version) ?? 0;
    this.metrics.portSelectionFailures.set(version, count + 1);
  }

  /**
   * Records a cache access (hit or miss).
   *
   * @param hit - True if cache hit, false if cache miss
   */
  recordCacheAccess(hit: boolean): void {
    if (hit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
  }

  /**
   * Determines if a performance operation should be sampled based on sampling rate.
   *
   * In production mode, uses probabilistic sampling to reduce overhead.
   * In development mode, always samples (returns true).
   *
   * @returns True if the operation should be measured/recorded
   *
   * @example
   * ```typescript
   * const metrics = container.resolve(metricsCollectorToken);
   * if (metrics.shouldSample()) {
   *   performance.mark('operation-start');
   *   // ... operation ...
   *   performance.mark('operation-end');
   *   performance.measure('operation', 'operation-start', 'operation-end');
   * }
   * ```
   */
  shouldSample(): boolean {
    // Always sample in development mode
    /* c8 ignore start -- Development mode always returns true; tested implicitly in all metrics tests */
    if (this.env.isDevelopment) {
      return true;
    }
    /* c8 ignore stop */

    // Probabilistic sampling in production based on configured rate
    /* c8 ignore start -- Production sampling: Math.random() behavior tested in shouldSample tests */
    return Math.random() < this.env.performanceSamplingRate;
    /* c8 ignore stop */
  }

  /**
   * Gets a snapshot of current metrics.
   *
   * @returns Immutable snapshot of metrics data
   */
  getSnapshot(): MetricsSnapshot {
    // Calculate average from circular buffer
    let sum = 0;
    for (let i = 0; i < this.resolutionTimesCount; i++) {
      // Entries up to resolutionTimesCount are explicitly written before incrementing the counter
      /* type-coverage:ignore-next-line */
      sum += this.resolutionTimes[i]!;
    }
    const avgTime = this.resolutionTimesCount > 0 ? sum / this.resolutionTimesCount : 0;

    const totalCacheAccess = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate =
      totalCacheAccess > 0 ? (this.metrics.cacheHits / totalCacheAccess) * 100 : 0;

    return {
      containerResolutions: this.metrics.containerResolutions,
      resolutionErrors: this.metrics.resolutionErrors,
      avgResolutionTimeMs: avgTime,
      portSelections: Object.fromEntries(this.metrics.portSelections),
      portSelectionFailures: Object.fromEntries(this.metrics.portSelectionFailures),
      cacheHitRate,
    };
  }

  /**
   * Logs a formatted metrics summary to the console.
   * Uses console.table() for easy-to-read tabular output.
   */
  logSummary(): void {
    const snapshot = this.getSnapshot();

    /* eslint-disable @typescript-eslint/naming-convention */
    console.table({
      "Total Resolutions": snapshot.containerResolutions,
      Errors: snapshot.resolutionErrors,
      "Avg Time (ms)": snapshot.avgResolutionTimeMs.toFixed(2),
      "Cache Hit Rate": `${snapshot.cacheHitRate.toFixed(1)}%`,
    });
    /* eslint-enable @typescript-eslint/naming-convention */
  }

  /**
   * Resets all collected metrics.
   * Useful for testing or starting fresh measurements.
   */
  reset(): void {
    this.metrics = {
      containerResolutions: 0,
      resolutionErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      portSelections: new Map(),
      portSelectionFailures: new Map(),
    };
    this.resolutionTimes = new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE);
    this.resolutionTimesIndex = 0;
    this.resolutionTimesCount = 0;
  }
}
