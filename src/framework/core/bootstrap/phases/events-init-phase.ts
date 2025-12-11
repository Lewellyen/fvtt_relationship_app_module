import type { InitPhase, InitPhaseContext } from "../init-phase.interface";
import { InitPhaseCriticality } from "../init-phase.interface";
import { EventsBootstrapper } from "../orchestrators/events-bootstrapper";

/**
 * Init phase for event registration.
 */
export class EventsInitPhase implements InitPhase {
  readonly id = "event-registration";
  readonly priority = 6;
  readonly criticality = InitPhaseCriticality.HALT_ON_ERROR;

  execute(ctx: InitPhaseContext): ReturnType<typeof EventsBootstrapper.registerEvents> {
    return EventsBootstrapper.registerEvents(ctx.container);
  }
}
