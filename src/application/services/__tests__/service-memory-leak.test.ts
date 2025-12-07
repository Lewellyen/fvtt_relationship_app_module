import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { createTestContainer } from "@/test/utils/test-helpers";
import { configureDependencies } from "@/framework/config/dependencyconfig";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";

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

describe("Memory Leak: Service Disposal", () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = createTestContainer();
    configureDependencies(container);
    const validateResult = container.validate();
    expect(validateResult.ok).toBe(true);
  });

  afterEach(() => {
    container.dispose();
  });

  it("should dispose services correctly", async () => {
    // Services resolven
    const logger = container.resolveWithError(loggerToken);
    expect(logger.ok).toBe(true);
    if (!logger.ok) return;

    // Initialen Speicherverbrauch
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const initialMemory = getMemoryUsage();

    // 100 Services erstellen (in Scoped Container)
    const scopedContainers: ServiceContainer[] = [];
    for (let i = 0; i < 100; i++) {
      const scopedResult = container.createScope();
      if (!scopedResult.ok) {
        throw new Error(`Failed to create scope: ${scopedResult.error.message}`);
      }
      const scoped = scopedResult.value;
      // Scoped Container müssen validiert werden, bevor Services resolviert werden können
      const scopedValidateResult = scoped.validate();
      if (!scopedValidateResult.ok) {
        throw new Error(
          `Failed to validate scoped container: ${JSON.stringify(scopedValidateResult.error)}`
        );
      }
      scopedContainers.push(scoped);
      const scopedLogger = scoped.resolveWithError(loggerToken);
      expect(scopedLogger.ok).toBe(true);
    }

    // Speicher nach Erstellung
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const _afterCreationMemory = getMemoryUsage();

    // Scoped Container dispose
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
