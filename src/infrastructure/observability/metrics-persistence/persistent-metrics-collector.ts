import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import { metricsStorageToken } from "@/infrastructure/shared/tokens/observability/metrics-storage.token";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import { metricsAggregatorToken } from "@/infrastructure/shared/tokens/observability/metrics-aggregator.token";
import { metricsPersistenceManagerToken } from "@/infrastructure/shared/tokens/observability/metrics-persistence-manager.token";
import { metricsStateManagerToken } from "@/infrastructure/shared/tokens/observability/metrics-state-manager.token";
import type { IMetricsAggregator } from "@/infrastructure/observability/interfaces/metrics-aggregator.interface";
import type { IMetricsPersistenceManager } from "@/infrastructure/observability/interfaces/metrics-persistence-manager.interface";
import type { IMetricsStateManager } from "@/infrastructure/observability/interfaces/metrics-state-manager.interface";
import type { MetricsPersistenceState } from "@/infrastructure/observability/metrics-types";
import { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { MetricsStorage } from "./metrics-storage";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { MetricDefinitionRegistry } from "@/infrastructure/observability/metrics-definition/metric-definition-registry";
import type { Initializable } from "@/domain/ports/initializable.interface";

/**
 * MetricsCollector variant that persists state via MetricsStorage.
 *
 * Implements Initializable interface to support explicit initialization
 * after construction, following the Liskov Substitution Principle (LSP).
 */
export class PersistentMetricsCollector extends MetricsCollector implements Initializable {
  static override dependencies: readonly InjectionToken<unknown>[] = [
    runtimeConfigToken,
    metricsStorageToken,
  ];

  private suppressPersistence = false;
  private initialized = false;

  constructor(
    config: PlatformRuntimeConfigPort,
    private readonly metricsStorage: MetricsStorage,
    aggregator: IMetricsAggregator,
    persistenceManager: IMetricsPersistenceManager,
    stateManager: IMetricsStateManager,
    registry?: MetricDefinitionRegistry
  ) {
    super(config, aggregator, persistenceManager, stateManager, registry);
    // I/O removed from constructor - use initialize() instead
  }

  /**
   * Initializes the collector by restoring state from storage.
   * Must be called explicitly after construction.
   *
   * @returns Result indicating success or error
   */
  initialize(): Result<void, string> {
    if (this.initialized) {
      return ok(undefined);
    }

    try {
      this.restoreFromStorage();
      this.initialized = true;
      return ok(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(`Failed to initialize PersistentMetricsCollector: ${errorMessage}`);
    }
  }

  clearPersistentState(): void {
    this.metricsStorage.clear?.();
    this.suppressPersistence = true;
    try {
      super.reset();
    } finally {
      this.suppressPersistence = false;
    }
  }

  protected override onStateChanged(): void {
    // Call parent to notify state manager
    super.onStateChanged();

    if (this.suppressPersistence) {
      return;
    }
    this.persist();
  }

  private restoreFromStorage(): void {
    let state: MetricsPersistenceState | null = null;
    try {
      state = this.metricsStorage.load();
    } catch {
      state = null;
    }

    if (!state) {
      return;
    }

    this.suppressPersistence = true;
    try {
      this.restoreFromPersistenceState(state);
    } finally {
      this.suppressPersistence = false;
    }
  }

  private persist(): void {
    try {
      this.metricsStorage.save(this.getPersistenceState());
    } catch {
      // Persistence failures are non-critical; ignore
    }
  }
}

export class DIPersistentMetricsCollector extends PersistentMetricsCollector {
  static override dependencies: readonly InjectionToken<unknown>[] = [
    runtimeConfigToken,
    metricsStorageToken,
    metricsAggregatorToken,
    metricsPersistenceManagerToken,
    metricsStateManagerToken,
  ];

  constructor(
    config: PlatformRuntimeConfigPort,
    metricsStorage: MetricsStorage,
    aggregator: IMetricsAggregator,
    persistenceManager: IMetricsPersistenceManager,
    stateManager: IMetricsStateManager,
    registry?: MetricDefinitionRegistry
  ) {
    super(config, metricsStorage, aggregator, persistenceManager, stateManager, registry);
  }
}
