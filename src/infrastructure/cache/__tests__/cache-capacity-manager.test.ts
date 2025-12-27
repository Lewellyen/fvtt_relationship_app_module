import { describe, expect, it, vi } from "vitest";
import { CacheCapacityManager } from "../cache-capacity-manager";
import type { CacheEvictionStrategy, InternalCacheEntry } from "../eviction-strategy.interface";
import type { CacheKey } from "@/infrastructure/di/types/utilities/type-casts";
import { assertCacheKey } from "@/infrastructure/di/types/utilities/type-casts";
import { CacheStore } from "../store/CacheStore";

describe("CacheCapacityManager", () => {
  it("returns empty array when cache size is within limit", () => {
    const strategy = createMockStrategy([]);
    const store = new CacheStore();
    store.set(assertCacheKey("key1"), createEntry());
    store.set(assertCacheKey("key2"), createEntry());

    const manager = new CacheCapacityManager(strategy, store);
    const evicted = manager.enforceCapacity(5);

    expect(evicted).toEqual([]);
    expect(store.size).toBe(2);
  });

  it("evicts entries when cache exceeds limit", () => {
    const key1 = assertCacheKey("key1");
    const key2 = assertCacheKey("key2");
    const key3 = assertCacheKey("key3");
    const key4 = assertCacheKey("key4");
    const strategy = createMockStrategy([key1, key2]);
    const store = new CacheStore();
    store.set(key1, createEntry());
    store.set(key2, createEntry());
    store.set(key3, createEntry());
    store.set(key4, createEntry());

    const manager = new CacheCapacityManager(strategy, store);
    const evicted = manager.enforceCapacity(2);

    expect(evicted).toEqual([key1, key2]);
    expect(evicted.length).toBe(2);
    expect(store.size).toBe(2);
    expect(store.has(key1)).toBe(false);
    expect(store.has(key2)).toBe(false);
    expect(store.has(key3)).toBe(true);
    expect(store.has(key4)).toBe(true);
  });

  it("calls strategy with correct parameters", () => {
    const key1 = assertCacheKey("key1");
    const selectForEviction = vi.fn().mockReturnValue([key1]);
    const strategy = { selectForEviction };
    const store = new CacheStore();
    store.set(key1, createEntry());
    store.set(assertCacheKey("key2"), createEntry());
    store.set(assertCacheKey("key3"), createEntry());

    const manager = new CacheCapacityManager(strategy, store);
    manager.enforceCapacity(2);

    // Strategy receives a Map built from store entries
    expect(selectForEviction).toHaveBeenCalled();
    const callArgs = selectForEviction.mock.calls[0];
    expect(callArgs).toBeDefined();
    if (callArgs) {
      expect(callArgs[0]).toBeInstanceOf(Map);
      expect(callArgs[0].size).toBe(3);
      expect(callArgs[1]).toBe(2);
    }
  });

  it("handles empty eviction list from strategy", () => {
    const strategy = createMockStrategy([]);
    const store = new CacheStore();
    store.set(assertCacheKey("key1"), createEntry());
    store.set(assertCacheKey("key2"), createEntry());

    const manager = new CacheCapacityManager(strategy, store);
    const evicted = manager.enforceCapacity(1);

    expect(evicted).toEqual([]);
    expect(store.size).toBe(2);
  });
});

function createMockStrategy(keysToEvict: CacheKey[]): CacheEvictionStrategy {
  return {
    selectForEviction: vi.fn().mockReturnValue(keysToEvict),
  };
}

function createEntry(): InternalCacheEntry {
  return {
    value: "test",
    expiresAt: null,
    metadata: {
      key: "test-key" as CacheKey,
      createdAt: 0,
      expiresAt: null,
      lastAccessedAt: 0,
      hits: 0,
      tags: [],
    },
  };
}
