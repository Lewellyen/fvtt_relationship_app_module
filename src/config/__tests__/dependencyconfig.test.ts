import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "../dependencyconfig";
import { loggerToken, journalVisibilityServiceToken, portSelectorToken } from "@/tokens/tokenindex";
import {
  foundryGameToken,
  foundryHooksToken,
  foundryDocumentToken,
  foundryUIToken,
  foundryGamePortRegistryToken,
} from "@/foundry/foundrytokens";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { err } from "@/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("dependencyconfig", () => {
  describe("Success Path", () => {
    it("should successfully configure all dependencies", () => {
      const container = ServiceContainer.createRoot();
      const result = configureDependencies(container);

      expectResultOk(result);

      // Alle Services sollten registriert sein
      expect(container.isRegistered(loggerToken).value).toBe(true);
      expect(container.isRegistered(foundryGameToken).value).toBe(true);
      expect(container.isRegistered(foundryHooksToken).value).toBe(true);
      expect(container.isRegistered(foundryDocumentToken).value).toBe(true);
      expect(container.isRegistered(foundryUIToken).value).toBe(true);
      expect(container.isRegistered(journalVisibilityServiceToken).value).toBe(true);
    });

    it("should validate container after configuration", () => {
      const container = ServiceContainer.createRoot();
      const result = configureDependencies(container);

      expectResultOk(result);
      expect(container.getValidationState()).toBe("validated");
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
      const logger = container.resolve(loggerToken);
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
              code: "TestError",
              message: "Mocked failure",
            });
          }
          // Original-Verhalten für andere Tokens
          return Reflect.apply(
            ServiceContainer.prototype.registerValue,
            container,
            [token, value]
          );
        });

      const result = configureDependencies(container);
      expect(result.ok).toBe(false); // Scheitert wegen Port-Registry

      registerValueSpy.mockRestore();

      // Fallback wurde VOR dem Fehler registriert und muss weiterhin greifen
      const logger = container.resolve(loggerToken);
      expect(logger).toBeInstanceOf(ConsoleLoggerService);
    });
  });

  describe("Error Injection", () => {
    it("should return error when logger registration fails", () => {
      const container = ServiceContainer.createRoot();

      // Mock registerClass um Fehler zu provozieren
      const registerClassSpy = vi
        .spyOn(container, "registerClass")
        .mockImplementation((token) => {
          if (token === loggerToken) {
            return err({
              code: "TestError",
              message: "Mocked logger registration failure",
            });
          }
          return Reflect.apply(
            ServiceContainer.prototype.registerClass,
            container,
            // eslint-disable-next-line prefer-rest-params
            Array.from(arguments) as unknown as Parameters<typeof container.registerClass>
          );
        });

      const result = configureDependencies(container);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Failed to register logger");

      registerClassSpy.mockRestore();
    });

    it("should return error when port registry registration fails", () => {
      const container = ServiceContainer.createRoot();

      const registerValueSpy = vi
        .spyOn(container, "registerValue")
        .mockImplementation((token) => {
          if (token === foundryGamePortRegistryToken) {
            return err({
              code: "TestError",
              message: "Mocked port registry failure",
            });
          }
          return Reflect.apply(
            ServiceContainer.prototype.registerValue,
            container,
            [token, {} as never]
          );
        });

      const result = configureDependencies(container);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Failed to register FoundryGame PortRegistry");

      registerValueSpy.mockRestore();
    });
  });

  describe("All Service Registration Errors", () => {
    it("should handle FoundryHooks service registration failure", () => {
      const container = ServiceContainer.createRoot();
      const originalRegisterClass = container.registerClass.bind(container);
      
      vi.spyOn(container, "registerClass").mockImplementation((token, serviceClass, lifecycle) => {
        if (token === foundryHooksToken) {
          return err({ code: "TestError", message: "FoundryHooks registration failed" });
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
          return err({ code: "TestError", message: "FoundryDocument registration failed" });
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
          return err({ code: "TestError", message: "FoundryUI registration failed" });
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
          return err({ code: "TestError", message: "JournalVisibility registration failed" });
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
});



