import type { CacheEvictionStrategy } from "./eviction-strategy.interface";

/**
 * Registry for cache eviction strategies.
 *
 * OCP-compliant: New strategies can be registered without modifying existing code.
 * The registry is open for extension but closed for modification.
 *
 * @example
 * ```typescript
 * const registry = EvictionStrategyRegistry.getInstance();
 * registry.register("lru", new LRUEvictionStrategy());
 * registry.register("fifo", new FIFOEvictionStrategy());
 *
 * const strategy = registry.get("lru"); // Returns LRU strategy
 * ```
 */
export class EvictionStrategyRegistry {
  private static instance: EvictionStrategyRegistry | null = null;
  private readonly strategies = new Map<string, CacheEvictionStrategy>();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Gets the singleton instance of the registry.
   *
   * @returns The singleton registry instance
   */
  static getInstance(): EvictionStrategyRegistry {
    if (!EvictionStrategyRegistry.instance) {
      EvictionStrategyRegistry.instance = new EvictionStrategyRegistry();
    }
    return EvictionStrategyRegistry.instance;
  }

  /**
   * Registers a strategy with the given key.
   *
   * If a strategy with the same key already exists, it will be replaced.
   * This allows for runtime strategy updates.
   *
   * @param key - Unique identifier for the strategy (e.g., "lru", "fifo", "lfu")
   * @param strategy - The strategy instance to register
   * @returns true if a strategy was replaced, false if it's a new registration
   */
  register(key: string, strategy: CacheEvictionStrategy): boolean {
    const wasReplaced = this.strategies.has(key);
    this.strategies.set(key, strategy);
    return wasReplaced;
  }

  /**
   * Gets a strategy by key.
   *
   * @param key - The strategy key
   * @returns The strategy if found, undefined otherwise
   */
  get(key: string): CacheEvictionStrategy | undefined {
    return this.strategies.get(key);
  }

  /**
   * Gets a strategy by key, or returns the default strategy if not found.
   *
   * @param key - The strategy key
   * @param defaultKey - The key of the default strategy to use if key is not found
   * @returns The strategy if found, the default strategy if defaultKey is found, undefined otherwise
   */
  getOrDefault(key: string | undefined, defaultKey: string): CacheEvictionStrategy | undefined {
    if (!key) {
      return this.get(defaultKey);
    }
    return this.get(key) ?? this.get(defaultKey);
  }

  /**
   * Checks if a strategy is registered.
   *
   * @param key - The strategy key
   * @returns true if the strategy is registered, false otherwise
   */
  has(key: string): boolean {
    return this.strategies.has(key);
  }

  /**
   * Unregisters a strategy.
   *
   * @param key - The strategy key to unregister
   * @returns true if a strategy was removed, false if it didn't exist
   */
  unregister(key: string): boolean {
    return this.strategies.delete(key);
  }

  /**
   * Gets all registered strategy keys.
   *
   * @returns Array of all registered strategy keys
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Clears all registered strategies.
   * Useful for testing or reset scenarios.
   */
  clear(): void {
    this.strategies.clear();
  }
}
