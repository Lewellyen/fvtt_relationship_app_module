import { describe, it, expect, vi, beforeEach } from "vitest";
import { UIChannel } from "@/infrastructure/notifications/channels/UIChannel";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import type { Notification } from "@/infrastructure/notifications/notification-channel.interface";
import { LogLevel } from "@/domain/types/log-level";
import { createMockRuntimeConfig } from "@/test/utils/test-helpers";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";

describe("UIChannel", () => {
  let channel: UIChannel;
  let mockFoundryUI: FoundryUI;
  let devConfig: RuntimeConfigService;
  let prodConfig: RuntimeConfigService;

  beforeEach(() => {
    mockFoundryUI = {
      notify: vi.fn().mockReturnValue(ok(undefined)),
      removeJournalElement: vi.fn(),
      findElement: vi.fn(),
      dispose: vi.fn(),
    } as unknown as FoundryUI;

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
      channel = new UIChannel(mockFoundryUI, devConfig);

      const notification: Notification = {
        level: "debug",
        context: "Debug message",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(false);
    });

    it("should handle info notifications", () => {
      channel = new UIChannel(mockFoundryUI, devConfig);

      const notification: Notification = {
        level: "info",
        context: "Info message",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(true);
    });

    it("should handle warn notifications", () => {
      channel = new UIChannel(mockFoundryUI, devConfig);

      const notification: Notification = {
        level: "warn",
        context: "Warning",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(true);
    });

    it("should handle error notifications", () => {
      channel = new UIChannel(mockFoundryUI, devConfig);

      const notification: Notification = {
        level: "error",
        context: "Error",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(true);
    });
  });

  describe("send - Development Mode", () => {
    beforeEach(() => {
      channel = new UIChannel(mockFoundryUI, devConfig);
    });

    it("should show error details in development", () => {
      const error = { code: "OPERATION_FAILED", message: "Database connection lost" };
      const notification: Notification = {
        level: "error",
        context: "Failed to save",
        error,
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(
        "Failed to save: Database connection lost",
        "error",
        undefined
      );
    });

    it("should show data.message in development for non-error levels", () => {
      const notification: Notification = {
        level: "info",
        context: "Processing",
        data: { message: "User action completed", details: "..." },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(
        "Processing: User action completed",
        "info",
        undefined
      );
    });

    it("should show context only if no message in data", () => {
      const notification: Notification = {
        level: "info",
        context: "Operation completed successfully",
        data: { count: 10 },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(
        "Operation completed successfully",
        "info",
        undefined
      );
    });

    it("should forward uiOptions to Foundry UI", () => {
      const uiOptions = { permanent: true, console: true };
      const notification: Notification = {
        level: "info",
        context: "Persistent message",
        timestamp: new Date(),
        uiOptions,
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith("Persistent message", "info", uiOptions);
    });

    it("should show warnings as-is in development", () => {
      const notification: Notification = {
        level: "warn",
        context: "Deprecated API used",
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(
        "Deprecated API used",
        "warning",
        undefined
      );
    });

    it("should return error when debug level is passed to mapLevelToUIType (exhaustive type check)", () => {
      // Test the exhaustive type check in mapLevelToUIType
      // This should never be called in practice because canHandle() filters debug level
      // Create a test subclass to access protected method
      class TestUIChannel extends UIChannel {
        public testMapLevelToUIType(
          level: Notification["level"]
        ): Result<"info" | "warning" | "error", string> {
          return this.mapLevelToUIType(level);
        }
      }
      const testChannel = new TestUIChannel(mockFoundryUI, devConfig);
      const result = testChannel.testMapLevelToUIType("debug");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Debug level should be filtered by canHandle()");
      }
    });

    it("should return error when mapLevelToUIType fails in send()", () => {
      channel = new UIChannel(mockFoundryUI, devConfig);
      // Create a test subclass that forces mapLevelToUIType to fail
      class TestUIChannel extends UIChannel {
        protected override mapLevelToUIType(
          _level: Notification["level"]
        ): Result<"info" | "warning" | "error", string> {
          // Force an error for testing
          return err("Test error from mapLevelToUIType");
        }
      }
      const testChannel = new TestUIChannel(mockFoundryUI, devConfig);

      const notification: Notification = {
        level: "info",
        context: "Test",
        timestamp: new Date(),
      };

      const result = testChannel.send(notification);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("Test error from mapLevelToUIType");
      }
      expect(mockFoundryUI.notify).not.toHaveBeenCalled();
    });
  });

  describe("send - Production Mode", () => {
    beforeEach(() => {
      channel = new UIChannel(mockFoundryUI, prodConfig);
    });

    it("should sanitize error messages in production", () => {
      const error = {
        code: "DATABASE_ERROR",
        message: "Connection to postgres://localhost:5432/secret failed",
        details: { apiKey: "secret123" },
      };
      const notification: Notification = {
        level: "error",
        context: "Failed to save data",
        error,
        timestamp: new Date(),
      };

      channel.send(notification);

      // Should show generic message with error code
      expect(mockFoundryUI.notify).toHaveBeenCalledWith(
        "Failed to save data. Please try again or contact support. (Error: DATABASE_ERROR)",
        "error",
        undefined
      );
      // Should NOT contain sensitive details
      expect(mockFoundryUI.notify).not.toHaveBeenCalledWith(
        expect.stringContaining("postgres://"),
        expect.anything(),
        expect.anything()
      );
      expect(mockFoundryUI.notify).not.toHaveBeenCalledWith(
        expect.stringContaining("secret123"),
        expect.anything(),
        expect.anything()
      );
    });

    it("should show info/warn messages as-is in production", () => {
      const infoNotification: Notification = {
        level: "info",
        context: "Save completed",
        timestamp: new Date(),
      };

      channel.send(infoNotification);

      // Info/Warn messages are assumed to be already user-friendly
      expect(mockFoundryUI.notify).toHaveBeenCalledWith("Save completed", "info", undefined);
    });
  });

  describe("send - UI notification failures", () => {
    it("should return error if UI notification fails", () => {
      channel = new UIChannel(mockFoundryUI, devConfig);
      vi.mocked(mockFoundryUI.notify).mockReturnValue(
        err({ code: "API_NOT_AVAILABLE", message: "UI not ready" })
      );

      const notification: Notification = {
        level: "info",
        context: "Test",
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("UI notification failed");
      }
    });
  });

  describe("Level mapping", () => {
    beforeEach(() => {
      channel = new UIChannel(mockFoundryUI, devConfig);
    });

    it("should map info to info UI type", () => {
      const notification: Notification = {
        level: "info",
        context: "Info",
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(expect.anything(), "info", undefined);
    });

    it("should map warn to warning UI type", () => {
      const notification: Notification = {
        level: "warn",
        context: "Warning",
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(expect.anything(), "warning", undefined);
    });

    it("should map error to error UI type", () => {
      const notification: Notification = {
        level: "error",
        context: "Error",
        error: { code: "TEST", message: "Test" },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockFoundryUI.notify).toHaveBeenCalledWith(expect.anything(), "error", undefined);
    });
  });

  describe("name", () => {
    it("should have correct channel name", () => {
      channel = new UIChannel(mockFoundryUI, devConfig);
      expect(channel.name).toBe("UIChannel");
    });
  });
});
