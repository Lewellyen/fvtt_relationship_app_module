import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { notificationCenterToken } from "@/application/tokens/notifications/notification-center.token";
import { queuedUIChannelToken } from "@/application/tokens/notifications/queued-ui-channel.token";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";
import type { NotificationService } from "@/application/services/notification-center.interface";
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
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);
    if (!notificationCenterResult.ok) {
      // NotificationCenter resolution failure - return error so orchestrator can log warning
      return err(
        `NotificationCenter could not be resolved: ${notificationCenterResult.error.message}`
      );
    }

    const queuedUIChannelResult = container.resolveWithError(queuedUIChannelToken);
    if (!queuedUIChannelResult.ok) {
      // UI channel is optional - return error so orchestrator can log warning
      return err(`QueuedUIChannel could not be resolved: ${queuedUIChannelResult.error.message}`);
    }

    const notificationCenter = castResolvedService<NotificationService>(
      notificationCenterResult.value
    );
    const queuedUIChannel = castResolvedService<PlatformChannelPort>(queuedUIChannelResult.value);
    notificationCenter.addChannel(queuedUIChannel);
    return ok(undefined);
  }
}
