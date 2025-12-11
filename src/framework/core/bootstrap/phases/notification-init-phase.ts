import type { InitPhase, InitPhaseContext } from "../init-phase.interface";
import { InitPhaseCriticality } from "../init-phase.interface";
import { NotificationBootstrapper } from "../orchestrators/notification-bootstrapper";

/**
 * Init phase for notification channels attachment.
 */
export class NotificationInitPhase implements InitPhase {
  readonly id = "notification-channels";
  readonly priority = 2;
  readonly criticality = InitPhaseCriticality.WARN_AND_CONTINUE;

  execute(
    ctx: InitPhaseContext
  ): ReturnType<typeof NotificationBootstrapper.attachNotificationChannels> {
    return NotificationBootstrapper.attachNotificationChannels(ctx.container);
  }
}
