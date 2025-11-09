import { MODULE_CONSTANTS } from "@/constants";
import type { Result } from "@/types/result";
import { ServiceContainer } from "@/di_infrastructure/container";
import { configureDependencies } from "@/config/dependencyconfig";
import { ENV } from "@/config/environment";
import { BootstrapPerformanceTracker } from "@/observability/bootstrap-performance-tracker";
import { loggerToken } from "@/tokens/tokenindex";

/**
 * CompositionRoot
 *
 * Responsible for DI-Container bootstrap only.
 * Creates the ServiceContainer and performs service registrations via configureDependencies.
 *
 * Responsibilities:
 * - Create ServiceContainer (createRoot)
 * - Execute configureDependencies (all service registrations)
 * - Track bootstrap performance
 * - Provide container access via getContainer()
 *
 * NOT responsible for:
 * - API exposition (handled by ModuleApiInitializer)
 * - Hook registration (handled by ModuleHookRegistrar)
 * - Settings registration (handled by ModuleSettingsRegistrar)
 */
export class CompositionRoot {
  private container: ServiceContainer | null = null;

  /**
   * Erstellt den ServiceContainer und führt Basis-Registrierungen aus.
   * Misst Performance für Diagnose-Zwecke.
   *
   * **Performance Tracking:**
   * Uses BootstrapPerformanceTracker with ENV (direct import) and null MetricsCollector.
   * MetricsCollector is not yet available during bootstrap phase.
   *
   * @returns Result mit initialisiertem Container oder Fehlermeldung
   */
  bootstrap(): Result<ServiceContainer, string> {
    const container = ServiceContainer.createRoot();

    // Track bootstrap performance (no MetricsCollector yet)
    const performanceTracker = new BootstrapPerformanceTracker(ENV, null);

    const configured = performanceTracker.track(
      () => configureDependencies(container),
      /* c8 ignore start -- onComplete callback is only called when performance tracking is enabled and sampling passes */
      (duration) => {
        // Use logger from container if available (container is validated at this point)
        const loggerResult = container.resolveWithError(loggerToken);
        if (loggerResult.ok) {
          loggerResult.value.debug(`Bootstrap completed in ${duration.toFixed(2)}ms`);
        }
      }
      /* c8 ignore stop */
    );

    if (configured.ok) {
      this.container = container;
      return { ok: true, value: container };
    }
    return { ok: false, error: configured.error };
  }

  /**
   * Liefert den initialisierten Container als Result.
   * @returns Result mit Container oder Fehlermeldung
   */
  getContainer(): Result<ServiceContainer, string> {
    if (!this.container) {
      return { ok: false, error: `${MODULE_CONSTANTS.LOG_PREFIX} Container not initialized` };
    }
    return { ok: true, value: this.container };
  }
}
