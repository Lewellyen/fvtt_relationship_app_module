import type { RuntimeConfigKey, RuntimeConfigValues } from "@/domain/types/runtime-config";
import type { EnvironmentConfig } from "@/domain/types/environment-config";

/**
 * Interface for runtime configuration value storage.
 * Allows for dependency injection and testing.
 */
export interface IRuntimeConfigStore {
  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K];
  set<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): boolean;
}

/**
 * RuntimeConfigStore
 *
 * Manages the storage and retrieval of runtime configuration values.
 * Single Responsibility: Config value management only.
 */
export class RuntimeConfigStore implements IRuntimeConfigStore {
  private readonly values: RuntimeConfigValues;

  constructor(env: EnvironmentConfig) {
    this.values = {
      isDevelopment: env.isDevelopment,
      isProduction: env.isProduction,
      logLevel: env.logLevel,
      enablePerformanceTracking: env.enablePerformanceTracking,
      performanceSamplingRate: env.performanceSamplingRate,
      enableMetricsPersistence: env.enableMetricsPersistence,
      metricsPersistenceKey: env.metricsPersistenceKey,
      enableCacheService: env.enableCacheService,
      cacheDefaultTtlMs: env.cacheDefaultTtlMs,
      cacheMaxEntries: env.cacheMaxEntries,
      notificationQueueMaxSize: env.notificationQueueDefaultSize,
    };
  }

  /**
   * Returns the current value for the given configuration key.
   */
  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K] {
    return this.values[key];
  }

  /**
   * Updates the configuration value.
   * Returns true if the value actually changed, false otherwise.
   */
  set<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): boolean {
    const current = this.values[key];
    if (Object.is(current, value)) {
      return false;
    }

    this.values[key] = value;
    return true;
  }

  /**
   * Gets all current values (for testing/debugging purposes).
   */
  getAll(): Readonly<RuntimeConfigValues> {
    return { ...this.values };
  }
}
