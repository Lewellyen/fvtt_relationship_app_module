import { describe, expect, it } from "vitest";
import { CacheStore } from "../CacheStore";
import type { CacheKey } from "../../cache.interface";
import { assertCacheKey } from "@/infrastructure/di/types/utilities/type-casts";
import type { InternalCacheEntry } from "../../eviction-strategy.interface";

describe("CacheStore", () => {
  it("stores and retrieves entries", () => {
    const store = new CacheStore();
    const key = assertCacheKey("test-key");
    const entry = createEntry(key);

    store.set(key, entry);
    const retrieved = store.get(key);

    expect(retrieved).toEqual(entry);
  });

  it("returns undefined for non-existent keys", () => {
    const store = new CacheStore();
    const key = assertCacheKey("non-existent");

    const retrieved = store.get(key);

    expect(retrieved).toBeUndefined();
  });

  it("deletes entries", () => {
    const store = new CacheStore();
    const key = assertCacheKey("test-key");
    const entry = createEntry(key);

    store.set(key, entry);
    const deleted = store.delete(key);

    expect(deleted).toBe(true);
    expect(store.get(key)).toBeUndefined();
  });

  it("returns false when deleting non-existent key", () => {
    const store = new CacheStore();
    const key = assertCacheKey("non-existent");

    const deleted = store.delete(key);

    expect(deleted).toBe(false);
  });

  it("checks if key exists", () => {
    const store = new CacheStore();
    const key = assertCacheKey("test-key");
    const entry = createEntry(key);

    expect(store.has(key)).toBe(false);

    store.set(key, entry);

    expect(store.has(key)).toBe(true);
  });

  it("clears all entries", () => {
    const store = new CacheStore();
    const key1 = assertCacheKey("key1");
    const key2 = assertCacheKey("key2");

    store.set(key1, createEntry(key1));
    store.set(key2, createEntry(key2));

    const cleared = store.clear();

    expect(cleared).toBe(2);
    expect(store.size).toBe(0);
    expect(store.has(key1)).toBe(false);
    expect(store.has(key2)).toBe(false);
  });

  it("tracks size correctly", () => {
    const store = new CacheStore();
    const key1 = assertCacheKey("key1");
    const key2 = assertCacheKey("key2");

    expect(store.size).toBe(0);

    store.set(key1, createEntry(key1));
    expect(store.size).toBe(1);

    store.set(key2, createEntry(key2));
    expect(store.size).toBe(2);

    store.delete(key1);
    expect(store.size).toBe(1);
  });

  it("iterates over entries", () => {
    const store = new CacheStore();
    const key1 = assertCacheKey("key1");
    const key2 = assertCacheKey("key2");
    const entry1 = createEntry(key1);
    const entry2 = createEntry(key2);

    store.set(key1, entry1);
    store.set(key2, entry2);

    const entries = Array.from(store.entries());

    expect(entries).toHaveLength(2);
    expect(entries).toContainEqual([key1, entry1]);
    expect(entries).toContainEqual([key2, entry2]);
  });
});

function createEntry(key: CacheKey): InternalCacheEntry {
  return {
    value: "test-value",
    expiresAt: null,
    metadata: {
      key,
      createdAt: 0,
      expiresAt: null,
      lastAccessedAt: 0,
      hits: 0,
      tags: [],
    },
  };
}
