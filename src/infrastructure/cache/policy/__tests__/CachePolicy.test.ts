import { describe, expect, it } from "vitest";
import { CachePolicy } from "../CachePolicy";
import { CacheCapacityManager } from "../../cache-capacity-manager";
import { CacheStore } from "../../store/CacheStore";
import { LRUEvictionStrategy } from "../../lru-eviction-strategy";
import type { CacheServiceConfig } from "../../cache-config.interface";

describe("CachePolicy", () => {
  it("shouldExpire returns false when expiresAt is null", () => {
    const store = new CacheStore();
    const strategy = new LRUEvictionStrategy();
    const capacityManager = new CacheCapacityManager(strategy, store);
    const policy = new CachePolicy(capacityManager);

    const result = policy.shouldExpire(null, 1000);

    expect(result).toBe(false);
  });

  it("shouldExpire returns true when entry is expired", () => {
    const store = new CacheStore();
    const strategy = new LRUEvictionStrategy();
    const capacityManager = new CacheCapacityManager(strategy, store);
    const policy = new CachePolicy(capacityManager);

    const result = policy.shouldExpire(500, 1000);

    expect(result).toBe(true);
  });

  it("shouldExpire returns false when entry is not expired", () => {
    const store = new CacheStore();
    const strategy = new LRUEvictionStrategy();
    const capacityManager = new CacheCapacityManager(strategy, store);
    const policy = new CachePolicy(capacityManager);

    const result = policy.shouldExpire(2000, 1000);

    expect(result).toBe(false);
  });

  it("enforceCapacity returns empty array when size is within limit", () => {
    const store = new CacheStore();
    const strategy = new LRUEvictionStrategy();
    const capacityManager = new CacheCapacityManager(strategy, store);
    const policy = new CachePolicy(capacityManager);

    const config: CacheServiceConfig = {
      enabled: true,
      defaultTtlMs: 1000,
      namespace: "test",
      maxEntries: 10,
    };

    const evicted = policy.enforceCapacity(5, config);

    expect(evicted).toEqual([]);
  });

  it("enforceCapacity returns empty array when maxEntries is undefined", () => {
    const store = new CacheStore();
    const strategy = new LRUEvictionStrategy();
    const capacityManager = new CacheCapacityManager(strategy, store);
    const policy = new CachePolicy(capacityManager);

    const config: CacheServiceConfig = {
      enabled: true,
      defaultTtlMs: 1000,
      namespace: "test",
    };

    const evicted = policy.enforceCapacity(100, config);

    expect(evicted).toEqual([]);
  });
});
