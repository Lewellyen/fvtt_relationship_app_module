// Test file: `any` needed for mocking FoundrySettings and Logger

import { describe, it, expect, vi } from "vitest";
import {
  ModuleSettingsRegistrar,
  DIModuleSettingsRegistrar,
} from "@/application/services/ModuleSettingsRegistrar";
import { runtimeConfigBindings } from "@/application/services/RuntimeConfigSync";
import { RuntimeConfigSync } from "@/application/services/RuntimeConfigSync";
import { RuntimeConfigSettingsSync } from "@/application/services/runtime-config-settings-sync";
import { SettingRegistrationErrorMapper } from "@/application/services/SettingRegistrationErrorMapper";
import { createTestContainer } from "@/test/utils/test-helpers";
import { configureDependencies } from "@/framework/config/dependencyconfig";
import { markAsApiSafe } from "@/infrastructure/di/types";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import {
  runtimeConfigSettingsSyncToken,
  settingRegistrationErrorMapperToken,
} from "@/application/tokens/application.tokens";
import { platformSettingsRegistrationPortToken } from "@/application/tokens/domain-ports.tokens";
import {
  platformNotificationPortToken,
  platformI18nPortToken,
  platformValidationPortToken,
  platformLoggingPortToken,
} from "@/application/tokens/domain-ports.tokens";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import { SETTING_KEYS, MODULE_METADATA } from "@/application/constants/app-constants";
import { LogLevel } from "@/domain/types/log-level";
import { ok, err } from "@/domain/utils/result";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import { castResolvedService } from "@/infrastructure/di/types/utilities/runtime-safe-cast";

const DEFAULT_SETTING_VALUES: Record<string, unknown> = {
  [SETTING_KEYS.LOG_LEVEL]: LogLevel.INFO,
  [SETTING_KEYS.CACHE_ENABLED]: true,
  [SETTING_KEYS.CACHE_TTL_MS]: 5000,
  [SETTING_KEYS.CACHE_MAX_ENTRIES]: 250,
  [SETTING_KEYS.PERFORMANCE_TRACKING_ENABLED]: false,
  [SETTING_KEYS.PERFORMANCE_SAMPLING_RATE]: 0.5,
  [SETTING_KEYS.METRICS_PERSISTENCE_ENABLED]: false,
  [SETTING_KEYS.METRICS_PERSISTENCE_KEY]: "fvtt_relationship_app_module.metrics",
};

function stubPlatformGetSettingValue(
  mockSettings: any,
  overrides: Record<string, unknown> = {}
): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(mockSettings, "getSettingValue").mockImplementation((...args: unknown[]) => {
    const [, key] = args as [string, string, unknown];
    const hasOverride = Object.prototype.hasOwnProperty.call(overrides, key);
    const value = hasOverride ? overrides[key] : DEFAULT_SETTING_VALUES[key];
    return ok(value as unknown);
  });
}

describe("ModuleSettingsRegistrar", () => {
  describe("registerAll()", () => {
    it("should register log level setting", () => {
      const container = createTestContainer();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(
        markAsApiSafe(platformSettingsRegistrationPortToken)
      ) as any;
      const registerSpy = vi.spyOn(mockSettings, "registerSetting").mockReturnValue(ok(undefined));

      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as PlatformRuntimeConfigPort;
      const mockNotifications = container.resolve(
        markAsApiSafe(platformNotificationPortToken)
      ) as PlatformNotificationPort;
      const mockI18n = container.resolve(markAsApiSafe(platformI18nPortToken)) as PlatformI18nPort;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      const mockValidator = container.resolve(
        markAsApiSafe(platformValidationPortToken)
      ) as PlatformValidationPort;

      const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);
      const mockRuntimeConfigSettingsSync = new RuntimeConfigSettingsSync(runtimeConfigSync);
      const errorMapper = new SettingRegistrationErrorMapper(mockNotifications);
      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfigSettingsSync,
        errorMapper,
        mockNotifications,
        mockI18n,
        mockLogger,
        mockValidator
      );
      registrar.registerAll();

      const logLevelCall = registerSpy.mock.calls.find(([, key]) => key === SETTING_KEYS.LOG_LEVEL);

      expect(logLevelCall).toBeDefined();
      expect(logLevelCall?.[0]).toBe(MODULE_METADATA.ID);
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
      const container = createTestContainer();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(
        markAsApiSafe(platformSettingsRegistrationPortToken)
      ) as any;

      const callbacks: Record<string, (value: unknown) => void> = {};
      vi.spyOn(mockSettings, "registerSetting").mockImplementation((...args: unknown[]) => {
        const [, key, config] = args as [unknown, string, { onChange?: (value: unknown) => void }];
        callbacks[key] = config.onChange ?? (() => {});
        return ok(undefined);
      });

      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      const infoSpy = vi.spyOn(mockLogger, "info");
      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as PlatformRuntimeConfigPort;
      const mockNotifications = container.resolve(
        markAsApiSafe(platformNotificationPortToken)
      ) as PlatformNotificationPort;
      const mockI18n = container.resolve(markAsApiSafe(platformI18nPortToken)) as PlatformI18nPort;
      const mockValidator = container.resolve(
        markAsApiSafe(platformValidationPortToken)
      ) as PlatformValidationPort;

      const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);
      const mockRuntimeConfigSettingsSync = new RuntimeConfigSettingsSync(runtimeConfigSync);
      const errorMapper = new SettingRegistrationErrorMapper(mockNotifications);
      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfigSettingsSync,
        errorMapper,
        mockNotifications,
        mockI18n,
        mockLogger,
        mockValidator
      );
      registrar.registerAll();

      // Trigger onChange callback
      expect(callbacks[SETTING_KEYS.LOG_LEVEL]).toBeDefined();
      callbacks[SETTING_KEYS.LOG_LEVEL]!(LogLevel.DEBUG);

      // Logger should be reconfigured
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("Log level changed to"));
    });

    it("should handle logger without setMinLevel gracefully", () => {
      const container = createTestContainer();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(
        markAsApiSafe(platformSettingsRegistrationPortToken)
      ) as any;

      const callbacks: Record<string, (value: unknown) => void> = {};
      vi.spyOn(mockSettings, "registerSetting").mockImplementation((...args: unknown[]) => {
        const [, key, config] = args as [unknown, string, { onChange?: (value: unknown) => void }];
        callbacks[key] = config.onChange ?? (() => {});
        return ok(undefined);
      });

      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      // Remove setMinLevel
      delete (mockLogger as any).setMinLevel;

      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as PlatformRuntimeConfigPort;
      const mockNotifications = container.resolve(
        markAsApiSafe(platformNotificationPortToken)
      ) as PlatformNotificationPort;
      const mockI18n = container.resolve(markAsApiSafe(platformI18nPortToken)) as PlatformI18nPort;
      const mockValidator = container.resolve(
        markAsApiSafe(platformValidationPortToken)
      ) as PlatformValidationPort;

      const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);
      const mockRuntimeConfigSettingsSync = new RuntimeConfigSettingsSync(runtimeConfigSync);
      const errorMapper = new SettingRegistrationErrorMapper(mockNotifications);
      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfigSettingsSync,
        errorMapper,
        mockNotifications,
        mockI18n,
        mockLogger,
        mockValidator
      );
      registrar.registerAll();

      // Should not throw when onChange is called
      expect(() => callbacks[SETTING_KEYS.LOG_LEVEL]?.(LogLevel.WARN)).not.toThrow();
    });

    it("should log error when setting registration fails", () => {
      const container = createTestContainer();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(
        markAsApiSafe(platformSettingsRegistrationPortToken)
      ) as any;
      vi.spyOn(mockSettings, "registerSetting").mockImplementation((...args: unknown[]) => {
        const [, key] = args as [unknown, string];
        if (key === SETTING_KEYS.LOG_LEVEL) {
          return err({ code: "SETTING_REGISTRATION_FAILED", message: "Registration failed" });
        }
        return ok(undefined);
      });

      const mockNotificationCenter = container.resolve(
        markAsApiSafe(platformNotificationPortToken)
      ) as any;
      const errorSpy = vi.spyOn(mockNotificationCenter, "error");

      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as PlatformRuntimeConfigPort;
      const mockI18n = container.resolve(markAsApiSafe(platformI18nPortToken)) as PlatformI18nPort;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      const mockValidator = container.resolve(
        markAsApiSafe(platformValidationPortToken)
      ) as PlatformValidationPort;

      const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotificationCenter);
      const mockRuntimeConfigSettingsSync = new RuntimeConfigSettingsSync(runtimeConfigSync);
      const errorMapper = new SettingRegistrationErrorMapper(mockNotificationCenter);
      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfigSettingsSync,
        errorMapper,
        mockNotificationCenter,
        mockI18n,
        mockLogger,
        mockValidator
      );
      registrar.registerAll();

      expect(errorSpy).toHaveBeenCalledWith(
        "Failed to register logLevel setting",
        expect.objectContaining({
          code: "SETTING_REGISTRATION_FAILED",
        }),
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should register with correct choices", () => {
      const container = createTestContainer();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(
        markAsApiSafe(platformSettingsRegistrationPortToken)
      ) as any;
      const registerSpy = vi.spyOn(mockSettings, "registerSetting").mockReturnValue(ok(undefined));

      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as PlatformRuntimeConfigPort;
      const mockNotifications = container.resolve(
        markAsApiSafe(platformNotificationPortToken)
      ) as PlatformNotificationPort;
      const mockI18n = container.resolve(markAsApiSafe(platformI18nPortToken)) as PlatformI18nPort;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      const mockValidator = container.resolve(
        markAsApiSafe(platformValidationPortToken)
      ) as PlatformValidationPort;

      const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);
      const mockRuntimeConfigSettingsSync = new RuntimeConfigSettingsSync(runtimeConfigSync);
      const errorMapper = new SettingRegistrationErrorMapper(mockNotifications);
      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfigSettingsSync,
        errorMapper,
        mockNotifications,
        mockI18n,
        mockLogger,
        mockValidator
      );
      registrar.registerAll();

      const logLevelCall = registerSpy.mock.calls.find(([, key]) => key === SETTING_KEYS.LOG_LEVEL);
      const config = logLevelCall?.[2] as any;

      expect(config?.choices).toBeDefined();
      expect(config?.choices[LogLevel.DEBUG]).toContain("DEBUG");
      expect(config?.choices[LogLevel.INFO]).toContain("INFO");
      expect(config?.choices[LogLevel.WARN]).toContain("WARN");
      expect(config?.choices[LogLevel.ERROR]).toContain("ERROR");
    });

    it("should synchronize runtime config for bound settings", () => {
      const container = createTestContainer();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(
        markAsApiSafe(platformSettingsRegistrationPortToken)
      ) as any;
      const registerSpy = vi.spyOn(mockSettings, "registerSetting").mockReturnValue(ok(undefined));
      stubPlatformGetSettingValue(mockSettings, {
        [SETTING_KEYS.CACHE_ENABLED]: true,
        [SETTING_KEYS.PERFORMANCE_TRACKING_ENABLED]: true,
      });

      const runtimeConfigResult = container.resolveWithError(runtimeConfigToken);
      if (!runtimeConfigResult.ok) {
        throw new Error("PlatformRuntimeConfigPort missing");
      }
      const runtimeConfig = castResolvedService<PlatformRuntimeConfigPort>(
        runtimeConfigResult.value
      );
      const setSpy = vi.spyOn(runtimeConfig, "setFromPlatform");

      const mockNotifications = container.resolve(
        markAsApiSafe(platformNotificationPortToken)
      ) as PlatformNotificationPort;
      const mockI18n = container.resolve(markAsApiSafe(platformI18nPortToken)) as PlatformI18nPort;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      const mockValidator = container.resolve(
        markAsApiSafe(platformValidationPortToken)
      ) as PlatformValidationPort;

      const runtimeConfigSync = new RuntimeConfigSync(runtimeConfig, mockNotifications);
      const mockRuntimeConfigSettingsSync = new RuntimeConfigSettingsSync(runtimeConfigSync);
      const errorMapper = new SettingRegistrationErrorMapper(mockNotifications);
      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfigSettingsSync,
        errorMapper,
        mockNotifications,
        mockI18n,
        mockLogger,
        mockValidator
      );
      registrar.registerAll();

      expect(setSpy).toHaveBeenCalledWith("enableCacheService", true);

      const cacheEnabledConfig = registerSpy.mock.calls.find(
        ([, key]) => key === SETTING_KEYS.CACHE_ENABLED
      )?.[2] as { onChange?: (value: boolean) => void } | undefined;
      expect(cacheEnabledConfig).toBeDefined();
      if (!cacheEnabledConfig?.onChange) {
        throw new Error("cacheEnabled onChange missing");
      }
      cacheEnabledConfig.onChange(false);

      expect(setSpy).toHaveBeenCalledWith("enableCacheService", false);
    });

    it("should apply binding transform for cacheMaxEntries", () => {
      const container = createTestContainer();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(
        markAsApiSafe(platformSettingsRegistrationPortToken)
      ) as any;
      const registerSpy = vi.spyOn(mockSettings, "registerSetting").mockReturnValue(ok(undefined));
      stubPlatformGetSettingValue(mockSettings, {
        [SETTING_KEYS.CACHE_MAX_ENTRIES]: 0,
      });

      const runtimeConfigResult = container.resolveWithError(runtimeConfigToken);
      if (!runtimeConfigResult.ok) {
        throw new Error("PlatformRuntimeConfigPort missing");
      }
      const runtimeConfig = castResolvedService<PlatformRuntimeConfigPort>(
        runtimeConfigResult.value
      );
      const setSpy = vi.spyOn(runtimeConfig, "setFromPlatform");

      const mockNotifications = container.resolve(
        markAsApiSafe(platformNotificationPortToken)
      ) as PlatformNotificationPort;
      const mockI18n = container.resolve(markAsApiSafe(platformI18nPortToken)) as PlatformI18nPort;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      const mockValidator = container.resolve(
        markAsApiSafe(platformValidationPortToken)
      ) as PlatformValidationPort;

      const runtimeConfigSync = new RuntimeConfigSync(runtimeConfig, mockNotifications);
      const mockRuntimeConfigSettingsSync = new RuntimeConfigSettingsSync(runtimeConfigSync);
      const errorMapper = new SettingRegistrationErrorMapper(mockNotifications);
      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfigSettingsSync,
        errorMapper,
        mockNotifications,
        mockI18n,
        mockLogger,
        mockValidator
      );
      registrar.registerAll();

      expect(setSpy).toHaveBeenCalledWith("cacheMaxEntries", undefined);

      const maxEntriesConfig = registerSpy.mock.calls.find(
        ([, key]) => key === SETTING_KEYS.CACHE_MAX_ENTRIES
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
      const container = createTestContainer();
      configureDependencies(container);
      container.validate();

      const mockSettings = container.resolve(
        markAsApiSafe(platformSettingsRegistrationPortToken)
      ) as any;
      const registerSpy = vi.spyOn(mockSettings, "registerSetting").mockReturnValue(ok(undefined));

      const mockRuntimeConfig = container.resolve(
        markAsApiSafe(runtimeConfigToken)
      ) as PlatformRuntimeConfigPort;
      const mockNotifications = container.resolve(
        markAsApiSafe(platformNotificationPortToken)
      ) as PlatformNotificationPort;
      const mockI18n = container.resolve(markAsApiSafe(platformI18nPortToken)) as PlatformI18nPort;
      const mockLogger = container.resolve(markAsApiSafe(loggerToken)) as Logger;
      const mockValidator = container.resolve(
        markAsApiSafe(platformValidationPortToken)
      ) as PlatformValidationPort;

      const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);
      const mockRuntimeConfigSettingsSync = new RuntimeConfigSettingsSync(runtimeConfigSync);
      const errorMapper = new SettingRegistrationErrorMapper(mockNotifications);
      const registrar = new ModuleSettingsRegistrar(
        mockSettings,
        mockRuntimeConfigSettingsSync,
        errorMapper,
        mockNotifications,
        mockI18n,
        mockLogger,
        mockValidator
      );

      // syncRuntimeConfigFromSettings is now in RuntimeConfigSync, no need to spy

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
        mockRuntimeConfigSettingsSync,
        errorMapper,
        mockI18n,
        mockLogger,
        mockValidator
      );

      // Should still register the setting even without binding
      expect(registerSpy).toHaveBeenCalled();
    });
  });
});

describe("ModuleSettingsRegistrar DI metadata", () => {
  it("should expose correct dependency arrays", () => {
    // Base class has no static dependencies (constructor-based)
    expect("dependencies" in ModuleSettingsRegistrar).toBe(false);
    // DI wrapper class has all dependencies
    expect(DIModuleSettingsRegistrar.dependencies).toEqual([
      platformSettingsRegistrationPortToken,
      runtimeConfigSettingsSyncToken,
      settingRegistrationErrorMapperToken,
      platformNotificationPortToken,
      platformI18nPortToken,
      platformLoggingPortToken,
      platformValidationPortToken,
    ]);
  });
});

describe("runtimeConfigBindings", () => {
  it("should have binding for logLevel", () => {
    const binding = runtimeConfigBindings[SETTING_KEYS.LOG_LEVEL];
    expect(binding).toBeDefined();
    expect(binding.runtimeKey).toBe("logLevel");
    expect(binding.normalize(LogLevel.DEBUG)).toBe(LogLevel.DEBUG);
  });

  it("should have binding for cacheEnabled", () => {
    const binding = runtimeConfigBindings[SETTING_KEYS.CACHE_ENABLED];
    expect(binding).toBeDefined();
    expect(binding.runtimeKey).toBe("enableCacheService");
    expect(binding.normalize(true)).toBe(true);
    expect(binding.normalize(false)).toBe(false);
  });

  it("should have binding for cacheTtlMs", () => {
    const binding = runtimeConfigBindings[SETTING_KEYS.CACHE_TTL_MS];
    expect(binding).toBeDefined();
    expect(binding.runtimeKey).toBe("cacheDefaultTtlMs");
    expect(binding.normalize(5000)).toBe(5000);
  });

  it("should have binding for cacheMaxEntries with transform", () => {
    const binding = runtimeConfigBindings[SETTING_KEYS.CACHE_MAX_ENTRIES];
    expect(binding).toBeDefined();
    expect(binding.runtimeKey).toBe("cacheMaxEntries");
    // Transform: 0 becomes undefined, positive values stay
    expect(binding.normalize(0)).toBeUndefined();
    expect(binding.normalize(100)).toBe(100);
  });

  it("should have binding for performanceTrackingEnabled", () => {
    const binding = runtimeConfigBindings[SETTING_KEYS.PERFORMANCE_TRACKING_ENABLED];
    expect(binding).toBeDefined();
    expect(binding.runtimeKey).toBe("enablePerformanceTracking");
    expect(binding.normalize(true)).toBe(true);
  });

  it("should have binding for performanceSamplingRate", () => {
    const binding = runtimeConfigBindings[SETTING_KEYS.PERFORMANCE_SAMPLING_RATE];
    expect(binding).toBeDefined();
    expect(binding.runtimeKey).toBe("performanceSamplingRate");
    expect(binding.normalize(0.5)).toBe(0.5);
  });

  it("should have binding for metricsPersistenceEnabled", () => {
    const binding = runtimeConfigBindings[SETTING_KEYS.METRICS_PERSISTENCE_ENABLED];
    expect(binding).toBeDefined();
    expect(binding.runtimeKey).toBe("enableMetricsPersistence");
    expect(binding.normalize(true)).toBe(true);
  });

  it("should have binding for metricsPersistenceKey", () => {
    const binding = runtimeConfigBindings[SETTING_KEYS.METRICS_PERSISTENCE_KEY];
    expect(binding).toBeDefined();
    expect(binding.runtimeKey).toBe("metricsPersistenceKey");
    expect(binding.normalize("test-key")).toBe("test-key");
  });
});
