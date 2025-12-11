import type { InitPhase, InitPhaseContext } from "../init-phase.interface";
import { InitPhaseCriticality } from "../init-phase.interface";
import { ContextMenuBootstrapper } from "../orchestrators/context-menu-bootstrapper";

/**
 * Init phase for context menu registration.
 */
export class ContextMenuInitPhase implements InitPhase {
  readonly id = "context-menu-registration";
  readonly priority = 7;
  readonly criticality = InitPhaseCriticality.WARN_AND_CONTINUE;

  execute(ctx: InitPhaseContext): ReturnType<typeof ContextMenuBootstrapper.registerContextMenu> {
    return ContextMenuBootstrapper.registerContextMenu(ctx.container);
  }
}
