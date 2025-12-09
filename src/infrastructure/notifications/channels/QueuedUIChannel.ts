/**
 * QueuedUIChannel - Decorator for UIChannel that queues notifications before UI is available.
 *
 * **Responsibilities:**
 * - Queue notifications when UI is not available
 * - Flush queue when UI becomes available
 * - Delegate to real UIChannel when UI is available
 *
 * **Design:**
 * - Decorator Pattern: Wraps UIChannel
 * - Uses NotificationQueue for storage
 * - Uses PlatformUIAvailabilityPort for availability checks
 * - Implements PlatformUINotificationChannelPort (same interface as UIChannel)
 */

import type {
  PlatformUINotificationChannelPort,
  PlatformNotification,
  PlatformChannelError,
} from "@/domain/ports/notifications/platform-ui-notification-channel-port.interface";
import type { PlatformUIAvailabilityPort } from "@/domain/ports/platform-ui-availability-port.interface";
import type { NotificationQueue } from "@/infrastructure/notifications/NotificationQueue";
import type { PlatformUINotificationChannelPort as UIChannelType } from "@/domain/ports/notifications/platform-ui-notification-channel-port.interface";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import { notificationQueueToken } from "@/infrastructure/shared/tokens/notifications/notification-queue.token";
import { platformUIAvailabilityPortToken } from "@/application/tokens/domain-ports.tokens";
import { uiChannelToken } from "@/application/tokens/notifications/ui-channel.token";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { platformContainerPortToken } from "@/application/tokens/domain-ports.tokens";

/**
 * QueuedUIChannel decorates UIChannel with queue functionality.
 */
export class QueuedUIChannel implements PlatformUINotificationChannelPort {
  readonly name = "UIChannel";

  private realChannel: UIChannelType | null = null;
  private hasFlushed = false;

  constructor(
    private readonly queue: NotificationQueue,
    private readonly uiAvailability: PlatformUIAvailabilityPort,
    private readonly container: PlatformContainerPort
  ) {}

  /**
   * Gets or creates the real UIChannel.
   * Uses lazy initialization to avoid creating channel before UI is available.
   */
  private getRealChannel(): UIChannelType | null {
    if (this.realChannel) {
      return this.realChannel;
    }

    // Try to resolve UIChannel from container
    const channelResult = this.container.resolveWithError<UIChannelType>(uiChannelToken);
    if (!channelResult.ok) {
      return null;
    }

    this.realChannel = channelResult.value;
    return this.realChannel;
  }

  /**
   * Determines if this channel should handle the notification.
   * Delegates to real channel if available, otherwise uses same logic as UIChannel.
   */
  canHandle(notification: PlatformNotification): boolean {
    // Debug messages are too technical for UI (same as UIChannel)
    if (notification.level === "debug") {
      return false;
    }

    // If real channel is available, delegate
    const realChannel = this.getRealChannel();
    if (realChannel) {
      return realChannel.canHandle(notification);
    }

    // Otherwise, use same logic (non-debug messages)
    return true;
  }

  /**
   * Sends notification to UI or queues it if UI is not available.
   */
  send(notification: PlatformNotification): Result<void, PlatformChannelError> {
    // Check if UI is available
    if (this.uiAvailability.isAvailable()) {
      // Flush queue if not already flushed
      if (!this.hasFlushed && this.queue.size > 0) {
        const realChannel = this.getRealChannel();
        if (realChannel) {
          this.queue.flush((n) => {
            // Ignore errors during flush (best effort)
            realChannel.send(n);
          });
        }
        this.hasFlushed = true;
      }

      // Send immediately via real channel
      const realChannel = this.getRealChannel();
      if (!realChannel) {
        // UI is available but channel can't be resolved - queue it
        this.queue.enqueue(notification);
        return ok(undefined);
      }

      return realChannel.send(notification);
    }

    // UI not available - queue notification
    // Debug messages should not be queued (same as UIChannel logic)
    if (notification.level === "debug") {
      return ok(undefined); // Silently ignore debug messages
    }

    this.queue.enqueue(notification);
    return ok(undefined);
  }

  /**
   * Sends notification directly to UI (bypasses queue).
   * Used for immediate notifications when UI is available.
   */
  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformChannelError> {
    // If UI is available, use real channel
    if (this.uiAvailability.isAvailable()) {
      const realChannel = this.getRealChannel();
      if (!realChannel) {
        return err({
          code: "CHANNEL_NOT_AVAILABLE",
          message: "UIChannel could not be resolved",
          channelName: this.name,
        });
      }

      return realChannel.notify(message, type);
    }

    // UI not available - cannot send immediate notification
    return err({
      code: "UI_NOT_AVAILABLE",
      message: "UI is not available for immediate notifications",
      channelName: this.name,
    });
  }
}

/**
 * DI wrapper for QueuedUIChannel.
 */
export class DIQueuedUIChannel extends QueuedUIChannel {
  static dependencies = [
    notificationQueueToken,
    platformUIAvailabilityPortToken,
    platformContainerPortToken,
  ] as const;

  constructor(
    queue: NotificationQueue,
    uiAvailability: PlatformUIAvailabilityPort,
    container: PlatformContainerPort
  ) {
    super(queue, uiAvailability, container);
  }
}
