import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";

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
 * Singleton metrics collector for observability and performance tracking.
 *
 * Collects performance metrics for:
 * - Container service resolutions
 * - Port selections
 * - Cache hit/miss rates
 *
 * Metrics are only collected when ENV.enablePerformanceTracking is true.
 *
 * @remarks
 * This is a singleton to ensure metrics are collected across the entire
 * application lifecycle. Access via MetricsCollector.getInstance().
 *
 * @example
 * ```typescript
 * const collector = MetricsCollector.getInstance();
 * collector.recordResolution(token, 2.5, true);
 *
 * const snapshot = collector.getSnapshot();
 * console.log(`Avg resolution time: ${snapshot.avgResolutionTimeMs}ms`);
 * ```
 */
export class MetricsCollector {
  private static instance: MetricsCollector | null = null;

  private metrics = {
    containerResolutions: 0,
    resolutionErrors: 0,
    cacheHits: 0,
    cacheMisses: 0,
    portSelections: new Map<number, number>(),
    portSelectionFailures: new Map<number, number>(),
  };

  // Circular buffer for resolution times (more efficient than array shift)
  private resolutionTimes = new Float64Array(100);
  private resolutionTimesIndex = 0;
  private resolutionTimesCount = 0;
  private readonly MAX_RESOLUTION_TIMES = 100;

  private constructor() {}

  /**
   * Gets the singleton instance of MetricsCollector.
   *
   * @returns The singleton MetricsCollector instance
   */
  static getInstance(): MetricsCollector {
    if (!this.instance) {
      this.instance = new MetricsCollector();
    }
    return this.instance;
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
   * Gets a snapshot of current metrics.
   *
   * @returns Immutable snapshot of metrics data
   */
  getSnapshot(): MetricsSnapshot {
    // Calculate average from circular buffer
    let sum = 0;
    for (let i = 0; i < this.resolutionTimesCount; i++) {
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
    this.resolutionTimes = new Float64Array(100);
    this.resolutionTimesIndex = 0;
    this.resolutionTimesCount = 0;
  }
}
