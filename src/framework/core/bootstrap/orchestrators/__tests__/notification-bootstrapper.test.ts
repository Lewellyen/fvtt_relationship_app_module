import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationBootstrapper } from "../notification-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { notificationCenterToken } from "@/application/tokens/notifications/notification-center.token";
import { queuedUIChannelToken } from "@/application/tokens/notifications/queued-ui-channel.token";
import { ok, err } from "@/domain/utils/result";
import type { NotificationService } from "@/application/services/notification-center.interface";
import type { PlatformChannelPort } from "@/domain/ports/notifications/platform-channel-port.interface";

describe("NotificationBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockNotificationCenter: NotificationService;
  let mockQueuedUIChannel: PlatformChannelPort;

  beforeEach(() => {
    mockNotificationCenter = {
      addChannel: vi.fn(),
    } as unknown as NotificationService;

    mockQueuedUIChannel = {} as unknown as PlatformChannelPort;

    mockContainer = {
      resolveWithError: vi.fn((token) => {
        if (token === notificationCenterToken) {
          return ok(mockNotificationCenter);
        }
        if (token === queuedUIChannelToken) {
          return ok(mockQueuedUIChannel);
        }
        return err({
          code: "TokenNotRegistered",
          message: "Token not found",
          tokenDescription: String(token),
        });
      }),
    } as unknown as PlatformContainerPort;
  });

  it("should attach notification channels successfully", () => {
    const result = NotificationBootstrapper.attachNotificationChannels(mockContainer);

    expect(result.ok).toBe(true);
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(notificationCenterToken);
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(queuedUIChannelToken);
    expect(mockNotificationCenter.addChannel).toHaveBeenCalledWith(mockQueuedUIChannel);
  });

  it("should return error when NotificationCenter cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "NotificationCenter not found",
        tokenDescription: String(notificationCenterToken),
      })
    );

    const result = NotificationBootstrapper.attachNotificationChannels(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("NotificationCenter could not be resolved");
    }
    expect(mockNotificationCenter.addChannel).not.toHaveBeenCalled();
  });

  it("should return error when QueuedUIChannel cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
      if (token === notificationCenterToken) {
        return ok(mockNotificationCenter);
      }
      if (token === queuedUIChannelToken) {
        return err({
          code: "TokenNotRegistered",
          message: "QueuedUIChannel not found",
          tokenDescription: String(queuedUIChannelToken),
        });
      }
      return err({
        code: "TokenNotRegistered",
        message: "Token not found",
        tokenDescription: String(token),
      });
    });

    const result = NotificationBootstrapper.attachNotificationChannels(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("QueuedUIChannel could not be resolved");
    }
    expect(mockNotificationCenter.addChannel).not.toHaveBeenCalled();
  });
});
