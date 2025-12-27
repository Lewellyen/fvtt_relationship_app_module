import { describe, it, expect, vi } from "vitest";
import {
  RuntimeConfigSettingsSync,
  DIRuntimeConfigSettingsSync,
} from "@/application/services/runtime-config-settings-sync";
import { RuntimeConfigSync } from "@/application/services/RuntimeConfigSync";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import { ok } from "@/domain/utils/result";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { LogLevel } from "@/domain/types/log-level";
import { runtimeConfigSyncToken } from "@/application/tokens/application.tokens";

describe("RuntimeConfigSettingsSync", () => {
  describe("attachBinding", () => {
    it("should delegate to RuntimeConfigSync.attachBinding", () => {
      const mockRuntimeConfig = {
        get: vi.fn(),
        setFromPlatform: vi.fn(),
        onChange: vi.fn(),
      } as unknown as PlatformRuntimeConfigPort;

      const mockNotifications = {
        warn: vi.fn(),
      } as unknown as NotificationPublisherPort;

      const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);
      const attachBindingSpy = vi.spyOn(runtimeConfigSync, "attachBinding");

      const sync = new RuntimeConfigSettingsSync(runtimeConfigSync);

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

      sync.attachBinding(config, binding);

      expect(attachBindingSpy).toHaveBeenCalledWith(config, binding);
    });

    it("should return result from RuntimeConfigSync.attachBinding", () => {
      const mockRuntimeConfig = {
        get: vi.fn(),
        setFromPlatform: vi.fn(),
        onChange: vi.fn(),
      } as unknown as PlatformRuntimeConfigPort;

      const mockNotifications = {
        warn: vi.fn(),
      } as unknown as NotificationPublisherPort;

      const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);
      const sync = new RuntimeConfigSettingsSync(runtimeConfigSync);

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

      expect(mockRuntimeConfig.setFromPlatform).toHaveBeenCalledWith("logLevel", LogLevel.DEBUG);
      expect(originalOnChange).toHaveBeenCalledWith(LogLevel.DEBUG);
    });
  });

  describe("syncInitialValue", () => {
    it("should delegate to RuntimeConfigSync.syncInitialValue", () => {
      const mockRuntimeConfig = {
        get: vi.fn(),
        setFromPlatform: vi.fn(),
        onChange: vi.fn(),
      } as unknown as PlatformRuntimeConfigPort;

      const mockNotifications = {
        warn: vi.fn(),
      } as unknown as NotificationPublisherPort;

      const mockSettings = {
        getSettingValue: vi.fn().mockReturnValue(ok(LogLevel.WARN)),
      } as unknown as PlatformSettingsRegistrationPort;

      const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);
      const syncInitialValueSpy = vi.spyOn(runtimeConfigSync, "syncInitialValue");

      const sync = new RuntimeConfigSettingsSync(runtimeConfigSync);

      const binding = {
        runtimeKey: "logLevel" as const,
        validator: (v: unknown): v is LogLevel => typeof v === "number" && v >= 0 && v <= 3,
        normalize: (value: LogLevel) => value,
      };

      sync.syncInitialValue(mockSettings, binding, "logLevel");

      expect(syncInitialValueSpy).toHaveBeenCalledWith(mockSettings, binding, "logLevel");
    });

    it("should sync initial value correctly", () => {
      const mockRuntimeConfig = {
        get: vi.fn(),
        setFromPlatform: vi.fn(),
        onChange: vi.fn(),
      } as unknown as PlatformRuntimeConfigPort;

      const mockNotifications = {
        warn: vi.fn(),
      } as unknown as NotificationPublisherPort;

      const mockSettings = {
        getSettingValue: vi.fn().mockReturnValue(ok(LogLevel.WARN)),
      } as unknown as PlatformSettingsRegistrationPort;

      const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);
      const sync = new RuntimeConfigSettingsSync(runtimeConfigSync);

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
      expect(mockRuntimeConfig.setFromPlatform).toHaveBeenCalledWith("logLevel", LogLevel.WARN);
      expect(mockNotifications.warn).not.toHaveBeenCalled();
    });
  });
});

describe("DIRuntimeConfigSettingsSync", () => {
  it("should expose correct dependency array", () => {
    expect(DIRuntimeConfigSettingsSync.dependencies).toEqual([runtimeConfigSyncToken]);
  });

  it("should construct with RuntimeConfigSync", () => {
    const mockRuntimeConfig = {
      get: vi.fn(),
      setFromPlatform: vi.fn(),
      onChange: vi.fn(),
    } as unknown as PlatformRuntimeConfigPort;

    const mockNotifications = {
      warn: vi.fn(),
    } as unknown as PlatformNotificationPort;

    const runtimeConfigSync = new RuntimeConfigSync(mockRuntimeConfig, mockNotifications);
    const sync = new DIRuntimeConfigSettingsSync(runtimeConfigSync);

    expect(sync).toBeInstanceOf(RuntimeConfigSettingsSync);
  });
});
