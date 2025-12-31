import { describe, it, expect, vi, beforeEach } from "vitest";
import { UIChannel } from "@/infrastructure/notifications/channels/UIChannel";
import type { PlatformUINotificationPort } from "@/domain/ports/platform-ui-notification-port.interface";
import type { PlatformNotification } from "@/domain/ports/notifications/platform-channel-port.interface";
import { LogLevel } from "@/domain/types/log-level";
import { createMockRuntimeConfig } from "@/test/utils/test-helpers";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";

describe("UIChannel", () => {
  let channel: UIChannel;
  let mockPlatformUI: PlatformUINotificationPort;
  let devConfig: PlatformRuntimeConfigPort;
  let prodConfig: PlatformRuntimeConfigPort;

  beforeEach(() => {
    mockPlatformUI = {
      notify: vi.fn().mockReturnValue(ok(undefined)),
    } as unknown as PlatformUINotificationPort;

    devConfig = createMockRuntimeConfig({
      isDevelopment: true,
      isProduction: false,
      logLevel: LogLevel.DEBUG,
      enablePerformanceTracking: false,
    });

    prodConfig = createMockRuntimeConfig({
      isDevelopment: false,
      isProduction: true,
      logLevel: LogLevel.INFO,
      enablePerformanceTracking: false,
      performanceSamplingRate: 0.01,
    });
  });

  describe("canHandle", () => {
    it("should NOT handle debug notifications", () => {
      channel = new UIChannel(mockPlatformUI, devConfig);

      const notification: PlatformNotification = {
        level: "debug",
        context: "Debug message",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(false);
    });

    it("should handle info notifications", () => {
      channel = new UIChannel(mockPlatformUI, devConfig);

      const notification: PlatformNotification = {
        level: "info",
        context: "Info message",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(true);
    });

    it("should handle warn notifications", () => {
      channel = new UIChannel(mockPlatformUI, devConfig);

      const notification: PlatformNotification = {
        level: "warn",
        context: "Warning",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(true);
    });

    it("should handle error notifications", () => {
      channel = new UIChannel(mockPlatformUI, devConfig);

      const notification: PlatformNotification = {
        level: "error",
        context: "Error",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(true);
    });
  });

  describe("send - Development Mode", () => {
    beforeEach(() => {
      channel = new UIChannel(mockPlatformUI, devConfig);
    });

    it("should show error details in development", () => {
      const error = { code: "OPERATION_FAILED", message: "Database connection lost" };
      const notification: PlatformNotification = {
        level: "error",
        context: "Failed to save",
        error,
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockPlatformUI.notify).toHaveBeenCalledWith(
        "Failed to save: Database connection lost",
        "error"
      );
    });

    it("should show data.message in development for non-error levels", () => {
      const notification: PlatformNotification = {
        level: "info",
        context: "Processing",
        data: { message: "User action completed", details: "..." },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockPlatformUI.notify).toHaveBeenCalledWith(
        "Processing: User action completed",
        "info"
      );
    });

    it("should show context only if no message in data", () => {
      const notification: PlatformNotification = {
        level: "info",
        context: "Operation completed successfully",
        data: { count: 10 },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockPlatformUI.notify).toHaveBeenCalledWith(
        "Operation completed successfully",
        "info"
      );
    });

    // Note: uiOptions are platform-specific and handled by channels, not by NotificationCenter
    // This test is removed as PlatformNotification no longer includes uiOptions

    it("should show warnings as-is in development", () => {
      const notification: PlatformNotification = {
        level: "warn",
        context: "Deprecated API used",
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockPlatformUI.notify).toHaveBeenCalledWith("Deprecated API used", "warning");
    });

    it("should return error when debug level is passed to mapLevelToUIType (exhaustive type check)", () => {
      // Test the exhaustive type check in mapLevelToUIType
      // This should never be called in practice because canHandle() filters debug level
      // Create a test subclass to access protected method
      class TestUIChannel extends UIChannel {
        public testMapLevelToUIType(
          level: PlatformNotification["level"]
        ): Result<"info" | "warning" | "error", string> {
          return this.mapLevelToUIType(level);
        }
      }
      const testChannel = new TestUIChannel(mockPlatformUI, devConfig);
      const result = testChannel.testMapLevelToUIType("debug");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Debug level should be filtered by canHandle()");
      }
    });

    it("should return error when mapLevelToUIType fails in send()", () => {
      channel = new UIChannel(mockPlatformUI, devConfig);
      // Create a test subclass that forces mapLevelToUIType to fail
      class TestUIChannel extends UIChannel {
        protected override mapLevelToUIType(
          _level: PlatformNotification["level"]
        ): Result<"info" | "warning" | "error", string> {
          // Force an error for testing
          return err("Test error from mapLevelToUIType");
        }
      }
      const testChannel = new TestUIChannel(mockPlatformUI, devConfig);

      const notification: PlatformNotification = {
        level: "info",
        context: "Test",
        timestamp: new Date(),
      };

      const result = testChannel.send(notification);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Test error from mapLevelToUIType");
      }
      expect(mockPlatformUI.notify).not.toHaveBeenCalled();
    });
  });

  describe("send - Production Mode", () => {
    beforeEach(() => {
      channel = new UIChannel(mockPlatformUI, prodConfig);
    });

    it("should sanitize error messages in production", () => {
      const error = {
        code: "DATABASE_ERROR",
        message: "Connection to postgres://localhost:5432/secret failed",
        details: { apiKey: "secret123" },
      };
      const notification: PlatformNotification = {
        level: "error",
        context: "Failed to save data",
        error,
        timestamp: new Date(),
      };

      channel.send(notification);

      // Should show generic message with error code
      expect(mockPlatformUI.notify).toHaveBeenCalledWith(
        "Failed to save data. Please try again or contact support. (Error: DATABASE_ERROR)",
        "error"
      );
      // Should NOT contain sensitive details
      const calls = vi.mocked(mockPlatformUI.notify).mock.calls;
      const messages = calls.map((call) => call[0]);
      expect(messages.some((msg) => typeof msg === "string" && msg.includes("postgres://"))).toBe(
        false
      );
      expect(messages.some((msg) => typeof msg === "string" && msg.includes("secret123"))).toBe(
        false
      );
    });

    it("should show info/warn messages as-is in production", () => {
      const infoNotification: PlatformNotification = {
        level: "info",
        context: "Save completed",
        timestamp: new Date(),
      };

      channel.send(infoNotification);

      // Info/Warn messages are assumed to be already user-friendly
      expect(mockPlatformUI.notify).toHaveBeenCalledWith("Save completed", "info");
    });
  });

  describe("send - UI notification failures", () => {
    it("should return error if UI notification fails", () => {
      channel = new UIChannel(mockPlatformUI, devConfig);
      vi.mocked(mockPlatformUI.notify).mockReturnValue(
        err({ code: "API_NOT_AVAILABLE", message: "UI not ready", operation: "notify" })
      );

      const notification: PlatformNotification = {
        level: "info",
        context: "Test",
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("UI not ready");
      }
    });
  });

  describe("Level mapping", () => {
    beforeEach(() => {
      channel = new UIChannel(mockPlatformUI, devConfig);
    });

    it("should map info to info UI type", () => {
      const notification: PlatformNotification = {
        level: "info",
        context: "Info",
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockPlatformUI.notify).toHaveBeenCalledWith(expect.anything(), "info");
    });

    it("should map warn to warning UI type", () => {
      const notification: PlatformNotification = {
        level: "warn",
        context: "Warning",
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockPlatformUI.notify).toHaveBeenCalledWith(expect.anything(), "warning");
    });

    it("should map error to error UI type", () => {
      const notification: PlatformNotification = {
        level: "error",
        context: "Error",
        error: { code: "TEST", message: "Test" },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockPlatformUI.notify).toHaveBeenCalledWith(expect.anything(), "error");
    });
  });

  describe("notify", () => {
    beforeEach(() => {
      channel = new UIChannel(mockPlatformUI, devConfig);
    });

    it("should return ok when platformUI.notify succeeds", () => {
      vi.mocked(mockPlatformUI.notify).mockReturnValue(ok(undefined));

      const result = channel.notify("Test message", "info");

      expect(result.ok).toBe(true);
      expect(mockPlatformUI.notify).toHaveBeenCalledWith("Test message", "info");
    });

    it("should return error when platformUI.notify fails", () => {
      const error = { code: "API_ERROR", message: "UI unavailable", operation: "notify" };
      vi.mocked(mockPlatformUI.notify).mockReturnValue(err(error));

      const result = channel.notify("Test message", "error");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UI_NOTIFICATION_FAILED");
        expect(result.error.message).toBe("UI unavailable");
        expect(result.error.channelName).toBe("UIChannel");
        expect(result.error.details).toEqual(error);
      }
    });
  });

  describe("name", () => {
    it("should have correct channel name", () => {
      channel = new UIChannel(mockPlatformUI, devConfig);
      expect(channel.name).toBe("UIChannel");
    });
  });
});
