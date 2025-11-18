import { describe, it, expect, beforeEach, vi } from "vitest";
import { CacheService, DEFAULT_CACHE_SERVICE_CONFIG } from "../CacheService";
import type { CacheServiceConfig } from "@/interfaces/cache";
import { createCacheKey } from "@/interfaces/cache";
import type { MetricsCollector } from "@/observability/metrics-collector";

describe("Concurrency: Cache Access", () => {
  let service: CacheService;
  let now: number;
  let metrics: MetricsCollector;

  const createService = (config?: Partial<CacheServiceConfig>): CacheService => {
    const namespace = config?.namespace ?? DEFAULT_CACHE_SERVICE_CONFIG.namespace ?? "test-cache";
    const merged: CacheServiceConfig = {
      enabled: config?.enabled ?? DEFAULT_CACHE_SERVICE_CONFIG.enabled,
      defaultTtlMs: config?.defaultTtlMs ?? DEFAULT_CACHE_SERVICE_CONFIG.defaultTtlMs,
      namespace,
      ...(config?.maxEntries !== undefined ? { maxEntries: config.maxEntries } : {}),
    };
    return new CacheService(merged, metrics, () => now);
  };

  beforeEach(() => {
    now = 1_000;
    metrics = {
      recordCacheAccess: vi.fn(),
    } as unknown as MetricsCollector;
    service = createService();
  });

  it.concurrent("should handle concurrent reads", async () => {
    // Cache mit Daten füllen
    const key = createCacheKey({
      namespace: "test",
      resource: "concurrent-read",
    });
    service.set(key, "test-value");

    // 50 parallele Reads
    const promises = Array.from({ length: 50 }, () => service.get<string>(key));

    const results = await Promise.all(promises);

    // Alle sollten erfolgreich sein (nicht null)
    results.forEach((result) => {
      expect(result).not.toBeNull();
      expect(result?.hit).toBe(true);
      expect(result?.value).toBe("test-value");
    });
  });

  it.concurrent("should handle concurrent writes", async () => {
    const key = createCacheKey({
      namespace: "test",
      resource: "concurrent-write",
    });

    // 50 parallele Writes (gleicher Key)
    const promises = Array.from({ length: 50 }, (_, i) =>
      Promise.resolve(service.set(key, `value-${i}`))
    );

    const results = await Promise.all(promises);

    // Alle sollten erfolgreich sein (Metadata zurückgegeben)
    expect(results.every((r) => r !== undefined)).toBe(true);

    // Finaler Wert sollte konsistent sein
    const getResult = service.get<string>(key);
    expect(getResult).not.toBeNull();
    expect(getResult?.value).toBeDefined();
    // Wert sollte einer der geschriebenen Werte sein
    const writtenValues = Array.from({ length: 50 }, (_, i) => `value-${i}`);
    expect(writtenValues).toContain(getResult?.value);
  });

  it.concurrent("should handle concurrent read-write mix", async () => {
    const key = createCacheKey({
      namespace: "test",
      resource: "concurrent-mix",
    });

    // Initialer Wert
    service.set(key, "initial");

    // 50 Reads und 50 Writes parallel
    const promises = Array.from({ length: 100 }, (_, i) => {
      if (i % 2 === 0) {
        return Promise.resolve(service.get<string>(key));
      } else {
        return Promise.resolve(service.set(key, `value-${i}`));
      }
    });

    const results = await Promise.all(promises);

    // Alle sollten erfolgreich sein
    results.forEach((result) => {
      expect(result).not.toBeNull();
    });

    // Cache sollte konsistent sein
    const finalGetResult = service.get<string>(key);
    expect(finalGetResult).not.toBeNull();
    expect(finalGetResult?.value).toBeDefined();
  });
});
