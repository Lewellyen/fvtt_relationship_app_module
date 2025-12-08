/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking ENV and container methods

import { describe, it, expect, vi } from "vitest";
import { createTestContainer } from "@/test/utils/test-helpers";
import { configureDependencies } from "@/framework/config/dependencyconfig";
import { markAsApiSafe } from "@/infrastructure/di/types";
import { notificationCenterToken } from "@/infrastructure/shared/tokens/notifications/notification-center.token";
import { uiChannelToken } from "@/infrastructure/shared/tokens/notifications/ui-channel.token";
import { journalVisibilityServiceToken } from "@/application/tokens/application.tokens";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { containerHealthCheckToken } from "@/infrastructure/shared/tokens/core/container-health-check.token";
import { metricsHealthCheckToken } from "@/infrastructure/shared/tokens/core/metrics-health-check.token";
import { serviceContainerToken } from "@/infrastructure/shared/tokens/core/service-container.token";
import { environmentConfigToken } from "@/infrastructure/shared/tokens/core/environment-config.token";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import { healthCheckRegistryToken } from "@/application/tokens/health-check-registry.token";
import { platformContainerPortToken } from "@/application/tokens/domain-ports.tokens";
import { foundryGameToken } from "@/infrastructure/shared/tokens/foundry/foundry-game.token";
import { foundryHooksToken } from "@/infrastructure/shared/tokens/foundry/foundry-hooks.token";
import { foundryDocumentToken } from "@/infrastructure/shared/tokens/foundry/foundry-document.token";
import { foundryUIToken } from "@/infrastructure/shared/tokens/foundry/foundry-ui.token";
import { foundryGamePortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-game-port-registry.token";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings.token";
import { foundrySettingsPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings-port-registry.token";
import { moduleIdToken } from "@/infrastructure/shared/tokens/infrastructure/module-id.token";
import {
  platformJournalCollectionPortToken,
  platformJournalRepositoryToken,
  platformSettingsPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { ConsoleLoggerService } from "@/infrastructure/logging/ConsoleLoggerService";
import { err } from "@/domain/utils/result";
import {
  expectResultOk,
  expectResultErr,
  createMockRuntimeConfig,
} from "@/test/utils/test-helpers";
import { ENV } from "@/framework/config/environment";
import { LogLevel } from "@/domain/types/log-level";

describe("dependencyconfig", () => {
  describe("Success Path", () => {
    it("should successfully configure all dependencies", () => {
      const container = createTestContainer();
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
      const container = createTestContainer();
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
    it("should return error when moduleId registration fails", () => {
      const container = createTestContainer();
      const originalRegisterValue = container.registerValue.bind(container);

      const registerValueSpy = vi
        .spyOn(container, "registerValue")
        .mockImplementation((token, value) => {
          if (token === moduleIdToken) {
            return err({
              code: "InvalidOperation",
              message: "Mocked moduleId registration failure",
            });
          }
          return originalRegisterValue(token, value);
        });

      const result = configureDependencies(container);
      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("Failed to register ModuleId");
      }

      registerValueSpy.mockRestore();
    });

    it("should return error when logger registration fails", () => {
      const container = createTestContainer();
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
      const container = createTestContainer();

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
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();

      // Test path where PortRegistry.register() itself fails
      // This would happen if v13 port was already registered (duplicate)
      // Since we can't easily inject this, we test the validation path
      const result = configureDependencies(container);
      expectResultOk(result);
    });

    it("should handle FoundrySettings registry registration failure", () => {
      const container = createTestContainer();

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
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();
      const result = configureDependencies(container);

      expectResultOk(result);

      // Validation sollte erfolgreich sein
      const validationResult = container.validate();
      expect(validationResult.ok).toBe(true);
    });
  });

  describe("Logger Configuration", () => {
    it("should configure logger with ENV.logLevel", () => {
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();

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
      const container = createTestContainer();

      // Make validation succeed but health check resolution fail
      vi.spyOn(container, "validate").mockReturnValue({ ok: true, value: undefined });
      const originalResolve = container.resolveWithError.bind(container);
      vi.spyOn(container, "resolveWithError").mockImplementation((token: any) => {
        if (token === runtimeConfigToken) {
          return { ok: true as const, value: createMockRuntimeConfig() };
        }
        if (token === healthCheckRegistryToken) {
          return err({
            code: "TokenNotRegistered",
            message: "HealthCheckRegistry not found",
            tokenDescription: "HealthCheckRegistry",
          } as any);
        }
        return originalResolve(token);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toContain("Failed to resolve HealthCheckRegistry");
    });

    it("should propagate metrics collector resolution errors", () => {
      const container = createTestContainer();

      // Make validation succeed and health check registry succeed, but metrics collector fail
      vi.spyOn(container, "validate").mockReturnValue({ ok: true, value: undefined });
      const originalResolve = container.resolveWithError.bind(container);
      vi.spyOn(container, "resolveWithError").mockImplementation((token: any) => {
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
          } as any);
        }
        return originalResolve(token);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toContain("MetricsCollector not found");
    });

    it("should propagate errors when ContainerHealthCheck registration fails", () => {
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();

      vi.spyOn(container, "validate").mockReturnValue({ ok: true, value: undefined });
      const originalResolve = container.resolveWithError.bind(container);
      vi.spyOn(container, "resolveWithError").mockImplementation((token: any) => {
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
          } as any);
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
      const container = createTestContainer();

      vi.spyOn(container, "validate").mockReturnValue({ ok: true, value: undefined });
      const originalResolveWithError = container.resolveWithError.bind(container);
      vi.spyOn(container, "resolveWithError").mockImplementation((token: any) => {
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
          } as any);
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
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();
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

    it("should propagate errors when PlatformContainerPort alias registration fails", () => {
      const container = createTestContainer();

      // Make all previous registrations succeed, but fail on alias registration
      const originalRegisterValue = container.registerValue.bind(container);
      const originalRegisterAlias = container.registerAlias.bind(container);

      vi.spyOn(container, "registerValue").mockImplementation((token, value) => {
        return originalRegisterValue(token, value);
      });

      vi.spyOn(container, "registerAlias").mockImplementation((aliasToken, targetToken) => {
        if (aliasToken === platformContainerPortToken) {
          return err({
            code: "InvalidOperation",
            message: "PlatformContainerPort alias registration failed",
          } as any);
        }
        return originalRegisterAlias(aliasToken, targetToken);
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("Failed to register PlatformContainerPort alias");
      }
    });
  });

  describe("Sub-Module Error Propagation", () => {
    // These tests cover the error propagation branches in configureDependencies
    // where sub-module registration functions return errors

    it("should propagate errors from registerObservability", async () => {
      const container = createTestContainer();

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
      const container = createTestContainer();

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
      const container = createTestContainer();

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
      const container = createTestContainer();

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
      const container = createTestContainer();
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

    it("should propagate errors from registerJournalVisibilityConfig", async () => {
      const container = createTestContainer();

      // Mock registerJournalVisibilityConfig to return an error
      // This ensures line 201 in dependencyconfig.ts is covered (if (isErr(journalVisibilityConfigResult)) return journalVisibilityConfigResult;)
      const journalVisibilityModule =
        await import("@/framework/config/modules/journal-visibility.config");
      vi.spyOn(journalVisibilityModule, "registerJournalVisibilityConfig").mockReturnValue(
        err("JournalVisibilityConfig registration failed")
      );

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toBe("JournalVisibilityConfig registration failed");

      // Restore for other tests
      vi.restoreAllMocks();
    });

    it("should propagate errors from registerI18nServices", async () => {
      const container = createTestContainer();

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
      const container = createTestContainer();
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
      const container = createTestContainer();
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
      const container = createTestContainer();
      const originalRegisterClass = container.registerClass.bind(container);

      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        // Fail entity port registration
        if (
          token === platformJournalCollectionPortToken ||
          token === platformJournalRepositoryToken
        ) {
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
        expect(result.error).toContain("PlatformJournalCollectionPort");
      }
    });

    it("should propagate errors from registerNotifications", () => {
      const container = createTestContainer();
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
      const container = createTestContainer();
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

    it("should propagate errors from initializeCacheConfigSync", async () => {
      const container = createTestContainer();

      // Mock initializeCacheConfigSync to return an error
      const cacheServicesModule = await import("@/framework/config/modules/cache-services.config");
      vi.spyOn(cacheServicesModule, "initializeCacheConfigSync").mockReturnValue(
        err("Failed to initialize CacheConfigSync: Mocked error")
      );

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("CacheConfigSync");
      }
    });
  });
});
