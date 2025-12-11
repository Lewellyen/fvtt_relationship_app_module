import type { InitPhase, InitPhaseContext } from "../init-phase.interface";
import { InitPhaseCriticality } from "../init-phase.interface";
import { SettingsBootstrapper } from "../orchestrators/settings-bootstrapper";

/**
 * Init phase for settings registration.
 */
export class SettingsInitPhase implements InitPhase {
  readonly id = "settings-registration";
  readonly priority = 4;
  readonly criticality = InitPhaseCriticality.HALT_ON_ERROR;

  execute(ctx: InitPhaseContext): ReturnType<typeof SettingsBootstrapper.registerSettings> {
    return SettingsBootstrapper.registerSettings(ctx.container);
  }
}
