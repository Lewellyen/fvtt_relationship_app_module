import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { RuntimeConfigService } from "@/core/runtime-config/runtime-config.service";
import { runtimeConfigToken } from "@/tokens/tokenindex";
import type { MetricsPersistenceState } from "@/observability/metrics-collector";
import { MetricsCollector } from "@/observability/metrics-collector";
import type { MetricsStorage } from "./metrics-storage";
import { metricsStorageToken } from "@/tokens/tokenindex";

/**
 * MetricsCollector variant that persists state via MetricsStorage.
 */
export class PersistentMetricsCollector extends MetricsCollector {
  static override dependencies: readonly InjectionToken<ServiceType>[] = [
    runtimeConfigToken,
    metricsStorageToken,
  ];

  private suppressPersistence = false;

  constructor(
    config: RuntimeConfigService,
    private readonly metricsStorage: MetricsStorage
  ) {
    super(config);
    this.restoreFromStorage();
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
