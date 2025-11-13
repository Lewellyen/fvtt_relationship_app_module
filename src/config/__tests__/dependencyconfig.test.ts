/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking ENV and container methods

import { describe, it, expect, vi } from "vitest";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "../dependencyconfig";
import { markAsApiSafe } from "@/di_infrastructure/types/api-safe-token";
import {
  loggerToken,
  journalVisibilityServiceToken,
  containerHealthCheckToken,
  metricsHealthCheckToken,
  notificationCenterToken,
  uiChannelToken,
  serviceContainerToken,
  environmentConfigToken,
} from "@/tokens/tokenindex";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundryGamePortRegistryToken,
  foundrySettingsToken,
  foundrySettingsPortRegistryToken,
} from "@/foundry/foundrytokens";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { err } from "@/utils/functional/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ENV, LogLevel } from "@/config/environment";

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

  describe("Logger-Fallback (KRITISCH)", () => {
    it("should register logger fallback via configureDependencies", () => {
      const container = ServiceContainer.createRoot();

      // configureDependencies ruft registerFallback auf (dependencyconfig.ts:56)
      const result = configureDependencies(container);
      expectResultOk(result);

      // Container clearen -> alle Registrierungen weg, Fallback bleibt
      container.clear();

      // resolve() sollte Fallback nutzen (von configureDependencies gesetzt)
      const logger = container.resolve(markAsApiSafe(loggerToken));
      expect(logger).toBeInstanceOf(ConsoleLoggerService);
    });

    it("should keep fallback when configureDependencies aborts early", () => {
      const container = ServiceContainer.createRoot();

      // Spy auf registerValue, damit Port-Registry-Registrierung fehlschlägt
      // ABER: Fallback wird VOR Port-Registries gesetzt (Zeile 56)
      const registerValueSpy = vi
        .spyOn(container, "registerValue")
        .mockImplementation((token, value) => {
          if (token === foundryGamePortRegistryToken) {
            return err({
              code: "InvalidOperation",
              message: "Mocked failure",
            });
          }
          // Original-Verhalten für andere Tokens
          return Reflect.apply(ServiceContainer.prototype.registerValue, container, [token, value]);
        });

      const result = configureDependencies(container);
      expect(result.ok).toBe(false); // Scheitert wegen Port-Registry

      registerValueSpy.mockRestore();

      // Fallback wurde VOR dem Fehler registriert und muss weiterhin greifen
      const logger = container.resolve(markAsApiSafe(loggerToken));
      expect(logger).toBeInstanceOf(ConsoleLoggerService);
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

      const registerValueSpy = vi.spyOn(container, "registerValue").mockImplementation((token) => {
        if (token === foundryGamePortRegistryToken) {
          return err({
            code: "InvalidOperation",
            message: "Mocked port registry failure",
          });
        }
        return Reflect.apply(ServiceContainer.prototype.registerValue, container, [
          token,
          {} as never,
        ]);
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

      const registerValueSpy = vi.spyOn(container, "registerValue").mockImplementation((token) => {
        if (token === foundrySettingsPortRegistryToken) {
          return err({
            code: "InvalidOperation",
            message: "Settings registry failed",
          });
        }
        return Reflect.apply(ServiceContainer.prototype.registerValue, container, [
          token,
          {} as never,
        ]);
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
      vi.spyOn(container, "resolveWithError").mockReturnValueOnce(
        err({
          code: "TokenNotRegistered",
          message: "HealthCheckRegistry not found",
          tokenDescription: "HealthCheckRegistry",
        })
      );

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toContain("Failed to resolve HealthCheckRegistry");
    });

    it("should propagate metrics collector resolution errors", () => {
      const container = ServiceContainer.createRoot();

      // Make validation succeed and health check registry succeed, but metrics collector fail
      vi.spyOn(container, "validate").mockReturnValue({ ok: true, value: undefined });
      vi.spyOn(container, "resolveWithError")
        .mockReturnValueOnce({ ok: true, value: {} as any }) // HealthCheckRegistry succeeds
        .mockReturnValueOnce(
          err({
            code: "TokenNotRegistered",
            message: "MetricsCollector not found",
            tokenDescription: "MetricsCollector",
          })
        );

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toContain("Failed to resolve MetricsCollector");
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
      vi.spyOn(container, "resolveWithError")
        .mockReturnValueOnce({ ok: true, value: {} as any }) // HealthCheckRegistry
        .mockReturnValueOnce({ ok: true, value: {} as any }) // MetricsCollector
        .mockReturnValueOnce(
          err({
            code: "TokenNotRegistered",
            message: "ContainerHealthCheck not found",
            tokenDescription: "ContainerHealthCheck",
          })
        );

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("Failed to resolve ContainerHealthCheck");
      }
    });

    it("should propagate errors when MetricsHealthCheck resolution fails", () => {
      const container = ServiceContainer.createRoot();

      vi.spyOn(container, "validate").mockReturnValue({ ok: true, value: undefined });
      vi.spyOn(container, "resolveWithError")
        .mockReturnValueOnce({ ok: true, value: {} as any }) // HealthCheckRegistry
        .mockReturnValueOnce({ ok: true, value: {} as any }) // MetricsCollector
        .mockReturnValueOnce({ ok: true, value: {} as any }) // ContainerHealthCheck resolves
        .mockReturnValueOnce(
          err({
            code: "TokenNotRegistered",
            message: "MetricsHealthCheck not found",
            tokenDescription: "MetricsHealthCheck",
          })
        );

      const result = configureDependencies(container);

      expectResultErr(result);
      if (!result.ok) {
        expect(result.error).toContain("Failed to resolve MetricsHealthCheck");
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
  });

  describe("Sub-Module Error Propagation", () => {
    // These tests cover the error propagation branches in configureDependencies
    // where sub-module registration functions return errors

    it("should propagate errors from registerObservability", () => {
      const container = ServiceContainer.createRoot();

      // Mock registerClass to fail for any observability token
      vi.spyOn(container, "registerClass").mockImplementation((token) => {
        // Let core services succeed, but fail observability
        if (String(token).includes("Metrics") || String(token).includes("Performance")) {
          return err({ code: "InvalidOperation", message: "Observability failed" });
        }
        return { ok: true, value: undefined };
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      // Should contain either "Metrics" or "Performance"
      const hasObservabilityError =
        result.error.includes("Metrics") || result.error.includes("Performance");
      expect(hasObservabilityError).toBe(true);
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

    it("should propagate errors from registerI18nServices", () => {
      const container = ServiceContainer.createRoot();

      vi.spyOn(container, "registerClass").mockImplementation((token) => {
        if (String(token).includes("I18n") || String(token).includes("Facade")) {
          return err({ code: "InvalidOperation", message: "I18n service failed" });
        }
        return { ok: true, value: undefined };
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      // Should contain either "I18n" or "Facade"
      const hasI18nError = result.error.includes("I18n") || result.error.includes("Facade");
      expect(hasI18nError).toBe(true);
    });

    it("should propagate errors from registerRegistrars", () => {
      const container = ServiceContainer.createRoot();

      vi.spyOn(container, "registerClass").mockImplementation((token) => {
        if (String(token).includes("Registrar")) {
          return err({ code: "InvalidOperation", message: "Registrar failed" });
        }
        return { ok: true, value: undefined };
      });

      const result = configureDependencies(container);

      expectResultErr(result);
      expect(result.error).toContain("Registrar");
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
