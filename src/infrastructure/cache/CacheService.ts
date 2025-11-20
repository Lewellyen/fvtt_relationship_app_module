import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
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
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { castCacheValue } from "@/infrastructure/di/types/utilities/runtime-safe-cast";
import {
  cacheServiceConfigToken,
  metricsCollectorToken,
  runtimeConfigToken,
} from "@/infrastructure/shared/tokens";
import type { Result } from "@/domain/types/result";
import { ok, err, fromPromise } from "@/infrastructure/shared/utils/result";

type InternalCacheEntry = {
  value: unknown;
  expiresAt: number | null;
  metadata: CacheEntryMetadata;
};

export const DEFAULT_CACHE_SERVICE_CONFIG: CacheServiceConfig = {
  enabled: true,
  defaultTtlMs: MODULE_CONSTANTS.DEFAULTS.CACHE_TTL_MS,
  namespace: "global",
};

function clampTtl(ttl: number | undefined, fallback: number): number {
  if (typeof ttl !== "number" || Number.isNaN(ttl)) {
    return fallback;
  }
  return ttl < 0 ? 0 : ttl;
}

export class CacheService implements CacheServiceContract {
  private readonly store = new Map<CacheKey, InternalCacheEntry>();
  private readonly stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  private config: CacheServiceConfig;
  private runtimeConfigUnsubscribe: (() => void) | null = null;

  constructor(
    config: CacheServiceConfig = DEFAULT_CACHE_SERVICE_CONFIG,
    private readonly metricsCollector?: MetricsCollector,
    private readonly clock: () => number = () => Date.now(),
    runtimeConfig?: RuntimeConfigService
  ) {
    const resolvedMaxEntries =
      typeof config?.maxEntries === "number" && config.maxEntries > 0
        ? config.maxEntries
        : undefined;

    this.config = {
      ...DEFAULT_CACHE_SERVICE_CONFIG,
      ...config,
      defaultTtlMs: clampTtl(config?.defaultTtlMs, DEFAULT_CACHE_SERVICE_CONFIG.defaultTtlMs),
      ...(resolvedMaxEntries !== undefined ? { maxEntries: resolvedMaxEntries } : {}),
    };

    this.bindRuntimeConfig(runtimeConfig);
  }

  get isEnabled(): boolean {
    return this.config.enabled;
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
    const metadata = this.createMetadata(key, options, now);

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
      this.stats.evictions++;
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
    for (const [key, entry] of this.store.entries()) {
      if (predicate(entry.metadata)) {
        this.store.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.stats.evictions += removed;
    }

    return removed;
  }

  getMetadata(key: CacheKey): CacheEntryMetadata | null {
    if (!this.isEnabled) return null;

    const entry = this.store.get(key) as InternalCacheEntry | undefined;
    if (!entry) return null;
    if (this.isExpired(entry)) {
      this.handleExpiration(key);
      return null;
    }
    return this.cloneMetadata(entry.metadata);
  }

  getStatistics(): CacheStatistics {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      size: this.store.size,
      enabled: this.isEnabled,
    };
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
      this.recordMiss();
      return null;
    }

    if (this.isExpired(entry)) {
      this.handleExpiration(key);
      this.recordMiss();
      return null;
    }

    if (mutateUsage) {
      entry.metadata.hits += 1;
      entry.metadata.lastAccessedAt = this.clock();
    }

    this.recordHit();

    return {
      hit: true,
      value: castCacheValue<TValue>(entry.value),
      metadata: this.cloneMetadata(entry.metadata),
    };
  }

  private recordHit(): void {
    this.metricsCollector?.recordCacheAccess(true);
    this.stats.hits++;
  }

  private recordMiss(): void {
    this.metricsCollector?.recordCacheAccess(false);
    this.stats.misses++;
  }

  private handleExpiration(key: CacheKey): void {
    if (this.store.delete(key)) {
      this.stats.evictions++;
    }
  }

  private isExpired(entry: InternalCacheEntry): boolean {
    return (
      typeof entry.expiresAt === "number" && entry.expiresAt > 0 && entry.expiresAt <= this.clock()
    );
  }

  private enforceCapacity(): void {
    if (!this.config.maxEntries || this.store.size <= this.config.maxEntries) {
      return;
    }

    while (this.store.size > this.config.maxEntries) {
      let lruKey: CacheKey | null = null;
      let oldestTimestamp = Number.POSITIVE_INFINITY;

      for (const [key, entry] of this.store.entries()) {
        if (entry.metadata.lastAccessedAt < oldestTimestamp) {
          oldestTimestamp = entry.metadata.lastAccessedAt;
          lruKey = key;
        }
      }

      if (!lruKey) {
        break;
      }

      this.store.delete(lruKey);
      this.stats.evictions++;
    }
  }

  private createMetadata(
    key: CacheKey,
    options: CacheSetOptions | undefined,
    now: number
  ): CacheEntryMetadata {
    const ttlMs = clampTtl(options?.ttlMs, this.config.defaultTtlMs);
    const expiresAt = ttlMs > 0 ? now + ttlMs : null;
    const tags = options?.tags ? Array.from(new Set(options.tags.map((tag) => String(tag)))) : [];

    return {
      key,
      createdAt: now,
      expiresAt,
      lastAccessedAt: now,
      hits: 0,
      tags,
    };
  }

  private cloneMetadata(metadata: CacheEntryMetadata): CacheEntryMetadata {
    return {
      ...metadata,
      tags: [...metadata.tags],
    };
  }

  private updateConfig(partial: Partial<CacheServiceConfig>): void {
    const merged: CacheServiceConfig = {
      ...this.config,
      ...partial,
    };

    merged.defaultTtlMs = clampTtl(merged.defaultTtlMs, DEFAULT_CACHE_SERVICE_CONFIG.defaultTtlMs);

    this.config = merged;

    if (!this.isEnabled) {
      this.clearStore();
      return;
    }

    if (typeof this.config.maxEntries === "number") {
      this.enforceCapacity();
    }
  }

  private bindRuntimeConfig(runtimeConfig?: RuntimeConfigService): void {
    if (!runtimeConfig) {
      return;
    }

    this.runtimeConfigUnsubscribe?.();

    const unsubscribers: Array<() => void> = [];
    unsubscribers.push(
      runtimeConfig.onChange("enableCacheService", (enabled) => {
        this.updateConfig({ enabled });
      })
    );
    unsubscribers.push(
      runtimeConfig.onChange("cacheDefaultTtlMs", (ttl) => {
        this.updateConfig({ defaultTtlMs: ttl });
      })
    );
    unsubscribers.push(
      runtimeConfig.onChange("cacheMaxEntries", (maxEntries) => {
        this.updateConfig({
          maxEntries: typeof maxEntries === "number" && maxEntries > 0 ? maxEntries : undefined,
        });
      })
    );

    this.runtimeConfigUnsubscribe = () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
    };
  }

  private clearStore(): number {
    const removed = this.store.size;
    this.store.clear();
    if (removed > 0) {
      this.stats.evictions += removed;
    }
    return removed;
  }
}

export class DICacheService extends CacheService {
  static dependencies = [
    cacheServiceConfigToken,
    metricsCollectorToken,
    runtimeConfigToken,
  ] as const;

  constructor(
    config: CacheServiceConfig,
    metrics: MetricsCollector,
    runtimeConfig: RuntimeConfigService
  ) {
    super(config, metrics, undefined, runtimeConfig);
  }
}
