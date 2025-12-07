import { describe, it, expect, vi } from "vitest";
import { RuntimeConfigSync } from "@/application/services/RuntimeConfigSync";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import { ok, err } from "@/domain/utils/result";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { LogLevel } from "@/domain/types/log-level";

describe("RuntimeConfigSync", () => {
  describe("attachBinding", () => {
    it("should wrap onChange callback to sync with RuntimeConfig", () => {
      const mockRuntimeConfig = {
        setFromFoundry: vi.fn(),
      } as unknown as RuntimeConfigService;

      const mockNotifications = {
        warn: vi.fn(),
      } as unknown as PlatformNotificationPort;

      const sync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);

      const originalOnChange = vi.fn();
      const config = {
        name: "Test Setting",
        scope: "world" as const,
        type: Number,
        default: LogLevel.INFO,
        hint: "Test hint",
        config: true,
        onChange: originalOnChange,
      };

      const binding = {
        runtimeKey: "logLevel" as const,
        validator: (v: unknown): v is LogLevel => typeof v === "number" && v >= 0 && v <= 3,
        normalize: (value: LogLevel) => value,
      };

      const result = sync.attachBinding(config, binding);

      // Call the wrapped onChange
      result.onChange?.(LogLevel.DEBUG);

      expect(mockRuntimeConfig.setFromFoundry).toHaveBeenCalledWith("logLevel", LogLevel.DEBUG);
      expect(originalOnChange).toHaveBeenCalledWith(LogLevel.DEBUG);
    });

    it("should handle config without onChange callback", () => {
      const mockRuntimeConfig = {
        setFromFoundry: vi.fn(),
      } as unknown as RuntimeConfigService;

      const mockNotifications = {
        warn: vi.fn(),
      } as unknown as PlatformNotificationPort;

      const sync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);

      const config = {
        name: "Test Setting",
        scope: "world" as const,
        type: Number,
        default: LogLevel.INFO,
        hint: "Test hint",
        config: true,
      };

      const binding = {
        runtimeKey: "logLevel" as const,
        validator: (v: unknown): v is LogLevel => typeof v === "number" && v >= 0 && v <= 3,
        normalize: (value: LogLevel) => value,
      };

      const result = sync.attachBinding(config, binding);

      // Should not throw
      expect(() => result.onChange?.(LogLevel.DEBUG)).not.toThrow();
      expect(mockRuntimeConfig.setFromFoundry).toHaveBeenCalledWith("logLevel", LogLevel.DEBUG);
    });

    it("should apply normalize function correctly", () => {
      const mockRuntimeConfig = {
        setFromFoundry: vi.fn(),
      } as unknown as RuntimeConfigService;

      const mockNotifications = {
        warn: vi.fn(),
      } as unknown as PlatformNotificationPort;

      const sync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);

      const config = {
        name: "Test Setting",
        scope: "world" as const,
        type: Number,
        default: 0,
        hint: "Test hint",
        config: true,
        onChange: vi.fn(),
      };

      const binding = {
        runtimeKey: "cacheMaxEntries" as const,
        validator: (v: unknown): v is number => typeof v === "number",
        normalize: (value: number) => (value > 0 ? value : undefined),
      };

      const result = sync.attachBinding(config, binding);

      result.onChange?.(0);
      expect(mockRuntimeConfig.setFromFoundry).toHaveBeenCalledWith("cacheMaxEntries", undefined);

      result.onChange?.(100);
      expect(mockRuntimeConfig.setFromFoundry).toHaveBeenCalledWith("cacheMaxEntries", 100);
    });
  });

  describe("syncInitialValue", () => {
    it("should sync initial value from settings to RuntimeConfig", () => {
      const mockRuntimeConfig = {
        setFromFoundry: vi.fn(),
      } as unknown as RuntimeConfigService;

      const mockNotifications = {
        warn: vi.fn(),
      } as unknown as PlatformNotificationPort;

      const mockSettings = {
        getSettingValue: vi.fn().mockReturnValue(ok(LogLevel.WARN)),
      } as unknown as PlatformSettingsRegistrationPort;

      const sync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);

      const binding = {
        runtimeKey: "logLevel" as const,
        validator: (v: unknown): v is LogLevel => typeof v === "number" && v >= 0 && v <= 3,
        normalize: (value: LogLevel) => value,
      };

      sync.syncInitialValue(mockSettings, binding, "logLevel");

      expect(mockSettings.getSettingValue).toHaveBeenCalledWith(
        MODULE_METADATA.ID,
        "logLevel",
        binding.validator
      );
      expect(mockRuntimeConfig.setFromFoundry).toHaveBeenCalledWith("logLevel", LogLevel.WARN);
      expect(mockNotifications.warn).not.toHaveBeenCalled();
    });

    it("should handle error when reading setting value", () => {
      const mockRuntimeConfig = {
        setFromFoundry: vi.fn(),
      } as unknown as RuntimeConfigService;

      const mockNotifications = {
        warn: vi.fn(),
      } as unknown as PlatformNotificationPort;

      const mockSettings = {
        getSettingValue: vi.fn().mockReturnValue(
          err({
            code: "OPERATION_FAILED",
            message: "Failed to read setting",
          })
        ),
      } as unknown as PlatformSettingsRegistrationPort;

      const sync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);

      const binding = {
        runtimeKey: "logLevel" as const,
        validator: (v: unknown): v is LogLevel => typeof v === "number" && v >= 0 && v <= 3,
        normalize: (value: LogLevel) => value,
      };

      sync.syncInitialValue(mockSettings, binding, "logLevel");

      expect(mockNotifications.warn).toHaveBeenCalledWith(
        "Failed to read initial value for logLevel",
        expect.objectContaining({
          code: "OPERATION_FAILED",
          message: "Failed to read setting",
        }),
        { channels: ["ConsoleChannel"] }
      );
      expect(mockRuntimeConfig.setFromFoundry).not.toHaveBeenCalled();
    });

    it("should apply normalize function when syncing", () => {
      const mockRuntimeConfig = {
        setFromFoundry: vi.fn(),
      } as unknown as RuntimeConfigService;

      const mockNotifications = {
        warn: vi.fn(),
      } as unknown as PlatformNotificationPort;

      const mockSettings = {
        getSettingValue: vi.fn().mockReturnValue(ok(0)),
      } as unknown as PlatformSettingsRegistrationPort;

      const sync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);

      const binding = {
        runtimeKey: "cacheMaxEntries" as const,
        validator: (v: unknown): v is number => typeof v === "number",
        normalize: (value: number) => (value > 0 ? value : undefined),
      };

      sync.syncInitialValue(mockSettings, binding, "cacheMaxEntries");

      expect(mockRuntimeConfig.setFromFoundry).toHaveBeenCalledWith("cacheMaxEntries", undefined);
    });
  });
});
