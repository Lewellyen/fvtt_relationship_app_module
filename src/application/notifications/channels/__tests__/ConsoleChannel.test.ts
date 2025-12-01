import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConsoleChannel } from "@/infrastructure/notifications/channels/ConsoleChannel";
import type { Logger } from "@/domain/ports/logger-port.interface";
import type { Notification } from "@/infrastructure/notifications/notification-channel.interface";

describe("ConsoleChannel", () => {
  let channel: ConsoleChannel;
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      log: vi.fn(),
    } as unknown as Logger;

    channel = new ConsoleChannel(mockLogger);
  });

  describe("canHandle", () => {
    it("should handle all notification levels", () => {
      expect(channel.canHandle()).toBe(true);
    });
  });

  describe("send", () => {
    it("should route debug to logger.debug", () => {
      const notification: Notification = {
        level: "debug",
        context: "Debug message",
        data: { key: "value" },
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith("Debug message", { key: "value" });
    });

    it("should route info to logger.info", () => {
      const notification: Notification = {
        level: "info",
        context: "Info message",
        data: { count: 42 },
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith("Info message", { count: 42 });
    });

    it("should route warn to logger.warn", () => {
      const notification: Notification = {
        level: "warn",
        context: "Warning message",
        data: { deprecated: true },
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith("Warning message", { deprecated: true });
    });

    it("should route error to logger.error", () => {
      const error = { code: "OPERATION_FAILED", message: "Failed" };
      const notification: Notification = {
        level: "error",
        context: "Error message",
        error,
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith("Error message", error);
    });

    it("should use error instead of data for error level", () => {
      const error = { code: "TEST", message: "Error" };
      const notification: Notification = {
        level: "error",
        context: "Test",
        data: { ignored: true },
        error,
        timestamp: new Date(),
      };

      channel.send(notification);

      // Should use error, not data
      expect(mockLogger.error).toHaveBeenCalledWith("Test", error);
    });

    it("should use data as fallback if error is missing for warn level", () => {
      const notification: Notification = {
        level: "warn",
        context: "Warning",
        data: { info: "details" },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockLogger.warn).toHaveBeenCalledWith("Warning", { info: "details" });
    });

    it("should use error fallback when warn has no data", () => {
      const error = { code: "WARN", message: "Problem" };
      const notification: Notification = {
        level: "warn",
        context: "Warning",
        error,
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockLogger.warn).toHaveBeenCalledWith("Warning", error);
    });

    it("should use data as fallback if error is missing for error level", () => {
      const notification: Notification = {
        level: "error",
        context: "Error",
        data: { fallback: "data" },
        timestamp: new Date(),
      };

      channel.send(notification);

      expect(mockLogger.error).toHaveBeenCalledWith("Error", { fallback: "data" });
    });
  });

  describe("name", () => {
    it("should have correct channel name", () => {
      expect(channel.name).toBe("ConsoleChannel");
    });
  });
});
