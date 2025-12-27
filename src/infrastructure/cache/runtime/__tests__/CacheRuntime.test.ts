import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheRuntime } from "../CacheRuntime";
import { CacheStore } from "../../store/CacheStore";
import { CacheExpirationManager } from "../../expiration/CacheExpirationManager";
import { CacheConfigManager } from "../../config/CacheConfigManager";
import { CacheTelemetry } from "../../telemetry/CacheTelemetry";
import { CachePolicy } from "../../policy/CachePolicy";
import { CacheStatisticsCollector } from "../../statistics/CacheStatisticsCollector";
import { CacheCapacityManager } from "../../cache-capacity-manager";
import { LRUEvictionStrategy } from "../../lru-eviction-strategy";
import { CacheMetricsCollector } from "../../cache-metrics-collector";
import { assertCacheKey } from "@/infrastructure/di/types/utilities/type-casts";
import type { InternalCacheEntry } from "../../eviction-strategy.interface";
import { DEFAULT_CACHE_SERVICE_CONFIG } from "../../CacheService";

describe("CacheRuntime", () => {
  let now: number;
  let runtime: CacheRuntime;
  let store: CacheStore;
  let expirationManager: CacheExpirationManager;
  let configManager: CacheConfigManager;
  let telemetry: CacheTelemetry;
  let policy: CachePolicy;

  beforeEach(() => {
    now = 1_000;
    store = new CacheStore();
    expirationManager = new CacheExpirationManager(() => now);
    configManager = new CacheConfigManager(DEFAULT_CACHE_SERVICE_CONFIG);
    const capacityManager = new CacheCapacityManager(new LRUEvictionStrategy(), store);
    policy = new CachePolicy(capacityManager);
    const metricsObserver = new CacheMetricsCollector(undefined);
    const statisticsCollector = new CacheStatisticsCollector(metricsObserver);
    telemetry = new CacheTelemetry(statisticsCollector);
    runtime = new CacheRuntime(
      store,
      expirationManager,
      configManager,
      telemetry,
      policy,
      () => now
    );
  });

  it("get returns null when cache is disabled", () => {
    configManager.updateConfig({ enabled: false });
    const key = assertCacheKey("test-key");

    const result = runtime.get(key);

    expect(result).toBeNull();
  });

  it("get returns null for non-existent key", () => {
    const key = assertCacheKey("non-existent");

    const result = runtime.get(key);

    expect(result).toBeNull();
  });

  it("get returns value for existing non-expired entry", () => {
    const key = assertCacheKey("test-key");
    const entry: InternalCacheEntry = {
      value: "test-value",
      expiresAt: now + 1000,
      metadata: {
        key,
        createdAt: now,
        expiresAt: now + 1000,
        lastAccessedAt: now,
        hits: 0,
        tags: [],
      },
    };
    store.set(key, entry);

    const result = runtime.get<string>(key);

    expect(result).not.toBeNull();
    expect(result?.hit).toBe(true);
    expect(result?.value).toBe("test-value");
    expect(result?.metadata.hits).toBe(1);
  });

  it("get handles expiration when entry is expired", () => {
    const key = assertCacheKey("expired-key");
    const entry: InternalCacheEntry = {
      value: "test-value",
      expiresAt: now - 100, // Expired
      metadata: {
        key,
        createdAt: now - 1000,
        expiresAt: now - 100,
        lastAccessedAt: now - 1000,
        hits: 0,
        tags: [],
      },
    };
    store.set(key, entry);

    const result = runtime.get<string>(key);

    expect(result).toBeNull();
    expect(store.has(key)).toBe(false); // Entry should be removed
  });

  it("handleExpiration does not remove entry when isExpired returns false", () => {
    // This tests the else branch in handleExpiration where isExpired returns false
    // Edge case: expiresAt = 0 causes shouldExpire to return true (now >= 0)
    // but isExpired returns false (because expiresAt > 0 check fails)
    const key = assertCacheKey("edge-case-key");
    const entry: InternalCacheEntry = {
      value: "test-value",
      expiresAt: 0, // Edge case: shouldExpire will be true, but isExpired will be false
      metadata: {
        key,
        createdAt: now,
        expiresAt: 0,
        lastAccessedAt: now,
        hits: 0,
        tags: [],
      },
    };
    store.set(key, entry);

    // Call get which will call handleExpiration internally
    // shouldExpire(0, now) returns true (now >= 0)
    // isExpired(entry, now) returns false (0 > 0 is false)
    // So handleExpiration is called, but the entry is not removed
    const result = runtime.get<string>(key);

    // Entry should still exist since isExpired returned false
    expect(result).toBeNull(); // get returns null because shouldExpire was true
    expect(store.has(key)).toBe(true); // But entry is not removed because isExpired was false
  });

  it("set creates entry when cache is enabled", () => {
    const key = assertCacheKey("set-key");

    const metadata = runtime.set(key, "test-value");

    expect(metadata).toBeDefined();
    expect(metadata.key).toBe(key);
    expect(store.has(key)).toBe(true);
  });

  it("set returns metadata when cache is disabled", () => {
    configManager.updateConfig({ enabled: false });
    const key = assertCacheKey("disabled-key");

    const metadata = runtime.set(key, "test-value");

    expect(metadata).toBeDefined();
    expect(store.has(key)).toBe(false); // Should not be stored
  });

  it("getOrSet returns cached value if exists", async () => {
    const key = assertCacheKey("getorset-key");
    runtime.set(key, "cached-value");

    const result = await runtime.getOrSet(key, () => "new-value");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.hit).toBe(true);
      expect(result.value.value).toBe("cached-value");
    }
  });

  it("getOrSet calls factory and caches result when not cached", async () => {
    const key = assertCacheKey("getorset-new");
    const factory = vi.fn().mockReturnValue("factory-value");

    const result = await runtime.getOrSet(key, factory);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.hit).toBe(false);
      expect(result.value.value).toBe("factory-value");
    }
    expect(factory).toHaveBeenCalledTimes(1);
    expect(store.has(key)).toBe(true);
  });
});
