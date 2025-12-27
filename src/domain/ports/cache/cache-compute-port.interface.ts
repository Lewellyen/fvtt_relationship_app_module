import type {
  DomainCacheKey,
  DomainCacheSetOptions,
  DomainCacheLookupResult,
} from "@/domain/types/cache/cache-types";
import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic port for cache compute operations (get-or-set pattern).
 *
 * Segregated interface following Interface Segregation Principle (ISP).
 * Clients that need the get-or-set pattern can depend on this minimal interface.
 *
 * Implementations:
 * - Browser: CachePortAdapter (implements all cache ports)
 * - Node.js: NodeCachePortAdapter
 * - Redis: RedisCachePortAdapter
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(private readonly cacheCompute: CacheComputePort) {}
 *
 *   async getOrFetchData(key: string) {
 *     const result = await this.cacheCompute.getOrSet(
 *       key,
 *       async () => await this.fetchFromApi(),
 *       { ttlMs: 60000 }
 *     );
 *     return result;
 *   }
 * }
 * ```
 */
export interface CacheComputePort {
  /**
   * Retrieves a value from cache, or computes and stores it if missing.
   *
   * Implements the "get-or-set" pattern: checks cache first, and if not found,
   * calls the factory function to compute the value, stores it in cache, and returns it.
   *
   * @param key - Cache key
   * @param factory - Function that computes the value (sync or async)
   * @param options - Optional cache entry configuration (TTL, tags)
   * @returns Result with cache lookup result containing the value
   */
  getOrSet<TValue>(
    key: DomainCacheKey,
    factory: () => TValue | Promise<TValue>,
    options?: DomainCacheSetOptions
  ): Promise<Result<DomainCacheLookupResult<TValue>, string>>;
}
