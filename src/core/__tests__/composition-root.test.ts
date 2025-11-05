/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking game.modules and ENV

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CompositionRoot } from "../composition-root";
import { expectResultOk } from "@/test/utils/test-helpers";
import { markAsApiSafe } from "@/di_infrastructure/types/api-safe-token";
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

    it("should record performance marks using constants when debug mode enabled", async () => {
      // Mock ENV to enable debug mode
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: true,
        isProduction: false,
        logLevel: 0,
        enablePerformanceTracking: true,
        enableDebugMode: true,
      });

      const root = new CompositionRoot();

      // Spy on console.debug to verify performance logging happened
      const consoleDebugSpy = vi.spyOn(console, "debug");

      root.bootstrap();

      // Verify performance logging occurred (marks are cleaned up after measurement)
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("Bootstrap completed in")
      );
      expect(consoleDebugSpy).toHaveBeenCalledWith(expect.stringContaining("ms"));

      consoleDebugSpy.mockRestore();
    });

    it("should skip performance tracking when debug mode disabled", async () => {
      // Mock ENV to disable debug mode
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: false,
        isProduction: true,
        logLevel: 1,
        enablePerformanceTracking: false,
        enableDebugMode: false,
      });

      const root = new CompositionRoot();

      // Clear previous marks
      performance.clearMarks();
      performance.clearMeasures();

      const marksCountBefore = performance.getEntriesByType("mark").length;
      root.bootstrap();
      const marksCountAfter = performance.getEntriesByType("mark").length;

      // No new marks should be created
      expect(marksCountAfter).toBe(marksCountBefore);
    });
  });

  describe("getContainer", () => {
    it("should return ok Result with container after bootstrap", () => {
      const root = new CompositionRoot();
      root.bootstrap();

      const result = root.getContainer();
      expectResultOk(result);
      expect(result.value).toBeDefined();
    });

    it("should return err Result before bootstrap", () => {
      const root = new CompositionRoot();

      const result = root.getContainer();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Container not initialized");
      }
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

      const containerResult = root.getContainer();
      expectResultOk(containerResult);

      const logger = containerResult.value.resolve(markAsApiSafe(loggerToken));
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

    it("should report healthy status when container is validated", () => {
      const root = new CompositionRoot();
      root.bootstrap();
      root.exposeToModuleApi();

      const mod = (game as any).modules.get("fvtt_relationship_app_module");
      const health = mod.api.getHealth();

      expect(health.status).toBe("healthy");
      expect(health.checks.containerValidated).toBe(true);
      expect(health.timestamp).toBeDefined();
    });

    it("should report degraded status when resolution errors exist", async () => {
      const root = new CompositionRoot();
      root.bootstrap();
      root.exposeToModuleApi();

      // Simulate resolution error by recording it in metrics
      const metricsModule = await import("@/observability/metrics-collector");
      const tokensModule = await import("@/di_infrastructure/tokenutilities");
      const token = tokensModule.createInjectionToken("TestError");
      metricsModule.MetricsCollector.getInstance().recordResolution(token, 0, false);

      const mod = (game as any).modules.get("fvtt_relationship_app_module");
      const health = mod.api.getHealth();

      expect(health.status).toBe("degraded");
      expect(health.checks.containerValidated).toBe(true);
    });
  });
});
