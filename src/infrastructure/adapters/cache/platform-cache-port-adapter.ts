import type { CacheReaderPort } from "@/domain/ports/cache/cache-reader-port.interface";
import type { CacheWriterPort } from "@/domain/ports/cache/cache-writer-port.interface";
import type { CacheInvalidationPort } from "@/domain/ports/cache/cache-invalidation-port.interface";
import type { CacheStatsPort } from "@/domain/ports/cache/cache-stats-port.interface";
import type { CacheComputePort } from "@/domain/ports/cache/cache-compute-port.interface";
import type { CacheService } from "@/infrastructure/cache/cache.interface";
import type {
  CacheKey,
  CacheSetOptions,
  CacheEntryMetadata,
  CacheLookupResult,
  CacheStatistics,
  CacheInvalidationPredicate,
} from "@/infrastructure/cache/cache.interface";
import type {
  DomainCacheKey,
  DomainCacheSetOptions,
  DomainCacheEntryMetadata,
  DomainCacheLookupResult,
  DomainCacheStatistics,
  DomainCacheInvalidationPredicate,
} from "@/domain/types/cache/cache-types";
import type { Result } from "@/domain/types/result";
import { cacheServiceToken } from "@/infrastructure/shared/tokens/infrastructure/cache-service.token";
import { assertCacheKey } from "@/infrastructure/di/types/utilities/type-casts";

/**
 * Adapter that implements all cache ports by wrapping CacheService.
 *
 * Implements the segregated cache ports (CacheReaderPort, CacheWriterPort, etc.) to allow clients
 * to depend only on the capabilities they need (Interface Segregation Principle).
 *
 * Maps between Domain cache types (domain-agnostic) and Infrastructure cache types
 * (Infrastructure-specific implementation details like branded keys).
 */
export class CachePortAdapter
  implements
    CacheReaderPort,
    CacheWriterPort,
    CacheInvalidationPort,
    CacheStatsPort,
    CacheComputePort
{
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Maps Domain cache key (plain string) to Infrastructure cache key (branded type).
   */
  private mapDomainKeyToInfrastructure(key: DomainCacheKey): CacheKey {
    return assertCacheKey(key);
  }

  /**
   * Maps Infrastructure cache key (branded type) to Domain cache key (plain string).
   */
  private mapInfrastructureKeyToDomain(key: CacheKey): DomainCacheKey {
    return key as DomainCacheKey;
  }

  /**
   * Maps Domain cache options to Infrastructure cache options.
   */
  private mapDomainOptionsToInfrastructure(
    options?: DomainCacheSetOptions
  ): CacheSetOptions | undefined {
    if (!options) return undefined;
    const result: CacheSetOptions = {};
    if (options.ttlMs !== undefined) {
      result.ttlMs = options.ttlMs;
    }
    if (options.tags !== undefined) {
      result.tags = options.tags;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  /**
   * Maps Infrastructure cache metadata to Domain cache metadata.
   */
  private mapInfrastructureMetadataToDomain(
    metadata: CacheEntryMetadata
  ): DomainCacheEntryMetadata {
    return {
      key: this.mapInfrastructureKeyToDomain(metadata.key),
      createdAt: metadata.createdAt,
      expiresAt: metadata.expiresAt,
      lastAccessedAt: metadata.lastAccessedAt,
      hits: metadata.hits,
      tags: metadata.tags,
    };
  }

  /**
   * Maps Infrastructure cache lookup result to Domain cache lookup result.
   */
  private mapInfrastructureLookupResultToDomain<T>(
    result: CacheLookupResult<T>
  ): DomainCacheLookupResult<T> {
    const domainResult: DomainCacheLookupResult<T> = {
      hit: result.hit,
      metadata: this.mapInfrastructureMetadataToDomain(result.metadata),
    };
    if (result.value !== undefined) {
      domainResult.value = result.value;
    }
    return domainResult;
  }

  /**
   * Maps Infrastructure cache statistics to Domain cache statistics.
   */
  private mapInfrastructureStatisticsToDomain(statistics: CacheStatistics): DomainCacheStatistics {
    return {
      hits: statistics.hits,
      misses: statistics.misses,
      evictions: statistics.evictions,
      size: statistics.size,
      enabled: statistics.enabled,
    };
  }

  /**
   * Maps Domain invalidation predicate to Infrastructure invalidation predicate.
   */
  private mapDomainPredicateToInfrastructure(
    predicate: DomainCacheInvalidationPredicate
  ): CacheInvalidationPredicate {
    return (entry: CacheEntryMetadata) => {
      const domainEntry = this.mapInfrastructureMetadataToDomain(entry);
      return predicate(domainEntry);
    };
  }

  get isEnabled(): boolean {
    return this.cacheService.isEnabled;
  }

  get size(): number {
    return this.cacheService.size;
  }

  get<TValue>(key: DomainCacheKey): DomainCacheLookupResult<TValue> | null {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    const result = this.cacheService.get<TValue>(infraKey);
    if (!result) return null;
    return this.mapInfrastructureLookupResultToDomain(result);
  }

  set<TValue>(
    key: DomainCacheKey,
    value: TValue,
    options?: DomainCacheSetOptions
  ): DomainCacheEntryMetadata {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    const infraOptions = this.mapDomainOptionsToInfrastructure(options);
    const metadata = this.cacheService.set(infraKey, value, infraOptions);
    return this.mapInfrastructureMetadataToDomain(metadata);
  }

  delete(key: DomainCacheKey): boolean {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    return this.cacheService.delete(infraKey);
  }

  has(key: DomainCacheKey): boolean {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    return this.cacheService.has(infraKey);
  }

  clear(): number {
    return this.cacheService.clear();
  }

  invalidateWhere(predicate: DomainCacheInvalidationPredicate): number {
    const infraPredicate = this.mapDomainPredicateToInfrastructure(predicate);
    return this.cacheService.invalidateWhere(infraPredicate);
  }

  getMetadata(key: DomainCacheKey): DomainCacheEntryMetadata | null {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    const metadata = this.cacheService.getMetadata(infraKey);
    if (!metadata) return null;
    return this.mapInfrastructureMetadataToDomain(metadata);
  }

  getStatistics(): DomainCacheStatistics {
    const statistics = this.cacheService.getStatistics();
    return this.mapInfrastructureStatisticsToDomain(statistics);
  }

  async getOrSet<TValue>(
    key: DomainCacheKey,
    factory: () => TValue | Promise<TValue>,
    options?: DomainCacheSetOptions
  ): Promise<Result<DomainCacheLookupResult<TValue>, string>> {
    const infraKey = this.mapDomainKeyToInfrastructure(key);
    const infraOptions = this.mapDomainOptionsToInfrastructure(options);
    const result = await this.cacheService.getOrSet(infraKey, factory, infraOptions);
    if (!result.ok) {
      return result;
    }
    return {
      ok: true,
      value: this.mapInfrastructureLookupResultToDomain(result.value),
    };
  }
}

/**
 * DI-enabled wrapper for CachePortAdapter.
 */
export class DICachePortAdapter extends CachePortAdapter {
  static dependencies = [cacheServiceToken] as const;

  constructor(cacheService: CacheService) {
    super(cacheService);
  }
}
