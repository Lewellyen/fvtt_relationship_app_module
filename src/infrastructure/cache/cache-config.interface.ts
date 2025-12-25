/**
 * Configuration used to instantiate CacheService.
 * Separated into its own file to avoid circular dependencies.
 */
export interface CacheServiceConfig {
  enabled: boolean;
  defaultTtlMs: number;
  maxEntries?: number | undefined;
  namespace?: string;
  /**
   * Optional key for the eviction strategy to use.
   * If not provided, defaults to "lru".
   * Strategies must be registered in EvictionStrategyRegistry before use.
   */
  evictionStrategyKey?: string;
}
