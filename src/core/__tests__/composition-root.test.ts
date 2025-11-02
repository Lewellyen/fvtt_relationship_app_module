import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompositionRoot } from "../composition-root";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { loggerToken } from "@/tokens/tokenindex";
import { ConsoleLoggerService } from "@/services/consolelogger";

describe("CompositionRoot", () => {
  beforeEach(() => {
    vi.stubGlobal("game", {
      version: "13.291",
      modules: new Map([
        [
          "fvtt_relationship_app_module",
          { id: "fvtt_relationship_app_module", api: undefined },
        ],
      ]),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("bootstrap", () => {
    it("should bootstrap successfully", () => {
      const root = new CompositionRoot();
      const result = root.bootstrap();

      expectResultOk(result);
    });
  });

  describe("getContainerOrThrow", () => {
    it("should return container after bootstrap", () => {
      const root = new CompositionRoot();
      root.bootstrap();

      const container = root.getContainerOrThrow();
      expect(container).toBeDefined();
    });

    it("should throw before bootstrap", () => {
      const root = new CompositionRoot();

      expect(() => root.getContainerOrThrow()).toThrow("Container not initialized");
    });
  });

  describe("exposeToModuleApi", () => {
    it("should expose container to module API", () => {
      const root = new CompositionRoot();
      root.bootstrap();

      root.exposeToModuleApi();

      // Verify API is exposed
      const mod = (game as any).modules.get("fvtt_relationship_app_module");
      expect(mod.api).toBeDefined();
      expect(mod.api.resolve).toBeDefined();
    });

    it("should throw when container not initialized", () => {
      const root = new CompositionRoot();

      expect(() => root.exposeToModuleApi()).toThrow("Container not initialized");
    });

    it("should throw when game.modules not available", () => {
      vi.stubGlobal("game", { version: "13.291" }); // No modules

      const root = new CompositionRoot();
      root.bootstrap();

      expect(() => root.exposeToModuleApi()).toThrow("Game modules not available");
    });

    it("should throw when module not found in game.modules", () => {
      vi.stubGlobal("game", {
        version: "13.291",
        modules: new Map(), // Empty map
      });

      const root = new CompositionRoot();
      root.bootstrap();

      expect(() => root.exposeToModuleApi()).toThrow("Module not available to expose API");
    });
  });

  describe("Integration", () => {
    it("should provide fully configured container", () => {
      const root = new CompositionRoot();
      const bootstrapResult = root.bootstrap();

      expectResultOk(bootstrapResult);

      const container = root.getContainerOrThrow();
      const logger = container.resolve(loggerToken);

      expect(logger).toBeInstanceOf(ConsoleLoggerService);
    });
  });
});

