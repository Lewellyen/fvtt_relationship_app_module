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
import type { ICacheStore } from "./store/cache-store.interface";
import type { ICacheExpirationManager } from "./expiration/cache-expiration-manager.interface";
import type { ICacheConfigManager } from "./config/cache-config-manager.interface";
import type { CacheRuntime as ICacheRuntime } from "./runtime/cache-runtime.interface";
import type { CachePolicy as ICachePolicy } from "./policy/cache-policy.interface";
import type { CacheTelemetry as ICacheTelemetry } from "./telemetry/cache-telemetry.interface";
import { CacheCompositionFactory } from "./factory/CacheCompositionFactory";

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
 * - No composition logic: Components are injected, not created
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
    runtime: ICacheRuntime,
    policy: ICachePolicy,
    telemetry: ICacheTelemetry,
    store: ICacheStore,
    configManager: ICacheConfigManager,
    expirationManager: ICacheExpirationManager,
    clock: () => number = () => Date.now()
  ) {
    this.runtime = runtime;
    this.policy = policy;
    this.telemetry = telemetry;
    this.store = store;
    this.configManager = configManager;
    this.expirationManager = expirationManager;
    this.clock = clock;
  }

  get isEnabled(): boolean {
    return this.configManager.isEnabled();
  }

  get size(): number {
    return this.store.size;
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

  getConfigManager(): ICacheConfigManager {
    return this.configManager;
  }

  getStore(): ICacheStore {
    return this.store;
  }

  getPolicy(): ICachePolicy {
    return this.policy;
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

  constructor(_config: CacheServiceConfig, _metrics: MetricsCollector) {
    // DICacheService will be created via factory in DI registration
    // This constructor signature is kept for backward compatibility but should not be used directly
    // The actual composition is handled by CacheCompositionFactory in cache-services.config.ts
    // We create a minimal composition here to satisfy the super() call requirement
    const factory = new CacheCompositionFactory();
    const composition = factory.create(_config, _metrics);
    super(
      composition.runtime,
      composition.policy,
      composition.telemetry,
      composition.store,
      composition.configManager,
      composition.expirationManager
    );
  }
}
