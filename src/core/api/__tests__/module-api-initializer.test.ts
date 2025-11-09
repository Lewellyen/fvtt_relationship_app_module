/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ModuleApiInitializer } from "../module-api-initializer";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/config/dependencyconfig";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("ModuleApiInitializer", () => {
  let container: ServiceContainer;
  let initializer: ModuleApiInitializer;

  beforeEach(() => {
    // Setup Foundry game mock (type-safe)
    const mockModule = {
      id: "fvtt_relationship_app_module",
      api: undefined as unknown,
    };

    vi.stubGlobal("game", {
      version: "13.291",
      modules: new Map([["fvtt_relationship_app_module", mockModule]]),
    });

    // Create and bootstrap container
    container = ServiceContainer.createRoot();
    const configResult = configureDependencies(container);
    expectResultOk(configResult);

    // Create initializer
    initializer = new ModuleApiInitializer();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("expose", () => {
    it("should return err when game.modules not available", () => {
      vi.stubGlobal("game", undefined);

      const result = initializer.expose(container);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Game modules not available");
      }
    });

    it("should return err when game.modules is missing", () => {
      vi.stubGlobal("game", { version: "13.291" }); // No modules

      const result = initializer.expose(container);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Game modules not available");
      }
    });

    it("should return err when module not found", () => {
      vi.stubGlobal("game", {
        version: "13.291",
        modules: new Map(), // Empty map - module not found
      });

      const result = initializer.expose(container);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found in game.modules");
      }
    });

    it("should expose API successfully", () => {
      const result = initializer.expose(container);

      expectResultOk(result);

      // Verify API is exposed (type-safe)
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      expect(mod.api).toBeDefined();
      expect(mod.api.version).toBeDefined();
      expect(mod.api.resolve).toBeDefined();
      expect(mod.api.getAvailableTokens).toBeDefined();
      expect(mod.api.getMetrics).toBeDefined();
      expect(mod.api.getHealth).toBeDefined();
      expect(mod.api.tokens).toBeDefined();
    });
  });

  describe("API - tokens", () => {
    beforeEach(() => {
      const result = initializer.expose(container);
      expectResultOk(result);
    });

    it("should expose well-known tokens", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
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
    });

    it("should resolve services via tokens", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      // Resolve logger
      const logger = mod.api.resolve(mod.api.tokens.loggerToken);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");

      // Resolve i18n
      const i18n = mod.api.resolve(mod.api.tokens.i18nFacadeToken);
      expect(i18n).toBeDefined();

      // Resolve journal facade
      const journalFacade = mod.api.resolve(mod.api.tokens.foundryJournalFacadeToken);
      expect(journalFacade).toBeDefined();
    });
  });

  describe("API - getAvailableTokens", () => {
    beforeEach(() => {
      const result = initializer.expose(container);
      expectResultOk(result);
    });

    it("should return Map of available tokens", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const tokens = mod.api.getAvailableTokens();

      expect(tokens).toBeInstanceOf(Map);
      expect(tokens.size).toBeGreaterThan(0);
    });

    it("should include registration status for tokens", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const tokens = mod.api.getAvailableTokens();

      // Verify logger token is available and registered
      const loggerInfo = Array.from(tokens.values()).find((info: any) =>
        info.description.includes("Logger")
      );
      expect(loggerInfo).toBeDefined();
      if (loggerInfo) {
        expect((loggerInfo as any).isRegistered).toBe(true);
      }
    });
  });

  describe("API - getMetrics", () => {
    beforeEach(() => {
      const result = initializer.expose(container);
      expectResultOk(result);
    });

    it("should return metrics snapshot", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const metrics = mod.api.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.containerResolutions).toBe("number");
      expect(typeof metrics.resolutionErrors).toBe("number");
      expect(typeof metrics.avgResolutionTimeMs).toBe("number");
    });
  });

  describe("API - getHealth", () => {
    beforeEach(() => {
      const result = initializer.expose(container);
      expectResultOk(result);
    });

    it("should report healthy status when container validated", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const health = mod.api.getHealth();

      expect(health.status).toBe("healthy");
      expect(health.checks.containerValidated).toBe(true);
      expect(health.timestamp).toBeDefined();
    });

    it("should report degraded status when resolution errors exist", async () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      // Simulate resolution error by recording it in metrics
      const { metricsCollectorToken } = await import("@/tokens/tokenindex");
      const tokensModule = await import("@/di_infrastructure/tokenutilities");
      const metricsResult = container.resolveWithError(metricsCollectorToken);
      if (!metricsResult.ok) throw new Error("MetricsCollector not resolved");
      const token = tokensModule.createInjectionToken("TestError");
      metricsResult.value.recordResolution(token, 0, false);

      const health = mod.api.getHealth();

      expect(health.status).toBe("degraded");
      expect(health.checks.containerValidated).toBe(true);
    });

    it("should report degraded status when port selection failures exist", async () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      // Simulate port selection failure
      const { metricsCollectorToken } = await import("@/tokens/tokenindex");
      const metricsResult = container.resolveWithError(metricsCollectorToken);
      if (!metricsResult.ok) throw new Error("MetricsCollector not resolved");
      metricsResult.value.recordPortSelectionFailure(12.331);

      const health = mod.api.getHealth();

      expect(health.status).toBe("degraded");
      expect(health.checks.lastError).toBeDefined();
      expect(health.checks.lastError).toContain("Port selection failures");
      expect(health.checks.lastError).toContain("12.331");
    });

    it("should include port selection information", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const health = mod.api.getHealth();

      expect(health.checks.portsSelected).toBeDefined();
      expect(typeof health.checks.portsSelected).toBe("boolean");
    });
  });

  describe("API - Deprecation", () => {
    beforeEach(() => {
      const result = initializer.expose(container);
      expectResultOk(result);
    });

    it("should show deprecation warning for deprecated token on first resolve", async () => {
      // Create a deprecated token manually for testing
      const { markAsDeprecated } = await import("@/di_infrastructure/types/deprecated-token");
      const { loggerToken } = await import("@/tokens/tokenindex");
      const deprecatedLoggerToken = markAsDeprecated(
        loggerToken,
        "Test deprecation reason",
        null,
        "2.0.0"
      );

      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      // Spy on console.warn
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // First resolve should show warning
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

    it("should resolve deprecated token normally", async () => {
      const { markAsDeprecated } = await import("@/di_infrastructure/types/deprecated-token");
      const { loggerToken } = await import("@/tokens/tokenindex");
      const deprecatedLoggerToken = markAsDeprecated(loggerToken, "Test", null, "2.0.0");

      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      // Suppress console.warn
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Resolve should work despite deprecation
      const logger = mod.api.resolve(deprecatedLoggerToken);
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");

      warnSpy.mockRestore();
    });
  });

  describe("API - ReadOnly Wrappers", () => {
    beforeEach(() => {
      const result = initializer.expose(container);
      expectResultOk(result);
    });

    it("should apply readonly wrapper to logger", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const logger = mod.api.resolve(mod.api.tokens.loggerToken);

      // Logging methods should work
      expect(() => logger.info("test")).not.toThrow();

      // setMinLevel should be blocked
      expect(() => (logger as any).setMinLevel(0)).toThrow("setMinLevel");
    });

    it("should apply readonly wrapper to i18n", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const i18n = mod.api.resolve(mod.api.tokens.i18nFacadeToken);

      // Read methods should work
      expect(() => i18n.translate("test")).not.toThrow();
      expect(() => i18n.has("test")).not.toThrow();

      // Internal properties should be blocked
      expect(() => {
        (i18n as any).internalState = {};
      }).toThrow("Cannot modify");
    });
  });

  describe("API - resolveWithError", () => {
    beforeEach(() => {
      const result = initializer.expose(container);
      expectResultOk(result);
    });

    it("should resolve services with Result pattern", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const loggerResult = mod.api.resolveWithError(mod.api.tokens.loggerToken);
      expect(loggerResult.ok).toBe(true);
      if (loggerResult.ok) {
        expect(loggerResult.value).toBeDefined();
        expect(typeof loggerResult.value.info).toBe("function");
      }
    });

    it("should apply readonly wrapper to logger via resolveWithError", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const loggerResult = mod.api.resolveWithError(mod.api.tokens.loggerToken);
      expect(loggerResult.ok).toBe(true);

      if (loggerResult.ok) {
        const logger = loggerResult.value;
        // Logging should work
        expect(() => logger.info("test")).not.toThrow();
        // setMinLevel should be blocked
        expect(() => (logger as any).setMinLevel(0)).toThrow("setMinLevel");
      }
    });

    it("should apply readonly wrapper to i18n via resolveWithError", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const i18nResult = mod.api.resolveWithError(mod.api.tokens.i18nFacadeToken);
      expect(i18nResult.ok).toBe(true);

      if (i18nResult.ok) {
        const i18n = i18nResult.value;
        // Read methods should work
        expect(() => i18n.translate("test")).not.toThrow();
        // Internal properties should be blocked
        expect(() => {
          (i18n as any).internalState = {};
        }).toThrow("Cannot modify");
      }
    });

    it("should show deprecation warning for deprecated token", async () => {
      const { markAsDeprecated } = await import("@/di_infrastructure/types/deprecated-token");
      const { loggerToken } = await import("@/tokens/tokenindex");
      const deprecatedLoggerToken = markAsDeprecated(
        loggerToken,
        "Test deprecation",
        null,
        "2.0.0"
      );

      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const result = mod.api.resolveWithError(deprecatedLoggerToken);
      expect(result.ok).toBe(true);
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should resolve non-wrapped services (FoundryGame, etc.)", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      // Resolve a non-wrapped service (FoundryGame doesn't get wrapped)
      const foundryGameResult = mod.api.resolveWithError(mod.api.tokens.foundryGameToken);
      expect(foundryGameResult.ok).toBe(true);
      if (foundryGameResult.ok) {
        expect(foundryGameResult.value).toBeDefined();
        expect(typeof foundryGameResult.value.getJournalEntries).toBe("function");
      }
    });

    it("should return err Result for unregistered token", async () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      // Create a token that is NOT registered
      const { createInjectionToken } = await import("@/di_infrastructure/tokenutilities");
      const { markAsApiSafe } = await import("@/di_infrastructure/types/api-safe-token");

      // Use 'any' as type parameter - we're testing unregistered token error handling
      // Type constraints don't matter for this specific test scenario
      const unregisteredToken = markAsApiSafe(createInjectionToken<any>("UnregisteredService"));

      const result = mod.api.resolveWithError(unregisteredToken);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeDefined();
        expect(result.error.code).toBeDefined();
        expect(result.error.message).toBeDefined();
      }
    });
  });
});
