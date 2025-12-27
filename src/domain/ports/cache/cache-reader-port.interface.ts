import type {
  DomainCacheKey,
  DomainCacheEntryMetadata,
  DomainCacheLookupResult,
} from "@/domain/types/cache/cache-types";

/**
 * Platform-agnostic port for cache read operations.
 *
 * Segregated interface following Interface Segregation Principle (ISP).
 * Clients that only need to read from cache can depend on this minimal interface.
 *
 * Implementations:
 * - Browser: CachePortAdapter (implements all cache ports)
 * - Node.js: NodeCachePortAdapter
 * - Redis: RedisCachePortAdapter
 *
 * @example
 * ```typescript
 * class MyService {
 *   constructor(private readonly cacheReader: CacheReaderPort) {}
 *
 *   getCachedData(key: string) {
 *     return this.cacheReader.get<MyData>(key);
 *   }
 * }
 * ```
 */
export interface CacheReaderPort {
  /**
   * Retrieves a value from cache by key.
   *
   * @param key - Cache key
   * @returns Cache lookup result with value and metadata, or null if not found
   */
  get<TValue>(key: DomainCacheKey): DomainCacheLookupResult<TValue> | null;

  /**
   * Checks if a key exists in cache.
   *
   * @param key - Cache key to check
   * @returns true if key exists, false otherwise
   */
  has(key: DomainCacheKey): boolean;

  /**
   * Retrieves metadata for a cache entry without retrieving the value.
   *
   * @param key - Cache key
   * @returns Cache entry metadata, or null if entry doesn't exist
   */
  getMetadata(key: DomainCacheKey): DomainCacheEntryMetadata | null;
}
