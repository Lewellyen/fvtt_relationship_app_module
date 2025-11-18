import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/config/dependencyconfig";

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

describe("Memory Leak: Container Scope Cleanup", () => {
  let rootContainer: ServiceContainer;

  beforeEach(() => {
    rootContainer = ServiceContainer.createRoot();
    configureDependencies(rootContainer);
  });

  afterEach(() => {
    rootContainer.dispose();
  });

  it("should cleanup scoped containers", async () => {
    // Initialen Speicherverbrauch
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const initialMemory = getMemoryUsage();

    // 100 Scoped Container erstellen
    const scopedContainers: ServiceContainer[] = [];
    for (let i = 0; i < 100; i++) {
      const scopedResult = rootContainer.createScope();
      if (!scopedResult.ok) {
        throw new Error(`Failed to create scope: ${scopedResult.error.message}`);
      }
      scopedContainers.push(scopedResult.value);
    }

    // Speicher nach Erstellung
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const _afterCreationMemory = getMemoryUsage();

    // Alle Scoped Container dispose
    scopedContainers.forEach((scoped) => {
      const disposeResult = scoped.dispose();
      expect(disposeResult.ok).toBe(true);
    });

    // GC forcieren
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const finalMemory = getMemoryUsage();

    // Speicher sollte freigegeben worden sein
    const memoryDiff = finalMemory - initialMemory;
    expect(memoryDiff).toBeLessThan(10 * 1024 * 1024);
  });
});
