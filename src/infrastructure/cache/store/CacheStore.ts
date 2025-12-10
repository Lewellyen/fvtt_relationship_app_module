import type { CacheKey } from "../cache.interface";
import type { InternalCacheEntry } from "../eviction-strategy.interface";
import type { ICacheStore } from "./cache-store.interface";

/**
 * Manages cache storage operations.
 * Responsible only for storing and retrieving cache entries.
 */
export class CacheStore implements ICacheStore {
  private readonly store = new Map<CacheKey, InternalCacheEntry>();

  get(key: CacheKey): InternalCacheEntry | undefined {
    return this.store.get(key);
  }

  set(key: CacheKey, entry: InternalCacheEntry): void {
    this.store.set(key, entry);
  }

  delete(key: CacheKey): boolean {
    return this.store.delete(key);
  }

  has(key: CacheKey): boolean {
    return this.store.has(key);
  }

  clear(): number {
    const size = this.store.size;
    this.store.clear();
    return size;
  }

  get size(): number {
    return this.store.size;
  }

  entries(): IterableIterator<[CacheKey, InternalCacheEntry]> {
    return this.store.entries();
  }
}
