import { describe, expect, it, vi } from "vitest";
import { CacheMetricsCollector } from "../cache-metrics-collector";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";
import type { CacheKey } from "../cache.interface";

describe("CacheMetricsCollector", () => {
  it("records cache hit via MetricsCollector", () => {
    const metricsCollector = {
      recordCacheAccess: vi.fn(),
    } as unknown as MetricsCollector;

    const collector = new CacheMetricsCollector(metricsCollector);
    collector.onCacheHit("test-key" as CacheKey);

    expect(metricsCollector.recordCacheAccess).toHaveBeenCalledWith(true);
  });

  it("records cache miss via MetricsCollector", () => {
    const metricsCollector = {
      recordCacheAccess: vi.fn(),
    } as unknown as MetricsCollector;

    const collector = new CacheMetricsCollector(metricsCollector);
    collector.onCacheMiss("test-key" as CacheKey);

    expect(metricsCollector.recordCacheAccess).toHaveBeenCalledWith(false);
  });

  it("handles cache eviction without throwing", () => {
    const metricsCollector = {
      recordCacheAccess: vi.fn(),
    } as unknown as MetricsCollector;

    const collector = new CacheMetricsCollector(metricsCollector);
    expect(() => {
      collector.onCacheEviction("test-key" as CacheKey);
    }).not.toThrow();
  });

  it("handles missing MetricsCollector gracefully", () => {
    const collector = new CacheMetricsCollector(undefined);
    expect(() => {
      collector.onCacheHit("test-key" as CacheKey);
      collector.onCacheMiss("test-key" as CacheKey);
      collector.onCacheEviction("test-key" as CacheKey);
    }).not.toThrow();
  });
});
