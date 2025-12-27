import type {
  DomainCacheKey,
  DomainCacheSetOptions,
  DomainCacheEntryMetadata,
} from "@/domain/types/cache/cache-types";

/**
 * Platform-agnostic port for cache write operations.
 *
 * Segregated interface following Interface Segregation Principle (ISP).
 * Clients that only need to write to cache can depend on this minimal interface.
 *
 * Implementations:
 * - Browser: CachePortAdapter (implements all cache ports)
 * - Node.js: NodeCachePortAdapter
 * - Redis: RedisCachePortAdapter
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(private readonly cacheWriter: CacheWriterPort) {}
 *
 *   cacheData(key: string, data: MyData) {
 *     this.cacheWriter.set(key, data, { ttlMs: 60000 });
 *   }
 * }
 * ```
 */
export interface CacheWriterPort {
  /**
   * Stores a value in cache with optional TTL and tags.
   *
   * @param key - Cache key
   * @param value - Value to store
   * @param options - Optional cache entry configuration (TTL, tags)
   * @returns Metadata for the stored cache entry
   */
  set<TValue>(
    key: DomainCacheKey,
    value: TValue,
    options?: DomainCacheSetOptions
  ): DomainCacheEntryMetadata;

  /**
   * Deletes a cache entry by key.
   *
   * @param key - Cache key to delete
   * @returns true if entry was deleted, false if it didn't exist
   */
  delete(key: DomainCacheKey): boolean;

  /**
   * Clears all cache entries.
   *
   * @returns Number of entries cleared
   */
  clear(): number;
}
