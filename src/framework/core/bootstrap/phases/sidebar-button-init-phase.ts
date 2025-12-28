import type { InitPhase, InitPhaseContext } from "../init-phase.interface";
import { InitPhaseCriticality } from "../init-phase.interface";
import { SidebarButtonBootstrapper } from "../orchestrators/sidebar-button-bootstrapper";

/**
 * Init phase for sidebar button registration.
 */
export class SidebarButtonInitPhase implements InitPhase {
  readonly id = "sidebar-button-registration";
  readonly priority = 8;
  readonly criticality = InitPhaseCriticality.WARN_AND_CONTINUE;

  execute(
    ctx: InitPhaseContext
  ): ReturnType<typeof SidebarButtonBootstrapper.registerSidebarButton> {
    return SidebarButtonBootstrapper.registerSidebarButton(ctx.container);
  }
}
