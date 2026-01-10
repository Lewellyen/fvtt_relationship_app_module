import { describe, it, expect, beforeEach, vi } from "vitest";
import { NotificationBootstrapper } from "../notification-bootstrapper";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { notificationChannelRegistryToken } from "@/application/tokens/notifications/notification-channel-registry.token";
import { queuedUIChannelToken } from "@/application/tokens/notifications/queued-ui-channel.token";
import { ok, err } from "@/domain/utils/result";
import type { NotificationChannelRegistry } from "@/application/services/notification-center.interface";
import type { PlatformChannelPort } from "@/domain/ports/notifications/platform-channel-port.interface";

describe("NotificationBootstrapper", () => {
  let mockContainer: PlatformContainerPort;
  let mockChannelRegistry: NotificationChannelRegistry;
  let mockQueuedUIChannel: PlatformChannelPort;

  beforeEach(() => {
    mockChannelRegistry = {
      addChannel: vi.fn(),
    } as unknown as NotificationChannelRegistry;

    mockQueuedUIChannel = {} as unknown as PlatformChannelPort;

    mockContainer = {
      resolveWithError: vi.fn((token) => {
        if (token === notificationChannelRegistryToken) {
          return ok(mockChannelRegistry);
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
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(notificationChannelRegistryToken);
    expect(mockContainer.resolveWithError).toHaveBeenCalledWith(queuedUIChannelToken);
    expect(mockChannelRegistry.addChannel).toHaveBeenCalledWith(mockQueuedUIChannel);
  });

  it("should return error when NotificationChannelRegistry cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockReturnValue(
      err({
        code: "TokenNotRegistered",
        message: "NotificationChannelRegistry not found",
        tokenDescription: String(notificationChannelRegistryToken),
      })
    );

    const result = NotificationBootstrapper.attachNotificationChannels(mockContainer);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("NotificationChannelRegistry could not be resolved");
    }
    expect(mockChannelRegistry.addChannel).not.toHaveBeenCalled();
  });

  it("should return error when QueuedUIChannel cannot be resolved", () => {
    vi.mocked(mockContainer.resolveWithError).mockImplementation((token) => {
      if (token === notificationChannelRegistryToken) {
        return ok(mockChannelRegistry);
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
    expect(mockChannelRegistry.addChannel).not.toHaveBeenCalled();
  });
});
