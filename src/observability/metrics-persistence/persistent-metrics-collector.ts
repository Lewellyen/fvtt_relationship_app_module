import type { InjectionToken } from "@/di_infrastructure/types/injectiontoken";
import type { ServiceType } from "@/types/servicetypeindex";
import type { EnvironmentConfig } from "@/config/environment";
import { environmentConfigToken } from "@/tokens/tokenindex";
import type { MetricsPersistenceState } from "@/observability/metrics-collector";
import { MetricsCollector } from "@/observability/metrics-collector";
import type { MetricsStorage } from "./metrics-storage";
import { metricsStorageToken } from "@/tokens/tokenindex";

/**
 * MetricsCollector variant that persists state via MetricsStorage.
 */
export class PersistentMetricsCollector extends MetricsCollector {
  static override dependencies: readonly InjectionToken<ServiceType>[] = [
    environmentConfigToken,
    metricsStorageToken,
  ];

  private suppressPersistence = false;

  constructor(
    env: EnvironmentConfig,
    private readonly metricsStorage: MetricsStorage
  ) {
    super(env);
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
    environmentConfigToken,
    metricsStorageToken,
  ];

  constructor(env: EnvironmentConfig, metricsStorage: MetricsStorage) {
    super(env, metricsStorage);
  }
}
