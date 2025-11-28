import type { PlatformCachePort } from "@/domain/ports/platform-cache-port.interface";
import type { CacheService } from "@/infrastructure/cache/cache.interface";
import type {
  CacheKey,
  CacheSetOptions,
  CacheEntryMetadata,
  CacheLookupResult,
  CacheStatistics,
  CacheInvalidationPredicate,
} from "@/infrastructure/cache/cache.interface";
import type { Result } from "@/domain/types/result";
import { cacheServiceToken } from "@/infrastructure/shared/tokens";

/**
 * Adapter that implements PlatformCachePort by wrapping CacheService.
 *
 * Simple 1:1 mapping since CacheService is already platform-agnostic.
 */
export class CachePortAdapter implements PlatformCachePort {
  constructor(private readonly cacheService: CacheService) {}

  get isEnabled(): boolean {
    return this.cacheService.isEnabled;
  }

  get size(): number {
    return this.cacheService.size;
  }

  get<TValue>(key: CacheKey): CacheLookupResult<TValue> | null {
    return this.cacheService.get<TValue>(key);
  }

  set<TValue>(key: CacheKey, value: TValue, options?: CacheSetOptions): CacheEntryMetadata {
    return this.cacheService.set(key, value, options);
  }

  delete(key: CacheKey): boolean {
    return this.cacheService.delete(key);
  }

  has(key: CacheKey): boolean {
    return this.cacheService.has(key);
  }

  clear(): number {
    return this.cacheService.clear();
  }

  invalidateWhere(predicate: CacheInvalidationPredicate): number {
    return this.cacheService.invalidateWhere(predicate);
  }

  getMetadata(key: CacheKey): CacheEntryMetadata | null {
    return this.cacheService.getMetadata(key);
  }

  getStatistics(): CacheStatistics {
    return this.cacheService.getStatistics();
  }

  async getOrSet<TValue>(
    key: CacheKey,
    factory: () => TValue | Promise<TValue>,
    options?: CacheSetOptions
  ): Promise<Result<CacheLookupResult<TValue>, string>> {
    return this.cacheService.getOrSet(key, factory, options);
  }
}

/**
 * DI-enabled wrapper for CachePortAdapter.
 */
export class DICachePortAdapter extends CachePortAdapter {
  static dependencies = [cacheServiceToken] as const;

  constructor(cacheService: CacheService) {
    super(cacheService);
  }
}
