import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ModuleApiInitializer,
  DIModuleApiInitializer,
} from "@/framework/core/api/module-api-initializer";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { createTestContainer } from "@/test/utils/test-helpers";
import { configureDependencies } from "@/framework/config/dependencyconfig";
import { expectResultOk } from "@/test/utils/test-helpers";
import type { MetricsCollector } from "@/infrastructure/observability/metrics-collector";

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
    container = createTestContainer();
    const configResult = configureDependencies(container);
    expectResultOk(configResult);

    // Create initializer (no dependencies)
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

      expect(tokens.platformContainerPortToken).toBeDefined();
      expect(tokens.platformLoggingPortToken).toBeDefined();
      expect(tokens.platformMetricsSnapshotPortToken).toBeDefined();
      expect(tokens.platformSettingsPortToken).toBeDefined();
      expect(tokens.platformSettingsRegistrationPortToken).toBeDefined();
      expect(tokens.platformI18nPortToken).toBeDefined();
      expect(tokens.platformNotificationPortToken).toBeDefined();
      expect(tokens.platformUIPortToken).toBeDefined();
      expect(tokens.platformJournalDirectoryUiPortToken).toBeDefined();
      expect(tokens.platformUINotificationPortToken).toBeDefined();
      expect(tokens.platformValidationPortToken).toBeDefined();
      expect(tokens.platformContextMenuRegistrationPortToken).toBeDefined();
      expect(tokens.platformUuidUtilsPortToken).toBeDefined();
      expect(tokens.platformObjectUtilsPortToken).toBeDefined();
      expect(tokens.platformHtmlUtilsPortToken).toBeDefined();
      expect(tokens.platformAsyncUtilsPortToken).toBeDefined();
    });

    it("should resolve services via tokens", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      // Resolve notification port
      const notifications = mod.api.resolve(mod.api.tokens.platformNotificationPortToken);
      expect(notifications).toBeDefined();
      expect(typeof notifications.error).toBe("function");

      // Resolve i18n
      const i18n = mod.api.resolve(mod.api.tokens.platformI18nPortToken);
      expect(i18n).toBeDefined();
    });

    it("should prevent channel mutations on public PlatformNotificationPort", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const notifications = mod.api.resolve(mod.api.tokens.platformNotificationPortToken);

      expect(() => (notifications as unknown as { addChannel: () => void }).addChannel()).toThrow(
        'Property "addChannel" is not accessible via Public API'
      );
      expect(() =>
        (notifications as unknown as { removeChannel: () => void }).removeChannel()
      ).toThrow('Property "removeChannel" is not accessible via Public API');
    });

    it("should prevent settings mutations via public PlatformSettingsRegistrationPort", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const settings = mod.api.resolve(mod.api.tokens.platformSettingsRegistrationPortToken);

      expect(() =>
        (settings as unknown as { registerSetting: () => void }).registerSetting()
      ).toThrow('Property "registerSetting" is not accessible via Public API');
      expect(() =>
        (settings as unknown as { setSettingValue: () => void }).setSettingValue()
      ).toThrow('Property "setSettingValue" is not accessible via Public API');
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

      // Verify notification port token is available and registered
      const notificationInfo = Array.from(tokens.values()).find((info: any) =>
        info.description.includes("PlatformNotificationPort")
      );
      expect(notificationInfo).toBeDefined();
      if (notificationInfo) {
        expect((notificationInfo as any).isRegistered).toBe(true);
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

    it("should return empty metrics when MetricsCollector is not registered", async () => {
      // Create a container without MetricsCollector
      const emptyContainer = createTestContainer();
      const emptyInitializer = new ModuleApiInitializer();
      const result = emptyInitializer.expose(emptyContainer);
      expectResultOk(result);

      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const metrics = mod.api.getMetrics();

      expect(metrics).toEqual({
        containerResolutions: 0,
        resolutionErrors: 0,
        avgResolutionTimeMs: 0,
        portSelections: {},
        portSelectionFailures: {},
        cacheHitRate: 0,
      });
    });
  });

  describe("DI integration", () => {
    it("base class exposes empty dependency list", () => {
      expect(ModuleApiInitializer.dependencies).toHaveLength(0);
    });

    it("wrapper mirrors empty dependencies", () => {
      expect(DIModuleApiInitializer.dependencies).toHaveLength(0);
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

      // Health checks are now auto-registered during configureDependencies
      // No need to eagerly resolve them
      const { metricsCollectorToken } =
        await import("@/infrastructure/shared/tokens/observability/metrics-collector.token");
      const tokensModule = await import("@/infrastructure/di/token-factory");
      const metricsResult = container.resolveWithError<MetricsCollector>(metricsCollectorToken);
      if (!metricsResult.ok) throw new Error("MetricsCollector not resolved");
      const token = tokensModule.createInjectionToken("TestError");
      const metricsCollector = metricsResult.value;
      metricsCollector.recordResolution(token, 0, false);

      const health = mod.api.getHealth();

      expect(health.status).toBe("degraded");
      expect(health.checks.containerValidated).toBe(true);
    });

    it("should report degraded status when port selection failures exist", async () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      // Health checks are now auto-registered during configureDependencies
      // No need to eagerly resolve them
      const { metricsCollectorToken } =
        await import("@/infrastructure/shared/tokens/observability/metrics-collector.token");

      // Simulate port selection failure
      const metricsResult = container.resolveWithError<MetricsCollector>(metricsCollectorToken);
      if (!metricsResult.ok) throw new Error("MetricsCollector not resolved");
      const metricsCollector = metricsResult.value;
      metricsCollector.recordPortSelectionFailure(12.331);

      const health = mod.api.getHealth();

      expect(health.status).toBe("degraded");
      expect(health.checks.lastError).toBeDefined();
      expect(health.checks.lastError).toContain("Port selection failures");
      expect(health.checks.lastError).toContain("12.331");
    });

    it("should include port selection information", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      // Health checks are now auto-registered during configureDependencies
      const health = mod.api.getHealth();

      expect(health.checks.portsSelected).toBeDefined();
      expect(typeof health.checks.portsSelected).toBe("boolean");
    });

    it("should return fallback health status when ModuleHealthService is not registered", () => {
      // Create a container without ModuleHealthService
      const emptyContainer = createTestContainer();
      const emptyInitializer = new ModuleApiInitializer();
      const result = emptyInitializer.expose(emptyContainer);
      expectResultOk(result);

      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const health = mod.api.getHealth();

      expect(health.status).toBe("unhealthy");
      expect(health.checks.containerValidated).toBe(false);
      expect(health.checks.portsSelected).toBe(false);
      expect(health.checks.lastError).toBe("ModuleHealthService not available");
      expect(health.timestamp).toBeDefined();
    });
  });

  describe("API - Deprecation", () => {
    beforeEach(() => {
      const result = initializer.expose(container);
      expectResultOk(result);
    });

    it("should show deprecation warning for deprecated token on first resolve", async () => {
      const { markAsDeprecated } =
        await import("@/infrastructure/di/types/utilities/deprecated-token");
      const { getDeprecationInfo } =
        await import("@/infrastructure/di/types/utilities/deprecated-token");
      const { platformNotificationPortToken: notificationTokenImport } =
        await import("@/application/tokens/domain-ports.tokens");

      const existingInfo = getDeprecationInfo(notificationTokenImport);
      if (existingInfo) {
        existingInfo.warningShown = false;
      }

      const deprecatedNotificationToken = markAsDeprecated(
        notificationTokenImport,
        "Test deprecation reason",
        null,
        "2.0.0"
      );

      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const notifications1 = mod.api.resolve(deprecatedNotificationToken);
      expect(notifications1).toBeDefined();
      expect(warnSpy).toHaveBeenCalledOnce();
      const warningMsg = warnSpy.mock.calls?.[0]?.[0];
      expect(warningMsg).toBeDefined();
      expect(warningMsg).toContain("DEPRECATED");
      expect(warningMsg).toContain("Test deprecation reason");
      expect(warningMsg).toContain("2.0.0");
      expect(warningMsg).not.toContain("Use");

      warnSpy.mockClear();
      const notifications2 = mod.api.resolve(deprecatedNotificationToken);
      expect(notifications2).toBeDefined();
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("should resolve deprecated token normally", async () => {
      const { markAsDeprecated } =
        await import("@/infrastructure/di/types/utilities/deprecated-token");
      const { platformNotificationPortToken } =
        await import("@/application/tokens/domain-ports.tokens");
      const deprecatedNotificationToken = markAsDeprecated(
        platformNotificationPortToken,
        "Test",
        null,
        "2.0.0"
      );

      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const resolvedNotification = mod.api.resolve(deprecatedNotificationToken);
      expect(resolvedNotification).toBeDefined();
      expect(typeof resolvedNotification.error).toBe("function");
      expect(typeof resolvedNotification.info).toBe("function");
    });
  });

  describe("API - ReadOnly Wrappers", () => {
    beforeEach(() => {
      const result = initializer.expose(container);
      expectResultOk(result);
    });

    it("should expose notification center with read-only surface", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const notifications = mod.api.resolve(mod.api.tokens.platformNotificationPortToken);

      expect(() =>
        notifications.error("test", { code: "API_DEBUG", message: "Triggered from test" })
      ).not.toThrow();

      expect(() => (notifications as any).addChannel("TestChannel")).toThrow(
        'Property "addChannel" is not accessible via Public API'
      );

      const channelNamesResult = notifications.getChannelNames();
      expect(channelNamesResult.ok).toBe(true);

      expect(() => (notifications as any).removeChannel("TestChannel")).toThrow(
        'Property "removeChannel" is not accessible via Public API'
      );
    });

    it("should apply readonly wrapper to i18n", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const i18n = mod.api.resolve(mod.api.tokens.platformI18nPortToken);

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

      const notificationsResult = mod.api.resolveWithError(
        mod.api.tokens.platformNotificationPortToken
      );
      expect(notificationsResult.ok).toBe(true);
      if (notificationsResult.ok) {
        expect(notificationsResult.value).toBeDefined();
        expect(typeof notificationsResult.value.error).toBe("function");
      }
    });

    it("should provide usable notification center via resolveWithError", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const notificationsResult = mod.api.resolveWithError(
        mod.api.tokens.platformNotificationPortToken
      );
      expect(notificationsResult.ok).toBe(true);

      if (notificationsResult.ok) {
        const notifications = notificationsResult.value;
        expect(() =>
          notifications.warn("resolveWithError test", { code: "WARN", message: "Test" })
        ).not.toThrow();
      }
    });

    it("should apply readonly wrapper to i18n via resolveWithError", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const i18nResult = mod.api.resolveWithError(mod.api.tokens.platformI18nPortToken);
      expect(i18nResult.ok).toBe(true);

      if (i18nResult.ok) {
        const i18n = i18nResult.value;
        // Read operations should work
        expect(() => i18n.translate("test")).not.toThrow();

        // Internal mutation should not be allowed
        expect(() => {
          (i18n as any).internalState = {};
        }).toThrow("Cannot modify");
      }
    });

    it("should return error for unknown tokens via resolveWithError", async () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const { createInjectionToken } = await import("@/infrastructure/di/token-factory");
      const { markAsApiSafe } = await import("@/infrastructure/di/types");

      const unknownToken = markAsApiSafe(createInjectionToken("UnknownService"));

      const result = mod.api.resolveWithError(unknownToken);
      expect(result.ok).toBe(false);
    });
  });

  describe("API - ReadOnly Wrappers", () => {
    beforeEach(() => {
      const result = initializer.expose(container);
      expectResultOk(result);
    });

    it("should expose notification center with read-only surface", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const notifications = mod.api.resolve(mod.api.tokens.platformNotificationPortToken);

      expect(() =>
        notifications.error("test", { code: "API_DEBUG", message: "Triggered from test" })
      ).not.toThrow();

      const tempChannel = {
        name: "TestChannel",
        canHandle: () => true,
        send: () => ({ ok: true, value: undefined }) as const,
      };

      expect(() => notifications.addChannel(tempChannel)).toThrow(
        'Property "addChannel" is not accessible via Public API'
      );
      expect(notifications.getChannelNames()).not.toContain("TestChannel");
      expect(() => notifications.removeChannel("TestChannel")).toThrow(
        'Property "removeChannel" is not accessible via Public API'
      );
    });

    it("should apply readonly wrapper to i18n", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const i18n = mod.api.resolve(mod.api.tokens.platformI18nPortToken);

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

      const notificationsResult = mod.api.resolveWithError(
        mod.api.tokens.platformNotificationPortToken
      );
      expect(notificationsResult.ok).toBe(true);
      if (notificationsResult.ok) {
        expect(notificationsResult.value).toBeDefined();
        expect(typeof notificationsResult.value.error).toBe("function");
      }
    });

    it("should provide usable notification center via resolveWithError", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const notificationsResult = mod.api.resolveWithError(
        mod.api.tokens.platformNotificationPortToken
      );
      expect(notificationsResult.ok).toBe(true);

      if (notificationsResult.ok) {
        const notifications = notificationsResult.value;
        expect(() =>
          notifications.warn("resolveWithError test", { code: "WARN", message: "Test" })
        ).not.toThrow();
      }
    });

    it("should apply readonly wrapper to i18n via resolveWithError", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const i18nResult = mod.api.resolveWithError(mod.api.tokens.platformI18nPortToken);
      expect(i18nResult.ok).toBe(true);

      if (i18nResult.ok) {
        const i18n = i18nResult.value;
        // Read operations should work
        expect(() => i18n.translate("test")).not.toThrow();

        // Internal mutation should not be allowed
        expect(() => {
          (i18n as any).internalState = {};
        }).toThrow("Cannot modify");
      }
    });
  });
});
