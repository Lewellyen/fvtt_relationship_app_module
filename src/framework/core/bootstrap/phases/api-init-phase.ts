import type { InitPhase, InitPhaseContext } from "../init-phase.interface";
import { InitPhaseCriticality } from "../init-phase.interface";
import { ApiBootstrapper } from "../orchestrators/api-bootstrapper";

/**
 * Init phase for API exposure.
 */
export class ApiInitPhase implements InitPhase {
  readonly id = "api-exposure";
  readonly priority = 3;
  readonly criticality = InitPhaseCriticality.HALT_ON_ERROR;

  execute(ctx: InitPhaseContext): ReturnType<typeof ApiBootstrapper.exposeApi> {
    return ApiBootstrapper.exposeApi(ctx.container);
  }
}
