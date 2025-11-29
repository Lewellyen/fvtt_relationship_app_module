import type {
  DomainCacheKey,
  DomainCacheSetOptions,
  DomainCacheEntryMetadata,
  DomainCacheLookupResult,
  DomainCacheStatistics,
  DomainCacheInvalidationPredicate,
} from "@/domain/types/cache/cache-types";
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
  get<TValue>(key: DomainCacheKey): DomainCacheLookupResult<TValue> | null;
  set<TValue>(
    key: DomainCacheKey,
    value: TValue,
    options?: DomainCacheSetOptions
  ): DomainCacheEntryMetadata;
  delete(key: DomainCacheKey): boolean;
  has(key: DomainCacheKey): boolean;
  clear(): number;
  invalidateWhere(predicate: DomainCacheInvalidationPredicate): number;
  getMetadata(key: DomainCacheKey): DomainCacheEntryMetadata | null;
  getStatistics(): DomainCacheStatistics;
  getOrSet<TValue>(
    key: DomainCacheKey,
    factory: () => TValue | Promise<TValue>,
    options?: DomainCacheSetOptions
  ): Promise<Result<DomainCacheLookupResult<TValue>, string>>;
}
