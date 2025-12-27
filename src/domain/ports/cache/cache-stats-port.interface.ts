import type { DomainCacheStatistics } from "@/domain/types/cache/cache-types";

/**
 * Platform-agnostic port for cache statistics and status.
 *
 * Segregated interface following Interface Segregation Principle (ISP).
 * Clients that only need cache statistics can depend on this minimal interface.
 *
 * Implementations:
 * - Browser: CachePortAdapter (implements all cache ports)
 * - Node.js: NodeCachePortAdapter
 * - Redis: RedisCachePortAdapter
 *
 * @example
 * ```typescript
 * class MonitoringService {
 *   constructor(private readonly cacheStats: CacheStatsPort) {}
 *
 *   getCacheMetrics() {
 *     return {
 *       enabled: this.cacheStats.isEnabled,
 *       size: this.cacheStats.size,
 *       stats: this.cacheStats.getStatistics(),
 *     };
 *   }
 * }
 * ```
 */
export interface CacheStatsPort {
  /**
   * Whether the cache is enabled.
   */
  readonly isEnabled: boolean;

  /**
   * Current number of entries in cache.
   */
  readonly size: number;

  /**
   * Retrieves aggregate statistics for the cache.
   *
   * @returns Cache statistics (hits, misses, evictions, etc.)
   */
  getStatistics(): DomainCacheStatistics;
}
