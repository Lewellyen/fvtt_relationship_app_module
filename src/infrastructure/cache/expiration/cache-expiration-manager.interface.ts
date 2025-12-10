import type { CacheKey, CacheEntryMetadata, CacheSetOptions } from "../cache.interface";
import type { InternalCacheEntry } from "../eviction-strategy.interface";
import type { ICacheStore } from "../store/cache-store.interface";

/**
 * Interface for cache expiration management.
 * Responsible only for TTL/expiration logic.
 */
export interface ICacheExpirationManager {
  /**
   * Checks if a cache entry is expired.
   *
   * @param entry - The cache entry to check
   * @param now - Current timestamp
   * @returns true if the entry is expired, false otherwise
   */
  isExpired(entry: InternalCacheEntry, now: number): boolean;

  /**
   * Creates metadata for a new cache entry.
   *
   * @param key - The cache key
   * @param options - Cache set options (TTL, tags)
   * @param now - Current timestamp
   * @param defaultTtlMs - Default TTL from config
   * @returns The created metadata
   */
  createMetadata(
    key: CacheKey,
    options: CacheSetOptions | undefined,
    now: number,
    defaultTtlMs: number
  ): CacheEntryMetadata;

  /**
   * Handles expiration of a cache entry by removing it from the store.
   *
   * @param key - The cache key to expire
   * @param store - The cache store
   * @returns true if the entry was removed, false otherwise
   */
  handleExpiration(key: CacheKey, store: ICacheStore): boolean;
}
