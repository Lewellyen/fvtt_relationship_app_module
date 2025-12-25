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
import { castCacheValue } from "@/infrastructure/di/types/utilities/type-casts";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { cacheServiceConfigToken } from "@/infrastructure/shared/tokens/infrastructure/cache-service-config.token";
import type { Result } from "@/domain/types/result";
import { ok, err, fromPromise } from "@/domain/utils/result";
import type { InternalCacheEntry } from "./eviction-strategy.interface";
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

export const DEFAULT_CACHE_SERVICE_CONFIG: CacheServiceConfig = {
  enabled: true,
  defaultTtlMs: APP_DEFAULTS.CACHE_TTL_MS,
  namespace: "global",
};

export class CacheService implements CacheServiceContract {
  private readonly store: ICacheStore;
  private readonly expirationManager: ICacheExpirationManager;
  private readonly statisticsCollector: ICacheStatisticsCollector;
  private readonly configManager: ICacheConfigManager;
  private readonly capacityManager: CacheCapacityManager;
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
    configManager?: ICacheConfigManager
  ) {
    this.clock = clock;

    // Initialize managers (injectable for tests)
    this.store = store ?? new CacheStore();
    this.configManager = configManager ?? new CacheConfigManager(config);
    const resolvedMetricsObserver = metricsObserver ?? new CacheMetricsCollector(metricsCollector);
    this.statisticsCollector =
      statisticsCollector ?? new CacheStatisticsCollector(resolvedMetricsObserver);
    this.expirationManager = expirationManager ?? new CacheExpirationManager(clock);

    // Capacity manager needs store and strategy
    // Use registry-based strategy selection (OCP-compliant)
    if (capacityManager) {
      this.capacityManager = capacityManager;
    } else {
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
        this.capacityManager = new CacheCapacityManager(new LRUEvictionStrategy(), this.store);
      } else {
        this.capacityManager = new CacheCapacityManager(strategy, this.store);
      }
    }
  }

  get isEnabled(): boolean {
    return this.configManager.isEnabled();
  }

  get size(): number {
    return this.store.size;
  }

  get<TValue>(key: CacheKey): CacheLookupResult<TValue> | null {
    return this.accessEntry<TValue>(key, true);
  }

  async getOrSet<TValue>(
    key: CacheKey,
    factory: () => TValue | Promise<TValue>,
    options?: CacheSetOptions
  ): Promise<Result<CacheLookupResult<TValue>, string>> {
    const existing = this.get<TValue>(key);
    if (existing) {
      return ok(existing);
    }

    // Wrap factory() to handle both sync and async errors
    // Use try-catch for sync errors, fromPromise for async errors
    let factoryValue: TValue;
    try {
      const factoryResult = factory();
      // If factory returns a Promise, use fromPromise
      if (factoryResult instanceof Promise) {
        const asyncResult = await fromPromise(
          factoryResult,
          (error) => `Factory failed for cache key ${String(key)}: ${String(error)}`
        );
        if (!asyncResult.ok) {
          return asyncResult;
        }
        factoryValue = asyncResult.value;
      } else {
        // Synchronous result
        factoryValue = factoryResult;
      }
    } catch (error) {
      // Synchronous error from factory()
      return err(`Factory failed for cache key ${String(key)}: ${String(error)}`);
    }

    const metadata = this.set(key, factoryValue, options);
    return ok({
      hit: false,
      value: factoryValue,
      metadata,
    });
  }

  set<TValue>(key: CacheKey, value: TValue, options?: CacheSetOptions): CacheEntryMetadata {
    const now = this.clock();
    const config = this.configManager.getConfig();
    const metadata = this.expirationManager.createMetadata(key, options, now, config.defaultTtlMs);

    if (!this.isEnabled) {
      return metadata;
    }

    const entry: InternalCacheEntry = {
      value,
      expiresAt: metadata.expiresAt,
      metadata,
    };

    this.store.set(key, entry);
    this.enforceCapacity();
    return { ...metadata, tags: [...metadata.tags] };
  }

  delete(key: CacheKey): boolean {
    if (!this.isEnabled) return false;
    const removed = this.store.delete(key);
    if (removed) {
      this.statisticsCollector.recordEviction(key);
    }
    return removed;
  }

  has(key: CacheKey): boolean {
    return Boolean(this.accessEntry(key, false));
  }

  clear(): number {
    if (!this.isEnabled) return 0;
    return this.clearStore();
  }

  invalidateWhere(predicate: CacheInvalidationPredicate): number {
    if (!this.isEnabled) return 0;

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
        this.statisticsCollector.recordEviction(key);
      }
    }

    return removed;
  }

  getMetadata(key: CacheKey): CacheEntryMetadata | null {
    if (!this.isEnabled) return null;

    const entry = this.store.get(key);
    if (!entry) return null;
    const now = this.clock();
    if (this.expirationManager.isExpired(entry, now)) {
      const wasRemoved = this.expirationManager.handleExpiration(key, this.store);
      if (wasRemoved) {
        this.statisticsCollector.recordEviction(key);
      }
      return null;
    }
    return this.cloneMetadata(entry.metadata);
  }

  getStatistics(): CacheStatistics {
    return this.statisticsCollector.getStatistics(this.store.size, this.isEnabled);
  }

  private accessEntry<TValue>(
    key: CacheKey,
    mutateUsage: boolean
  ): CacheLookupResult<TValue> | null {
    if (!this.isEnabled) {
      return null; // Keine Metrics tracken wenn disabled
    }

    const entry = this.store.get(key);
    if (!entry) {
      this.statisticsCollector.recordMiss(key);
      return null;
    }

    const now = this.clock();
    if (this.expirationManager.isExpired(entry, now)) {
      this.expirationManager.handleExpiration(key, this.store);
      this.statisticsCollector.recordEviction(key);
      this.statisticsCollector.recordMiss(key);
      return null;
    }

    if (mutateUsage) {
      entry.metadata.hits += 1;
      entry.metadata.lastAccessedAt = now;
    }

    this.statisticsCollector.recordHit(key);

    return {
      hit: true,
      value: castCacheValue<TValue>(entry.value),
      metadata: this.cloneMetadata(entry.metadata),
    };
  }

  private enforceCapacity(): void {
    const config = this.configManager.getConfig();
    if (!config.maxEntries || this.store.size <= config.maxEntries) {
      return;
    }

    const evictedKeys = this.capacityManager.enforceCapacity(config.maxEntries);
    for (const key of evictedKeys) {
      this.statisticsCollector.recordEviction(key);
    }
  }

  private cloneMetadata(metadata: CacheEntryMetadata): CacheEntryMetadata {
    return {
      ...metadata,
      tags: [...metadata.tags],
    };
  }

  /**
   * Updates the cache service configuration at runtime.
   * Used by CacheConfigSync to synchronize RuntimeConfig changes.
   *
   * @param partial - Partial configuration to merge with existing config
   */
  public updateConfig(partial: Partial<CacheServiceConfig>): void {
    this.configManager.updateConfig(partial);

    if (!this.isEnabled) {
      this.clearStore();
      return;
    }

    const config = this.configManager.getConfig();
    if (typeof config.maxEntries === "number") {
      this.enforceCapacity();
    }
  }

  private clearStore(): number {
    const keysToEvict: CacheKey[] = [];
    for (const [key] of this.store.entries()) {
      keysToEvict.push(key);
    }
    const removed = this.store.clear();
    if (removed > 0) {
      // Notify about each evicted key
      for (const key of keysToEvict) {
        this.statisticsCollector.recordEviction(key);
      }
    }
    return removed;
  }
}

export class DICacheService extends CacheService {
  static dependencies = [cacheServiceConfigToken, metricsCollectorToken] as const;

  constructor(config: CacheServiceConfig, metrics: MetricsCollector) {
    super(config, metrics);
  }
}
