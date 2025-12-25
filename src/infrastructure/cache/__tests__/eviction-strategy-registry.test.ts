import { describe, it, expect, beforeEach } from "vitest";
import { EvictionStrategyRegistry } from "../eviction-strategy-registry";
import { LRUEvictionStrategy } from "../lru-eviction-strategy";
import type { CacheEvictionStrategy } from "../eviction-strategy.interface";
import type { CacheKey } from "../cache.interface";
import type { InternalCacheEntry } from "../eviction-strategy.interface";

describe("EvictionStrategyRegistry", () => {
  let registry: EvictionStrategyRegistry;

  beforeEach(() => {
    registry = EvictionStrategyRegistry.getInstance();
    registry.clear();
  });

  it("should return the same singleton instance", () => {
    const instance1 = EvictionStrategyRegistry.getInstance();
    const instance2 = EvictionStrategyRegistry.getInstance();

    expect(instance1).toBe(instance2);
  });

  it("should register a strategy", () => {
    const strategy = new LRUEvictionStrategy();
    const wasReplaced = registry.register("lru", strategy);

    expect(wasReplaced).toBe(false);
    expect(registry.has("lru")).toBe(true);
    expect(registry.get("lru")).toBe(strategy);
  });

  it("should replace an existing strategy", () => {
    const strategy1 = new LRUEvictionStrategy();
    const strategy2 = new LRUEvictionStrategy();

    registry.register("lru", strategy1);
    const wasReplaced = registry.register("lru", strategy2);

    expect(wasReplaced).toBe(true);
    expect(registry.get("lru")).toBe(strategy2);
  });

  it("should return undefined for non-existent strategy", () => {
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("should return default strategy when key is not found", () => {
    const defaultStrategy = new LRUEvictionStrategy();
    registry.register("lru", defaultStrategy);

    const result = registry.getOrDefault("nonexistent", "lru");

    expect(result).toBe(defaultStrategy);
  });

  it("should return undefined when key and default are not found", () => {
    const result = registry.getOrDefault("nonexistent", "also-nonexistent");

    expect(result).toBeUndefined();
  });

  it("should return strategy when key exists", () => {
    const strategy = new LRUEvictionStrategy();
    registry.register("lru", strategy);

    const result = registry.getOrDefault("lru", "fifo");

    expect(result).toBe(strategy);
  });

  it("should return undefined for undefined key with default", () => {
    const defaultStrategy = new LRUEvictionStrategy();
    registry.register("lru", defaultStrategy);

    const result = registry.getOrDefault(undefined, "lru");

    expect(result).toBe(defaultStrategy);
  });

  it("should check if strategy exists", () => {
    expect(registry.has("lru")).toBe(false);

    registry.register("lru", new LRUEvictionStrategy());

    expect(registry.has("lru")).toBe(true);
  });

  it("should unregister a strategy", () => {
    registry.register("lru", new LRUEvictionStrategy());

    const wasRemoved = registry.unregister("lru");

    expect(wasRemoved).toBe(true);
    expect(registry.has("lru")).toBe(false);
  });

  it("should return false when unregistering non-existent strategy", () => {
    const wasRemoved = registry.unregister("nonexistent");

    expect(wasRemoved).toBe(false);
  });

  it("should return all registered keys", () => {
    registry.register("lru", new LRUEvictionStrategy());
    registry.register("fifo", new LRUEvictionStrategy());
    registry.register("lfu", new LRUEvictionStrategy());

    const keys = registry.getRegisteredKeys();

    expect(keys).toHaveLength(3);
    expect(keys).toContain("lru");
    expect(keys).toContain("fifo");
    expect(keys).toContain("lfu");
  });

  it("should return empty array when no strategies are registered", () => {
    const keys = registry.getRegisteredKeys();

    expect(keys).toHaveLength(0);
  });

  it("should clear all registered strategies", () => {
    registry.register("lru", new LRUEvictionStrategy());
    registry.register("fifo", new LRUEvictionStrategy());

    registry.clear();

    expect(registry.getRegisteredKeys()).toHaveLength(0);
    expect(registry.has("lru")).toBe(false);
    expect(registry.has("fifo")).toBe(false);
  });

  it("should allow multiple different strategies", () => {
    class CustomStrategy implements CacheEvictionStrategy {
      selectForEviction(
        _entries: Map<CacheKey, InternalCacheEntry>,
        _maxEntries: number
      ): CacheKey[] {
        return [];
      }
    }

    const lruStrategy = new LRUEvictionStrategy();
    const customStrategy = new CustomStrategy();

    registry.register("lru", lruStrategy);
    registry.register("custom", customStrategy);

    expect(registry.get("lru")).toBe(lruStrategy);
    expect(registry.get("custom")).toBe(customStrategy);
  });
});
