import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { ContainerPort } from "@/domain/ports/container-port.interface";
import {
  notificationCenterToken,
  uiChannelToken,
} from "@/infrastructure/shared/tokens/notifications.tokens";
import {
  castNotificationService,
  castNotificationChannel,
} from "@/infrastructure/di/types/utilities/runtime-safe-cast";

/**
 * Orchestrator for attaching notification channels during bootstrap.
 *
 * Responsibilities:
 * - Resolve NotificationCenter and UIChannel
 * - Attach UIChannel to NotificationCenter
 * - Handle errors gracefully (warnings, not failures - this phase is optional)
 */
export class NotificationBootstrapper {
  /**
   * Attaches UI notification channel to NotificationCenter.
   *
   * This phase is optional - failures are logged as warnings but don't fail bootstrap.
   *
   * @param container - ContainerPort for service resolution
   * @returns Result indicating success or error (errors are logged as warnings but don't fail bootstrap)
   */
  static attachNotificationChannels(container: ContainerPort): Result<void, string> {
    const notificationCenterResult = container.resolveWithError(notificationCenterToken);
    if (!notificationCenterResult.ok) {
      // NotificationCenter resolution failure - return error so orchestrator can log warning
      return err(
        `NotificationCenter could not be resolved: ${notificationCenterResult.error.message}`
      );
    }

    const uiChannelResult = container.resolveWithError(uiChannelToken);
    if (!uiChannelResult.ok) {
      // UI channel is optional - return error so orchestrator can log warning
      return err(`UIChannel could not be resolved: ${uiChannelResult.error.message}`);
    }

    const notificationCenter = castNotificationService(notificationCenterResult.value);
    const uiChannel = castNotificationChannel(uiChannelResult.value);
    notificationCenter.addChannel(uiChannel);
    return ok(undefined);
  }
}
