/**
 * NotificationQueue - Manages a queue of notifications for delayed delivery.
 *
 * **Responsibilities:**
 * - Store notifications until UI becomes available
 * - Enforce max size limit (removes oldest when limit reached)
 * - Flush all queued notifications when UI becomes available
 * - Clear queue on demand
 *
 * **Design:**
 * - Uses FIFO (First In, First Out) queue
 * - Max size is configurable via RuntimeConfig (with ENV fallback)
 * - When queue is full, oldest notifications are removed
 */

import type { PlatformNotification } from "@/domain/ports/notifications/platform-channel-port.interface";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import { environmentConfigToken } from "@/infrastructure/shared/tokens/core/environment-config.token";

/**
 * NotificationQueue manages a queue of notifications for delayed delivery.
 */
export class NotificationQueue {
  private readonly queue: PlatformNotification[] = [];

  constructor(
    private readonly runtimeConfig: PlatformRuntimeConfigPort,
    private readonly env: EnvironmentConfig
  ) {}

  /**
   * Gets the maximum queue size from RuntimeConfig, with ENV fallback.
   */
  private getMaxSize(): number {
    const value = this.runtimeConfig.get("notificationQueueMaxSize");
    // Fallback: ENV default (should always be set, but safety check)
    return value ?? this.env.notificationQueueDefaultSize;
  }

  /**
   * Adds a notification to the queue.
   * If the queue is full, removes the oldest notification.
   */
  enqueue(notification: PlatformNotification): void {
    const maxSize = this.getMaxSize();

    // Remove oldest if queue is full
    if (this.queue.length >= maxSize) {
      this.queue.shift(); // Remove first (oldest) element
    }

    this.queue.push(notification);
  }

  /**
   * Flushes all queued notifications by calling the handler for each.
   * Queue is cleared after flushing.
   */
  flush(handler: (notification: PlatformNotification) => void): void {
    // Process all notifications
    for (const notification of this.queue) {
      try {
        handler(notification);
      } catch (_error) {
        // Ignore errors during flush (best effort)
        // Errors are logged by the handler if it's a channel
      }
    }

    // Clear queue after flushing
    this.queue.length = 0;
  }

  /**
   * Clears all queued notifications without processing them.
   */
  clear(): void {
    this.queue.length = 0;
  }

  /**
   * Gets the current number of queued notifications.
   */
  get size(): number {
    return this.queue.length;
  }
}

/**
 * DI wrapper for NotificationQueue.
 */
export class DINotificationQueue extends NotificationQueue {
  static dependencies = [runtimeConfigToken, environmentConfigToken] as const;

  constructor(runtimeConfig: PlatformRuntimeConfigPort, env: EnvironmentConfig) {
    super(runtimeConfig, env);
  }
}
