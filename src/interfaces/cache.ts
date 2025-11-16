import { MODULE_CONSTANTS } from "@/constants";

const KEY_SEPARATOR = ":";

/**
 * Normalized cache key used by CacheService.
 */
export type CacheKey = string & { readonly __cacheKeyBrand: unique symbol };

/**
 * Parts required to build a cache key.
 */
export interface CacheKeyParts {
  /** Logical namespace, e.g. "journal" */
  namespace: string;
  /** Resource or operation name, e.g. "hidden" */
  resource: string;
  /** Optional identifier or scope information */
  identifier?: string | number | null;
}

/**
 * Options to configure cache entries at set-time.
 */
export interface CacheSetOptions {
  /** Explicit TTL in milliseconds. Falls back to service default when omitted. */
  ttlMs?: number;
  /** Arbitrary tags that can be used for bulk invalidation. */
  tags?: readonly string[];
}

/**
 * Snapshot of metadata tracked for a cache entry.
 */
export interface CacheEntryMetadata {
  key: CacheKey;
  createdAt: number;
  expiresAt: number | null;
  lastAccessedAt: number;
  hits: number;
  tags: readonly string[];
}

/**
 * Result returned from cache lookups.
 */
export interface CacheLookupResult<T> {
  hit: boolean;
  value?: T;
  metadata: CacheEntryMetadata;
}

/**
 * Aggregate statistics for the entire cache.
 */
export interface CacheStatistics {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  enabled: boolean;
}

/**
 * Configuration used to instantiate CacheService.
 */
export interface CacheServiceConfig {
  enabled: boolean;
  defaultTtlMs: number;
  maxEntries?: number | undefined;
  namespace?: string;
}

/**
 * Predicate used for targeted cache invalidation.
 */
export type CacheInvalidationPredicate = (entry: CacheEntryMetadata) => boolean;

/**
 * CacheService contract exposed through DI.
 */
export interface CacheService {
  readonly isEnabled: boolean;
  readonly size: number;
  get<TValue>(key: CacheKey): CacheLookupResult<TValue> | null;
  set<TValue>(key: CacheKey, value: TValue, options?: CacheSetOptions): CacheEntryMetadata;
  delete(key: CacheKey): boolean;
  has(key: CacheKey): boolean;
  clear(): number;
  invalidateWhere(predicate: CacheInvalidationPredicate): number;
  getMetadata(key: CacheKey): CacheEntryMetadata | null;
  getStatistics(): CacheStatistics;
  getOrSet<TValue>(
    key: CacheKey,
    factory: () => TValue | Promise<TValue>,
    options?: CacheSetOptions
  ): Promise<CacheLookupResult<TValue>>;
}

/**
 * Normalizes individual key segments.
 */
function normalizeSegment(segment: string): string {
  return segment
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}

/**
 * Creates a module-scoped cache key.
 */
export function createCacheKey(parts: CacheKeyParts): CacheKey {
  const { namespace, resource, identifier } = parts;
  const payload = [MODULE_CONSTANTS.MODULE.ID, namespace, resource];
  if (identifier !== null && identifier !== undefined) {
    payload.push(String(identifier));
  }
  return payload.map(normalizeSegment).join(KEY_SEPARATOR) as CacheKey; // type-coverage:ignore-line -- Brand assertion required
}

/**
 * Helper to build cache key factories for a namespace.
 */
export function createCacheNamespace(namespace: string) {
  const normalizedNamespace = normalizeSegment(namespace);
  return (resource: string, identifier?: string | number | null): CacheKey =>
    identifier === undefined
      ? createCacheKey({ namespace: normalizedNamespace, resource })
      : createCacheKey({ namespace: normalizedNamespace, resource, identifier });
}
