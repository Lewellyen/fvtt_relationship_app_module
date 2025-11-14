import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheService, DICacheService, DEFAULT_CACHE_SERVICE_CONFIG } from "../CacheService";
import type { CacheServiceConfig } from "@/interfaces/cache";
import { createCacheNamespace } from "@/interfaces/cache";
import type { MetricsCollector } from "@/observability/metrics-collector";
import { cacheServiceConfigToken, metricsCollectorToken } from "@/tokens/tokenindex";

const buildCacheKey = createCacheNamespace("journal");

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

    const first = await service.getOrSet(key, factory);
    const second = await service.getOrSet(key, factory);

    expect(first.hit).toBe(false);
    expect(second.hit).toBe(true);
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

  it("applies basic LRU eviction when maxEntries exceeded", () => {
    createService({ maxEntries: 1 });
    const keyA = buildCacheKey("hidden", "a");
    const keyB = buildCacheKey("hidden", "b");

    service.set(keyA, ["a"]);
    service.set(keyB, ["b"]);

    expect(service.has(keyA)).toBe(false);
    expect(service.has(keyB)).toBe(true);
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
