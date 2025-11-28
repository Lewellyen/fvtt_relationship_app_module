import type {
  CacheKey,
  CacheSetOptions,
  CacheEntryMetadata,
  CacheLookupResult,
  CacheStatistics,
  CacheInvalidationPredicate,
} from "@/infrastructure/cache/cache.interface";
import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic port for caching operations.
 *
 * Abstraction that allows domain/application layers to cache data
 * without knowing about the underlying platform (Map, Redis, LocalStorage, etc.).
 *
 * Implementations:
 * - Browser: CachePortAdapter (wraps CacheService with Map-based storage)
 * - Node.js: NodeCachePortAdapter
 * - Redis: RedisCachePortAdapter
 */
export interface PlatformCachePort {
  readonly isEnabled: boolean;
  readonly size: number;
  get<TValue>(key: CacheKey): CacheLookupResult<TValue> | null;
  set<TValue>(key: CacheKey, value: TValue, options?: CacheSetOptions): CacheEntryMetadata;
  delete(key: CacheKey): boolean;
  has(key: CacheKey): boolean;
  clear(): number;
  invalidateWhere(predicate: CacheInvalidationPredicate): number;
  getMetadata(key: CacheKey): CacheEntryMetadata | null;
  getStatistics(): CacheStatistics;
  getOrSet<TValue>(
    key: CacheKey,
    factory: () => TValue | Promise<TValue>,
    options?: CacheSetOptions
  ): Promise<Result<CacheLookupResult<TValue>, string>>;
}
