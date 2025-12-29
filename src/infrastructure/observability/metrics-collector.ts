import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { METRICS_CONFIG } from "@/infrastructure/shared/constants";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import type { MetricsRecorder } from "./interfaces/metrics-recorder";
import type { IRawMetrics } from "./interfaces/raw-metrics.interface";
import type { IMetricsAggregator } from "./interfaces/metrics-aggregator.interface";
import type { IMetricsPersistenceManager } from "./interfaces/metrics-persistence-manager.interface";
import type { IMetricsStateManager } from "./interfaces/metrics-state-manager.interface";
import type { MetricsSnapshot, MetricsPersistenceState } from "./metrics-types";
import type { MetricState } from "./metrics-definition/metric-definition.interface";
import type { MetricDefinitionRegistry } from "./metrics-definition/metric-definition-registry";
import { createDefaultMetricDefinitionRegistry } from "./metrics-definition/default-metric-definitions";
import { metricsAggregatorToken } from "@/infrastructure/shared/tokens/observability/metrics-aggregator.token";
import { metricsPersistenceManagerToken } from "@/infrastructure/shared/tokens/observability/metrics-persistence-manager.token";
import { metricsStateManagerToken } from "@/infrastructure/shared/tokens/observability/metrics-state-manager.token";

// Re-export for backward compatibility
export type { MetricsSnapshot, MetricsPersistenceState } from "./metrics-types";
import { castMetricValue } from "./metrics-definition/metric-casts";

/**
 * Metrics collector for observability and performance tracking.
 *
 * Implements MetricsRecorder interface to provide
 * segregated access for recording metrics (Interface Segregation Principle).
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
 * **Design:** Follows Single Responsibility Principle:
 * - Metrics collection only (this class)
 * - Aggregation: MetricsAggregator
 * - Persistence: MetricsPersistenceManager
 * - State management: MetricsStateManager
 * - Sampling decisions: MetricsSampler
 * - Reporting/logging: MetricsReporter
 *
 * **OCP Design:** Follows Open/Closed Principle:
 * - Uses MetricDefinitionRegistry for dynamic metric registration
 * - New metrics can be added via registry without modifying this class
 * - Internal state managed via generic Map<string, MetricState>
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
export class MetricsCollector implements MetricsRecorder {
  static dependencies: readonly InjectionToken<unknown>[] = [runtimeConfigToken];

  /**
   * Generic map of metric states keyed by metric key.
   * Follows OCP: New metrics can be added via registry without code changes.
   */
  private readonly metricStates = new Map<string, MetricState>();

  // SRP: Delegation to specialized components
  // DIP: Depend on interfaces, not concrete implementations
  private readonly aggregator: IMetricsAggregator;
  private readonly persistenceManager: IMetricsPersistenceManager;
  private readonly stateManager: IMetricsStateManager;
  private readonly registry: MetricDefinitionRegistry;

  constructor(
    private readonly config: RuntimeConfigService,
    aggregator: IMetricsAggregator,
    persistenceManager: IMetricsPersistenceManager,
    stateManager: IMetricsStateManager,
    registry?: MetricDefinitionRegistry
  ) {
    // Use provided registry or create default one
    this.registry = registry ?? createDefaultMetricDefinitionRegistry();

    // Initialize metric states from registry
    this.initializeMetricStates();

    // DIP: All dependencies must be injected - no fallback
    this.aggregator = aggregator;
    this.persistenceManager = persistenceManager;
    this.stateManager = stateManager;
  }

  /**
   * Initializes metric states from registry definitions.
   * Private method called during construction.
   */
  private initializeMetricStates(): void {
    for (const definition of this.registry.getAll()) {
      this.metricStates.set(definition.key, {
        value: definition.initialValue,
        definition,
      });
    }
  }

  /**
   * Updates a metric using its reducer function.
   *
   * @param key - Metric key
   * @param event - Event data for the reducer
   */
  private updateMetric(key: string, event: unknown): void {
    const state = this.metricStates.get(key);
    if (!state) {
      // Metric not registered - ignore silently (could log warning in future)
      return;
    }

    const newValue = state.definition.reducer(state.value, event);
    this.metricStates.set(key, {
      value: newValue,
      definition: state.definition,
    });
  }

  /**
   * Records a service resolution attempt.
   *
   * @param token - The injection token that was resolved
   * @param durationMs - Time taken to resolve in milliseconds
   * @param success - Whether resolution succeeded
   */
  recordResolution(token: InjectionToken<unknown>, durationMs: number, success: boolean): void {
    const event = { token, durationMs, success };

    // Update container resolutions (always increments)
    this.updateMetric("containerResolutions", event);

    // Update resolution errors (only if failed)
    this.updateMetric("resolutionErrors", event);

    // Update resolution times (circular buffer handled by reducer)
    this.updateMetric("resolutionTimes", event);

    this.notifyStateChanged();
  }

  /**
   * Records a port selection event.
   *
   * @param version - The Foundry version for which a port was selected
   */
  recordPortSelection(version: number): void {
    this.updateMetric("portSelections", { version });
    this.notifyStateChanged();
  }

  /**
   * Records a port selection failure.
   *
   * Useful for tracking when no compatible port is available for a version.
   *
   * @param version - The Foundry version for which port selection failed
   */
  recordPortSelectionFailure(version: number): void {
    this.updateMetric("portSelectionFailures", { version });
    this.notifyStateChanged();
  }

  /**
   * Records a cache access (hit or miss).
   *
   * @param hit - True if cache hit, false if cache miss
   */
  recordCacheAccess(hit: boolean): void {
    const event = { hit };
    this.updateMetric("cacheHits", event);
    this.updateMetric("cacheMisses", event);
    this.notifyStateChanged();
  }

  /**
   * Gets a snapshot of current metrics.
   * Delegates aggregation to MetricsAggregator.
   *
   * @returns Immutable snapshot of metrics data
   */
  getSnapshot(): MetricsSnapshot {
    return this.aggregator.aggregate(this.getRawMetrics());
  }

  /**
   * Gets raw metrics data without aggregation.
   * Used internally by aggregator and persistence manager.
   *
   * Converts from generic Map structure to IRawMetrics for backward compatibility.
   *
   * @returns Raw metrics data
   */
  getRawMetrics(): IRawMetrics {
    // Extract values from metric states
    const containerResolutions = this.getMetricValue<number>("containerResolutions") ?? 0;
    const resolutionErrors = this.getMetricValue<number>("resolutionErrors") ?? 0;
    const cacheHits = this.getMetricValue<number>("cacheHits") ?? 0;
    const cacheMisses = this.getMetricValue<number>("cacheMisses") ?? 0;
    const portSelectionsRaw = this.getMetricValue<Map<number, number>>("portSelections");
    const portSelections: Map<number, number> =
      portSelectionsRaw instanceof Map ? portSelectionsRaw : new Map();
    const portSelectionFailuresRaw =
      this.getMetricValue<Map<number, number>>("portSelectionFailures");
    const portSelectionFailures: Map<number, number> =
      portSelectionFailuresRaw instanceof Map ? portSelectionFailuresRaw : new Map();

    // Extract resolution times state
    const resolutionTimesState = this.getMetricValue<{
      buffer: Float64Array;
      index: number;
      count: number;
    }>("resolutionTimes");

    return {
      containerResolutions,
      resolutionErrors,
      cacheHits,
      cacheMisses,
      portSelections,
      portSelectionFailures,
      resolutionTimes:
        resolutionTimesState?.buffer ??
        new Float64Array(METRICS_CONFIG.RESOLUTION_TIMES_BUFFER_SIZE),
      resolutionTimesIndex: resolutionTimesState?.index ?? 0,
      resolutionTimesCount: resolutionTimesState?.count ?? 0,
    };
  }

  /**
   * Gets a metric value by key.
   *
   * @param key - Metric key
   * @returns Metric value or undefined if not found
   */
  private getMetricValue<T>(key: string): T | undefined {
    const state = this.metricStates.get(key);
    if (!state) {
      return undefined;
    }
    // Runtime-safe cast: validates that value exists and casts to type T
    // Type safety is guaranteed by the metric registry initialization
    return castMetricValue<T>(state.value, key);
  }

  /**
   * Resets all collected metrics.
   * Useful for testing or starting fresh measurements.
   */
  reset(): void {
    // Reset all metric states to their initial values
    for (const definition of this.registry.getAll()) {
      this.metricStates.set(definition.key, {
        value: definition.initialValue,
        definition,
      });
    }
    this.stateManager.reset();
    this.notifyStateChanged();
  }

  /**
   * Hook invoked after state mutations. Subclasses can override to react
   * (e.g., persist metrics).
   */
  protected onStateChanged(): void {
    // Default implementation: notify state manager
    this.stateManager.notifyStateChanged();
  }

  /**
   * Notifies state manager of state changes.
   * Internal method that can be overridden by subclasses.
   */
  protected notifyStateChanged(): void {
    this.onStateChanged();
  }

  /**
   * Captures the internal state for persistence.
   * Delegates to MetricsPersistenceManager.
   *
   * @returns Serializable metrics state
   */
  protected getPersistenceState(): MetricsPersistenceState {
    return this.persistenceManager.serialize(this.getRawMetrics());
  }

  /**
   * Restores internal state from a persisted snapshot.
   * Delegates to MetricsPersistenceManager.
   *
   * @param state - Persisted metrics state
   */
  protected restoreFromPersistenceState(state: MetricsPersistenceState | null | undefined): void {
    const rawMetrics = this.persistenceManager.deserialize(state);
    this.applyRawMetrics(rawMetrics);
  }

  /**
   * Applies raw metrics to internal state.
   * Internal method used by restoreFromPersistenceState.
   * Converts from IRawMetrics to generic Map structure.
   *
   * @param rawMetrics - Raw metrics to apply
   */
  private applyRawMetrics(rawMetrics: IRawMetrics): void {
    // Update metric states from raw metrics
    this.setMetricValue("containerResolutions", rawMetrics.containerResolutions);
    this.setMetricValue("resolutionErrors", rawMetrics.resolutionErrors);
    this.setMetricValue("cacheHits", rawMetrics.cacheHits);
    this.setMetricValue("cacheMisses", rawMetrics.cacheMisses);
    this.setMetricValue("portSelections", rawMetrics.portSelections);
    this.setMetricValue("portSelectionFailures", rawMetrics.portSelectionFailures);

    // Restore resolution times state
    const resolutionTimesState = this.metricStates.get("resolutionTimes");
    if (resolutionTimesState) {
      const buffer = new Float64Array(rawMetrics.resolutionTimes);
      this.setMetricValue("resolutionTimes", {
        buffer,
        index: rawMetrics.resolutionTimesIndex,
        count: rawMetrics.resolutionTimesCount,
      });
    }
  }

  /**
   * Sets a metric value by key.
   *
   * @param key - Metric key
   * @param value - New metric value
   */
  private setMetricValue<T>(key: string, value: T): void {
    const state = this.metricStates.get(key);
    if (state) {
      this.metricStates.set(key, {
        value: value as unknown,
        definition: state.definition,
      });
    }
  }
}

export class DIMetricsCollector extends MetricsCollector {
  static override dependencies: readonly InjectionToken<unknown>[] = [
    runtimeConfigToken,
    metricsAggregatorToken,
    metricsPersistenceManagerToken,
    metricsStateManagerToken,
  ];

  constructor(
    config: RuntimeConfigService,
    aggregator: IMetricsAggregator,
    persistenceManager: IMetricsPersistenceManager,
    stateManager: IMetricsStateManager,
    registry?: MetricDefinitionRegistry
  ) {
    super(config, aggregator, persistenceManager, stateManager, registry);
  }
}
