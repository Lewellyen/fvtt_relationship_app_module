import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import type { ServiceType } from "@/infrastructure/di/types/service-type-registry";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { runtimeConfigToken, metricsStorageToken } from "@/infrastructure/shared/tokens";
import type { MetricsPersistenceState } from "@/infrastructure/observability/metrics-collector";
import { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { MetricsStorage } from "./metrics-storage";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";

/**
 * MetricsCollector variant that persists state via MetricsStorage.
 */
export class PersistentMetricsCollector extends MetricsCollector {
  static override dependencies: readonly InjectionToken<ServiceType>[] = [
    runtimeConfigToken,
    metricsStorageToken,
  ];

  private suppressPersistence = false;
  private initialized = false;

  constructor(
    config: RuntimeConfigService,
    private readonly metricsStorage: MetricsStorage
  ) {
    super(config);
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
  static override dependencies: readonly InjectionToken<ServiceType>[] = [
    runtimeConfigToken,
    metricsStorageToken,
  ];

  constructor(config: RuntimeConfigService, metricsStorage: MetricsStorage) {
    super(config, metricsStorage);
  }
}
