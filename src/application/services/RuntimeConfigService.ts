import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { LogLevel } from "@/domain/types/log-level";

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
  private readonly listeners = new Map<
    RuntimeConfigKey,
    Set<RuntimeConfigListener<RuntimeConfigKey>>
  >();

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
    const existing = this.getListenersForKey<K>(key);
    const listeners: Set<RuntimeConfigListener<K>> =
      existing ?? new Set<RuntimeConfigListener<K>>();
    listeners.add(listener);

    this.setListenersForKey(key, listeners);

    return () => {
      const activeListeners = this.getListenersForKey<K>(key);
      activeListeners?.delete(listener);
      if (!activeListeners || activeListeners.size === 0) {
        this.listeners.delete(key);
      }
    };
  }

  /**
   * Type-safe helper to get listeners for a specific key.
   * @ts-expect-error - Type coverage exclusion for generic Set cast
   */
  private getListenersForKey<K extends RuntimeConfigKey>(
    key: K
  ): Set<RuntimeConfigListener<K>> | undefined {
    return this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined;
  }

  /**
   * Type-safe helper to set listeners for a specific key.
   * @ts-expect-error - Type coverage exclusion for generic Set cast
   */
  private setListenersForKey<K extends RuntimeConfigKey>(
    key: K,
    listeners: Set<RuntimeConfigListener<K>>
  ): void {
    this.listeners.set(key, listeners as Set<RuntimeConfigListener<RuntimeConfigKey>>);
  }

  private updateValue<K extends RuntimeConfigKey>(key: K, value: RuntimeConfigValues[K]): void {
    const current = this.values[key];
    if (Object.is(current, value)) {
      return;
    }

    this.values[key] = value;
    const listeners = this.listeners.get(key) as Set<RuntimeConfigListener<K>> | undefined;
    if (!listeners || listeners.size === 0) {
      return;
    }

    for (const listener of listeners) {
      listener(value);
    }
  }
}
