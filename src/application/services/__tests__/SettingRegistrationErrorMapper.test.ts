import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingRegistrationErrorMapper } from "@/application/services/SettingRegistrationErrorMapper";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { DomainSettingsError } from "@/domain/types/settings";
import { ok } from "@/domain/utils/result";

describe("SettingRegistrationErrorMapper", () => {
  let mockNotifications: PlatformNotificationPort;
  let mapper: SettingRegistrationErrorMapper;

  beforeEach(() => {
    mockNotifications = {
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn().mockReturnValue(ok(undefined)),
      removeChannel: vi.fn().mockReturnValue(ok(undefined)),
      getChannelNames: vi.fn().mockReturnValue(ok([])),
    } as unknown as PlatformNotificationPort;

    mapper = new SettingRegistrationErrorMapper(mockNotifications);
  });

  describe("mapAndNotify", () => {
    it("should map DomainSettingsError to notification format", () => {
      const error: DomainSettingsError = {
        code: "SETTING_REGISTRATION_FAILED",
        message: "Test error",
        details: { key: "test" },
      };

      mapper.mapAndNotify(error, "test.setting");

      expect(mockNotifications.error).toHaveBeenCalledWith(
        "Failed to register test.setting setting",
        {
          code: "SETTING_REGISTRATION_FAILED",
          message: "Test error",
          details: { key: "test" },
        },
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should handle error without details", () => {
      const error: DomainSettingsError = {
        code: "SETTING_REGISTRATION_FAILED",
        message: "Test error",
      };

      mapper.mapAndNotify(error, "test.setting");

      expect(mockNotifications.error).toHaveBeenCalledWith(
        "Failed to register test.setting setting",
        {
          code: "SETTING_REGISTRATION_FAILED",
          message: "Test error",
        },
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should handle error with undefined details", () => {
      const error: DomainSettingsError = {
        code: "SETTING_REGISTRATION_FAILED",
        message: "Test error",
        details: undefined,
      };

      mapper.mapAndNotify(error, "test.setting");

      expect(mockNotifications.error).toHaveBeenCalledWith(
        "Failed to register test.setting setting",
        {
          code: "SETTING_REGISTRATION_FAILED",
          message: "Test error",
        },
        { channels: ["ConsoleChannel"] }
      );
    });

    it("should handle different error codes", () => {
      const errorCodes: DomainSettingsError["code"][] = [
        "SETTING_REGISTRATION_FAILED",
        "SETTING_READ_FAILED",
        "SETTING_WRITE_FAILED",
        "INVALID_SETTING_VALUE",
        "SETTING_NOT_FOUND",
        "PLATFORM_NOT_AVAILABLE",
      ];

      for (const code of errorCodes) {
        const error: DomainSettingsError = {
          code,
          message: `Error for ${code}`,
        };

        mapper.mapAndNotify(error, "test.setting");

        expect(mockNotifications.error).toHaveBeenCalledWith(
          "Failed to register test.setting setting",
          {
            code,
            message: `Error for ${code}`,
          },
          { channels: ["ConsoleChannel"] }
        );
      }
    });

    it("should use correct setting key in notification message", () => {
      const error: DomainSettingsError = {
        code: "SETTING_REGISTRATION_FAILED",
        message: "Test error",
      };

      mapper.mapAndNotify(error, "my.module.setting");

      expect(mockNotifications.error).toHaveBeenCalledWith(
        "Failed to register my.module.setting setting",
        expect.any(Object),
        { channels: ["ConsoleChannel"] }
      );
    });
  });
});
