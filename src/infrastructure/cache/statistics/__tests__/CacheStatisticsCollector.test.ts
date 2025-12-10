import { describe, expect, it, vi, beforeEach } from "vitest";
import { CacheStatisticsCollector } from "../CacheStatisticsCollector";
import { assertCacheKey } from "@/infrastructure/di/types/utilities/type-casts";
import type { CacheMetricsObserver } from "../../cache-metrics-observer.interface";

describe("CacheStatisticsCollector", () => {
  let metricsObserver: CacheMetricsObserver;
  let collector: CacheStatisticsCollector;

  beforeEach(() => {
    metricsObserver = {
      onCacheHit: vi.fn(),
      onCacheMiss: vi.fn(),
      onCacheEviction: vi.fn(),
    };
    collector = new CacheStatisticsCollector(metricsObserver);
  });

  it("records hits", () => {
    const key = assertCacheKey("test-key");

    collector.recordHit(key);

    expect(metricsObserver.onCacheHit).toHaveBeenCalledWith(key);
    const stats = collector.getStatistics(0, true);
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(0);
    expect(stats.evictions).toBe(0);
  });

  it("records misses", () => {
    const key = assertCacheKey("test-key");

    collector.recordMiss(key);

    expect(metricsObserver.onCacheMiss).toHaveBeenCalledWith(key);
    const stats = collector.getStatistics(0, true);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(1);
    expect(stats.evictions).toBe(0);
  });

  it("records evictions", () => {
    const key = assertCacheKey("test-key");

    collector.recordEviction(key);

    expect(metricsObserver.onCacheEviction).toHaveBeenCalledWith(key);
    const stats = collector.getStatistics(0, true);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.evictions).toBe(1);
  });

  it("tracks multiple statistics", () => {
    const key1 = assertCacheKey("key1");
    const key2 = assertCacheKey("key2");
    const key3 = assertCacheKey("key3");

    collector.recordHit(key1);
    collector.recordHit(key2);
    collector.recordMiss(key3);
    collector.recordEviction(key1);

    const stats = collector.getStatistics(5, true);
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.evictions).toBe(1);
    expect(stats.size).toBe(5);
    expect(stats.enabled).toBe(true);
  });

  it("resets statistics", () => {
    const key = assertCacheKey("test-key");

    collector.recordHit(key);
    collector.recordMiss(key);
    collector.recordEviction(key);

    collector.reset();

    const stats = collector.getStatistics(0, true);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.evictions).toBe(0);
  });
});
