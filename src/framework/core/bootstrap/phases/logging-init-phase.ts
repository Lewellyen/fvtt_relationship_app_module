import type { InitPhase, InitPhaseContext } from "../init-phase.interface";
import { InitPhaseCriticality } from "../init-phase.interface";
import { LoggingBootstrapper } from "../orchestrators/logging-bootstrapper";

/**
 * Init phase for logging configuration.
 */
export class LoggingInitPhase implements InitPhase {
  readonly id = "logging-configuration";
  readonly priority = 5;
  readonly criticality = InitPhaseCriticality.WARN_AND_CONTINUE;

  execute(ctx: InitPhaseContext): ReturnType<typeof LoggingBootstrapper.configureLogging> {
    return LoggingBootstrapper.configureLogging(ctx.container, ctx.logger);
  }
}
