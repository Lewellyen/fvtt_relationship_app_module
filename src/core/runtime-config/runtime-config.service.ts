import type { EnvironmentConfig, LogLevel } from "@/config/environment";

export type RuntimeConfigValues = {
  isDevelopment: boolean;
  isProduction: boolean;
  logLevel: LogLevel;
  enablePerformanceTracking: boolean;
  performanceSamplingRate: number;
  enableMetricsPersistence: boolean;
  metricsPersistenceKey: string;
  enableCacheService: boolean;
  cacheDefaultTtlMs: number;
  cacheMaxEntries: number | undefined;
};

export type RuntimeConfigKey = keyof RuntimeConfigValues;

type RuntimeConfigListener<K extends RuntimeConfigKey> = (value: RuntimeConfigValues[K]) => void;

/**
 * RuntimeConfigService
 *
 * Acts as a bridge between build-time environment defaults (VITE_*) and
 * runtime Foundry settings. Provides a central registry that services can
 * query for current values and subscribe to for live updates.
 */
export class RuntimeConfigService {
  private readonly values: RuntimeConfigValues;
  private readonly listeners = new Map<RuntimeConfigKey, Set<unknown>>();

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
    };
  }

  /**
   * Returns the current value for the given configuration key.
   */
  get<K extends RuntimeConfigKey>(key: K): RuntimeConfigValues[K] {
    return this.values[key];
  }

  /**
   * Updates the configuration value based on Foundry settings and notifies listeners
   * only if the value actually changed.
   */
  setFromFoundry<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    this.updateValue(key, value);
  }

  /**
   * Registers a listener for the given key. Returns an unsubscribe function.
   */
  onChange<K extends RuntimeConfigKey>(key: K, listener: RuntimeConfigListener<K>): () => void {
    const existing = this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined; // type-coverage:ignore-line -- Map stores heterogeneous listener sets
    const listeners = existing ?? new Set<RuntimeConfigListener<K>>();
    listeners.add(listener);
    this.listeners.set(key, listeners as Set<unknown>);

    return () => {
      const activeListeners = this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined; // type-coverage:ignore-line -- Map stores heterogeneous listener sets
      activeListeners?.delete(listener);
      if (!activeListeners || activeListeners.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  private updateValue<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    const current = this.values[key];
    if (Object.is(current, value)) {
      return;
    }

    this.values[key] = value;
    const listeners = this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined; // type-coverage:ignore-line -- Map stores heterogeneous listener sets
    if (!listeners || listeners.size === 0) {
      return;
    }

    for (const listener of listeners) {
      listener(value);
    }
  }
}
