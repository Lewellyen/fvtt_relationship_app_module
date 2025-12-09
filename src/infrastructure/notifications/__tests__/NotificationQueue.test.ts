import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationQueue } from "../NotificationQueue";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { PlatformNotification } from "@/domain/ports/notifications/platform-channel-port.interface";

describe("NotificationQueue", () => {
  let queue: NotificationQueue;
  let mockRuntimeConfig: PlatformRuntimeConfigPort;
  let mockEnv: EnvironmentConfig;

  beforeEach(() => {
    mockRuntimeConfig = {
      get: vi.fn().mockReturnValue(50), // Default max size
      setFromPlatform: vi.fn(),
      onChange: vi.fn(() => () => {}),
    } as unknown as PlatformRuntimeConfigPort;

    mockEnv = {
      notificationQueueMinSize: 10,
      notificationQueueMaxSize: 1000,
      notificationQueueDefaultSize: 50,
    } as EnvironmentConfig;

    queue = new NotificationQueue(mockRuntimeConfig, mockEnv);
  });

  describe("enqueue", () => {
    it("should add notification to queue", () => {
      const notification: PlatformNotification = {
        level: "info",
        context: "Test message",
        timestamp: new Date(),
      };

      queue.enqueue(notification);

      expect(queue.size).toBe(1);
    });

    it("should remove oldest notification when queue is full", () => {
      const maxSize = 3;
      vi.mocked(mockRuntimeConfig.get).mockReturnValue(maxSize);

      // Fill queue to max
      for (let i = 0; i < maxSize; i++) {
        queue.enqueue({
          level: "info",
          context: `Message ${i}`,
          timestamp: new Date(),
        });
      }

      expect(queue.size).toBe(maxSize);

      // Add one more - should remove oldest
      queue.enqueue({
        level: "info",
        context: "New message",
        timestamp: new Date(),
      });

      expect(queue.size).toBe(maxSize);
    });

    it("should use ENV fallback when RuntimeConfig returns undefined", () => {
      vi.mocked(mockRuntimeConfig.get).mockReturnValue(undefined);

      const maxSize = mockEnv.notificationQueueDefaultSize;

      // Fill queue to ENV default
      for (let i = 0; i < maxSize; i++) {
        queue.enqueue({
          level: "info",
          context: `Message ${i}`,
          timestamp: new Date(),
        });
      }

      expect(queue.size).toBe(maxSize);

      // Add one more - should remove oldest
      queue.enqueue({
        level: "info",
        context: "New message",
        timestamp: new Date(),
      });

      expect(queue.size).toBe(maxSize);
    });
  });

  describe("flush", () => {
    it("should call handler for each queued notification", () => {
      const handler = vi.fn();

      queue.enqueue({
        level: "info",
        context: "Message 1",
        timestamp: new Date(),
      });
      queue.enqueue({
        level: "warn",
        context: "Message 2",
        timestamp: new Date(),
      });

      queue.flush(handler);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenNthCalledWith(1, expect.objectContaining({ context: "Message 1" }));
      expect(handler).toHaveBeenNthCalledWith(2, expect.objectContaining({ context: "Message 2" }));
    });

    it("should clear queue after flushing", () => {
      const handler = vi.fn();

      queue.enqueue({
        level: "info",
        context: "Message 1",
        timestamp: new Date(),
      });

      queue.flush(handler);

      expect(queue.size).toBe(0);
    });

    it("should handle handler errors gracefully", () => {
      const handler = vi.fn().mockImplementation(() => {
        throw new Error("Handler error");
      });

      queue.enqueue({
        level: "info",
        context: "Message 1",
        timestamp: new Date(),
      });
      queue.enqueue({
        level: "warn",
        context: "Message 2",
        timestamp: new Date(),
      });

      // Should not throw
      expect(() => queue.flush(handler)).not.toThrow();
      expect(handler).toHaveBeenCalledTimes(2);
      expect(queue.size).toBe(0); // Queue should still be cleared
    });
  });

  describe("clear", () => {
    it("should remove all notifications from queue", () => {
      queue.enqueue({
        level: "info",
        context: "Message 1",
        timestamp: new Date(),
      });
      queue.enqueue({
        level: "warn",
        context: "Message 2",
        timestamp: new Date(),
      });

      expect(queue.size).toBe(2);

      queue.clear();

      expect(queue.size).toBe(0);
    });
  });

  describe("size", () => {
    it("should return 0 for empty queue", () => {
      expect(queue.size).toBe(0);
    });

    it("should return correct size after enqueue", () => {
      queue.enqueue({
        level: "info",
        context: "Message 1",
        timestamp: new Date(),
      });
      expect(queue.size).toBe(1);

      queue.enqueue({
        level: "warn",
        context: "Message 2",
        timestamp: new Date(),
      });
      expect(queue.size).toBe(2);
    });
  });

  describe("getMaxSize", () => {
    it("should use RuntimeConfig value when available", () => {
      const maxSize = 100;
      vi.mocked(mockRuntimeConfig.get).mockReturnValue(maxSize);

      // Fill queue to max
      for (let i = 0; i < maxSize; i++) {
        queue.enqueue({
          level: "info",
          context: `Message ${i}`,
          timestamp: new Date(),
        });
      }

      expect(queue.size).toBe(maxSize);
    });

    it("should use ENV fallback when RuntimeConfig returns undefined", () => {
      vi.mocked(mockRuntimeConfig.get).mockReturnValue(undefined);

      const maxSize = mockEnv.notificationQueueDefaultSize;

      // Fill queue to ENV default
      for (let i = 0; i < maxSize; i++) {
        queue.enqueue({
          level: "info",
          context: `Message ${i}`,
          timestamp: new Date(),
        });
      }

      expect(queue.size).toBe(maxSize);
    });
  });
});
