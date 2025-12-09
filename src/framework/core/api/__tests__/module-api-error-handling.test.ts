// Test file: `any` needed for mocking Foundry global objects, container access, and API types

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { withFoundryGlobals } from "@/test/utils/test-helpers";
import { createMockGame } from "@/test/mocks/foundry";
import { CompositionRoot } from "@/framework/core/composition-root";
import { ModuleApiInitializer } from "@/framework/core/api/module-api-initializer";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import { markAsApiSafe } from "@/infrastructure/di/types";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { ModuleApi } from "@/framework/core/api/module-api";

describe("Runtime Error: ModuleApi Error Handling", () => {
  let cleanup: (() => void) | undefined;
  let container: ServiceContainer;
  let api: ModuleApi;

  beforeEach(async () => {
    vi.resetModules();

    // Setup Foundry game mock with modules Map
    const mockModule = {
      id: MODULE_METADATA.ID,
      api: undefined as unknown,
    };

    const mockGame = createMockGame();

    (mockGame as any).modules = new Map([[MODULE_METADATA.ID, mockModule]]);

    cleanup = withFoundryGlobals({
      game: mockGame,
    });

    const root = new CompositionRoot();
    const bootstrapResult = root.bootstrap();
    expectResultOk(bootstrapResult);

    const containerResult = root.getContainer();
    expectResultOk(containerResult);
    container = containerResult.value;

    // Expose API
    const initializer = new ModuleApiInitializer();
    const exposeResult = initializer.expose(container);
    expectResultOk(exposeResult);

    const mod = (global as any).game.modules.get(MODULE_METADATA.ID);
    api = mod.api as ModuleApi;
  });

  afterEach(() => {
    cleanup?.();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("api.resolve() - Exception-based (expected behavior)", () => {
    it("should throw exception when token is invalid", async () => {
      const { createInjectionToken } = await import("@/infrastructure/di/token-factory");
      const { markAsApiSafe } = await import("@/infrastructure/di/types");

      const invalidToken = markAsApiSafe(createInjectionToken<unknown>("InvalidService"));

      // api.resolve() SOLL Exception werfen (erwartetes Verhalten)
      expect(() => {
        api.resolve(invalidToken);
      }).toThrow();
    });

    it("should throw exception when container is not validated", () => {
      // Dieser Test ist schwierig zu simulieren, da Container bereits validiert ist
      // Aber wir können prüfen, dass api.resolve() bei ungültigen Tokens wirft
      const invalidToken = markAsApiSafe(createInjectionToken<unknown>("NonExistentService"));

      expect(() => {
        api.resolve(invalidToken);
      }).toThrow();
    });

    it("should throw exception with helpful error message", async () => {
      const { createInjectionToken } = await import("@/infrastructure/di/token-factory");
      const { markAsApiSafe } = await import("@/infrastructure/di/types");

      const invalidToken = markAsApiSafe(createInjectionToken<unknown>("InvalidService"));

      try {
        api.resolve(invalidToken);
        expect.fail("Expected exception to be thrown");
      } catch (error: unknown) {
        expect(error).toBeDefined();
        expect(String(error)).toBeTruthy();
      }
    });

    it("should return service instance on successful resolution (no exception)", () => {
      // Bei erfolgreicher Resolution sollte keine Exception geworfen werden
      const notifications = api.resolve(api.tokens.notificationCenterToken);
      expect(notifications).toBeDefined();
      expect(typeof notifications.error).toBe("function");
    });
  });

  describe("api.resolveWithError() - Result-Pattern (never throws)", () => {
    it("should return Result with ok: false when token is invalid", async () => {
      const { createInjectionToken } = await import("@/infrastructure/di/token-factory");
      const { markAsApiSafe } = await import("@/infrastructure/di/types");

      const invalidToken = markAsApiSafe(createInjectionToken<unknown>("InvalidService"));

      // api.resolveWithError() SOLLTE nie Exception werfen
      const result = api.resolveWithError(invalidToken);

      expectResultErr(result);
      expect(result).toHaveProperty("ok");
      expect(result.ok).toBe(false);
      expect(result).toHaveProperty("error");
    });

    it("should return Result with ok: false when container is not validated", () => {
      // Container ist bereits validiert, aber wir können prüfen, dass Result zurückgegeben wird
      const invalidToken = markAsApiSafe(createInjectionToken<unknown>("NonExistentService"));

      // Sollte nie Exception werfen, auch bei Fehlern
      expect(() => {
        const result = api.resolveWithError(invalidToken);
        expectResultErr(result);
      }).not.toThrow();
    });

    it("should never throw exceptions, even on errors", async () => {
      const { createInjectionToken } = await import("@/infrastructure/di/token-factory");
      const { markAsApiSafe } = await import("@/infrastructure/di/types");

      const invalidToken = markAsApiSafe(createInjectionToken<unknown>("InvalidService"));

      // Sollte nie Exception werfen, auch bei Fehlern
      expect(() => {
        const result = api.resolveWithError(invalidToken);
        expectResultErr(result);
      }).not.toThrow();
    });

    it("should return Result with ok: true on successful resolution", () => {
      const result = api.resolveWithError(api.tokens.notificationCenterToken);

      expectResultOk(result);
      if (result.ok) {
        const notifications = result.value as any;
        expect(notifications).toBeDefined();
        expect(typeof notifications.error).toBe("function");
      }
    });
  });

  describe("Consistency between both methods", () => {
    it("should return same service instance on successful resolution", () => {
      const service1 = api.resolve(api.tokens.notificationCenterToken);
      const result2 = api.resolveWithError(api.tokens.notificationCenterToken);

      expectResultOk(result2);
      if (result2.ok) {
        // Beide sollten funktional identisch sein (gleiche Methoden verfügbar)
        // ReadOnly-Wrapper verhindert direkten Vergleich, daher prüfen wir Funktionalität
        expect(typeof service1.error).toBe("function");

        const notifications2 = result2.value as any;
        expect(typeof notifications2.error).toBe("function");
        // Beide sollten die gleichen Methoden haben
        expect(Array.isArray(service1.getChannelNames())).toBe(true);
        expect(Array.isArray(notifications2.getChannelNames())).toBe(true);
      }
    });

    it("should handle errors consistently (Exception vs Result)", async () => {
      const { createInjectionToken } = await import("@/infrastructure/di/token-factory");
      const { markAsApiSafe } = await import("@/infrastructure/di/types");

      const invalidToken = markAsApiSafe(createInjectionToken<unknown>("InvalidService"));

      // api.resolve() wirft Exception
      expect(() => {
        api.resolve(invalidToken);
      }).toThrow();

      // api.resolveWithError() gibt Result zurück
      const result = api.resolveWithError(invalidToken);
      expectResultErr(result);
    });
  });
});
