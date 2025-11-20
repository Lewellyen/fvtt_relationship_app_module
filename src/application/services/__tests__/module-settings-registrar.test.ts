/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking FoundrySettings and Logger

import { describe, it, expect, vi } from "vitest";
import {
  ModuleSettingsRegistrar,
  DIModuleSettingsRegistrar,
} from "@/application/services/ModuleSettingsRegistrar";
import { ServiceContainer } from "@/infrastructure/di/container";
import { configureDependencies } from "@/framework/config/dependencyconfig";
import { markAsApiSafe } from "@/infrastructure/di/types";
import {
  loggerToken,
  notificationCenterToken,
  runtimeConfigToken,
  i18nFacadeToken,
} from "@/infrastructure/shared/tokens";
import { foundrySettingsToken } from "@/infrastructure/shared/tokens";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { LogLevel } from "@/framework/config/environment";
import { ok, err } from "@/infrastructure/shared/utils/result";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";

const DEFAULT_SETTING_VALUES: Record<string, unknown> = {
  [MODULE_CONSTANTS.SETTINGS.LOG_LEVEL]: LogLevel.INFO,
  [MODULE_CONSTANTS.SETTINGS.CACHE_ENABLED]: true,
  [MODULE_CONSTANTS.SETTINGS.CACHE_TTL_MS]: 5000,
  [MODULE_CONSTANTS.SETTINGS.CACHE_MAX_ENTRIES]: 250,
  [MODULE_CONSTANTS.SETTINGS.PERFORMANCE_TRACKING_ENABLED]: false,
  [MODULE_CONSTANTS.SETTINGS.PERFORMANCE_SAMPLING_RATE]: 0.5,
  [MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_ENABLED]: false,
  [MODULE_CONSTANTS.SETTINGS.METRICS_PERSISTENCE_KEY]: "fvtt_relationship_app_module.metrics",
};

function stubFoundryGet(
  mockSettings: any,
  overrides: Record<string, unknown> = {}
): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(mockSettings, "get").mockImplementation((...args: unknown[]) => {
    const [, key] = args as [string, string];
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides, key);
    const value = hasOverride ? overrides[key] : DEFAULT_SETTING_VALUES[key];
    return ok(value as unknown);
  });
}

describe("ModuleSettingsRegistrar", () => {
  describe("registerAll()", () => {
    it("should register log level setting", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      const registerSpy = vi.spyOn(mockSettings, "register").mockReturnValue(ok(undefined));

      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as RuntimeConfigService;
      const mockNotifications = container.resolve(
        markAsApiSafe(notificationCenterToken)
      ) as NotificationCenter;
      const mockI18n = container.resolve(markAsApiSafe(i18nFacadeToken)) as I18nFacadeService;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;

      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfig,
        mockNotifications,
        mockI18n,
        mockLogger
      );
      registrar.registerAll();

      const logLevelCall = registerSpy.mock.calls.find(
        ([, key]) => key === MODULE_CONSTANTS.SETTINGS.LOG_LEVEL
      );

      expect(logLevelCall).toBeDefined();
      expect(logLevelCall?.[0]).toBe(MODULE_CONSTANTS.MODULE.ID);
      expect(logLevelCall?.[2]).toEqual(
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
      container.validate();

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;

      const callbacks: Record<string, (value: unknown) => void> = {};
      vi.spyOn(mockSettings, "register").mockImplementation((...args: unknown[]) => {
        const [, key, config] = args as [unknown, string, { onChange?: (value: unknown) => void }];
        callbacks[key] = config.onChange ?? (() => {});
        return ok(undefined);
      });

      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      const infoSpy = vi.spyOn(mockLogger, "info");
      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as RuntimeConfigService;
      const mockNotifications = container.resolve(
        markAsApiSafe(notificationCenterToken)
      ) as NotificationCenter;
      const mockI18n = container.resolve(markAsApiSafe(i18nFacadeToken)) as I18nFacadeService;

      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfig,
        mockNotifications,
        mockI18n,
        mockLogger
      );
      registrar.registerAll();

      // Trigger onChange callback
      expect(callbacks[MODULE_CONSTANTS.SETTINGS.LOG_LEVEL]).toBeDefined();
      callbacks[MODULE_CONSTANTS.SETTINGS.LOG_LEVEL]!(LogLevel.DEBUG);

      // Logger should be reconfigured
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("Log level changed to"));
    });

    it("should handle logger without setMinLevel gracefully", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;

      const callbacks: Record<string, (value: unknown) => void> = {};
      vi.spyOn(mockSettings, "register").mockImplementation((...args: unknown[]) => {
        const [, key, config] = args as [unknown, string, { onChange?: (value: unknown) => void }];
        callbacks[key] = config.onChange ?? (() => {});
        return ok(undefined);
      });

      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      // Remove setMinLevel
      delete (mockLogger as any).setMinLevel;

      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as RuntimeConfigService;
      const mockNotifications = container.resolve(
        markAsApiSafe(notificationCenterToken)
      ) as NotificationCenter;
      const mockI18n = container.resolve(markAsApiSafe(i18nFacadeToken)) as I18nFacadeService;

      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfig,
        mockNotifications,
        mockI18n,
        mockLogger
      );
      registrar.registerAll();

      // Should not throw when onChange is called
      expect(() => callbacks[MODULE_CONSTANTS.SETTINGS.LOG_LEVEL]?.(LogLevel.WARN)).not.toThrow();
    });

    it("should log error when setting registration fails", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      vi.spyOn(mockSettings, "register").mockImplementation((...args: unknown[]) => {
        const [, key] = args as [unknown, string];
        if (key === MODULE_CONSTANTS.SETTINGS.LOG_LEVEL) {
          return err({ code: "OPERATION_FAILED", message: "Registration failed" });
        }
        return ok(undefined);
      });

      const mockNotificationCenter = container.resolve(
        markAsApiSafe(notificationCenterToken)
      ) as any;
      const errorSpy = vi.spyOn(mockNotificationCenter, "error");

      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as RuntimeConfigService;
      const mockI18n = container.resolve(markAsApiSafe(i18nFacadeToken)) as I18nFacadeService;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;

      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfig,
        mockNotificationCenter,
        mockI18n,
        mockLogger
      );
      registrar.registerAll();

      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to register logLevel setting",
        expect.objectContaining({
          code: "OPERATION_FAILED",
        }),
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should register with correct choices", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      const registerSpy = vi.spyOn(mockSettings, "register").mockReturnValue(ok(undefined));

      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as RuntimeConfigService;
      const mockNotifications = container.resolve(
        markAsApiSafe(notificationCenterToken)
      ) as NotificationCenter;
      const mockI18n = container.resolve(markAsApiSafe(i18nFacadeToken)) as I18nFacadeService;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;

      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfig,
        mockNotifications,
        mockI18n,
        mockLogger
      );
      registrar.registerAll();

      const logLevelCall = registerSpy.mock.calls.find(
        ([, key]) => key === MODULE_CONSTANTS.SETTINGS.LOG_LEVEL
      );
      const config = logLevelCall?.[2] as any;

      expect(config?.choices).toBeDefined();
      expect(config?.choices[LogLevel.DEBUG]).toContain("DEBUG");
      expect(config?.choices[LogLevel.INFO]).toContain("INFO");
      expect(config?.choices[LogLevel.WARN]).toContain("WARN");
      expect(config?.choices[LogLevel.ERROR]).toContain("ERROR");
    });

    it("should synchronize runtime config for bound settings", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      const registerSpy = vi.spyOn(mockSettings, "register").mockReturnValue(ok(undefined));
      stubFoundryGet(mockSettings, {
        [MODULE_CONSTANTS.SETTINGS.CACHE_ENABLED]: true,
        [MODULE_CONSTANTS.SETTINGS.PERFORMANCE_TRACKING_ENABLED]: true,
      });

      const runtimeConfigResult = container.resolveWithError(runtimeConfigToken);
      if (!runtimeConfigResult.ok) {
        throw new Error("RuntimeConfigService missing");
      }
      const runtimeConfig = runtimeConfigResult.value;
      const setSpy = vi.spyOn(runtimeConfig, "setFromFoundry");

      const mockNotifications = container.resolve(
        markAsApiSafe(notificationCenterToken)
      ) as NotificationCenter;
      const mockI18n = container.resolve(markAsApiSafe(i18nFacadeToken)) as I18nFacadeService;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;

      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        runtimeConfig,
        mockNotifications,
        mockI18n,
        mockLogger
      );
      registrar.registerAll();

      expect(setSpy).toHaveBeenCalledWith("enableCacheService", true);

      const cacheEnabledConfig = registerSpy.mock.calls.find(
        ([, key]) => key === MODULE_CONSTANTS.SETTINGS.CACHE_ENABLED
      )?.[2] as { onChange?: (value: boolean) => void } | undefined;
      expect(cacheEnabledConfig).toBeDefined();
      if (!cacheEnabledConfig?.onChange) {
        throw new Error("cacheEnabled onChange missing");
      }
      cacheEnabledConfig.onChange(false);

      expect(setSpy).toHaveBeenCalledWith("enableCacheService", false);
    });

    it("should apply binding transform for cacheMaxEntries", () => {
      const container = ServiceContainer.createRoot();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      const registerSpy = vi.spyOn(mockSettings, "register").mockReturnValue(ok(undefined));
      stubFoundryGet(mockSettings, {
        [MODULE_CONSTANTS.SETTINGS.CACHE_MAX_ENTRIES]: 0,
      });

      const runtimeConfigResult = container.resolveWithError(runtimeConfigToken);
      if (!runtimeConfigResult.ok) {
        throw new Error("RuntimeConfigService missing");
      }
      const runtimeConfig = runtimeConfigResult.value;
      const setSpy = vi.spyOn(runtimeConfig, "setFromFoundry");

      const mockNotifications = container.resolve(
        markAsApiSafe(notificationCenterToken)
      ) as NotificationCenter;
      const mockI18n = container.resolve(markAsApiSafe(i18nFacadeToken)) as I18nFacadeService;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;

      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        runtimeConfig,
        mockNotifications,
        mockI18n,
        mockLogger
      );
      registrar.registerAll();

      expect(setSpy).toHaveBeenCalledWith("cacheMaxEntries", undefined);

      const maxEntriesConfig = registerSpy.mock.calls.find(
        ([, key]) => key === MODULE_CONSTANTS.SETTINGS.CACHE_MAX_ENTRIES
      )?.[2] as { onChange?: (value: number) => void } | undefined;
      expect(maxEntriesConfig).toBeDefined();
      if (!maxEntriesConfig?.onChange) {
        throw new Error("cacheMaxEntries onChange missing");
      }
      maxEntriesConfig.onChange(0);
      maxEntriesConfig.onChange(150);

      expect(setSpy).toHaveBeenCalledWith("cacheMaxEntries", undefined);
      expect(setSpy).toHaveBeenCalledWith("cacheMaxEntries", 150);
    });

    it("should handle settings without binding (coverage for binding branch)", () => {
      // This test covers the case where binding is undefined
      // In practice all current settings have bindings, but this allows for future extensibility
      const container = ServiceContainer.createRoot();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(markAsApiSafe(foundrySettingsToken)) as any;
      const registerSpy = vi.spyOn(mockSettings, "register").mockReturnValue(ok(undefined));

      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as RuntimeConfigService;
      const mockNotifications = container.resolve(
        markAsApiSafe(notificationCenterToken)
      ) as NotificationCenter;
      const mockI18n = container.resolve(markAsApiSafe(i18nFacadeToken)) as I18nFacadeService;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;

      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfig,
        mockNotifications,
        mockI18n,
        mockLogger
      );

      // Spy on syncRuntimeConfigFromSettings before calling registerDefinition
      const syncSpy = vi.spyOn(registrar as any, "syncRuntimeConfigFromSettings");

      // Use private method via type assertion to test undefined binding case
      const registerDefinition = (registrar as any).registerDefinition.bind(registrar);
      const mockDefinition = {
        key: "test-setting",
        createConfig: vi.fn().mockReturnValue({
          name: "Test Setting",
          scope: "world",
          type: String,
          default: "test",
        }),
      };

      registerDefinition(
        mockDefinition,
        undefined, // No binding
        mockSettings,
        mockRuntimeConfig,
        mockNotifications,
        mockI18n,
        mockLogger
      );

      // Should still register the setting even without binding
      expect(registerSpy).toHaveBeenCalled();
      // Should not call syncRuntimeConfigFromSettings when binding is undefined
      expect(syncSpy).not.toHaveBeenCalled();
    });
  });
});

describe("ModuleSettingsRegistrar DI metadata", () => {
  it("should expose correct dependency arrays", () => {
    // Base class has no static dependencies (constructor-based)
    expect("dependencies" in ModuleSettingsRegistrar).toBe(false);
    // DI wrapper class has all dependencies
    expect(DIModuleSettingsRegistrar.dependencies).toEqual([
      foundrySettingsToken,
      runtimeConfigToken,
      notificationCenterToken,
      i18nFacadeToken,
      loggerToken,
    ]);
  });
});
