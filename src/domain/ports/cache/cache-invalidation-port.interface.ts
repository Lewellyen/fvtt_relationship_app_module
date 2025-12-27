import type { DomainCacheInvalidationPredicate } from "@/domain/types/cache/cache-types";

/**
 * Platform-agnostic port for cache invalidation operations.
 *
 * Segregated interface following Interface Segregation Principle (ISP).
 * Clients that only need to invalidate cache entries can depend on this minimal interface.
 *
 * Implementations:
 * - Browser: CachePortAdapter (implements all cache ports)
 * - Node.js: NodeCachePortAdapter
 * - Redis: RedisCachePortAdapter
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(private readonly cacheInvalidation: CacheInvalidationPort) {}
 *
 *   invalidateByTag(tag: string) {
 *     this.cacheInvalidation.invalidateWhere((meta) => meta.tags.includes(tag));
 *   }
 * }
 * ```
 */
export interface CacheInvalidationPort {
  /**
   * Invalidates cache entries matching a predicate.
   *
   * Useful for bulk invalidation based on tags, expiration, or other metadata criteria.
   *
   * @param predicate - Function that returns true for entries to invalidate
   * @returns Number of entries invalidated
   */
  invalidateWhere(predicate: DomainCacheInvalidationPredicate): number;
}
