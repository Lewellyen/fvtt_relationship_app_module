/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking game.modules

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { CompositionRoot } from "@/framework/core/composition-root";
import { castResolvedService } from "@/infrastructure/di/types/utilities/runtime-safe-cast";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { ModuleApiInitializer } from "@/framework/core/api/module-api-initializer";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import { moduleApiInitializerToken } from "@/infrastructure/shared/tokens/infrastructure/module-api-initializer.token";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";

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
      const loggerResult = containerResult.value.resolveWithError(loggerToken);
      expect(loggerResult.ok).toBe(true);
      if (loggerResult.ok) {
        const logger = castResolvedService<Logger>(loggerResult.value);
        expect(logger).toBeDefined();
        expect(typeof logger.info).toBe("function");
        expect(typeof logger.error).toBe("function");
      }
    }
  });

  it("should expose module API correctly", () => {
    const root = new CompositionRoot();
    root.bootstrap();

    // Resolve and use ModuleApiInitializer
    const containerResult = root.getContainer();
    expect(containerResult.ok).toBe(true);

    if (containerResult.ok) {
      const initializerResult = containerResult.value.resolveWithError(moduleApiInitializerToken);
      expect(initializerResult.ok).toBe(true);

      if (initializerResult.ok) {
        const initializer = castResolvedService<ModuleApiInitializer>(initializerResult.value);
        const exposeResult = initializer.expose(containerResult.value);
        expect(exposeResult.ok).toBe(true);

        const mod = (global as any).game.modules.get("fvtt_relationship_app_module");
        expect(mod.api).toBeDefined();
        expect(typeof mod.api.resolve).toBe("function");
        expect(typeof mod.api.getAvailableTokens).toBe("function");
        expect(typeof mod.api.getMetrics).toBe("function");
        expect(mod.api.tokens).toBeDefined();
      }
    }
  });

  it("should expose metrics API", () => {
    const root = new CompositionRoot();
    root.bootstrap();

    // Resolve and use ModuleApiInitializer
    const containerResult = root.getContainer();
    if (!containerResult.ok) throw new Error("Container not bootstrapped");

    const initializerResult = containerResult.value.resolveWithError(moduleApiInitializerToken);
    if (!initializerResult.ok) throw new Error("ModuleApiInitializer not resolved");

    const initializer = castResolvedService<ModuleApiInitializer>(initializerResult.value);
    const exposeResult = initializer.expose(containerResult.value);
    expect(exposeResult.ok).toBe(true);

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
      const gameResult = containerResult.value.resolveWithError(foundryGameToken);
      expect(gameResult.ok).toBe(true);
      if (gameResult.ok) {
        const game = castResolvedService<{
          getJournalEntries: () => unknown;
          getJournalEntryById: (id: string) => unknown;
        }>(gameResult.value);
        expect(game).toBeDefined();
        expect(typeof game.getJournalEntries).toBe("function");
        expect(typeof game.getJournalEntryById).toBe("function");
      }
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
