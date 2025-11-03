import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompositionRoot } from "../composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";
import { loggerToken } from "@/tokens/tokenindex";
import { ConsoleLoggerService } from "@/services/consolelogger";

describe("CompositionRoot", () => {
  beforeEach(() => {
    vi.stubGlobal("game", {
      version: "13.291",
      modules: new Map([
        ["fvtt_relationship_app_module", { id: "fvtt_relationship_app_module", api: undefined }],
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
      expect(mod.api.getAvailableTokens).toBeDefined();
      expect(mod.api.tokens).toBeDefined();
      expect(mod.api.tokens.loggerToken).toBeDefined();
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

    it("should expose getAvailableTokens() in API", () => {
      const root = new CompositionRoot();
      root.bootstrap();
      root.exposeToModuleApi();

      const mod = (game as any).modules.get("fvtt_relationship_app_module");
      const tokens = mod.api.getAvailableTokens();

      expect(tokens).toBeInstanceOf(Map);
      expect(tokens.size).toBeGreaterThan(0);

      // Verify logger token is available
      const loggerInfo = Array.from(tokens.values()).find((info: any) =>
        info.description.includes("Logger")
      );
      expect(loggerInfo).toBeDefined();
      if (loggerInfo) {
        expect((loggerInfo as any).isRegistered).toBe(true);
      }
    });

    it("should expose well-known tokens in API", () => {
      const root = new CompositionRoot();
      root.bootstrap();
      root.exposeToModuleApi();

      const mod = (game as any).modules.get("fvtt_relationship_app_module");
      const { tokens } = mod.api;

      expect(tokens.loggerToken).toBeDefined();
      expect(tokens.journalVisibilityServiceToken).toBeDefined();
      expect(tokens.foundryGameToken).toBeDefined();
      expect(tokens.foundryHooksToken).toBeDefined();
      expect(tokens.foundryDocumentToken).toBeDefined();
      expect(tokens.foundryUIToken).toBeDefined();

      // Verify tokens can be used with resolve
      const logger = mod.api.resolve(tokens.loggerToken);
      expect(logger).toBeDefined();
    });
  });
});
