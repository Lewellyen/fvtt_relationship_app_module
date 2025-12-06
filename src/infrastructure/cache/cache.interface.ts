import type { Result } from "@/domain/types/result";
import { assertCacheKey, type CacheKey } from "@/infrastructure/di/types/utilities/type-casts";

/**
 * CacheKey Brand-Type - re-exportiert von type-casts für Konsistenz.
 *
 * Inline-Definition in type-casts.ts verhindert zirkuläre Dependency!
 * Diese Datei importiert und re-exportiert, damit bestehender Code weiterhin funktioniert.
 */
export type { CacheKey } from "@/infrastructure/di/types/utilities/type-casts";

const KEY_SEPARATOR = ":";

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
  ): Promise<Result<CacheLookupResult<TValue>, string>>;
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
 *
 * @param parts - Cache key parts (namespace, resource, identifier)
 * @param moduleId - Module ID for scoping (injected via DI to avoid Infrastructure → Application dependency)
 * @returns Branded CacheKey
 */
export function createCacheKey(parts: CacheKeyParts, moduleId: string): CacheKey {
  const { namespace, resource, identifier } = parts;
  const payload = [moduleId, namespace, resource];
  if (identifier !== null && identifier !== undefined) {
    payload.push(String(identifier));
  }
  return assertCacheKey(payload.map(normalizeSegment).join(KEY_SEPARATOR));
}

/**
 * Helper to build cache key factories for a namespace.
 *
 * @param namespace - Cache namespace
 * @param moduleId - Module ID for scoping (injected via DI to avoid Infrastructure → Application dependency)
 * @returns Factory function that creates cache keys for the namespace
 */
export function createCacheNamespace(namespace: string, moduleId: string) {
  const normalizedNamespace = normalizeSegment(namespace);
  return (resource: string, identifier?: string | number | null): CacheKey =>
    identifier === undefined
      ? createCacheKey({ namespace: normalizedNamespace, resource }, moduleId)
      : createCacheKey({ namespace: normalizedNamespace, resource, identifier }, moduleId);
}
