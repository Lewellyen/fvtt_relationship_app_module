import type { InitPhase, InitPhaseContext } from "../init-phase.interface";
import { InitPhaseCriticality } from "../init-phase.interface";
import { MetricsBootstrapper } from "../orchestrators/metrics-bootstrapper";

/**
 * Init phase for metrics initialization.
 */
export class MetricsInitPhase implements InitPhase {
  readonly id = "metrics-initialization";
  readonly priority = 1;
  readonly criticality = InitPhaseCriticality.WARN_AND_CONTINUE;

  execute(ctx: InitPhaseContext): ReturnType<typeof MetricsBootstrapper.initializeMetrics> {
    return MetricsBootstrapper.initializeMetrics(ctx.container);
  }
}
