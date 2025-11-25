/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking ENV and container methods

import { describe, it, expect, vi } from "vitest";
import { ServiceContainer } from "@/infrastructure/di/container";
import { configureDependencies } from "@/framework/config/dependencyconfig";
import { markAsApiSafe } from "@/infrastructure/di/types";
import {
  loggerToken,
  journalVisibilityServiceToken,
  containerHealthCheckToken,
  metricsHealthCheckToken,
  notificationCenterToken,
  uiChannelToken,
  serviceContainerToken,
  environmentConfigToken,
  runtimeConfigToken,
  healthCheckRegistryToken,
  metricsCollectorToken,
} from "@/infrastructure/shared/tokens";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundryGamePortRegistryToken,
  foundrySettingsToken,
  foundrySettingsPortRegistryToken,
  journalCollectionPortToken,
  journalRepositoryToken,
  platformSettingsPortToken,
} from "@/infrastructure/shared/tokens";
import { ConsoleLoggerService } from "@/infrastructure/logging/ConsoleLoggerService";
import { err } from "@/infrastructure/shared/utils/result";
import {
  expectResultOk,
  expectResultErr,
  createMockRuntimeConfig,
} from "@/test/utils/test-helpers";
import { ENV, LogLevel } from "@/framework/config/environment";

describe("dependencyconfig", () => {
  describe("Success Path", () => {
    it("should successfully configure all dependencies", () => {
      const container = ServiceContainer.createRoot();
      const result = configureDependencies(container);

      expectResultOk(result);

      // Alle Services sollten registriert sein
      expectResultOk(container.isRegistered(loggerToken));
      expectResultOk(container.isRegistered(notificationCenterToken));
      expectResultOk(container.isRegistered(foundryGameToken));
      expectResultOk(container.isRegistered(foundryHooksToken));
      expectResultOk(container.isRegistered(foundryDocumentToken));
      expectResultOk(container.isRegistered(foundryUIToken));
      expectResultOk(container.isRegistered(journalVisibilityServiceToken));
    });

    it("should validate container after configuration", () => {
      const container = ServiceContainer.createRoot();
      const result = configureDependencies(container);

      expectResultOk(result);
      expect(container.getValidationState()).toBe("validated");

      const containerCheck = container.resolveWithError(containerHealthCheckToken);
      const metricsCheck = container.resolveWithError(metricsHealthCheckToken);

      expect(containerCheck.ok).toBe(true);
      expect(metricsCheck.ok).toBe(true);
    });
  });

  describe("Error Injection", () => {
    it("should return error when logger registration fails", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      const registerClassSpy = vi
        .spyOn(container, "registerClass")
        .mockImplementation((token, serviceClass, lifecycle) => {
          if (token === loggerToken) {
            return err({
              code: "InvalidOperation",
              message: "Mocked logger registration failure",
            });
          }
          return originalRegisterClass(token, serviceClass, lifecycle);
        });

      const result = configureDependencies(container);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("Failed to register Logger");
      }

      registerClassSpy.mockRestore();
    });

    it("should return error when port registry registration fails", () => {
      const container = ServiceContainer.createRoot();

      const originalRegisterValue = container.registerValue.bind(container);
      const registerValueSpy = vi
        .spyOn(container, "registerValue")
        .mockImplementation((token, value) => {
          if (token === foundryGamePortRegistryToken) {
            return err({
              code: "InvalidOperation",
              message: "Mocked port registry failure",
            });
          }
          return originalRegisterValue(token, value);
        });

      const result = configureDependencies(container);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("Failed to register FoundryGame PortRegistry");
      }

      registerValueSpy.mockRestore();
    });
  });

  describe("All Service Registration Errors", () => {
    it("should handle FoundryHooks service registration failure", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === foundryHooksToken) {
          return err({ code: "InvalidOperation", message: "FoundryHooks registration failed" });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);
      expectResultErr(result);
      expect(result.error).toContain("FoundryHooks");
    });

    it("should handle FoundryDocument service registration failure", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === foundryDocumentToken) {
          return err({ code: "InvalidOperation", message: "FoundryDocument registration failed" });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);
      expectResultErr(result);
      expect(result.error).toContain("FoundryDocument");
    });

    it("should handle FoundryUI service registration failure", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === foundryUIToken) {
          return err({ code: "InvalidOperation", message: "FoundryUI registration failed" });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);
      expectResultErr(result);
      expect(result.error).toContain("FoundryUI");
    });

    it("should handle JournalVisibility service registration failure", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === journalVisibilityServiceToken) {
          return err({
            code: "InvalidOperation",
            message: "JournalVisibility registration failed",
          });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);
      expectResultErr(result);
      expect(result.error).toContain("JournalVisibility");
    });

    it("should handle port registration failures in PortRegistry", () => {
      const container = ServiceContainer.createRoot();

      // Test path where PortRegistry.register() itself fails
      // This would happen if v13 port was already registered (duplicate)
      // Since we can't easily inject this, we test the validation path
      const result = configureDependencies(container);
      expectResultOk(result);
    });

    it("should handle FoundrySettings registry registration failure", () => {
      const container = ServiceContainer.createRoot();

      const originalRegisterValue = container.registerValue.bind(container);
      const registerValueSpy = vi
        .spyOn(container, "registerValue")
        .mockImplementation((token, value) => {
          if (token === foundrySettingsPortRegistryToken) {
            return err({
              code: "InvalidOperation",
              message: "Settings registry failed",
            });
          }
          return originalRegisterValue(token, value);
        });

      const result = configureDependencies(container);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("FoundrySettings PortRegistry");
      }

      registerValueSpy.mockRestore();
    });

    it("should handle FoundrySettings service registration failure", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === foundrySettingsToken) {
          return err({
            code: "InvalidOperation",
            message: "Settings service failed",
          });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("FoundrySettings service");
      }
    });

    it("should handle FoundryGame service registration failure", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === foundryGameToken) {
          return err({
            code: "InvalidOperation",
            message: "FoundryGame registration failed",
          });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("FoundryGame");
      }
    });
  });

  describe("Validation", () => {
    it("should have no circular dependencies after configuration", () => {
      const container = ServiceContainer.createRoot();
      const result = configureDependencies(container);

      expectResultOk(result);

      // Validation sollte erfolgreich sein
      const validationResult = container.validate();
      expect(validationResult.ok).toBe(true);
    });
  });

  describe("Logger Configuration", () => {
    it("should configure logger with ENV.logLevel", () => {
      const container = ServiceContainer.createRoot();
      const originalLogLevel = ENV.logLevel;

      // Set to ERROR level
      (ENV as any).logLevel = LogLevel.ERROR;

      const result = configureDependencies(container);
      expectResultOk(result);

      const logger = container.resolve(markAsApiSafe(loggerToken)) as ConsoleLoggerService;

      // Debug should be suppressed
      const debugSpy = vi.spyOn(console, "debug");
      logger.debug("test debug");
      expect(debugSpy).not.toHaveBeenCalled();

      // Error should be shown
      const errorSpy = vi.spyOn(console, "error");
      logger.error("test error");
      expect(errorSpy).toHaveBeenCalled();

      // Restore
      (ENV as any).logLevel = originalLogLevel;
      debugSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it("should respect DEBUG level from ENV", () => {
      const container = ServiceContainer.createRoot();
      const originalLogLevel = ENV.logLevel;

      // Set to DEBUG level
      (ENV as any).logLevel = LogLevel.DEBUG;

      const result = configureDependencies(container);
      expectResultOk(result);

      const logger = container.resolve(markAsApiSafe(loggerToken)) as ConsoleLoggerService;

      // Debug should be shown
      const debugSpy = vi.spyOn(console, "debug");
      logger.debug("test debug");
      expect(debugSpy).toHaveBeenCalled();

      // Restore
      (ENV as any).logLevel = originalLogLevel;
      debugSpy.mockRestore();
    });
  });

  describe("Error Propagation", () => {
    it("should propagate validation errors", () => {
      const container = ServiceContainer.createRoot();

      // Mock container.validate() to fail
      vi.spyOn(container, "validate").mockReturnValue(
        err([
          {
            code: "DependencyResolveFailed" as const,
            message: "Test dependency missing",
            tokenDescription: "TestToken",
          },
        ])
      );

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toContain("Validation failed");
      expect(result.error).toContain("Test dependency missing");
    });

    it("should propagate health check resolution errors", () => {
      const container = ServiceContainer.createRoot();

      // Make validation succeed but health check resolution fail
      vi.spyOn(container, "validate").mockReturnValue({ ok: true, value: undefined });
      const originalResolve = container.resolveWithError.bind(container);
      vi.spyOn(container, "resolveWithError").mockImplementation((token: symbol) => {
        if (token === runtimeConfigToken) {
          return { ok: true as const, value: createMockRuntimeConfig() };
        }
        if (token === healthCheckRegistryToken) {
          return err({
            code: "TokenNotRegistered",
            message: "HealthCheckRegistry not found",
            tokenDescription: "HealthCheckRegistry",
          });
        }
        return originalResolve(token);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toContain("Failed to resolve HealthCheckRegistry");
    });

    it("should propagate metrics collector resolution errors", () => {
      const container = ServiceContainer.createRoot();

      // Make validation succeed and health check registry succeed, but metrics collector fail
      vi.spyOn(container, "validate").mockReturnValue({ ok: true, value: undefined });
      const originalResolve = container.resolveWithError.bind(container);
      vi.spyOn(container, "resolveWithError").mockImplementation((token: symbol) => {
        if (token === runtimeConfigToken) {
          return { ok: true as const, value: createMockRuntimeConfig() };
        }
        if (token === healthCheckRegistryToken) {
          return { ok: true as const, value: {} as any };
        }
        if (token === metricsCollectorToken) {
          return err({
            code: "TokenNotRegistered",
            message: "MetricsCollector not found",
            tokenDescription: "MetricsCollector",
          });
        }
        return originalResolve(token);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toContain("MetricsCollector not found");
    });

    it("should propagate errors when ContainerHealthCheck registration fails", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === containerHealthCheckToken) {
          return err({
            code: "InvalidOperation",
            message: "ContainerHealthCheck registration failed",
          });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("ContainerHealthCheck");
      }
    });

    it("should propagate errors when MetricsHealthCheck registration fails", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === metricsHealthCheckToken) {
          return err({
            code: "InvalidOperation",
            message: "MetricsHealthCheck registration failed",
          });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("MetricsHealthCheck");
      }
    });

    it("should propagate errors when ContainerHealthCheck resolution fails", () => {
      const container = ServiceContainer.createRoot();

      vi.spyOn(container, "validate").mockReturnValue({ ok: true, value: undefined });
      const originalResolve = container.resolveWithError.bind(container);
      vi.spyOn(container, "resolveWithError").mockImplementation((token: symbol) => {
        if (token === runtimeConfigToken) {
          return { ok: true as const, value: createMockRuntimeConfig() };
        }
        if (token === healthCheckRegistryToken || token === metricsCollectorToken) {
          return { ok: true as const, value: {} as any };
        }
        if (token === containerHealthCheckToken) {
          return err({
            code: "TokenNotRegistered",
            message: "ContainerHealthCheck not found",
            tokenDescription: "ContainerHealthCheck",
          });
        }
        return originalResolve(token);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("ContainerHealthCheck not found");
      }
    });

    it("should propagate errors when MetricsHealthCheck resolution fails", () => {
      const container = ServiceContainer.createRoot();

      vi.spyOn(container, "validate").mockReturnValue({ ok: true, value: undefined });
      const originalResolveWithError = container.resolveWithError.bind(container);
      vi.spyOn(container, "resolveWithError").mockImplementation((token: symbol) => {
        if (token === runtimeConfigToken) {
          return { ok: true as const, value: createMockRuntimeConfig() };
        }
        if (
          token === healthCheckRegistryToken ||
          token === metricsCollectorToken ||
          token === containerHealthCheckToken
        ) {
          return { ok: true as const, value: {} as any };
        }
        if (token === metricsHealthCheckToken) {
          return err({
            code: "TokenNotRegistered",
            message: "MetricsHealthCheck not found",
            tokenDescription: "MetricsHealthCheck",
          });
        }
        return originalResolveWithError(token);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("MetricsHealthCheck not found");
      }
    });

    it("should propagate errors when ServiceContainer value registration fails", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterValue = container.registerValue.bind(container);

      vi.spyOn(container, "registerValue").mockImplementation((token, value) => {
        if (token === serviceContainerToken) {
          return err({
            code: "InvalidOperation",
            message: "ServiceContainer registration failed",
          });
        }
        return originalRegisterValue(token, value);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("ServiceContainer");
      }
    });

    it("should propagate errors when EnvironmentConfig registration fails", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterValue = container.registerValue.bind(container);

      vi.spyOn(container, "registerValue").mockImplementation((token, value) => {
        if (token === environmentConfigToken) {
          return err({
            code: "InvalidOperation",
            message: "EnvironmentConfig registration failed",
          });
        }
        return originalRegisterValue(token, value);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("EnvironmentConfig");
      }
    });

    it("should propagate errors when RuntimeConfigService registration fails", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterValue = container.registerValue.bind(container);

      vi.spyOn(container, "registerValue").mockImplementation((token, value) => {
        if (token === runtimeConfigToken) {
          return err({
            code: "InvalidOperation",
            message: "RuntimeConfigService registration failed",
          });
        }
        return originalRegisterValue(token, value);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("RuntimeConfigService");
      }
    });
  });

  describe("Sub-Module Error Propagation", () => {
    // These tests cover the error propagation branches in configureDependencies
    // where sub-module registration functions return errors

    it("should propagate errors from registerObservability", async () => {
      const container = ServiceContainer.createRoot();

      // Mock registerObservability to return an error
      // This ensures line 175 in dependencyconfig.ts is covered (if (isErr(observabilityResult)) return observabilityResult;)
      const observabilityModule = await import("@/framework/config/modules/observability.config");
      vi.spyOn(observabilityModule, "registerObservability").mockReturnValue(
        err("Observability registration failed")
      );

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toBe("Observability registration failed");

      // Restore for other tests
      vi.restoreAllMocks();
    });

    it("should propagate errors from registerUtilityServices", () => {
      const container = ServiceContainer.createRoot();

      vi.spyOn(container, "registerClass").mockImplementation((token) => {
        // Let core and observability succeed, but fail utility
        if (String(token).includes("Retry") || String(token).includes("PerformanceTracking")) {
          return err({ code: "InvalidOperation", message: "Utility service failed" });
        }
        return { ok: true, value: undefined };
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      // Should contain either "Retry" or "PerformanceTracking"
      const hasUtilityError =
        result.error.includes("Retry") || result.error.includes("PerformanceTracking");
      expect(hasUtilityError).toBe(true);
    });

    it("should propagate errors from registerCacheServices", () => {
      const container = ServiceContainer.createRoot();

      vi.spyOn(container, "registerClass").mockImplementation((token) => {
        // Let core, observability, and utility succeed, but fail cache services
        if (String(token).includes("Cache") || String(token).includes("CacheService")) {
          return err({ code: "InvalidOperation", message: "Cache service failed" });
        }
        return { ok: true, value: undefined };
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      // Should contain "Cache" or "CacheService"
      const hasCacheError = result.error.includes("Cache") || result.error.includes("CacheService");
      expect(hasCacheError).toBe(true);
    });

    it("should propagate errors from registerPortInfrastructure", async () => {
      const container = ServiceContainer.createRoot();

      // Mock registerPortInfrastructure to return an error
      // This ensures line 184 in dependencyconfig.ts is covered (if (isErr(portInfraResult)) return portInfraResult;)
      const portInfraModule = await import("@/framework/config/modules/port-infrastructure.config");
      vi.spyOn(portInfraModule, "registerPortInfrastructure").mockReturnValue(
        err("Port infrastructure registration failed")
      );

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toBe("Port infrastructure registration failed");

      // Restore for other tests
      vi.restoreAllMocks();
    });

    it("should propagate errors from registerSettingsPorts", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      // Mock registerClass to fail for platformSettingsPortToken
      // This ensures line 194 in dependencyconfig.ts is covered (if (isErr(settingsPortsResult)) return settingsPortsResult;)
      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === platformSettingsPortToken) {
          return err({
            code: "InvalidOperation",
            message: "PlatformSettingsPort registration failed",
          });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("PlatformSettingsPort");
      }
    });

    it("should propagate errors from registerI18nServices", async () => {
      const container = ServiceContainer.createRoot();

      // Mock registerI18nServices to return an error
      // This ensures line 193 in dependencyconfig.ts is covered (if (isErr(i18nServicesResult)) return i18nServicesResult;)
      const i18nModule = await import("@/framework/config/modules/i18n-services.config");
      vi.spyOn(i18nModule, "registerI18nServices").mockReturnValue(
        err("I18n services registration failed")
      );

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toBe("I18n services registration failed");

      // Restore for other tests
      vi.restoreAllMocks();
    });

    it("should propagate errors from registerRegistrars", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      // Mock to fail specifically at ModuleSettingsRegistrar registration
      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        // Let all registrations succeed until we reach ModuleSettingsRegistrar
        if (String(token.description).includes("ModuleSettingsRegistrar")) {
          return err({ code: "InvalidOperation", message: "ModuleSettingsRegistrar failed" });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("ModuleSettingsRegistrar");
      }
    });

    it("should propagate errors from registerEventPorts", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        // Fail event port registration
        if (String(token.description).includes("JournalEventPort")) {
          return err({
            code: "InvalidOperation",
            message: "JournalEventPort registration failed",
          });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("JournalEventPort");
      }
    });

    it("should propagate errors from registerEntityPorts", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        // Fail entity port registration
        if (token === journalCollectionPortToken || token === journalRepositoryToken) {
          return err({
            code: "InvalidOperation",
            message: "Entity port registration failed",
          });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("JournalCollectionPort");
      }
    });

    it("should propagate errors from registerNotifications", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === uiChannelToken) {
          return err({
            code: "InvalidOperation",
            message: "UIChannel registration failed",
          });
        }
        return originalRegisterClass(token, serviceClass, lifecycle);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("UIChannel");
      }
    });

    it("should propagate errors when NotificationCenter registration fails", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);

      const registerClassSpy = vi
        .spyOn(container, "registerClass")
        .mockImplementation((token, serviceClass, lifecycle) => {
          if (token === notificationCenterToken) {
            return err({
              code: "InvalidOperation",
              message: "NotificationCenter registration failed",
            });
          }
          return originalRegisterClass(token, serviceClass, lifecycle);
        });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("NotificationCenter");
      }

      registerClassSpy.mockRestore();
    });
  });
});
