import type { CacheKey, CacheEntryMetadata, CacheSetOptions } from "../cache.interface";
import type { InternalCacheEntry } from "../eviction-strategy.interface";
import type { ICacheExpirationManager } from "./cache-expiration-manager.interface";
import type { ICacheStore } from "../store/cache-store.interface";

function clampTtl(ttl: number | undefined, fallback: number): number {
  if (typeof ttl !== "number" || Number.isNaN(ttl)) {
    return fallback;
  }
  return ttl < 0 ? 0 : ttl;
}

/**
 * Default clock function that returns current timestamp.
 * Exported for testing purposes.
 */
export function defaultClock(): number {
  return Date.now();
}

/**
 * Manages cache expiration logic.
 * Responsible only for TTL/expiration handling.
 */
export class CacheExpirationManager implements ICacheExpirationManager {
  private readonly clock: () => number;

  constructor(clock?: () => number) {
    this.clock = clock ?? defaultClock;
  }

  isExpired(entry: InternalCacheEntry, now: number): boolean {
    return typeof entry.expiresAt === "number" && entry.expiresAt > 0 && entry.expiresAt <= now;
  }

  createMetadata(
    key: CacheKey,
    options: CacheSetOptions | undefined,
    now: number,
    defaultTtlMs: number
  ): CacheEntryMetadata {
    const ttlMs = clampTtl(options?.ttlMs, defaultTtlMs);
    const expiresAt = ttlMs > 0 ? now + ttlMs : null;
    const tags = options?.tags ? Array.from(new Set(options.tags.map((tag) => String(tag)))) : [];

    return {
      key,
      createdAt: now,
      expiresAt,
      lastAccessedAt: now,
      hits: 0,
      tags,
    };
  }

  handleExpiration(key: CacheKey, store: ICacheStore): boolean {
    return store.delete(key);
  }
}
