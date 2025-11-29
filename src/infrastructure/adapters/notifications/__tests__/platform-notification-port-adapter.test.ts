import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  NotificationPortAdapter,
  DINotificationPortAdapter,
} from "../platform-notification-port-adapter";
import type { NotificationService } from "@/infrastructure/notifications/notification-center.interface";
import type { PlatformNotificationOptions } from "@/domain/ports/platform-notification-port.interface";
import type { FoundryNotificationOptions } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import { ok, err } from "@/domain/utils/result";
import { notificationCenterToken } from "@/infrastructure/shared/tokens";

describe("NotificationPortAdapter", () => {
  let adapter: NotificationPortAdapter;
  let mockNotificationCenter: NotificationService;

  beforeEach(() => {
    mockNotificationCenter = {
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn(),
      removeChannel: vi.fn().mockReturnValue(true),
      getChannelNames: vi.fn().mockReturnValue(["ConsoleChannel", "UIChannel"]),
    } as unknown as NotificationService;

    adapter = new NotificationPortAdapter(mockNotificationCenter);
  });

  describe("debug", () => {
    it("should delegate to notificationCenter.debug", () => {
      const result = adapter.debug("Test message", { data: "test" });

      expect(result.ok).toBe(true);
      expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
        "Test message",
        { data: "test" },
        undefined
      );
    });

    it("should map options correctly", () => {
      const options: PlatformNotificationOptions = {
        channels: ["ConsoleChannel"],
        traceId: "trace-123",
      };

      adapter.debug("Test", undefined, options);

      expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
        "Test",
        undefined,
        expect.objectContaining({
          channels: ["ConsoleChannel"],
          traceId: "trace-123",
        })
      );
    });

    it("should map error result correctly", () => {
      vi.mocked(mockNotificationCenter.debug).mockReturnValue(err("Error message"));

      const result = adapter.debug("Test");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NOTIFICATION_FAILED");
        expect(result.error.message).toBe("Error message");
        expect(result.error.operation).toBe("notify");
      }
    });
  });

  describe("info", () => {
    it("should delegate to notificationCenter.info", () => {
      const result = adapter.info("Info message", { count: 5 });

      expect(result.ok).toBe(true);
      expect(mockNotificationCenter.info).toHaveBeenCalledWith(
        "Info message",
        { count: 5 },
        undefined
      );
    });

    it("should map error result correctly", () => {
      vi.mocked(mockNotificationCenter.info).mockReturnValue(err("Info error"));

      const result = adapter.info("Test");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NOTIFICATION_FAILED");
      }
    });
  });

  describe("warn", () => {
    it("should delegate to notificationCenter.warn", () => {
      const result = adapter.warn("Warning message");

      expect(result.ok).toBe(true);
      expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
        "Warning message",
        undefined,
        undefined
      );
    });

    it("should map error result correctly", () => {
      vi.mocked(mockNotificationCenter.warn).mockReturnValue(err("Warn error"));

      const result = adapter.warn("Test");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NOTIFICATION_FAILED");
      }
    });
  });

  describe("error", () => {
    it("should delegate to notificationCenter.error", () => {
      const errorObj = { code: "TEST_ERROR", message: "Test error", details: { key: "value" } };
      const result = adapter.error("Error context", errorObj);

      expect(result.ok).toBe(true);
      expect(mockNotificationCenter.error).toHaveBeenCalledWith(
        "Error context",
        errorObj,
        undefined
      );
    });

    it("should map error result correctly", () => {
      vi.mocked(mockNotificationCenter.error).mockReturnValue(err("Error message"));

      const result = adapter.error("Test", { message: "Error" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NOTIFICATION_FAILED");
      }
    });
  });

  describe("addChannel", () => {
    it("should return error indicating operation not supported", () => {
      const result = adapter.addChannel("NewChannel");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_NOT_SUPPORTED");
        expect(result.error.operation).toBe("addChannel");
        expect(result.error.message).toContain("Dynamic channel addition via name not supported");
      }
    });
  });

  describe("removeChannel", () => {
    it("should delegate to notificationCenter.removeChannel", () => {
      const result = adapter.removeChannel("ConsoleChannel");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(mockNotificationCenter.removeChannel).toHaveBeenCalledWith("ConsoleChannel");
    });

    it("should return false when channel not found", () => {
      vi.mocked(mockNotificationCenter.removeChannel).mockReturnValue(false);

      const result = adapter.removeChannel("NonExistentChannel");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe("getChannelNames", () => {
    it("should delegate to notificationCenter.getChannelNames", () => {
      const result = adapter.getChannelNames();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(["ConsoleChannel", "UIChannel"]);
      }
      expect(mockNotificationCenter.getChannelNames).toHaveBeenCalled();
    });
  });

  describe("Foundry-specific options handling", () => {
    it("should detect Foundry options with permanent property", () => {
      const options = {
        channels: ["UIChannel"],
        permanent: true,
      } as unknown as PlatformNotificationOptions & FoundryNotificationOptions;

      adapter.info("Test", undefined, options);

      expect(mockNotificationCenter.info).toHaveBeenCalledWith(
        "Test",
        undefined,
        expect.objectContaining({
          channels: ["UIChannel"],
          uiOptions: expect.objectContaining({ permanent: true }),
        })
      );
    });

    it("should detect Foundry options with console property", () => {
      const options = {
        console: true,
      } as unknown as PlatformNotificationOptions & FoundryNotificationOptions;

      adapter.warn("Test", undefined, options);

      expect(mockNotificationCenter.warn).toHaveBeenCalledWith(
        "Test",
        undefined,
        expect.objectContaining({
          uiOptions: expect.objectContaining({ console: true }),
        })
      );
    });

    it("should detect Foundry options with localize property", () => {
      const options = {
        localize: true,
      } as unknown as PlatformNotificationOptions & FoundryNotificationOptions;

      adapter.error("Test", undefined, options);

      expect(mockNotificationCenter.error).toHaveBeenCalledWith(
        "Test",
        undefined,
        expect.objectContaining({
          uiOptions: expect.objectContaining({ localize: true }),
        })
      );
    });

    it("should detect Foundry options with progress property", () => {
      const options = {
        progress: true,
      } as unknown as PlatformNotificationOptions & FoundryNotificationOptions;

      adapter.debug("Test", undefined, options);

      expect(mockNotificationCenter.debug).toHaveBeenCalledWith(
        "Test",
        undefined,
        expect.objectContaining({
          uiOptions: expect.objectContaining({ progress: true }),
        })
      );
    });

    it("should not add uiOptions when no Foundry properties are present", () => {
      const options: PlatformNotificationOptions = {
        channels: ["ConsoleChannel"],
        traceId: "trace-123",
      };

      adapter.info("Test", undefined, options);

      expect(mockNotificationCenter.info).toHaveBeenCalledWith(
        "Test",
        undefined,
        expect.objectContaining({
          channels: ["ConsoleChannel"],
          traceId: "trace-123",
        })
      );
      expect(mockNotificationCenter.info).toHaveBeenCalledWith(
        "Test",
        undefined,
        expect.not.objectContaining({
          uiOptions: expect.anything(),
        })
      );
    });
  });
});

describe("DINotificationPortAdapter", () => {
  it("should have correct dependencies", () => {
    expect(DINotificationPortAdapter.dependencies).toEqual([notificationCenterToken]);
  });

  it("should extend NotificationPortAdapter", () => {
    const mockNotificationCenter = {
      debug: vi.fn().mockReturnValue(ok(undefined)),
      info: vi.fn().mockReturnValue(ok(undefined)),
      warn: vi.fn().mockReturnValue(ok(undefined)),
      error: vi.fn().mockReturnValue(ok(undefined)),
      addChannel: vi.fn(),
      removeChannel: vi.fn().mockReturnValue(true),
      getChannelNames: vi.fn().mockReturnValue([]),
    } as unknown as NotificationService;

    const adapter = new DINotificationPortAdapter(mockNotificationCenter);

    expect(adapter).toBeInstanceOf(NotificationPortAdapter);
    const result = adapter.debug("Test");
    expect(result.ok).toBe(true);
  });
});
