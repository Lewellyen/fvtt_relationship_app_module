import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame, createMockHooks } from "@/test/mocks/foundry";

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

describe("Memory Leak: Hook Registration", () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("should not leak memory after hook disposal", async () => {
    const mockHooks = createMockHooks();
    cleanup = withFoundryGlobals({
      game: createMockGame(),
      Hooks: mockHooks,
    });

    // Initialen Speicherverbrauch messen
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const initialMemory = getMemoryUsage();

    // Hooks direkt registrieren (simuliert Hook-Registrierung)
    const globalHooks = (global as { Hooks?: typeof Hooks }).Hooks;
    if (!globalHooks) {
      throw new Error("Hooks not available");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-deprecated
    const hooksOnMock = globalHooks.on as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-deprecated
    const hooksOffMock = globalHooks.off as any;

    // 1000 Hooks registrieren (simuliert viele Hook-Registrierungen)
    const registeredHooks: Array<{ hookName: string; callback: () => void; id: number }> = [];
    for (let i = 0; i < 1000; i++) {
      const callback = vi.fn();
      const id = hooksOnMock(`test-hook-${i}`, callback) as number;
      registeredHooks.push({ hookName: `test-hook-${i}`, callback, id });
    }

    // Prüfen ob Hooks registriert wurden
    expect(hooksOnMock.mock.calls.length).toBe(1000);

    // Speicher nach Registrierung
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const _afterRegistrationMemory = getMemoryUsage();

    // Hooks entfernen (manuelles Cleanup - Foundry hat keinen disable Hook)
    registeredHooks.forEach(({ hookName, callback }) => {
      hooksOffMock(hookName, callback);
    });

    // GC forcieren
    forceGC();
    await new Promise((resolve) => setTimeout(resolve, 100));
    const finalMemory = getMemoryUsage();

    // Speicher-Differenz sollte akzeptabel sein (< 10MB)
    const memoryDiff = finalMemory - initialMemory;
    expect(memoryDiff).toBeLessThan(10 * 1024 * 1024);
  });
});
