import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueuedUIChannel } from "../QueuedUIChannel";
import type { NotificationQueue } from "@/infrastructure/notifications/NotificationQueue";
import type { PlatformUIAvailabilityPort } from "@/domain/ports/platform-ui-availability-port.interface";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import type {
  PlatformUINotificationChannelPort,
  PlatformNotification,
} from "@/domain/ports/notifications/platform-ui-notification-channel-port.interface";
import { uiChannelToken } from "@/application/tokens/notifications/ui-channel.token";
import { ok, err } from "@/domain/utils/result";

describe("QueuedUIChannel", () => {
  let channel: QueuedUIChannel;
  let mockQueue: NotificationQueue;
  let mockUIAvailability: PlatformUIAvailabilityPort;
  let mockContainer: PlatformContainerPort;
  let mockRealChannel: PlatformUINotificationChannelPort;

  beforeEach(() => {
    mockRealChannel = {
      name: "UIChannel",
      canHandle: vi.fn().mockReturnValue(true),
      send: vi.fn().mockReturnValue(ok(undefined)),
      notify: vi.fn().mockReturnValue(ok(undefined)),
    } as unknown as PlatformUINotificationChannelPort;

    mockQueue = {
      enqueue: vi.fn(),
      flush: vi.fn(),
      clear: vi.fn(),
      get size() {
        return 0;
      },
    } as unknown as NotificationQueue;

    mockUIAvailability = {
      isAvailable: vi.fn().mockReturnValue(false),
      onAvailable: vi.fn(),
    } as unknown as PlatformUIAvailabilityPort;

    mockContainer = {
      resolveWithError: vi.fn().mockReturnValue({ ok: true, value: mockRealChannel }),
    } as unknown as PlatformContainerPort;

    channel = new QueuedUIChannel(mockQueue, mockUIAvailability, mockContainer);
  });

  describe("name", () => {
    it("should return 'UIChannel'", () => {
      expect(channel.name).toBe("UIChannel");
    });
  });

  describe("canHandle", () => {
    it("should NOT handle debug notifications", () => {
      const notification: PlatformNotification = {
        level: "debug",
        context: "Debug message",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(false);
    });

    it("should handle non-debug notifications when real channel is not available", () => {
      vi.mocked(mockContainer.resolveWithError).mockReturnValue({
        ok: false,
        error: { code: "NOT_FOUND", message: "Not found" },
      });

      const notification: PlatformNotification = {
        level: "info",
        context: "Info message",
        timestamp: new Date(),
      };

      expect(channel.canHandle(notification)).toBe(true);
    });

    it("should delegate to real channel when available", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);
      vi.mocked(mockRealChannel.canHandle).mockReturnValue(false);

      const notification: PlatformNotification = {
        level: "info",
        context: "Info message",
        timestamp: new Date(),
      };

      const result = channel.canHandle(notification);

      expect(result).toBe(false);
      expect(mockRealChannel.canHandle).toHaveBeenCalledWith(notification);
    });
  });

  describe("send", () => {
    it("should queue notification when UI is not available", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(false);

      const notification: PlatformNotification = {
        level: "info",
        context: "Test message",
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(true);
      expect(mockQueue.enqueue).toHaveBeenCalledWith(notification);
      expect(mockRealChannel.send).not.toHaveBeenCalled();
    });

    it("should NOT queue debug notifications when UI is not available", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(false);

      const notification: PlatformNotification = {
        level: "debug",
        context: "Debug message",
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(true);
      expect(mockQueue.enqueue).not.toHaveBeenCalled();
    });

    it("should flush queue and send immediately when UI becomes available", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);
      Object.defineProperty(mockQueue, "size", {
        get: () => 2,
        configurable: true,
      });

      const queuedNotification1: PlatformNotification = {
        level: "info",
        context: "Queued 1",
        timestamp: new Date(),
      };
      const queuedNotification2: PlatformNotification = {
        level: "warn",
        context: "Queued 2",
        timestamp: new Date(),
      };

      // Simulate queued notifications
      vi.mocked(mockQueue.flush).mockImplementation((handler) => {
        handler(queuedNotification1);
        handler(queuedNotification2);
      });

      const newNotification: PlatformNotification = {
        level: "info",
        context: "New message",
        timestamp: new Date(),
      };

      const result = channel.send(newNotification);

      expect(result.ok).toBe(true);
      expect(mockQueue.flush).toHaveBeenCalled();
      expect(mockRealChannel.send).toHaveBeenCalledWith(queuedNotification1);
      expect(mockRealChannel.send).toHaveBeenCalledWith(queuedNotification2);
      expect(mockRealChannel.send).toHaveBeenCalledWith(newNotification);
    });

    it("should only flush queue once", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);
      Object.defineProperty(mockQueue, "size", {
        get: () => 1,
        configurable: true,
      });

      const notification1: PlatformNotification = {
        level: "info",
        context: "Message 1",
        timestamp: new Date(),
      };
      const notification2: PlatformNotification = {
        level: "info",
        context: "Message 2",
        timestamp: new Date(),
      };

      channel.send(notification1);
      channel.send(notification2);

      // Should only flush once (on first send when UI becomes available)
      expect(mockQueue.flush).toHaveBeenCalledTimes(1);
    });

    it("should not flush queue if real channel cannot be resolved when UI becomes available", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);
      Object.defineProperty(mockQueue, "size", {
        get: () => 1,
        configurable: true,
      });
      vi.mocked(mockContainer.resolveWithError).mockReturnValue({
        ok: false,
        error: { code: "NOT_FOUND", message: "Channel not found" },
      });

      const notification: PlatformNotification = {
        level: "info",
        context: "Test message",
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      // Should queue notification if channel cannot be resolved
      expect(result.ok).toBe(true);
      expect(mockQueue.flush).not.toHaveBeenCalled();
      expect(mockQueue.enqueue).toHaveBeenCalledWith(notification);
    });

    it("should queue notification if UI is available but channel cannot be resolved", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);
      vi.mocked(mockContainer.resolveWithError).mockReturnValue({
        ok: false,
        error: { code: "NOT_FOUND", message: "Channel not found" },
      });

      const notification: PlatformNotification = {
        level: "info",
        context: "Test message",
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(true);
      expect(mockQueue.enqueue).toHaveBeenCalledWith(notification);
    });

    it("should send immediately when UI is available and channel is resolved", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);
      Object.defineProperty(mockQueue, "size", {
        get: () => 0,
        configurable: true,
      });

      const notification: PlatformNotification = {
        level: "info",
        context: "Test message",
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      expect(result.ok).toBe(true);
      expect(mockRealChannel.send).toHaveBeenCalledWith(notification);
      expect(mockQueue.enqueue).not.toHaveBeenCalled();
    });

    it("should handle flush errors gracefully", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);
      Object.defineProperty(mockQueue, "size", {
        get: () => 1,
        configurable: true,
      });

      const queuedNotification: PlatformNotification = {
        level: "info",
        context: "Queued",
        timestamp: new Date(),
      };

      vi.mocked(mockQueue.flush).mockImplementation((handler) => {
        handler(queuedNotification);
      });
      vi.mocked(mockRealChannel.send).mockReturnValue(
        err({
          code: "SEND_FAILED",
          message: "Failed to send",
          channelName: "UIChannel",
        })
      );

      const newNotification: PlatformNotification = {
        level: "info",
        context: "New",
        timestamp: new Date(),
      };

      // Should not throw
      expect(() => channel.send(newNotification)).not.toThrow();
    });
  });

  describe("notify", () => {
    it("should return error when UI is not available", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(false);

      const result = channel.notify("Test message", "info");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UI_NOT_AVAILABLE");
        expect(result.error.message).toContain("UI is not available");
      }
      expect(mockRealChannel.notify).not.toHaveBeenCalled();
    });

    it("should return error when UI is available but channel cannot be resolved", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);
      vi.mocked(mockContainer.resolveWithError).mockReturnValue({
        ok: false,
        error: { code: "NOT_FOUND", message: "Channel not found" },
      });

      const result = channel.notify("Test message", "info");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("CHANNEL_NOT_AVAILABLE");
        expect(result.error.message).toContain("UIChannel could not be resolved");
      }
    });

    it("should delegate to real channel when UI is available", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);
      vi.mocked(mockRealChannel.notify).mockReturnValue(ok(undefined));

      const result = channel.notify("Test message", "warning");

      expect(result.ok).toBe(true);
      expect(mockRealChannel.notify).toHaveBeenCalledWith("Test message", "warning");
    });

    it("should propagate errors from real channel", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);
      const channelError = {
        code: "NOTIFICATION_FAILED",
        message: "Failed to notify",
        channelName: "UIChannel",
      };
      vi.mocked(mockRealChannel.notify).mockReturnValue(err(channelError));

      const result = channel.notify("Test message", "error");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual(channelError);
      }
    });
  });

  describe("getRealChannel", () => {
    it("should cache real channel after first resolution", () => {
      vi.mocked(mockUIAvailability.isAvailable).mockReturnValue(true);

      const notification: PlatformNotification = {
        level: "info",
        context: "Test",
        timestamp: new Date(),
      };

      channel.send(notification);
      channel.send(notification);

      // Should only resolve once
      expect(mockContainer.resolveWithError).toHaveBeenCalledTimes(1);
      expect(mockContainer.resolveWithError).toHaveBeenCalledWith(uiChannelToken);
    });

    it("should return null if channel cannot be resolved", () => {
      vi.mocked(mockContainer.resolveWithError).mockReturnValue({
        ok: false,
        error: { code: "NOT_FOUND", message: "Not found" },
      });

      const notification: PlatformNotification = {
        level: "info",
        context: "Test",
        timestamp: new Date(),
      };

      const result = channel.send(notification);

      // Should queue notification when channel cannot be resolved
      expect(result.ok).toBe(true);
      expect(mockQueue.enqueue).toHaveBeenCalled();
    });
  });
});
