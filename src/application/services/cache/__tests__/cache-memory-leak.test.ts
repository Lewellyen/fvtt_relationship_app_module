import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServiceContainer } from "@/infrastructure/di/container";
import { configureDependencies } from "@/framework/config/dependencyconfig";
import { expectResultOk } from "@/test/utils/test-helpers";
import { cacheServiceToken } from "@/infrastructure/shared/tokens/infrastructure.tokens";
import type { CacheService as CacheServiceContract } from "@/infrastructure/cache/cache.interface";
import { createCacheNamespace } from "@/infrastructure/cache/cache.interface";
import { castResolvedService } from "@/infrastructure/di/types/utilities/runtime-safe-cast";

interface PerformanceMemory {
  usedJSHeapSize: number;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

function getMemoryUsage(): number {
  const perf = performance as unknown as PerformanceWithMemory;
  if (typeof perf.memory !== "undefined") {
    return perf.memory.usedJSHeapSize;
  }
  return 0;
}

function forceGC(): void {
  if (typeof global.gc !== "undefined") {
    global.gc();
  }
}

const buildCacheKey = createCacheNamespace("test");

describe("Memory Leak: Cache Cleanup", () => {
  let container: ServiceContainer;
  let cacheService: CacheServiceContract;

  beforeEach(() => {
    container = ServiceContainer.createRoot();
    configureDependencies(container);
    const cacheServiceResult = container.resolveWithError(cacheServiceToken);
    expectResultOk(cacheServiceResult);
    cacheService = castResolvedService<CacheServiceContract>(cacheServiceResult.value);
  });

  afterEach(() => {
    container.dispose();
  });

  it("should free memory after cache clear", async () => {
    // Initialen Speicherverbrauch
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const initialMemory = getMemoryUsage();

    // Cache mit 1000 Einträgen füllen
    for (let i = 0; i < 1000; i++) {
      const key = buildCacheKey(`key-${i}`);
      cacheService.set(key, `value-${i}`);
    }

    // Prüfen ob Cache gefüllt wurde
    expect(cacheService.size).toBe(1000);

    // Speicher nach Füllen
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const _afterFillMemory = getMemoryUsage();

    // Cache clear
    const clearedCount = cacheService.clear();
    expect(clearedCount).toBe(1000);
    expect(cacheService.size).toBe(0);

    // GC forcieren
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const finalMemory = getMemoryUsage();

    // Speicher sollte freigegeben worden sein
    const memoryDiff = finalMemory - initialMemory;
    expect(memoryDiff).toBeLessThan(10 * 1024 * 1024);
  });
});
