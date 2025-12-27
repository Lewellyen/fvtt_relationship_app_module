import { beforeEach, describe, expect, it } from "vitest";
import { CacheConfigSyncObserver } from "../CacheConfigSyncObserver";
import type { ICacheStore } from "../../store/cache-store.interface";
import type { CachePolicy } from "../../policy/cache-policy.interface";
import type { ICacheConfigManager } from "../cache-config-manager.interface";
import type { CacheServiceConfig } from "../../cache.interface";
import { CacheStore } from "../../store/CacheStore";
import { CachePolicy as CachePolicyImpl } from "../../policy/CachePolicy";
import { CacheCapacityManager } from "../../cache-capacity-manager";
import { LRUEvictionStrategy } from "../../lru-eviction-strategy";
import { CacheConfigManager } from "../CacheConfigManager";

describe("CacheConfigSyncObserver", () => {
  let store: ICacheStore;
  let policy: CachePolicy;
  let configManager: ICacheConfigManager;
  let observer: CacheConfigSyncObserver;

  beforeEach(() => {
    store = new CacheStore();
    const capacityManager = new CacheCapacityManager(new LRUEvictionStrategy(), store);
    policy = new CachePolicyImpl(capacityManager);
    configManager = new CacheConfigManager({
      enabled: true,
      defaultTtlMs: 1000,
      namespace: "test",
    });
    observer = new CacheConfigSyncObserver(store, policy, configManager);
  });

  it("clears store when config is disabled", () => {
    const config: CacheServiceConfig = {
      enabled: false,
      defaultTtlMs: 1000,
      namespace: "test",
    };

    observer.onConfigUpdated(config);

    expect(store.size).toBe(0);
  });

  it("enforces capacity when maxEntries changes", () => {
    // Add some entries to the store
    const key1 = "key1" as any;
    const key2 = "key2" as any;
    store.set(key1, { value: "value1", expiresAt: null, metadata: {} as any });
    store.set(key2, { value: "value2", expiresAt: null, metadata: {} as any });

    configManager.updateConfig({ maxEntries: 2 });
    const config: CacheServiceConfig = {
      enabled: true,
      defaultTtlMs: 1000,
      namespace: "test",
      maxEntries: 1, // Different from current config
    };

    observer.onConfigUpdated(config);

    // Capacity should be enforced (store size should be reduced)
    expect(store.size).toBeLessThanOrEqual(1);
  });

  it("does not enforce capacity when maxEntries is 0 (tests enforceCapacity early return)", () => {
    // Add some entries to the store
    const key1 = "key1" as any;
    store.set(key1, { value: "value1", expiresAt: null, metadata: {} as any });

    // Update current config to have maxEntries: 5
    configManager.updateConfig({ maxEntries: 5 });

    // Call with maxEntries: 0 - this should trigger enforceCapacity
    // But enforceCapacity will early return because !config.maxEntries is true (0 is falsy)
    const config: CacheServiceConfig = {
      enabled: true,
      defaultTtlMs: 1000,
      namespace: "test",
      maxEntries: 0, // This will cause enforceCapacity to early return on line 52
    };

    // This will call enforceCapacity with maxEntries: 0, which should early return
    observer.onConfigUpdated(config);

    // Should not throw and store should still have the entry (capacity not enforced)
    expect(store.size).toBe(1);
  });
});
