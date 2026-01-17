import { describe, it, expect, vi } from "vitest";
import {
  createPublicLogger,
  createPublicI18n,
  createPublicNotificationCenter,
  createPublicSettingsRegistrationPort,
} from "@/framework/core/api/public-api-wrappers";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import { ok } from "@/domain/utils/result";

describe("public-api-wrappers", () => {
  describe("createPublicLogger", () => {
    it("should allow logging methods", () => {
      const mockLogger: PlatformLoggingPort = {
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        withTraceId: vi.fn(),
        setMinLevel: vi.fn(),
      };

      const publicLogger = createPublicLogger(mockLogger);

      // All logging methods should work
      expect(() => publicLogger.log("test")).not.toThrow();
      expect(() => publicLogger.debug("test")).not.toThrow();
      expect(() => publicLogger.info("test")).not.toThrow();
      expect(() => publicLogger.warn("test")).not.toThrow();
      expect(() => publicLogger.error("test")).not.toThrow();

      expect(mockLogger.log).toHaveBeenCalledWith("test");
      expect(mockLogger.debug).toHaveBeenCalledWith("test");
      expect(mockLogger.info).toHaveBeenCalledWith("test");
      expect(mockLogger.warn).toHaveBeenCalledWith("test");
      expect(mockLogger.error).toHaveBeenCalledWith("test");
    });

    it("should allow withTraceId decorator", () => {
      const mockLogger: PlatformLoggingPort = {
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        withTraceId: vi.fn(() => mockLogger),
        setMinLevel: vi.fn(),
      };

      const publicLogger = createPublicLogger(mockLogger);

      expect(() => publicLogger.withTraceId?.("trace-123")).not.toThrow();
      expect(mockLogger.withTraceId).toHaveBeenCalledWith("trace-123");
    });

    it("should block setMinLevel configuration method", () => {
      const mockLogger: PlatformLoggingPort = {
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        withTraceId: vi.fn(),
        setMinLevel: vi.fn(),
      };

      const publicLogger = createPublicLogger(mockLogger);

      expect(() => (publicLogger as any).setMinLevel(0)).toThrow(
        'Property "setMinLevel" is not accessible'
      );
    });

    it("should block property access", () => {
      const mockLogger: PlatformLoggingPort = {
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        withTraceId: vi.fn(),
        setMinLevel: vi.fn(),
      };

      const publicLogger = createPublicLogger(mockLogger);

      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        (publicLogger as any).minLevel;
      }).toThrow("is not accessible via Public API");
    });
  });

  describe("createPublicI18n", () => {
    it("should allow read methods", () => {
      const mockI18n = {
        translate: vi.fn(() => ok("translated")),
        format: vi.fn(() => ok("formatted")),
        has: vi.fn(() => ok(true)),
      } as Partial<PlatformI18nPort> as PlatformI18nPort;

      const publicI18n = createPublicI18n(mockI18n);

      expect(() => publicI18n.translate("key")).not.toThrow();
      expect(() => publicI18n.format("key", {})).not.toThrow();
      expect(() => publicI18n.has("key")).not.toThrow();

      expect(mockI18n.translate).toHaveBeenCalledWith("key");
      expect(mockI18n.format).toHaveBeenCalledWith("key", {});
      expect(mockI18n.has).toHaveBeenCalledWith("key");
    });

    it("should block non-whitelisted methods", () => {
      const mockI18n = {
        translate: vi.fn(() => ok("translated")),
        format: vi.fn(() => ok("formatted")),
        has: vi.fn(() => ok(true)),
        internalMethod: vi.fn(),
      } as any as PlatformI18nPort;

      const publicI18n = createPublicI18n(mockI18n);

      expect(() => (publicI18n as any).internalMethod()).toThrow(
        'Property "internalMethod" is not accessible'
      );
    });

    it("should block property modifications", () => {
      const mockI18n = {
        translate: vi.fn(() => ok("translated")),
        format: vi.fn(() => ok("formatted")),
        has: vi.fn(() => ok(true)),
      } as Partial<PlatformI18nPort> as PlatformI18nPort;

      const publicI18n = createPublicI18n(mockI18n);

      expect(() => {
        (publicI18n as any).someProp = "value";
      }).toThrow("Cannot modify services via Public API");
    });
  });

  describe("createPublicNotificationCenter", () => {
    const createMockNotificationCenter = (): PlatformNotificationPort =>
      ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        addChannel: vi.fn(),
        removeChannel: vi.fn(),
        getChannelNames: vi.fn(() => ok(["ConsoleChannel"])),
      }) as unknown as PlatformNotificationPort;

    it("should allow routing notifications", () => {
      const mockNotificationCenter = createMockNotificationCenter();
      const publicNotificationCenter = createPublicNotificationCenter(mockNotificationCenter);

      expect(() => publicNotificationCenter.debug("ctx")).not.toThrow();
      expect(() => publicNotificationCenter.info("ctx")).not.toThrow();
      expect(() => publicNotificationCenter.warn("ctx")).not.toThrow();
      expect(() => publicNotificationCenter.error("ctx")).not.toThrow();
      expect(() => publicNotificationCenter.getChannelNames()).not.toThrow();
    });

    it("should block channel mutation APIs", () => {
      const mockNotificationCenter = createMockNotificationCenter();
      const publicNotificationCenter = createPublicNotificationCenter(mockNotificationCenter);

      expect(() =>
        (publicNotificationCenter as unknown as { addChannel: () => void }).addChannel()
      ).toThrow('Property "addChannel" is not accessible');

      expect(() =>
        (publicNotificationCenter as unknown as { removeChannel: () => void }).removeChannel()
      ).toThrow('Property "removeChannel" is not accessible');
    });
  });

  describe("createPublicSettingsRegistrationPort", () => {
    const createMockSettings = (): PlatformSettingsRegistrationPort =>
      ({
        registerSetting: vi.fn(),
        getSettingValue: vi.fn(),
        setSettingValue: vi.fn(),
      }) as unknown as PlatformSettingsRegistrationPort;

    it("should allow getSettingValue operations", () => {
      const mockSettings = createMockSettings();
      const publicSettings = createPublicSettingsRegistrationPort(mockSettings);

      expect(() =>
        publicSettings.getSettingValue(
          "module",
          "key",
          (v: unknown): v is string => typeof v === "string"
        )
      ).not.toThrow();
    });

    it("should block registerSetting and setSettingValue operations", () => {
      const mockSettings = createMockSettings();
      const publicSettings = createPublicSettingsRegistrationPort(mockSettings);

      expect(() =>
        (publicSettings as unknown as { registerSetting: () => void }).registerSetting()
      ).toThrow('Property "registerSetting" is not accessible');
      expect(() =>
        (publicSettings as unknown as { setSettingValue: () => void }).setSettingValue()
      ).toThrow('Property "setSettingValue" is not accessible');
    });
  });
});
