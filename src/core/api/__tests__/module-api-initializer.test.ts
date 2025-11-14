/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ModuleApiInitializer, DIModuleApiInitializer } from "../module-api-initializer";
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

      expect(tokens.notificationCenterToken).toBeDefined();
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

      // Resolve notification center
      const notifications = mod.api.resolve(mod.api.tokens.notificationCenterToken);
      expect(notifications).toBeDefined();
      expect(typeof notifications.error).toBe("function");

      // Resolve i18n
      const i18n = mod.api.resolve(mod.api.tokens.i18nFacadeToken);
      expect(i18n).toBeDefined();

      // Resolve journal facade
      const journalFacade = mod.api.resolve(mod.api.tokens.foundryJournalFacadeToken);
      expect(journalFacade).toBeDefined();
    });

    it("should prevent channel mutations on public NotificationCenter", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const notifications = mod.api.resolve(mod.api.tokens.notificationCenterToken);

      expect(() => (notifications as unknown as { addChannel: () => void }).addChannel()).toThrow(
        'Property "addChannel" is not accessible via Public API'
      );
      expect(() =>
        (notifications as unknown as { removeChannel: () => void }).removeChannel()
      ).toThrow('Property "removeChannel" is not accessible via Public API');
    });

    it("should prevent settings mutations via public FoundrySettings service", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };
      const settings = mod.api.resolve(mod.api.tokens.foundrySettingsToken);

      expect(() => (settings as unknown as { register: () => void }).register()).toThrow(
        'Property "register" is not accessible via Public API'
      );
      expect(() => (settings as unknown as { set: () => void }).set()).toThrow(
        'Property "set" is not accessible via Public API'
      );
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

      // Verify notification center token is available and registered
      const notificationInfo = Array.from(tokens.values()).find((info: any) =>
        info.description.includes("NotificationCenter")
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

      // Health checks are now auto-registered during configureDependencies
      // No need to eagerly resolve them
      const { metricsCollectorToken } = await import("@/tokens/tokenindex");

      // Simulate port selection failure
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

      // Health checks are now auto-registered during configureDependencies
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
      const { markAsDeprecated } = await import("@/di_infrastructure/types/deprecated-token");
      const { getDeprecationInfo } = await import("@/di_infrastructure/types/deprecated-token");
      const { notificationCenterToken: notificationTokenImport } = await import(
        "@/tokens/tokenindex"
      );

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
      const { markAsDeprecated } = await import("@/di_infrastructure/types/deprecated-token");
      const { notificationCenterToken } = await import("@/tokens/tokenindex");
      const deprecatedNotificationToken = markAsDeprecated(
        notificationCenterToken,
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
      const notifications = mod.api.resolve(mod.api.tokens.notificationCenterToken);

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

      const notificationsResult = mod.api.resolveWithError(mod.api.tokens.notificationCenterToken);
      expect(notificationsResult.ok).toBe(true);
      if (notificationsResult.ok) {
        expect(notificationsResult.value).toBeDefined();
        expect(typeof notificationsResult.value.error).toBe("function");
      }
    });

    it("should provide usable notification center via resolveWithError", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const notificationsResult = mod.api.resolveWithError(mod.api.tokens.notificationCenterToken);
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

      const i18nResult = mod.api.resolveWithError(mod.api.tokens.i18nFacadeToken);
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
      const { createInjectionToken } = await import("@/di_infrastructure/tokenutilities");
      const { markAsApiSafe } = await import("@/di_infrastructure/types/api-safe-token");

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
      const notifications = mod.api.resolve(mod.api.tokens.notificationCenterToken);

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

      const notificationsResult = mod.api.resolveWithError(mod.api.tokens.notificationCenterToken);
      expect(notificationsResult.ok).toBe(true);
      if (notificationsResult.ok) {
        expect(notificationsResult.value).toBeDefined();
        expect(typeof notificationsResult.value.error).toBe("function");
      }
    });

    it("should provide usable notification center via resolveWithError", () => {
      const mod = game.modules?.get("fvtt_relationship_app_module") as { id: string; api: any };

      const notificationsResult = mod.api.resolveWithError(mod.api.tokens.notificationCenterToken);
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

      const i18nResult = mod.api.resolveWithError(mod.api.tokens.i18nFacadeToken);
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
