/**
 * Domain-owned cache types - independent of infrastructure implementation.
 * These types define the cache contract from a domain perspective.
 */

/**
 * Normalized cache key used across domain.
 * Infrastructure adapters map this to their specific key format.
 */
export type DomainCacheKey = string;

/**
 * Options to configure cache entries at set-time.
 */
export interface DomainCacheSetOptions {
  /** Explicit TTL in milliseconds. Falls back to service default when omitted. */
  ttlMs?: number;
  /** Arbitrary tags that can be used for bulk invalidation. */
  tags?: readonly string[];
}

/**
 * Snapshot of metadata tracked for a cache entry.
 */
export interface DomainCacheEntryMetadata {
  key: DomainCacheKey;
  createdAt: number;
  expiresAt: number | null;
  lastAccessedAt: number;
  hits: number;
  tags: readonly string[];
}

/**
 * Result returned from cache lookups.
 */
export interface DomainCacheLookupResult<T> {
  hit: boolean;
  value?: T;
  metadata: DomainCacheEntryMetadata;
}

/**
 * Aggregate statistics for the entire cache.
 */
export interface DomainCacheStatistics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  enabled: boolean;
}

/**
 * Predicate used for targeted cache invalidation.
 */
export type DomainCacheInvalidationPredicate = (entry: DomainCacheEntryMetadata) => boolean;
