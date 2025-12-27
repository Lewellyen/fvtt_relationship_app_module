import { APP_DEFAULTS } from "@/application/constants/app-constants";
import type {
  CacheEntryMetadata,
  CacheInvalidationPredicate,
  CacheKey,
  CacheLookupResult,
  CacheService as CacheServiceContract,
  CacheServiceConfig,
  CacheSetOptions,
  CacheStatistics,
} from "./cache.interface";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { cacheServiceConfigToken } from "@/infrastructure/shared/tokens/infrastructure/cache-service-config.token";
import type { Result } from "@/domain/types/result";
import { CacheCapacityManager } from "./cache-capacity-manager";
import { LRUEvictionStrategy } from "./lru-eviction-strategy";
import { EvictionStrategyRegistry } from "./eviction-strategy-registry";
import type { CacheMetricsObserver } from "./cache-metrics-observer.interface";
import { CacheMetricsCollector } from "./cache-metrics-collector";
import { CacheStore } from "./store/CacheStore";
import { CacheExpirationManager } from "./expiration/CacheExpirationManager";
import { CacheStatisticsCollector } from "./statistics/CacheStatisticsCollector";
import { CacheConfigManager } from "./config/CacheConfigManager";
import type { ICacheStore } from "./store/cache-store.interface";
import type { ICacheExpirationManager } from "./expiration/cache-expiration-manager.interface";
import type { ICacheStatisticsCollector } from "./statistics/cache-statistics-collector.interface";
import type { ICacheConfigManager } from "./config/cache-config-manager.interface";
import { CacheRuntime } from "./runtime/CacheRuntime";
import { CachePolicy } from "./policy/CachePolicy";
import { CacheTelemetry } from "./telemetry/CacheTelemetry";
import type { CacheRuntime as ICacheRuntime } from "./runtime/cache-runtime.interface";
import type { CachePolicy as ICachePolicy } from "./policy/cache-policy.interface";
import type { CacheTelemetry as ICacheTelemetry } from "./telemetry/cache-telemetry.interface";

export const DEFAULT_CACHE_SERVICE_CONFIG: CacheServiceConfig = {
  enabled: true,
  defaultTtlMs: APP_DEFAULTS.CACHE_TTL_MS,
  namespace: "global",
};

/**
 * CacheService facade implementation.
 * Delegates to specialized components (Runtime, Policy, Telemetry) following SRP.
 *
 * **Responsibilities:**
 * - Coordinates cache operations
 * - Provides unified public API
 * - Delegates to specialized components
 *
 * **Design Benefits:**
 * - Single Responsibility: Only coordinates, doesn't implement logic
 * - Testable: Components can be mocked
 * - Maintainable: Clear separation of concerns
 */
export class CacheService implements CacheServiceContract {
  private readonly runtime: ICacheRuntime;
  private readonly policy: ICachePolicy;
  private readonly telemetry: ICacheTelemetry;
  private readonly store: ICacheStore;
  private readonly configManager: ICacheConfigManager;
  private readonly expirationManager: ICacheExpirationManager;
  private readonly clock: () => number;

  constructor(
    config: CacheServiceConfig = DEFAULT_CACHE_SERVICE_CONFIG,
    private readonly metricsCollector?: MetricsCollector,
    clock: () => number = () => Date.now(),
    capacityManager?: CacheCapacityManager,
    metricsObserver?: CacheMetricsObserver,
    store?: ICacheStore,
    expirationManager?: ICacheExpirationManager,
    statisticsCollector?: ICacheStatisticsCollector,
    configManager?: ICacheConfigManager,
    runtime?: ICacheRuntime,
    policy?: ICachePolicy,
    telemetry?: ICacheTelemetry
  ) {
    // Initialize core dependencies
    this.clock = clock;
    this.store = store ?? new CacheStore();
    this.configManager = configManager ?? new CacheConfigManager(config);
    this.expirationManager = expirationManager ?? new CacheExpirationManager(clock);

    // Initialize capacity manager if not provided
    let resolvedCapacityManager = capacityManager;
    if (!resolvedCapacityManager) {
      const registry = EvictionStrategyRegistry.getInstance();
      // Ensure default LRU strategy is registered
      if (!registry.has("lru")) {
        registry.register("lru", new LRUEvictionStrategy());
      }
      // Get strategy from registry (defaults to "lru" if not specified)
      const strategyKey = config.evictionStrategyKey ?? "lru";
      const strategy = registry.getOrDefault(strategyKey, "lru");
      if (!strategy) {
        // Fallback to LRU if strategy not found (should not happen if "lru" is registered)
        resolvedCapacityManager = new CacheCapacityManager(new LRUEvictionStrategy(), this.store);
      } else {
        resolvedCapacityManager = new CacheCapacityManager(strategy, this.store);
      }
    }

    // Initialize statistics collector
    const resolvedMetricsObserver = metricsObserver ?? new CacheMetricsCollector(metricsCollector);
    const resolvedStatisticsCollector =
      statisticsCollector ?? new CacheStatisticsCollector(resolvedMetricsObserver);

    // Initialize specialized components
    this.telemetry = telemetry ?? new CacheTelemetry(resolvedStatisticsCollector);
    this.policy = policy ?? new CachePolicy(resolvedCapacityManager);
    this.runtime =
      runtime ??
      new CacheRuntime(
        this.store,
        this.expirationManager,
        this.configManager,
        this.telemetry,
        this.policy,
        clock
      );
  }

  get isEnabled(): boolean {
    return this.configManager.isEnabled();
  }

  get size(): number {
    return this.store.size;
  }

  /**
   * Gets the config manager for external synchronization.
   * Used by CacheConfigSync to update configuration.
   */
  getConfigManager(): ICacheConfigManager {
    return this.configManager;
  }

  /**
   * Gets the store for external use (e.g., CacheConfigSyncObserver).
   * @internal
   */
  getStore(): ICacheStore {
    return this.store;
  }

  /**
   * Gets the policy for external use (e.g., CacheConfigSyncObserver).
   * @internal
   */
  getPolicy(): ICachePolicy {
    return this.policy;
  }

  get<TValue>(key: CacheKey): CacheLookupResult<TValue> | null {
    return this.runtime.get<TValue>(key);
  }

  async getOrSet<TValue>(
    key: CacheKey,
    factory: () => TValue | Promise<TValue>,
    options?: CacheSetOptions
  ): Promise<Result<CacheLookupResult<TValue>, string>> {
    return this.runtime.getOrSet(key, factory, options);
  }

  set<TValue>(key: CacheKey, value: TValue, options?: CacheSetOptions): CacheEntryMetadata {
    return this.runtime.set(key, value, options);
  }

  delete(key: CacheKey): boolean {
    const config = this.configManager.getConfig();
    if (!config.enabled) return false;
    const removed = this.store.delete(key);
    if (removed) {
      this.telemetry.recordEviction(key);
    }
    return removed;
  }

  has(key: CacheKey): boolean {
    const config = this.configManager.getConfig();
    if (!config.enabled) return false;

    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    const now = this.clock();
    if (this.policy.shouldExpire(entry.expiresAt, now)) {
      this.expirationManager.handleExpiration(key, this.store);
      this.telemetry.recordEviction(key);
      return false;
    }

    return true;
  }

  clear(): number {
    const config = this.configManager.getConfig();
    if (!config.enabled) return 0;

    const keysToEvict: CacheKey[] = [];
    for (const [key] of this.store.entries()) {
      keysToEvict.push(key);
    }
    const removed = this.store.clear();
    if (removed > 0) {
      // Notify about each evicted key
      for (const key of keysToEvict) {
        this.telemetry.recordEviction(key);
      }
    }
    return removed;
  }

  invalidateWhere(predicate: CacheInvalidationPredicate): number {
    const config = this.configManager.getConfig();
    if (!config.enabled) return 0;

    let removed = 0;
    const keysToEvict: CacheKey[] = [];
    for (const [key, entry] of this.store.entries()) {
      if (predicate(entry.metadata)) {
        keysToEvict.push(key);
      }
    }

    for (const key of keysToEvict) {
      if (this.store.delete(key)) {
        removed++;
        this.telemetry.recordEviction(key);
      }
    }

    return removed;
  }

  getMetadata(key: CacheKey): CacheEntryMetadata | null {
    const config = this.configManager.getConfig();
    if (!config.enabled) return null;

    const entry = this.store.get(key);
    if (!entry) return null;

    const now = this.clock();
    if (this.policy.shouldExpire(entry.expiresAt, now)) {
      const wasRemoved = this.expirationManager.handleExpiration(key, this.store);
      if (wasRemoved) {
        this.telemetry.recordEviction(key);
      }
      return null;
    }
    return this.cloneMetadata(entry.metadata);
  }

  getStatistics(): CacheStatistics {
    return this.telemetry.getStatistics(this.store.size, this.isEnabled);
  }

  private cloneMetadata(metadata: CacheEntryMetadata): CacheEntryMetadata {
    return {
      ...metadata,
      tags: [...metadata.tags],
    };
  }
}

export class DICacheService extends CacheService {
  static dependencies = [cacheServiceConfigToken, metricsCollectorToken] as const;

  constructor(config: CacheServiceConfig, metrics: MetricsCollector) {
    super(config, metrics);
  }
}
