import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CompositionRoot } from "@/core/composition-root";
import { loggerToken } from "@/tokens/tokenindex";
import { foundryGameToken } from "@/foundry/foundrytokens";

describe("Integration: Full Bootstrap", () => {
  beforeEach(() => {
    // Mock Foundry globals
    vi.stubGlobal("game", {
      modules: new Map([
        [
          "fvtt_relationship_app_module",
          {
            id: "fvtt_relationship_app_module",
            title: "Relationship App",
          },
        ],
      ]),
      journal: {
        contents: [],
      },
      version: "13.350",
    });

    vi.stubGlobal("Hooks", {
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should bootstrap container successfully", () => {
    const root = new CompositionRoot();
    const result = root.bootstrap();

    expect(result.ok).toBe(true);
  });

  it("should resolve core services after bootstrap", () => {
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();

    expect(bootstrapResult.ok).toBe(true);

    const containerResult = root.getContainer();
    expect(containerResult.ok).toBe(true);

    if (containerResult.ok) {
      const logger = containerResult.value.resolve(loggerToken);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
    }
  });

  it("should expose module API correctly", () => {
    const root = new CompositionRoot();
    root.bootstrap();

    expect(() => root.exposeToModuleApi()).not.toThrow();

    const mod = (global as any).game.modules.get("fvtt_relationship_app_module");
    expect(mod.api).toBeDefined();
    expect(typeof mod.api.resolve).toBe("function");
    expect(typeof mod.api.getAvailableTokens).toBe("function");
    expect(typeof mod.api.getMetrics).toBe("function");
    expect(mod.api.tokens).toBeDefined();
  });

  it("should expose metrics API", () => {
    const root = new CompositionRoot();
    root.bootstrap();
    root.exposeToModuleApi();

    const mod = (global as any).game.modules.get("fvtt_relationship_app_module");
    const metrics = mod.api.getMetrics();

    expect(metrics).toBeDefined();
    expect(typeof metrics.containerResolutions).toBe("number");
    expect(typeof metrics.avgResolutionTimeMs).toBe("number");
    expect(typeof metrics.cacheHitRate).toBe("number");
  });

  it("should resolve foundry services", () => {
    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();

    expect(bootstrapResult.ok).toBe(true);

    const containerResult = root.getContainer();
    if (containerResult.ok) {
      const game = containerResult.value.resolve(foundryGameToken);
      expect(game).toBeDefined();
      expect(typeof game.getJournalEntries).toBe("function");
      expect(typeof game.getJournalEntryById).toBe("function");
    }
  });

  it("should handle bootstrap failure gracefully", () => {
    // Stub game as undefined to force bootstrap failure
    vi.stubGlobal("game", undefined);

    const root = new CompositionRoot();
    root.bootstrap();

    // Bootstrap might still succeed (depends on implementation)
    // But should not throw
    expect(() => root.getContainer()).not.toThrow();
  });
});
