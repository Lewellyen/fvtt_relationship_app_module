import type { Result } from "@/domain/types/result";
import type {
  CacheEntryMetadata,
  CacheKey,
  CacheLookupResult,
  CacheSetOptions,
} from "../cache.interface";

/**
 * Core cache runtime operations.
 * Responsible only for get/set/getOrSet operations.
 *
 * **Single Responsibility:**
 * - Cache entry retrieval (get)
 * - Cache entry storage (set)
 * - Cache-or-compute pattern (getOrSet)
 *
 * **Design Benefits:**
 * - Separated from policy decisions (eviction, expiration)
 * - Separated from telemetry (statistics, metrics)
 * - Testable in isolation
 */
export interface CacheRuntime {
  /**
   * Retrieves a cached value by key.
   * Returns null if not found or expired.
   *
   * @param key - Cache key
   * @returns Cache lookup result or null
   */
  get<T>(key: CacheKey): CacheLookupResult<T> | null;

  /**
   * Stores a value in the cache.
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param options - Optional cache entry configuration
   * @returns Metadata for the cached entry
   */
  set<T>(key: CacheKey, value: T, options?: CacheSetOptions): CacheEntryMetadata;

  /**
   * Gets a cached value or computes and stores it if missing.
   *
   * @param key - Cache key
   * @param factory - Factory function to compute the value
   * @param options - Optional cache entry configuration
   * @returns Result with cache lookup result
   */
  getOrSet<T>(
    key: CacheKey,
    factory: () => T | Promise<T>,
    options?: CacheSetOptions
  ): Promise<Result<CacheLookupResult<T>, string>>;
}
