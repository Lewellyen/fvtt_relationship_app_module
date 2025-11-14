/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking FoundrySettings and Logger

import { describe, it, expect, vi } from "vitest";
import { ModuleSettingsRegistrar, DIModuleSettingsRegistrar } from "../module-settings-registrar";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/config/dependencyconfig";
import { markAsApiSafe } from "@/di_infrastructure/types/api-safe-token";
import { loggerToken } from "@/tokens/tokenindex";
import { foundrySettingsToken } from "@/foundry/foundrytokens";
import { MODULE_CONSTANTS } from "@/constants";
import { LogLevel } from "@/config/environment";
import { ok, err } from "@/utils/functional/result";
import type { Logger } from "@/interfaces/logger";

describe("ModuleSettingsRegistrar", () => {
  describe("registerAll()", () => {
    it("should register log level setting", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      const registerSpy = vi.spyOn(mockSettings, "register").mockReturnValue(ok(undefined));

      const registrar = new ModuleSettingsRegistrar();
      registrar.registerAll(container);

      expect(registerSpy).toHaveBeenCalledWith(
        MODULE_CONSTANTS.MODULE.ID,
        MODULE_CONSTANTS.SETTINGS.LOG_LEVEL,
        expect.objectContaining({
          name: "Log Level",
          scope: "world",
          type: Number,
          default: LogLevel.INFO,
        })
      );
    });

    it("should configure onChange callback to update logger", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      let onChangeCallback: ((value: number) => void) | undefined;

      vi.spyOn(mockSettings, "register").mockImplementation((ns, key, config: any) => {
        onChangeCallback = config.onChange;
        return ok(undefined);
      });

      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      const setMinLevelSpy = vi.spyOn(mockLogger, "setMinLevel" as any);
      const infoSpy = vi.spyOn(mockLogger, "info");

      const registrar = new ModuleSettingsRegistrar();
      registrar.registerAll(container);

      // Trigger onChange callback
      expect(onChangeCallback).toBeDefined();
      onChangeCallback!(LogLevel.DEBUG);

      // Logger should be reconfigured
      expect(setMinLevelSpy).toHaveBeenCalledWith(LogLevel.DEBUG);
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("Log level changed to"));
    });

    it("should handle logger without setMinLevel gracefully", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      let onChangeCallback: ((value: number) => void) | undefined;

      vi.spyOn(mockSettings, "register").mockImplementation((ns, key, config: any) => {
        onChangeCallback = config.onChange;
        return ok(undefined);
      });

      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      // Remove setMinLevel
      delete (mockLogger as any).setMinLevel;

      const registrar = new ModuleSettingsRegistrar();
      registrar.registerAll(container);

      // Should not throw when onChange is called
      expect(() => onChangeCallback!(LogLevel.WARN)).not.toThrow();
    });

    it("should log error when setting registration fails", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      vi.spyOn(mockSettings, "register").mockReturnValue(
        err({ code: "OPERATION_FAILED", message: "Registration failed" })
      );

      const mockLogger = container.resolve(markAsApiSafe(loggerToken));
      const errorSpy = vi.spyOn(mockLogger, "error");

      const registrar = new ModuleSettingsRegistrar();
      registrar.registerAll(container);

      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to register logLevel setting",
        expect.objectContaining({
          code: "OPERATION_FAILED",
        })
      );
    });

    it("should register with correct choices", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      const registerSpy = vi.spyOn(mockSettings, "register").mockReturnValue(ok(undefined));

      const registrar = new ModuleSettingsRegistrar();
      registrar.registerAll(container);

      const call = registerSpy.mock.calls[0];
      const config = call?.[2] as any;

      expect(config.choices).toBeDefined();
      expect(config.choices[LogLevel.DEBUG]).toContain("DEBUG");
      expect(config.choices[LogLevel.INFO]).toContain("INFO");
      expect(config.choices[LogLevel.WARN]).toContain("WARN");
      expect(config.choices[LogLevel.ERROR]).toContain("ERROR");
    });
  });
});

describe("ModuleSettingsRegistrar DI metadata", () => {
  it("should expose empty dependency arrays", () => {
    expect(ModuleSettingsRegistrar.dependencies).toEqual([]);
    expect(DIModuleSettingsRegistrar.dependencies).toEqual([]);
  });
});
