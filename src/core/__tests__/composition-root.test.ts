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

    it("should bootstrap successfully with performance tracking enabled", async () => {
      // Mock ENV to enable performance tracking
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: true,
        isProduction: false,
        logLevel: 0,
        enablePerformanceTracking: true,
        enableDebugMode: false, // Debug logging is separate from performance tracking
        performanceSamplingRate: 1.0, // 100% sampling
      });

      // Mock Math.random to always return 0 (ensures sampling passes)
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

      const root = new CompositionRoot();
      const result = root.bootstrap();

      // Verify bootstrap succeeded
      expectResultOk(result);

      randomSpy.mockRestore();
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
        performanceSamplingRate: 0.01,
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

    it("should handle performance tracking with debug mode and logger available", async () => {
      // Mock ENV to enable both performance tracking and debug mode
      const envModule = await import("@/config/environment");
      vi.spyOn(envModule, "ENV", "get").mockReturnValue({
        isDevelopment: true,
        isProduction: false,
        logLevel: 0,
        enablePerformanceTracking: true,
        enableDebugMode: true,
        performanceSamplingRate: 1.0,
      });

      // Mock Math.random to ensure sampling passes
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

      const root = new CompositionRoot();
      const result = root.bootstrap();

      expectResultOk(result);

      // After bootstrap, logger should be available in container
      const containerResult = root.getContainer();
      expectResultOk(containerResult);

      // Verify logger can be resolved (this covers lines 79-83)
      const loggerResult = containerResult.value.resolveWithError(markAsApiSafe(loggerToken));
      expectResultOk(loggerResult);

      randomSpy.mockRestore();
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
      expect(tokens.foundrySettingsToken).toBeDefined();
      expect(tokens.i18nFacadeToken).toBeDefined();
      expect(tokens.foundryJournalFacadeToken).toBeDefined();

      // Verify tokens can be used with resolve
      const logger = mod.api.resolve(tokens.loggerToken);
      expect(logger).toBeDefined();

      // Verify new tokens can be resolved
      const i18n = mod.api.resolve(tokens.i18nFacadeToken);
      expect(i18n).toBeDefined();

      const journalFacade = mod.api.resolve(tokens.foundryJournalFacadeToken);
      expect(journalFacade).toBeDefined();
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

      // Simulate resolution error by recording it in metrics via DI
      const mod = (game as any).modules.get("fvtt_relationship_app_module");
      const container = root.getContainer();
      if (!container.ok) throw new Error("Container not bootstrapped");
      const { metricsCollectorToken } = await import("@/tokens/tokenindex");
      const tokensModule = await import("@/di_infrastructure/tokenutilities");
      const metricsResult = container.value.resolveWithError(metricsCollectorToken);
      if (!metricsResult.ok) throw new Error("MetricsCollector not resolved");
      const token = tokensModule.createInjectionToken("TestError");
      metricsResult.value.recordResolution(token, 0, false);

      const health = mod.api.getHealth();

      expect(health.status).toBe("degraded");
      expect(health.checks.containerValidated).toBe(true);
    });

    it("should report degraded status when port selection failures exist", async () => {
      const root = new CompositionRoot();
      root.bootstrap();
      root.exposeToModuleApi();

      // Simulate port selection failure via DI
      const mod = (game as any).modules.get("fvtt_relationship_app_module");
      const container = root.getContainer();
      if (!container.ok) throw new Error("Container not bootstrapped");
      const { metricsCollectorToken } = await import("@/tokens/tokenindex");
      const metricsResult = container.value.resolveWithError(metricsCollectorToken);
      if (!metricsResult.ok) throw new Error("MetricsCollector not resolved");
      metricsResult.value.recordPortSelectionFailure(12.331);

      const health = mod.api.getHealth();

      expect(health.status).toBe("degraded");
      expect(health.checks.lastError).toBeDefined();
      expect(health.checks.lastError).toContain("Port selection failures");
      expect(health.checks.lastError).toContain("12.331");
    });

    it("should include port selection information in health check", () => {
      const root = new CompositionRoot();
      root.bootstrap();
      root.exposeToModuleApi();

      const mod = (game as any).modules.get("fvtt_relationship_app_module");
      const health = mod.api.getHealth();

      expect(health.checks.portsSelected).toBeDefined();
      expect(typeof health.checks.portsSelected).toBe("boolean");
    });

    it("should show deprecation warning for deprecated token on first resolve", async () => {
      const root = new CompositionRoot();
      root.bootstrap();

      // Create a deprecated token manually for testing (null replacement)
      const { markAsDeprecated } = await import("@/di_infrastructure/types/deprecated-token");
      const { loggerToken } = await import("@/tokens/tokenindex");
      const deprecatedLoggerToken = markAsDeprecated(
        loggerToken,
        "Test deprecation reason",
        null, // No replacement available
        "2.0.0"
      );

      root.exposeToModuleApi();

      const mod = (game as any).modules.get("fvtt_relationship_app_module");

      // Spy on console.warn
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // First resolve should show warning (without replacement)
      const logger1 = mod.api.resolve(deprecatedLoggerToken);
      expect(logger1).toBeDefined();
      expect(warnSpy).toHaveBeenCalledOnce();
      const warningMsg = warnSpy.mock.calls?.[0]?.[0];
      expect(warningMsg).toBeDefined();
      expect(warningMsg).toContain("DEPRECATED");
      expect(warningMsg).toContain("Test deprecation reason");
      expect(warningMsg).not.toContain('Use "'); // No replacement
      expect(warningMsg).toContain("2.0.0");

      // Second resolve should NOT show warning again (warningShown = true)
      warnSpy.mockClear();
      const logger2 = mod.api.resolve(deprecatedLoggerToken);
      expect(logger2).toBeDefined();
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should resolve deprecated token normally despite warning", async () => {
      const root = new CompositionRoot();
      root.bootstrap();

      const { markAsDeprecated } = await import("@/di_infrastructure/types/deprecated-token");
      const { loggerToken } = await import("@/tokens/tokenindex");
      const deprecatedLoggerToken = markAsDeprecated(loggerToken, "Test", null, "2.0.0");

      root.exposeToModuleApi();

      const mod = (game as any).modules.get("fvtt_relationship_app_module");

      // Suppress console.warn but capture it
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Resolve should work despite deprecation
      const logger = mod.api.resolve(deprecatedLoggerToken);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");

      // Verify warning included "no replacement" message (null replacement)
      expect(warnSpy).toHaveBeenCalled();
      const warningMessage = warnSpy.mock.calls?.[0]?.[0];
      expect(warningMessage).toBeDefined();
      expect(warningMessage).not.toContain('Use "');
      expect(warningMessage).toContain("2.0.0");

      warnSpy.mockRestore();
    });
  });
});
