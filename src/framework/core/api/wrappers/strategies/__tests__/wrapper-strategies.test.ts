import { describe, it, expect, beforeEach, vi } from "vitest";
import { I18nWrapperStrategy } from "../i18n-wrapper-strategy";
import { NotificationWrapperStrategy } from "../notification-wrapper-strategy";
import { SettingsWrapperStrategy } from "../settings-wrapper-strategy";
import { NoopWrapperStrategy } from "../noop-wrapper-strategy";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import type { NotificationService } from "@/application/services/notification-center.interface";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import { createApiTokens } from "../../../api-token-config";

describe("Wrapper Strategies", () => {
  const wellKnownTokens = createApiTokens();

  describe("I18nWrapperStrategy", () => {
    let strategy: I18nWrapperStrategy;
    let mockI18n: I18nFacadeService;

    beforeEach(() => {
      strategy = new I18nWrapperStrategy();
      mockI18n = {
        translate: vi.fn(),
        format: vi.fn(),
        has: vi.fn(),
      } as unknown as I18nFacadeService;
    });

    it("should support i18nFacadeToken", () => {
      const supports = strategy.supports(wellKnownTokens.i18nFacadeToken, wellKnownTokens);
      expect(supports).toBe(true);
    });

    it("should not support other tokens", () => {
      const supports = strategy.supports(
        wellKnownTokens.notificationCenterToken as any,
        wellKnownTokens
      );
      expect(supports).toBe(false);
    });

    it("should wrap i18n service", () => {
      const wrapped = strategy.wrap(mockI18n, wellKnownTokens.i18nFacadeToken, wellKnownTokens);

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
    let mockNotification: NotificationService;

    beforeEach(() => {
      strategy = new NotificationWrapperStrategy();
      mockNotification = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        getChannelNames: vi.fn().mockReturnValue([]),
      } as unknown as NotificationService;
    });

    it("should support notificationCenterToken", () => {
      const supports = strategy.supports(wellKnownTokens.notificationCenterToken, wellKnownTokens);
      expect(supports).toBe(true);
    });

    it("should not support other tokens", () => {
      const supports = strategy.supports(wellKnownTokens.i18nFacadeToken as any, wellKnownTokens);
      expect(supports).toBe(false);
    });

    it("should wrap notification service", () => {
      const wrapped = strategy.wrap(
        mockNotification,
        wellKnownTokens.notificationCenterToken,
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
    let mockSettings: FoundrySettings;

    beforeEach(() => {
      strategy = new SettingsWrapperStrategy();
      mockSettings = {
        get: vi.fn(),
      } as unknown as FoundrySettings;
    });

    it("should support foundrySettingsToken", () => {
      const supports = strategy.supports(wellKnownTokens.foundrySettingsToken, wellKnownTokens);
      expect(supports).toBe(true);
    });

    it("should not support other tokens", () => {
      const supports = strategy.supports(wellKnownTokens.i18nFacadeToken as any, wellKnownTokens);
      expect(supports).toBe(false);
    });

    it("should wrap settings service", () => {
      const wrapped = strategy.wrap(
        mockSettings,
        wellKnownTokens.foundrySettingsToken,
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
      const supports1 = strategy.supports(wellKnownTokens.i18nFacadeToken, wellKnownTokens);
      const supports2 = strategy.supports(wellKnownTokens.notificationCenterToken, wellKnownTokens);
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
