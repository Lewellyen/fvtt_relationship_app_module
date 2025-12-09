import { describe, it, expect, vi } from "vitest";
import {
  createPublicLogger,
  createPublicI18n,
  createPublicNotificationCenter,
  createPublicFoundrySettings,
} from "@/framework/core/api/public-api-wrappers";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import type { NotificationCenter } from "@/application/services/NotificationCenter";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import { ok } from "@/domain/utils/result";

describe("public-api-wrappers", () => {
  describe("createPublicLogger", () => {
    it("should allow logging methods", () => {
      const mockLogger: Logger = {
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
      const mockLogger: Logger = {
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
      const mockLogger: Logger = {
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
      const mockLogger: Logger = {
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
      } as Partial<I18nFacadeService> as I18nFacadeService;

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
      } as any as I18nFacadeService;

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
      } as Partial<I18nFacadeService> as I18nFacadeService;

      const publicI18n = createPublicI18n(mockI18n);

      expect(() => {
        (publicI18n as any).someProp = "value";
      }).toThrow("Cannot modify services via Public API");
    });
  });

  describe("createPublicNotificationCenter", () => {
    const createMockNotificationCenter = (): NotificationCenter =>
      ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        addChannel: vi.fn(),
        removeChannel: vi.fn(),
        getChannelNames: vi.fn(() => ["ConsoleChannel"]),
      }) as unknown as NotificationCenter;

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

  describe("createPublicFoundrySettings", () => {
    const createMockSettings = (): FoundrySettings =>
      ({
        register: vi.fn(),
        get: vi.fn(),
        set: vi.fn(),
        dispose: vi.fn(),
      }) as unknown as FoundrySettings;

    it("should allow get operations", () => {
      const mockSettings = createMockSettings();
      const publicSettings = createPublicFoundrySettings(mockSettings);

      expect(() =>
        publicSettings.get("module", "key", {
          parse: vi.fn(),
        } as unknown as Parameters<FoundrySettings["get"]>[2])
      ).not.toThrow();
    });

    it("should block register and set operations", () => {
      const mockSettings = createMockSettings();
      const publicSettings = createPublicFoundrySettings(mockSettings);

      expect(() => (publicSettings as unknown as { register: () => void }).register()).toThrow(
        'Property "register" is not accessible'
      );
      expect(() => (publicSettings as unknown as { set: () => void }).set()).toThrow(
        'Property "set" is not accessible'
      );
    });
  });
});
