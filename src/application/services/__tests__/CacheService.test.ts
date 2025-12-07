import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CacheService,
  DICacheService,
  DEFAULT_CACHE_SERVICE_CONFIG,
} from "@/infrastructure/cache/CacheService";
import type {
  CacheEntryMetadata,
  CacheKey,
  CacheServiceConfig,
} from "@/infrastructure/cache/cache.interface";
import { createCacheNamespace } from "@/infrastructure/cache/cache.interface";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability.tokens";
import { cacheServiceConfigToken } from "@/infrastructure/shared/tokens/infrastructure.tokens";
import { runtimeConfigToken } from "@/infrastructure/shared/tokens/core.tokens";
import { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { LogLevel } from "@/domain/types/log-level";
import { MODULE_METADATA } from "@/application/constants/app-constants";

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

  it("enforceCapacity handles case where no evictions are needed (evicted === 0)", () => {
    // To test the branch where evicted === 0 (line 284), we need to mock
    // the capacityManager to return 0 even when size > maxEntries
    createService({ maxEntries: 1 });
    const keyA = buildCacheKey("capacity", "a");
    const keyB = buildCacheKey("capacity", "b");

    service.set(keyA, ["a"]);
    // Now size is 1, which equals maxEntries, so enforceCapacity returns early
    // We need to force it to call capacityManager.enforceCapacity() and return 0

    const internal = service as unknown as {
      capacityManager: { enforceCapacity: (maxEntries: number) => number };
      config: { maxEntries?: number };
      store: Map<CacheKey, unknown>;
      enforceCapacity: () => void;
    };

    // Mock capacityManager to return 0 evictions even when size > maxEntries
    const originalEnforceCapacity = internal.capacityManager.enforceCapacity;
    internal.capacityManager.enforceCapacity = vi.fn().mockReturnValue(0);

    // Manually add another entry to make size > maxEntries
    internal.store.set(keyB, {
      value: ["b"],
      expiresAt: null,
      metadata: {
        key: keyB,
        createdAt: now,
        expiresAt: null,
        lastAccessedAt: now,
        hits: 0,
        tags: [],
      },
    });

    // Now trigger enforceCapacity - it should call capacityManager, get 0, and skip the if branch
    internal.enforceCapacity();

    // Verify that capacityManager was called and returned 0
    expect(internal.capacityManager.enforceCapacity).toHaveBeenCalledWith(1);

    // Restore original
    internal.capacityManager.enforceCapacity = originalEnforceCapacity;
  });

  it("handles defensive LRU guard without throwing when no entry is selected", () => {
    createService({ maxEntries: 1 });

    const keyA = buildCacheKey("lru-edge", "a");
    const keyB = buildCacheKey("lru-edge", "b");

    // Bypass normal set() to create an artificial state where no entry
    // has a smaller lastAccessedAt than the initial sentinel value.
    const internal = service as unknown as {
      store: Map<
        string,
        { value: unknown; expiresAt: number | null; metadata: CacheEntryMetadata }
      >;
    };

    internal.store.set(keyA, {
      value: ["a"],
      expiresAt: null,
      metadata: {
        key: keyA,
        createdAt: now,
        expiresAt: null,
        lastAccessedAt: Number.POSITIVE_INFINITY,
        hits: 0,
        tags: [],
      },
    });

    internal.store.set(keyB, {
      value: ["b"],
      expiresAt: null,
      metadata: {
        key: keyB,
        createdAt: now,
        expiresAt: null,
        lastAccessedAt: Number.POSITIVE_INFINITY,
        hits: 0,
        tags: [],
      },
    });

    // Force enforceCapacity() with this artificial state. The defensive
    // guard should safely break out of the loop without throwing.
    expect(() => {
      (service as unknown as { enforceCapacity: () => void }).enforceCapacity();
    }).not.toThrow();
  });

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
    // This covers line 251: if (this.store.delete(key)) - the case where delete returns false
    // To test this, we need to create an expired entry and then delete it before handleExpiration is called
    // However, this is tricky because handleExpiration is called internally during get()
    // Instead, we'll use the internal store to create an edge case where delete returns false

    const key = buildCacheKey("expired-but-deleted");

    // Set an entry that will expire
    service.set(key, ["entry"], { ttlMs: 100 });

    // Advance time to expire the entry
    now += 200;

    // Manually delete the key before get() is called (simulating race condition)
    // This ensures that when handleExpiration is called, delete() returns false
    const internal = service as unknown as {
      store: Map<string, unknown>;
      handleExpiration: (key: string) => void;
    };

    // Delete the key manually
    internal.store.delete(key);

    const initialEvictions = service.getStatistics().evictions;

    // Call handleExpiration directly - it should try to delete, but key is already gone
    // This covers the case where delete returns false (line 251)
    internal.handleExpiration(key);

    // Should not increment evictions when delete returns false (line 251)
    expect(service.getStatistics().evictions).toBe(initialEvictions);
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

  it("reacts to runtime config updates", () => {
    const runtimeConfig = new RuntimeConfigService({
      isDevelopment: false,
      isProduction: true,
      logLevel: LogLevel.INFO,
      enablePerformanceTracking: false,
      performanceSamplingRate: 1,
      enableMetricsPersistence: false,
      metricsPersistenceKey: "cache-metrics",
      enableCacheService: true,
      cacheDefaultTtlMs: 1000,
      cacheMaxEntries: 2,
    });

    const dynamicCache = new CacheService(
      {
        enabled: true,
        defaultTtlMs: 1000,
        namespace: "dynamic",
        maxEntries: 2,
      },
      metrics,
      () => now,
      runtimeConfig
    );

    const keyA = buildCacheKey("dynamic", "a");
    const keyB = buildCacheKey("dynamic", "b");

    dynamicCache.set(keyA, ["entry-a"]);
    runtimeConfig.setFromFoundry("enableCacheService", false);
    expect(dynamicCache.isEnabled).toBe(false);
    expect(dynamicCache.get<string[]>(keyA)).toBeNull();

    runtimeConfig.setFromFoundry("enableCacheService", true);
    dynamicCache.set(keyA, ["entry-a"]);
    expect(dynamicCache.get<string[]>(keyA)).not.toBeNull();

    runtimeConfig.setFromFoundry("cacheDefaultTtlMs", 50);
    dynamicCache.set(keyA, ["entry-ttl"]);
    now += 100;
    expect(dynamicCache.get<string[]>(keyA)).toBeNull();

    runtimeConfig.setFromFoundry("cacheMaxEntries", 1);
    dynamicCache.set(keyA, ["entry-a"]);
    dynamicCache.set(keyB, ["entry-b"]);
    expect(dynamicCache.has(keyA)).toBe(false);
    expect(dynamicCache.has(keyB)).toBe(true);

    // When cacheMaxEntries is set to a non-positive number, the config
    // should drop the maxEntries setting (defensive branch in updateConfig).
    runtimeConfig.setFromFoundry("cacheMaxEntries", 0);
    dynamicCache.set(keyA, ["entry-reset-a"]);
    dynamicCache.set(keyB, ["entry-reset-b"]);

    // Trigger the unsubscribe handler to cover the runtimeConfigUnsubscribe
    // closure created during bindRuntimeConfig, and then re-bind with a new
    // RuntimeConfigService to exercise the optional chaining branch.
    const anyCache = dynamicCache as unknown as {
      runtimeConfigUnsubscribe: () => void;
      bindRuntimeConfig: (config: RuntimeConfigService) => void;
    };
    expect(() => {
      anyCache.runtimeConfigUnsubscribe();
      anyCache.bindRuntimeConfig(
        new RuntimeConfigService({
          isDevelopment: false,
          isProduction: true,
          logLevel: LogLevel.INFO,
          enablePerformanceTracking: false,
          performanceSamplingRate: 1,
          enableMetricsPersistence: false,
          metricsPersistenceKey: "cache-metrics-2",
          enableCacheService: true,
          cacheDefaultTtlMs: 500,
          cacheMaxEntries: 3,
        })
      );
    }).not.toThrow();
  });

  it("DI wrapper exposes dependencies and forwards constructor args", () => {
    const wrapper = new DICacheService(
      {
        enabled: true,
        defaultTtlMs: 1,
        namespace: "test",
      },
      metrics,
      new RuntimeConfigService({
        isDevelopment: false,
        isProduction: true,
        logLevel: LogLevel.INFO,
        enablePerformanceTracking: false,
        performanceSamplingRate: 1,
        enableMetricsPersistence: false,
        metricsPersistenceKey: "cache-metrics",
        enableCacheService: true,
        cacheDefaultTtlMs: 1,
        cacheMaxEntries: undefined,
      })
    );

    expect(wrapper.isEnabled).toBe(true);
    expect(DICacheService.dependencies).toEqual([
      cacheServiceConfigToken,
      metricsCollectorToken,
      runtimeConfigToken,
    ]);
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
});
