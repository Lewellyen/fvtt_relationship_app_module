import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CacheService,
  DICacheService,
  DEFAULT_CACHE_SERVICE_CONFIG,
} from "@/infrastructure/cache/CacheService";
import type { CacheKey, CacheServiceConfig } from "@/infrastructure/cache/cache.interface";
import { createCacheNamespace } from "@/infrastructure/cache/cache.interface";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { cacheServiceConfigToken } from "@/infrastructure/shared/tokens/infrastructure/cache-service-config.token";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { EvictionStrategyRegistry } from "@/infrastructure/cache/eviction-strategy-registry";
import { CacheConfigSyncObserver } from "@/infrastructure/cache/config/CacheConfigSyncObserver";
import { CacheService as CacheServiceImpl } from "@/infrastructure/cache/CacheService";
import { CacheStore } from "@/infrastructure/cache/store/CacheStore";
import { CacheCapacityManager } from "@/infrastructure/cache/cache-capacity-manager";
import { LRUEvictionStrategy } from "@/infrastructure/cache/lru-eviction-strategy";

const buildCacheKey = createCacheNamespace("journal", MODULE_METADATA.ID);

describe("CacheService", () => {
  let now: number;
  let metrics: MetricsCollector;
  let service: CacheService;

  const createService = (config?: Partial<CacheServiceConfig>): CacheService => {
    const namespace = config?.namespace ?? DEFAULT_CACHE_SERVICE_CONFIG.namespace ?? "test-cache";
    const merged: CacheServiceConfig = {
      enabled: config?.enabled ?? DEFAULT_CACHE_SERVICE_CONFIG.enabled,
      defaultTtlMs: config?.defaultTtlMs ?? DEFAULT_CACHE_SERVICE_CONFIG.defaultTtlMs,
      namespace,
      ...(config?.maxEntries !== undefined ? { maxEntries: config.maxEntries } : {}),
    };
    service = new CacheService(merged, metrics, () => now);
    return service;
  };

  beforeEach(() => {
    now = 1_000;
    metrics = {
      recordCacheAccess: vi.fn(),
    } as unknown as MetricsCollector;
    createService();
  });

  it("returns cached values within TTL", () => {
    const key = buildCacheKey("hidden");

    service.set(key, ["entry-1"]);
    const result = service.get<string[]>(key);

    expect(result).not.toBeNull();
    expect(result?.hit).toBe(true);
    expect(result?.value).toEqual(["entry-1"]);
    expect(result?.metadata.hits).toBe(1);
    expect(metrics.recordCacheAccess).toHaveBeenCalledWith(true);
  });

  it("evicts entries after TTL expires", () => {
    const key = buildCacheKey("hidden");

    service.set(key, ["entry-1"], { ttlMs: 500 });

    now += 600;
    const result = service.get<string[]>(key);

    expect(result).toBeNull();
    expect(metrics.recordCacheAccess).toHaveBeenCalledWith(false);
    expect(service.size).toBe(0);
  });

  it("getOrSet caches factory results", async () => {
    const key = buildCacheKey("hidden");
    const factory = vi.fn().mockResolvedValue(["entry-1"]);

    const firstResult = await service.getOrSet(key, factory);
    const secondResult = await service.getOrSet(key, factory);

    expect(firstResult.ok).toBe(true);
    if (firstResult.ok) {
      expect(firstResult.value.hit).toBe(false);
    }
    expect(secondResult.ok).toBe(true);
    if (secondResult.ok) {
      expect(secondResult.value.hit).toBe(true);
    }
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("getOrSet returns error when factory fails", async () => {
    const key = buildCacheKey("hidden");
    const factory = vi.fn().mockRejectedValue(new Error("Factory error"));

    const result = await service.getOrSet(key, factory);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Factory failed");
      expect(result.error).toContain("Factory error");
    }
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("getOrSet returns error when factory throws synchronously", async () => {
    const key = buildCacheKey("hidden");
    const factory = vi.fn().mockImplementation(() => {
      throw new Error("Sync error");
    });

    const result = await service.getOrSet(key, factory);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Factory failed");
      expect(result.error).toContain("Sync error");
    }
  });

  it("getOrSet handles synchronous factory that returns value (not Promise)", async () => {
    const key = buildCacheKey("sync-value");
    const factory = vi.fn().mockReturnValue("synchronous-value");

    const result = await service.getOrSet(key, factory);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("synchronous-value");
      expect(result.value.hit).toBe(false);
    }
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("invalidates entries matching predicate", () => {
    const keyA = buildCacheKey("hidden", "a");
    const keyB = buildCacheKey("hidden", "b");

    service.set(keyA, ["a"], { tags: ["journal", "hidden"] });
    service.set(keyB, ["b"], { tags: ["journal"] });

    const removed = service.invalidateWhere((meta) => meta.tags.includes("hidden"));

    expect(removed).toBe(1);
    expect(service.has(keyA)).toBe(false);
    expect(service.has(keyB)).toBe(true);
  });

  it("invalidateWhere returns zero when no entries match predicate", () => {
    const keyA = buildCacheKey("hidden", "a");
    const keyB = buildCacheKey("hidden", "b");

    service.set(keyA, ["a"], { tags: ["journal"] });
    service.set(keyB, ["b"], { tags: ["journal"] });

    // No entries match this predicate
    const removed = service.invalidateWhere((meta) => meta.tags.includes("nonexistent"));

    expect(removed).toBe(0);
    expect(service.has(keyA)).toBe(true);
    expect(service.has(keyB)).toBe(true);
    // Should not increment evictions when removed = 0 (line 176)
    expect(service.getStatistics().evictions).toBe(0);
  });

  it("invalidateWhere handles race condition where key is deleted before eviction", () => {
    const keyA = buildCacheKey("race", "a");
    const keyB = buildCacheKey("race", "b");

    service.set(keyA, ["a"], { tags: ["test"] });
    service.set(keyB, ["b"], { tags: ["test"] });

    // Simulate race condition: keyA is in keysToEvict, but gets deleted between
    // the predicate check and the actual delete() call (line 186: if (this.store.delete(key)))
    const internal = service as unknown as {
      store: Map<CacheKey, unknown>;
    };

    // Mock store.delete to return false for keyA (simulating it was already deleted)
    const originalDelete = internal.store.delete.bind(internal.store);
    let deleteCallCount = 0;
    const mockDelete = vi.fn((key: CacheKey) => {
      deleteCallCount++;
      // On first delete call (keyA), return false to simulate race condition
      if (deleteCallCount === 1 && key === keyA) {
        return false;
      }
      return originalDelete(key);
    });
    internal.store.delete = mockDelete as typeof originalDelete;

    const removed = service.invalidateWhere((meta) => meta.tags.includes("test"));

    // keyA delete returned false (race condition), so only keyB should be removed
    expect(removed).toBe(1);
    expect(mockDelete).toHaveBeenCalledTimes(2); // keyA and keyB
    expect(service.has(keyB)).toBe(false); // Was removed by invalidateWhere
    // keyA still exists because delete() returned false
    expect(service.has(keyA)).toBe(true);
  });

  it("applies basic LRU eviction when maxEntries exceeded", () => {
    createService({ maxEntries: 1 });
    const keyA = buildCacheKey("hidden", "a");
    const keyB = buildCacheKey("hidden", "b");

    service.set(keyA, ["a"]);
    service.set(keyB, ["b"]);

    expect(service.has(keyA)).toBe(false);
    expect(service.has(keyB)).toBe(true);
  });

  // Note: enforceCapacity is now handled internally by CachePolicy
  // This test is no longer applicable as it tested internal implementation details

  // Note: enforceCapacity is now handled internally by CachePolicy
  // This test is no longer applicable as it tested internal implementation details

  it("honors disabled configuration", () => {
    createService({ enabled: false });
    const key = buildCacheKey("hidden");

    service.set(key, ["entry"]);
    const result = service.get<string[]>(key);

    expect(result).toBeNull();
    expect(service.size).toBe(0);
  });

  it("returns metadata clone and handles expiration cleanup", () => {
    const key = buildCacheKey("meta");

    service.set(key, ["entry"], { ttlMs: 100, tags: ["hidden", "hidden"] });
    const metadata = service.getMetadata(key);

    expect(metadata?.tags).toEqual(["hidden"]);
    const copiedTags = metadata ? [...metadata.tags, "mutated"] : [];
    expect(metadata?.tags).toEqual(["hidden"]);
    expect(copiedTags).toEqual(["hidden", "mutated"]);
    expect(service.getMetadata(key)?.tags).toEqual(["hidden"]);

    now += 200;
    expect(service.getMetadata(key)).toBeNull();
    expect(service.getStatistics().evictions).toBe(1);
  });

  it("handleExpiration does not increment evictions when key was already deleted", () => {
    // This tests that getMetadata() doesn't increment evictions when an expired entry
    // is already deleted (race condition)
    const key = buildCacheKey("expired-but-deleted");

    // Set an entry that will expire
    service.set(key, ["entry"], { ttlMs: 100 });

    // Advance time to expire the entry
    now += 200;

    // Manually delete the key before getMetadata() is called (simulating race condition)
    // This ensures that when handleExpiration is called, delete() returns false
    const internal = service as unknown as {
      store: { delete: (key: CacheKey) => boolean };
    };

    // Delete the key manually
    internal.store.delete(key);

    const initialEvictions = service.getStatistics().evictions;

    // Call getMetadata - it should try to handle expiration, but key is already gone
    // Should not increment evictions when delete returns false
    service.getMetadata(key);

    // Should not increment evictions when delete returns false
    expect(service.getStatistics().evictions).toBe(initialEvictions);
  });

  it("getMetadata does not increment evictions when handleExpiration returns false", () => {
    // This tests the branch in getMetadata() where wasRemoved is false
    const key = buildCacheKey("expired-entry");

    // Set an entry that will expire
    service.set(key, ["entry"], { ttlMs: 100 });

    // Advance time to expire the entry
    now += 200;

    // Mock the store to return false on delete (simulating race condition)
    const internal = service as unknown as {
      store: { delete: (key: CacheKey) => boolean; get: (key: CacheKey) => unknown };
      expirationManager: { handleExpiration: (key: CacheKey, store: unknown) => boolean };
    };

    // Store the original delete method
    const originalDelete = internal.store.delete;
    const originalHandleExpiration = internal.expirationManager.handleExpiration;

    // Mock delete to return false
    internal.store.delete = vi.fn().mockReturnValue(false);
    internal.expirationManager.handleExpiration = vi.fn().mockReturnValue(false);

    const initialEvictions = service.getStatistics().evictions;

    // Call getMetadata - it should try to handle expiration, but delete returns false
    const result = service.getMetadata(key);

    // Should return null for expired entry
    expect(result).toBeNull();
    // Should not increment evictions when handleExpiration returns false
    expect(service.getStatistics().evictions).toBe(initialEvictions);

    // Restore original methods
    internal.store.delete = originalDelete;
    internal.expirationManager.handleExpiration = originalHandleExpiration;
  });

  it("clears cache and increments evictions", () => {
    const keyA = buildCacheKey("clear", "a");
    const keyB = buildCacheKey("clear", "b");
    service.set(keyA, ["a"]);
    service.set(keyB, ["b"]);

    const removed = service.clear();

    expect(removed).toBe(2);
    expect(service.getStatistics().evictions).toBe(2);
    expect(service.size).toBe(0);
  });

  it("clear returns zero and does not increment evictions when cache is empty", () => {
    // Cache is already empty from beforeEach
    const removed = service.clear();

    expect(removed).toBe(0);
    // Should not increment evictions when removed = 0 (line 369)
    expect(service.getStatistics().evictions).toBe(0);
  });

  it("deletes entries and tracks evictions", () => {
    createService();
    const key = buildCacheKey("delete");
    service.set(key, ["entry"]);

    const removed = service.delete(key);

    expect(removed).toBe(true);
    expect(service.getStatistics().evictions).toBe(1);
    expect(service.delete(key)).toBe(false);
  });

  it("delete returns false when cache disabled", () => {
    createService({ enabled: false });
    expect(service.delete(buildCacheKey("delete-disabled"))).toBe(false);
  });

  it("clear returns zero when disabled", () => {
    createService({ enabled: false });
    expect(service.clear()).toBe(0);
  });

  it("invalidateWhere returns zero when disabled", () => {
    createService({ enabled: false });
    const removed = service.invalidateWhere(() => true);
    expect(removed).toBe(0);
  });

  it("has returns false when cache disabled", () => {
    createService({ enabled: false });
    expect(service.has(buildCacheKey("has-disabled"))).toBe(false);
  });

  it("has checks cache without mutating hits", () => {
    const key = buildCacheKey("has");
    service.set(key, ["entry"]);

    expect(service.has(key)).toBe(true);
    expect(service.getMetadata(key)?.hits).toBe(0);
  });

  it("has returns false for expired entries", () => {
    const key = buildCacheKey("expired-has");
    service.set(key, ["entry"], { ttlMs: 100 });

    now += 200;
    expect(service.has(key)).toBe(false);
    expect(service.getStatistics().evictions).toBe(1);
  });

  it("getMetadata returns null when disabled or entry missing", () => {
    createService({ enabled: false });
    expect(service.getMetadata(buildCacheKey("meta-disabled"))).toBeNull();

    createService();
    expect(service.getMetadata(buildCacheKey("missing"))).toBeNull();
  });

  it("supports ttl clamping and tag normalization", () => {
    const key = buildCacheKey("clamp");
    const metadata = service.set(key, ["entry"], { ttlMs: -10, tags: ["A", "a"] });

    expect(metadata.expiresAt).toBeNull();
    expect(metadata.tags).toEqual(["A", "a"]);
  });

  it("updates config via CacheConfigSyncObserver (Observer Pattern)", () => {
    const dynamicCache = new CacheService(
      {
        enabled: true,
        defaultTtlMs: 1000,
        namespace: "dynamic",
        maxEntries: 2,
      },
      metrics,
      () => now
    );

    const keyA = buildCacheKey("dynamic", "a");
    const keyB = buildCacheKey("dynamic", "b");
    const configManager = dynamicCache.getConfigManager();

    // Create observer with components from CacheService
    const cacheImpl = dynamicCache as CacheServiceImpl;
    const observer = new CacheConfigSyncObserver(
      cacheImpl.getStore(),
      cacheImpl.getPolicy(),
      configManager
    );

    dynamicCache.set(keyA, ["entry-a"]);
    configManager.updateConfig({ enabled: false });
    observer.onConfigUpdated(configManager.getConfig());
    expect(dynamicCache.isEnabled).toBe(false);
    expect(dynamicCache.get<string[]>(keyA)).toBeNull();

    configManager.updateConfig({ enabled: true });
    observer.onConfigUpdated(configManager.getConfig());
    dynamicCache.set(keyA, ["entry-a"]);
    expect(dynamicCache.get<string[]>(keyA)).not.toBeNull();

    configManager.updateConfig({ defaultTtlMs: 50 });
    observer.onConfigUpdated(configManager.getConfig());
    dynamicCache.set(keyA, ["entry-ttl"]);
    now += 100;
    expect(dynamicCache.get<string[]>(keyA)).toBeNull();

    // Test maxEntries change that triggers enforceCapacity
    // First, add entries to exceed the new limit
    dynamicCache.set(keyA, ["entry-a"]);
    dynamicCache.set(keyB, ["entry-b"]);
    expect(dynamicCache.size).toBe(2);

    // Now change maxEntries to 1 - this should trigger enforceCapacity
    configManager.updateConfig({ maxEntries: 1 });
    observer.onConfigUpdated(configManager.getConfig());

    // Capacity should be enforced
    dynamicCache.set(keyA, ["entry-a-new"]);
    dynamicCache.set(keyB, ["entry-b-new"]);
    expect(dynamicCache.has(keyA)).toBe(false);
    expect(dynamicCache.has(keyB)).toBe(true);

    // When cacheMaxEntries is set to undefined, the config should drop the maxEntries setting
    configManager.updateConfig({ maxEntries: undefined });
    observer.onConfigUpdated(configManager.getConfig());
    dynamicCache.set(keyA, ["entry-reset-a"]);
    dynamicCache.set(keyB, ["entry-reset-b"]);
    // Both should be present now (no limit)
    expect(dynamicCache.has(keyA)).toBe(true);
    expect(dynamicCache.has(keyB)).toBe(true);
  });

  it("CacheConfigSyncObserver handles config update without maxEntries", () => {
    const dynamicCache = new CacheService(
      {
        enabled: true,
        defaultTtlMs: 1000,
        namespace: "test-no-max",
      },
      metrics,
      () => now
    );

    const configManager = dynamicCache.getConfigManager();
    const cacheImpl = dynamicCache as CacheServiceImpl;
    const observer = new CacheConfigSyncObserver(
      cacheImpl.getStore(),
      cacheImpl.getPolicy(),
      configManager
    );

    // Update config without maxEntries - should not throw and should not call enforceCapacity
    configManager.updateConfig({ enabled: true, defaultTtlMs: 2000 });
    observer.onConfigUpdated(configManager.getConfig());

    // Should still work
    expect(dynamicCache.isEnabled).toBe(true);
  });

  it("calls enforceCapacity when maxEntries changes in CacheConfigSyncObserver", () => {
    // Create a cache with maxEntries: 10 to allow adding entries without immediate eviction
    const cache = new CacheService(
      {
        enabled: true,
        defaultTtlMs: 1000,
        namespace: "test",
        maxEntries: 10,
      },
      metrics,
      () => now
    );

    const keyA = buildCacheKey("enforce", "a");
    const keyB = buildCacheKey("enforce", "b");
    const keyC = buildCacheKey("enforce", "c");

    // Add entries
    cache.set(keyA, ["a"]);
    cache.set(keyB, ["b"]);
    cache.set(keyC, ["c"]);
    expect(cache.size).toBe(3);

    // Get the configManager and update it to have maxEntries: 2
    const configManager = cache.getConfigManager();
    configManager.updateConfig({ maxEntries: 2 });

    // Create observer with components from CacheService
    const cacheImpl = cache as CacheServiceImpl;
    const observer = new CacheConfigSyncObserver(
      cacheImpl.getStore(),
      cacheImpl.getPolicy(),
      configManager
    );

    // Now call onConfigUpdated with maxEntries: 1, which is different from current (2)
    // This should trigger the branch: config.maxEntries (1) !== currentConfig.maxEntries (2)
    observer.onConfigUpdated({
      enabled: true,
      defaultTtlMs: 1000,
      namespace: "test",
      maxEntries: 1, // Different from current config's maxEntries: 2
    });

    // Verify that enforceCapacity was called by checking that cache size was reduced
    // enforceCapacity uses configManager.getConfig() which returns maxEntries: 2
    // So the cache should have at most 2 entries after enforcement
    expect(cache.size).toBeLessThanOrEqual(2);
  });

  it("DI wrapper exposes dependencies and forwards constructor args", () => {
    const wrapper = new DICacheService(
      {
        enabled: true,
        defaultTtlMs: 1,
        namespace: "test",
      },
      metrics
    );

    expect(wrapper.isEnabled).toBe(true);
    expect(DICacheService.dependencies).toEqual([cacheServiceConfigToken, metricsCollectorToken]);
  });

  it("falls back to default clock when none provided", () => {
    const defaulted = new CacheService(
      {
        enabled: true,
        defaultTtlMs: 5,
        namespace: "test",
      },
      metrics
    );

    const key = buildCacheKey("default-clock");
    defaulted.set(key, ["entry"]);
    // Verify entry exists by getting it first
    const result = defaulted.get<string[]>(key);
    expect(result).not.toBeNull();
    expect(result?.value).toEqual(["entry"]);
    // Now check metadata
    expect(defaulted.getMetadata(key)).not.toBeNull();
  });

  it("exposes cache statistics", () => {
    const key = buildCacheKey("hidden");

    service.get<string[]>(key);
    service.set(key, ["entry"]);
    service.get<string[]>(key);
    service.delete(key);

    const stats = service.getStatistics();

    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.evictions).toBe(1);
  });

  // Note: capacityManager is now encapsulated in CachePolicy
  // This test is no longer applicable as it tested internal implementation details
  // The functionality is still available through the public API (set/get operations)

  it("uses provided capacityManager when passed as constructor parameter", () => {
    // Create a custom capacity manager using the same store that CacheService will use
    // We need to create the store first, then pass it to both CacheService and capacityManager
    const customStore = new CacheStore();
    const customStrategy = new LRUEvictionStrategy();
    const customCapacityManager = new CacheCapacityManager(customStrategy, customStore);

    const config: CacheServiceConfig = {
      enabled: true,
      defaultTtlMs: 1000,
      namespace: "test-custom-manager",
      maxEntries: 2,
    };

    // Pass the custom capacity manager AND the store to the constructor
    // This tests the branch where capacityManager is provided (line 87: if (!resolvedCapacityManager))
    const serviceWithCustomManager = new CacheService(
      config,
      metrics,
      () => now,
      customCapacityManager,
      undefined, // metricsObserver
      customStore // store - must match the one used by capacityManager
    );

    // Verify the custom manager is being used by testing eviction behavior
    const keyA = buildCacheKey("custom", "a");
    const keyB = buildCacheKey("custom", "b");
    const keyC = buildCacheKey("custom", "c");

    serviceWithCustomManager.set(keyA, ["a"]);
    serviceWithCustomManager.set(keyB, ["b"]);
    serviceWithCustomManager.set(keyC, ["c"]); // Should trigger eviction

    // With maxEntries: 2, only 2 entries should remain
    expect(serviceWithCustomManager.size).toBeLessThanOrEqual(2);
  });

  it("should fallback to LRU strategy when getOrDefault returns undefined", () => {
    const registry = EvictionStrategyRegistry.getInstance();

    // Mock getOrDefault to return undefined (simulating both key and defaultKey not found)
    // This tests the defensive fallback path in CacheService constructor
    vi.spyOn(registry, "getOrDefault").mockReturnValue(undefined);

    const config: CacheServiceConfig = {
      enabled: true,
      defaultTtlMs: 1000,
      namespace: "test-fallback",
      maxEntries: 1,
      evictionStrategyKey: "non-existent-strategy",
    };

    // Should not throw and should fallback to creating LRU strategy directly
    const service = new CacheService(config, metrics, () => now);

    const key1 = buildCacheKey("fallback", "1");
    const key2 = buildCacheKey("fallback", "2");

    service.set(key1, ["value1"]);
    service.set(key2, ["value2"]); // Should trigger eviction with fallback LRU

    expect(service.size).toBeLessThanOrEqual(1);

    // Restore original method
    vi.spyOn(registry, "getOrDefault").mockRestore();
  });
});
