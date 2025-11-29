import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type {
  NotificationChannel,
  Notification,
} from "@/infrastructure/notifications/notification-channel.interface";
import { ok, err } from "@/domain/utils/result";

describe("NotificationCenter", () => {
  let center: NotificationCenter;
  let mockConsoleChannel: NotificationChannel;
  let mockUIChannel: NotificationChannel;
  let mockSentryChannel: NotificationChannel;

  beforeEach(() => {
    mockConsoleChannel = {
      name: "ConsoleChannel",
      canHandle: vi.fn().mockReturnValue(true), // Handles all
      send: vi.fn().mockReturnValue(ok(undefined)),
    };

    mockUIChannel = {
      name: "UIChannel",
      canHandle: vi.fn((n: Notification) => n.level !== "debug"), // No debug
      send: vi.fn().mockReturnValue(ok(undefined)),
    };

    mockSentryChannel = {
      name: "SentryChannel",
      canHandle: vi.fn((n: Notification) => n.level === "error"), // Only errors
      send: vi.fn().mockReturnValue(ok(undefined)),
    };
  });

  describe("Convenience methods", () => {
    beforeEach(() => {
      center = new NotificationCenter([mockConsoleChannel, mockUIChannel]);
    });

    it("should send debug notification", () => {
      const result = center.debug("Processing data", { count: 10 });

      expect(result.ok).toBe(true);
      expect(mockConsoleChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "debug",
          context: "Processing data",
          data: { count: 10 },
        })
      );
    });

    it("should send debug notification with traceId", () => {
      const result = center.debug("Processing data", { count: 10 }, { traceId: "trace-123" });

      expect(result.ok).toBe(true);
      expect(mockConsoleChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "debug",
          context: "Processing data",
          data: { count: 10 },
          traceId: "trace-123",
        })
      );
    });

    it("should send debug notification without payload", () => {
      const result = center.debug("Processing data");

      expect(result.ok).toBe(true);
      const sendMock = mockConsoleChannel.send as ReturnType<typeof vi.fn>;
      const callArg = sendMock.mock.calls.at(-1)?.[0];
      expect(callArg).toBeDefined();
      expect(callArg?.level).toBe("debug");
      expect(callArg?.context).toBe("Processing data");
      expect("data" in (callArg ?? {})).toBe(false);
    });

    it("should send info notification", () => {
      const result = center.info("Operation completed");

      expect(result.ok).toBe(true);
      expect(mockConsoleChannel.send).toHaveBeenCalled();
      expect(mockUIChannel.send).toHaveBeenCalled();
    });

    it("should send info notification with traceId", () => {
      const result = center.info("Operation completed", undefined, { traceId: "trace-456" });

      expect(result.ok).toBe(true);
      expect(mockConsoleChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "info",
          context: "Operation completed",
          traceId: "trace-456",
        })
      );
    });

    it("should forward uiOptions to channels", () => {
      const uiOptions = { permanent: true, title: "Heads-up" };

      const result = center.info("Operation completed", undefined, { uiOptions });

      expect(result.ok).toBe(true);
      expect(mockConsoleChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "info",
          context: "Operation completed",
          uiOptions,
        })
      );
      expect(mockUIChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "info",
          context: "Operation completed",
          uiOptions,
        })
      );
    });

    it("should send info notification with data payload", () => {
      center.info("Operation completed", { status: "ok" });

      expect(mockConsoleChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "info",
          context: "Operation completed",
          data: { status: "ok" },
        })
      );
    });

    it("should send warn notification", () => {
      const result = center.warn("Deprecated API");

      expect(result.ok).toBe(true);
      expect(mockConsoleChannel.send).toHaveBeenCalled();
      expect(mockUIChannel.send).toHaveBeenCalled();
    });

    it("should send warn notification with traceId", () => {
      const result = center.warn("Deprecated API", undefined, { traceId: "trace-789" });

      expect(result.ok).toBe(true);
      expect(mockConsoleChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "warn",
          context: "Deprecated API",
          traceId: "trace-789",
        })
      );
    });

    it("should send warn notification with data payload", () => {
      center.warn("Deprecated API", { version: 12 });

      expect(mockConsoleChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "warn",
          context: "Deprecated API",
          data: { version: 12 },
        })
      );
    });

    it("should send error notification", () => {
      const error = { code: "OPERATION_FAILED", message: "Failed" };
      const result = center.error("Operation failed", error);

      expect(result.ok).toBe(true);
      expect(mockConsoleChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "error",
          context: "Operation failed",
          error,
        })
      );
    });

    it("should send error notification with traceId", () => {
      const error = { code: "OPERATION_FAILED", message: "Failed" };
      const result = center.error("Operation failed", error, { traceId: "trace-error" });

      expect(result.ok).toBe(true);
      expect(mockConsoleChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          level: "error",
          context: "Operation failed",
          error,
          traceId: "trace-error",
        })
      );
    });

    it("should send error notification without error object", () => {
      const result = center.error("Operation failed");

      expect(result.ok).toBe(true);
      const sendMock = mockConsoleChannel.send as ReturnType<typeof vi.fn>;
      const callArg = sendMock.mock.calls.at(-1)?.[0];
      expect(callArg).toBeDefined();
      expect(callArg?.level).toBe("error");
      expect(callArg?.context).toBe("Operation failed");
      expect("error" in (callArg ?? {})).toBe(false);
    });
  });

  describe("Channel filtering", () => {
    beforeEach(() => {
      center = new NotificationCenter([mockConsoleChannel, mockUIChannel, mockSentryChannel]);
    });

    it("should only send debug to ConsoleChannel (UIChannel filters it out)", () => {
      center.debug("Debug message");

      expect(mockConsoleChannel.send).toHaveBeenCalled();
      expect(mockUIChannel.send).not.toHaveBeenCalled();
      expect(mockSentryChannel.send).not.toHaveBeenCalled();
    });

    it("should send error to all channels that handle it", () => {
      const error = { code: "TEST", message: "Test" };
      center.error("Error", error);

      expect(mockConsoleChannel.send).toHaveBeenCalled(); // Handles all
      expect(mockUIChannel.send).toHaveBeenCalled(); // Handles non-debug
      expect(mockSentryChannel.send).toHaveBeenCalled(); // Handles errors only
    });

    it("should send info only to channels that handle it", () => {
      center.info("Info message");

      expect(mockConsoleChannel.send).toHaveBeenCalled(); // Handles all
      expect(mockUIChannel.send).toHaveBeenCalled(); // Handles non-debug
      expect(mockSentryChannel.send).not.toHaveBeenCalled(); // Only errors
    });
  });

  describe("Explicit channel selection", () => {
    beforeEach(() => {
      center = new NotificationCenter([mockConsoleChannel, mockUIChannel, mockSentryChannel]);
    });

    it("should only send to specified channels", () => {
      center.error("Error", { code: "TEST", message: "Test" }, { channels: ["ConsoleChannel"] });

      expect(mockConsoleChannel.send).toHaveBeenCalled();
      expect(mockUIChannel.send).not.toHaveBeenCalled();
      expect(mockSentryChannel.send).not.toHaveBeenCalled();
    });

    it("should respect canHandle even with explicit channels", () => {
      // Try to send debug to UIChannel (but UIChannel.canHandle returns false for debug)
      center.debug("Debug", undefined, { channels: ["UIChannel"] });

      // UIChannel should NOT receive it (canHandle filters it out)
      expect(mockUIChannel.send).not.toHaveBeenCalled();
    });
  });

  describe("Channel management", () => {
    beforeEach(() => {
      center = new NotificationCenter([mockConsoleChannel]);
    });

    it("should add channel dynamically", () => {
      center.addChannel(mockUIChannel);

      expect(center.getChannelNames()).toContain("UIChannel");
      expect(center.getChannelNames()).toContain("ConsoleChannel");
    });

    it("should not add duplicate channels", () => {
      center.addChannel(mockConsoleChannel); // Already registered

      const names = center.getChannelNames();
      const consoleCount = names.filter((n) => n === "ConsoleChannel").length;
      expect(consoleCount).toBe(1);
    });

    it("should remove channel dynamically", () => {
      center.addChannel(mockUIChannel);
      const removed = center.removeChannel("UIChannel");

      expect(removed).toBe(true);
      expect(center.getChannelNames()).not.toContain("UIChannel");
    });

    it("should remove channel from beginning of array", () => {
      // Remove first channel
      const removed = center.removeChannel("ConsoleChannel");

      expect(removed).toBe(true);
      expect(center.getChannelNames()).not.toContain("ConsoleChannel");
    });

    it("should return false when removing non-existent channel", () => {
      const removed = center.removeChannel("NonExistent");

      expect(removed).toBe(false);
    });

    it("should list all channel names", () => {
      center.addChannel(mockUIChannel);
      center.addChannel(mockSentryChannel);

      const names = center.getChannelNames();

      expect(names).toHaveLength(3);
      expect(names).toContain("ConsoleChannel");
      expect(names).toContain("UIChannel");
      expect(names).toContain("SentryChannel");
    });
  });

  describe("Error handling", () => {
    it("should return error if all channels fail", () => {
      mockConsoleChannel.send = vi.fn().mockReturnValue(err("Console failed"));
      mockUIChannel.send = vi.fn().mockReturnValue(err("UI failed"));

      center = new NotificationCenter([mockConsoleChannel, mockUIChannel]);

      const result = center.info("Test");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("All channels failed");
        expect(result.error).toContain("ConsoleChannel: Console failed");
        expect(result.error).toContain("UIChannel: UI failed");
      }
    });

    it("should succeed if at least one channel succeeds", () => {
      mockConsoleChannel.send = vi.fn().mockReturnValue(ok(undefined));
      mockUIChannel.send = vi.fn().mockReturnValue(err("UI failed"));

      center = new NotificationCenter([mockConsoleChannel, mockUIChannel]);

      const result = center.info("Test");

      expect(result.ok).toBe(true);
    });

    it("should succeed if no channels match without explicit selection", () => {
      // Debug message, but no console channel
      center = new NotificationCenter([mockUIChannel]); // UIChannel doesn't handle debug

      const result = center.debug("Debug message");

      expect(result.ok).toBe(true);
      expect(mockUIChannel.send).not.toHaveBeenCalled();
    });

    it("should return error when explicit channels are provided but none can handle", () => {
      center = new NotificationCenter([mockUIChannel, mockSentryChannel]);

      const result = center.debug("Debug message", undefined, { channels: ["UIChannel"] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("No channels attempted");
        expect(result.error).toContain("UIChannel");
      }
      expect(mockUIChannel.send).not.toHaveBeenCalled();
      expect(mockSentryChannel.send).not.toHaveBeenCalled();
    });

    it("should return error when requested channels do not exist", () => {
      center = new NotificationCenter([mockConsoleChannel]);

      const result = center.info("Test message", undefined, { channels: ["NonExistentChannel"] });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("No channels attempted to handle notification");
        expect(result.error).toContain("requested: NonExistentChannel");
      }
      expect(mockConsoleChannel.send).not.toHaveBeenCalled();
    });
  });

  describe("name", () => {
    it("should have correct channel names", () => {
      expect(mockConsoleChannel.name).toBe("ConsoleChannel");
      expect(mockUIChannel.name).toBe("UIChannel");
    });
  });
});
