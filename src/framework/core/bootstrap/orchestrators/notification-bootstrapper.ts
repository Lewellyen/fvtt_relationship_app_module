import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { notificationChannelRegistryToken } from "@/application/tokens/notifications/notification-channel-registry.token";
import { queuedUIChannelToken } from "@/application/tokens/notifications/queued-ui-channel.token";
import type { NotificationChannelRegistry } from "@/application/services/notification-center.interface";
import type { PlatformChannelPort } from "@/domain/ports/notifications/platform-channel-port.interface";

/**
 * Orchestrator for attaching notification channels during bootstrap.
 *
 * Responsibilities:
 * - Resolve NotificationCenter and QueuedUIChannel
 * - Attach QueuedUIChannel to NotificationCenter
 * - Handle errors gracefully (warnings, not failures - this phase is optional)
 */
export class NotificationBootstrapper {
  /**
   * Attaches UI notification channel to NotificationCenter.
   *
   * Uses QueuedUIChannel which queues notifications before UI is available
   * and flushes them when UI becomes available.
   *
   * This phase is optional - failures are logged as warnings but don't fail bootstrap.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success or error (errors are logged as warnings but don't fail bootstrap)
   */
  static attachNotificationChannels(container: PlatformContainerPort): Result<void, string> {
    const channelRegistryResult = container.resolveWithError<NotificationChannelRegistry>(
      notificationChannelRegistryToken
    );
    if (!channelRegistryResult.ok) {
      // NotificationChannelRegistry resolution failure - return error so orchestrator can log warning
      return err(
        `NotificationChannelRegistry could not be resolved: ${channelRegistryResult.error.message}`
      );
    }

    const queuedUIChannelResult =
      container.resolveWithError<PlatformChannelPort>(queuedUIChannelToken);
    if (!queuedUIChannelResult.ok) {
      // UI channel is optional - return error so orchestrator can log warning
      return err(`QueuedUIChannel could not be resolved: ${queuedUIChannelResult.error.message}`);
    }

    const channelRegistry = channelRegistryResult.value;
    const queuedUIChannel = queuedUIChannelResult.value;
    channelRegistry.addChannel(queuedUIChannel);
    return ok(undefined);
  }
}
