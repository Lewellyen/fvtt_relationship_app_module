import type { CacheKey } from "@/infrastructure/di/types/utilities/type-casts";
import type { InternalCacheEntry } from "../eviction-strategy.interface";

/**
 * Interface for cache storage operations.
 * Responsible only for storing and retrieving cache entries.
 */
export interface ICacheStore {
  /**
   * Retrieves a cache entry by key.
   *
   * @param key - The cache key
   * @returns The cache entry or undefined if not found
   */
  get(key: CacheKey): InternalCacheEntry | undefined;

  /**
   * Stores a cache entry.
   *
   * @param key - The cache key
   * @param entry - The cache entry to store
   */
  set(key: CacheKey, entry: InternalCacheEntry): void;

  /**
   * Deletes a cache entry.
   *
   * @param key - The cache key
   * @returns true if the entry was deleted, false if it didn't exist
   */
  delete(key: CacheKey): boolean;

  /**
   * Checks if a cache entry exists.
   *
   * @param key - The cache key
   * @returns true if the entry exists, false otherwise
   */
  has(key: CacheKey): boolean;

  /**
   * Clears all cache entries.
   *
   * @returns The number of entries that were cleared
   */
  clear(): number;

  /**
   * Gets the current number of entries in the store.
   */
  get size(): number;

  /**
   * Returns an iterator over all entries.
   */
  entries(): IterableIterator<[CacheKey, InternalCacheEntry]>;
}
