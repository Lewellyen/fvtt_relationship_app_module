import type { Result } from "@/domain/types/result";
import { ok, err, fromPromise } from "@/domain/utils/result";
import { castCacheValue } from "@/infrastructure/di/types/utilities/type-casts";
import type {
  CacheEntryMetadata,
  CacheKey,
  CacheLookupResult,
  CacheSetOptions,
} from "../cache.interface";
import type { CacheRuntime as ICacheRuntime } from "./cache-runtime.interface";
import type { ICacheStore } from "../store/cache-store.interface";
import type { ICacheExpirationManager } from "../expiration/cache-expiration-manager.interface";
import type { ICacheConfigManager } from "../config/cache-config-manager.interface";
import type { CacheTelemetry } from "../telemetry/cache-telemetry.interface";
import type { CachePolicy } from "../policy/cache-policy.interface";
import type { InternalCacheEntry } from "../eviction-strategy.interface";

/**
 * Core cache runtime implementation.
 * Handles get/set/getOrSet operations.
 */
export class CacheRuntime implements ICacheRuntime {
  constructor(
    private readonly store: ICacheStore,
    private readonly expirationManager: ICacheExpirationManager,
    private readonly configManager: ICacheConfigManager,
    private readonly telemetry: CacheTelemetry,
    private readonly policy: CachePolicy,
    private readonly clock: () => number
  ) {}

  get<T>(key: CacheKey): CacheLookupResult<T> | null {
    const config = this.configManager.getConfig();
    if (!config.enabled) {
      return null;
    }

    const entry = this.store.get(key);
    if (!entry) {
      this.telemetry.recordMiss(key);
      return null;
    }

    const now = this.clock();
    if (this.policy.shouldExpire(entry.expiresAt, now)) {
      this.handleExpiration(key, entry);
      this.telemetry.recordEviction(key);
      this.telemetry.recordMiss(key);
      return null;
    }

    // Update access metadata
    entry.metadata.hits += 1;
    entry.metadata.lastAccessedAt = now;

    this.telemetry.recordHit(key);

    return {
      hit: true,
      value: castCacheValue<T>(entry.value),
      metadata: this.cloneMetadata(entry.metadata),
    };
  }

  set<T>(key: CacheKey, value: T, options?: CacheSetOptions): CacheEntryMetadata {
    const now = this.clock();
    const config = this.configManager.getConfig();
    const metadata = this.expirationManager.createMetadata(key, options, now, config.defaultTtlMs);

    if (!config.enabled) {
      return metadata;
    }

    const entry: InternalCacheEntry = {
      value,
      expiresAt: metadata.expiresAt,
      metadata,
    };

    this.store.set(key, entry);
    const evictedKeys = this.policy.enforceCapacity(this.store.size, config);
    for (const evictedKey of evictedKeys) {
      this.telemetry.recordEviction(evictedKey);
    }

    return { ...metadata, tags: [...metadata.tags] };
  }

  async getOrSet<T>(
    key: CacheKey,
    factory: () => T | Promise<T>,
    options?: CacheSetOptions
  ): Promise<Result<CacheLookupResult<T>, string>> {
    const existing = this.get<T>(key);
    if (existing) {
      return ok(existing);
    }

    // Wrap factory() to handle both sync and async errors
    let factoryValue: T;
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

  private handleExpiration(key: CacheKey, entry: InternalCacheEntry): void {
    const now = this.clock();
    if (this.expirationManager.isExpired(entry, now)) {
      this.expirationManager.handleExpiration(key, this.store);
    }
  }

  private cloneMetadata(metadata: CacheEntryMetadata): CacheEntryMetadata {
    return {
      ...metadata,
      tags: [...metadata.tags],
    };
  }
}
