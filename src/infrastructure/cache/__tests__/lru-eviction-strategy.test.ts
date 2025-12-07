import { describe, expect, it } from "vitest";
import { LRUEvictionStrategy } from "../lru-eviction-strategy";
import type { InternalCacheEntry } from "../eviction-strategy.interface";
import type { CacheKey } from "../cache.interface";
import { assertCacheKey } from "@/infrastructure/di/types/utilities/type-casts";

describe("LRUEvictionStrategy", () => {
  it("returns empty array when cache size is within limit", () => {
    const strategy = new LRUEvictionStrategy();
    const entries = new Map<CacheKey, InternalCacheEntry>();
    entries.set(assertCacheKey("key1"), createEntry(1000));
    entries.set(assertCacheKey("key2"), createEntry(2000));

    const result = strategy.selectForEviction(entries, 5);

    expect(result).toEqual([]);
  });

  it("selects oldest entries first (LRU)", () => {
    const strategy = new LRUEvictionStrategy();
    const key1 = assertCacheKey("key1");
    const entries = new Map<CacheKey, InternalCacheEntry>();
    entries.set(key1, createEntry(1000)); // Oldest
    entries.set(assertCacheKey("key2"), createEntry(2000));
    entries.set(assertCacheKey("key3"), createEntry(3000)); // Newest

    const result = strategy.selectForEviction(entries, 2);

    expect(result).toEqual([key1]);
  });

  it("selects multiple entries when needed", () => {
    const strategy = new LRUEvictionStrategy();
    const key1 = assertCacheKey("key1");
    const key2 = assertCacheKey("key2");
    const entries = new Map<CacheKey, InternalCacheEntry>();
    entries.set(key1, createEntry(1000)); // Oldest
    entries.set(key2, createEntry(2000));
    entries.set(assertCacheKey("key3"), createEntry(3000));
    entries.set(assertCacheKey("key4"), createEntry(4000)); // Newest

    const result = strategy.selectForEviction(entries, 2);

    expect(result).toEqual([key1, key2]);
  });

  it("handles entries with same lastAccessedAt", () => {
    const strategy = new LRUEvictionStrategy();
    const key1 = assertCacheKey("key1");
    const key2 = assertCacheKey("key2");
    const entries = new Map<CacheKey, InternalCacheEntry>();
    entries.set(key1, createEntry(1000));
    entries.set(key2, createEntry(1000)); // Same timestamp

    const result = strategy.selectForEviction(entries, 1);

    expect(result.length).toBe(1);
    expect([key1, key2]).toContain(result[0]);
  });

  it("returns empty array when toRemove is zero or negative", () => {
    const strategy = new LRUEvictionStrategy();
    const key1 = assertCacheKey("key1");
    const entries = new Map<CacheKey, InternalCacheEntry>();
    entries.set(key1, createEntry(1000));

    // When maxEntries >= entries.size, no eviction needed
    expect(strategy.selectForEviction(entries, 1)).toEqual([]);
    expect(strategy.selectForEviction(entries, 2)).toEqual([]);

    // When maxEntries is 0 and entries.size is 1, toRemove = 1 - 0 = 1, so one entry should be evicted
    // This is correct behavior - if maxEntries is 0, all entries should be evicted
    const result = strategy.selectForEviction(entries, 0);
    expect(result.length).toBe(1);
    expect(result).toContain(key1);
  });
});

function createEntry(lastAccessedAt: number): InternalCacheEntry {
  return {
    value: "test",
    expiresAt: null,
    metadata: {
      key: "test-key" as CacheKey,
      createdAt: 0,
      expiresAt: null,
      lastAccessedAt,
      hits: 0,
      tags: [],
    },
  };
}
