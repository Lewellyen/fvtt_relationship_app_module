import { describe, it, expect, beforeEach, vi } from "vitest";
import { I18nWrapperStrategy } from "../i18n-wrapper-strategy";
import { NotificationWrapperStrategy } from "../notification-wrapper-strategy";
import { SettingsWrapperStrategy } from "../settings-wrapper-strategy";
import { LoggingWrapperStrategy } from "../logging-wrapper-strategy";
import { NoopWrapperStrategy } from "../noop-wrapper-strategy";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import { createApiTokens } from "../../../api-token-config";

describe("Wrapper Strategies", () => {
  const wellKnownTokens = createApiTokens();

  describe("LoggingWrapperStrategy", () => {
    let strategy: LoggingWrapperStrategy;
    let mockLogger: PlatformLoggingPort;

    beforeEach(() => {
      strategy = new LoggingWrapperStrategy();
      mockLogger = {
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      } as unknown as PlatformLoggingPort;
    });

    it("should support platformLoggingPortToken", () => {
      const supports = strategy.supports(wellKnownTokens.platformLoggingPortToken, wellKnownTokens);
      expect(supports).toBe(true);
    });

    it("should wrap logger", () => {
      const wrapped = strategy.wrap(
        mockLogger,
        wellKnownTokens.platformLoggingPortToken,
        wellKnownTokens
      );
      expect(wrapped).toBeDefined();
      // Ensure proxy wrapping occurred
      expect(() => wrapped.info("test")).not.toThrow();
      // Don't do deep equality / structural checks here; proxy traps can be triggered by test utilities.
    });
  });

  describe("I18nWrapperStrategy", () => {
    let strategy: I18nWrapperStrategy;
    let mockI18n: PlatformI18nPort;

    beforeEach(() => {
      strategy = new I18nWrapperStrategy();
      mockI18n = {
        translate: vi.fn(),
        format: vi.fn(),
        has: vi.fn(),
      } as unknown as PlatformI18nPort;
    });

    it("should support platformI18nPortToken", () => {
      const supports = strategy.supports(wellKnownTokens.platformI18nPortToken, wellKnownTokens);
      expect(supports).toBe(true);
    });

    it("should not support other tokens", () => {
      const supports = strategy.supports(
        wellKnownTokens.platformNotificationPortToken as any,
        wellKnownTokens
      );
      expect(supports).toBe(false);
    });

    it("should wrap i18n service", () => {
      const wrapped = strategy.wrap(
        mockI18n,
        wellKnownTokens.platformI18nPortToken,
        wellKnownTokens
      );

      expect(wrapped).toBeDefined();
      // Verify wrapping occurred by checking reference inequality
      const isWrapped = wrapped !== mockI18n;
      expect(isWrapped).toBe(true);
    });

    it("should have priority 10", () => {
      expect(strategy.getPriority?.()).toBe(10);
    });
  });

  describe("NotificationWrapperStrategy", () => {
    let strategy: NotificationWrapperStrategy;
    let mockNotification: PlatformNotificationPort;

    beforeEach(() => {
      strategy = new NotificationWrapperStrategy();
      mockNotification = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        getChannelNames: vi.fn().mockReturnValue({ ok: true, value: [] }),
      } as unknown as PlatformNotificationPort;
    });

    it("should support platformNotificationPortToken", () => {
      const supports = strategy.supports(
        wellKnownTokens.platformNotificationPortToken,
        wellKnownTokens
      );
      expect(supports).toBe(true);
    });

    it("should not support other tokens", () => {
      const supports = strategy.supports(
        wellKnownTokens.platformI18nPortToken as any,
        wellKnownTokens
      );
      expect(supports).toBe(false);
    });

    it("should wrap notification service", () => {
      const wrapped = strategy.wrap(
        mockNotification,
        wellKnownTokens.platformNotificationPortToken,
        wellKnownTokens
      );

      expect(wrapped).toBeDefined();
      // Verify wrapping occurred by checking reference inequality
      const isWrapped = wrapped !== mockNotification;
      expect(isWrapped).toBe(true);
    });

    it("should have priority 10", () => {
      expect(strategy.getPriority?.()).toBe(10);
    });
  });

  describe("SettingsWrapperStrategy", () => {
    let strategy: SettingsWrapperStrategy;
    let mockSettings: PlatformSettingsRegistrationPort;

    beforeEach(() => {
      strategy = new SettingsWrapperStrategy();
      mockSettings = {
        getSettingValue: vi.fn(),
      } as unknown as PlatformSettingsRegistrationPort;
    });

    it("should support platformSettingsRegistrationPortToken", () => {
      const supports = strategy.supports(
        wellKnownTokens.platformSettingsRegistrationPortToken,
        wellKnownTokens
      );
      expect(supports).toBe(true);
    });

    it("should not support other tokens", () => {
      const supports = strategy.supports(
        wellKnownTokens.platformI18nPortToken as any,
        wellKnownTokens
      );
      expect(supports).toBe(false);
    });

    it("should wrap settings service", () => {
      const wrapped = strategy.wrap(
        mockSettings,
        wellKnownTokens.platformSettingsRegistrationPortToken,
        wellKnownTokens
      );

      expect(wrapped).toBeDefined();
      // Verify wrapping occurred by checking reference inequality
      const isWrapped = wrapped !== mockSettings;
      expect(isWrapped).toBe(true);
    });

    it("should have priority 10", () => {
      expect(strategy.getPriority?.()).toBe(10);
    });
  });

  describe("NoopWrapperStrategy", () => {
    let strategy: NoopWrapperStrategy;

    beforeEach(() => {
      strategy = new NoopWrapperStrategy();
    });

    it("should always support any token", () => {
      const supports1 = strategy.supports(wellKnownTokens.platformI18nPortToken, wellKnownTokens);
      const supports2 = strategy.supports(
        wellKnownTokens.platformNotificationPortToken,
        wellKnownTokens
      );
      const unknownToken = Symbol("Unknown") as any;

      expect(supports1).toBe(true);
      expect(supports2).toBe(true);
      expect(strategy.supports(unknownToken, wellKnownTokens)).toBe(true);
    });

    it("should return service unchanged", () => {
      const service = { test: "value" };
      const wrapped = strategy.wrap(service, Symbol("Test") as any, wellKnownTokens);

      expect(wrapped).toBe(service); // Should be same reference
    });

    it("should have priority 1000 (lowest)", () => {
      expect(strategy.getPriority?.()).toBe(1000);
    });
  });
});
