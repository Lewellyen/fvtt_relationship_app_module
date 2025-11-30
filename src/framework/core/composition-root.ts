import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import type { Result } from "@/domain/types/result";
import { ServiceContainer } from "@/infrastructure/di/container";
import { configureDependencies } from "@/framework/config/dependencyconfig";
import { ENV } from "@/framework/config/environment";
import { BootstrapPerformanceTracker } from "@/infrastructure/observability/bootstrap-performance-tracker";
import { loggerToken } from "@/infrastructure/shared/tokens";
import { createBootstrapLogger } from "@/infrastructure/logging/BootstrapLogger";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";
import { castLogger } from "@/infrastructure/di/types/utilities/runtime-safe-cast";

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
 * - Event listener registration (handled by ModuleEventRegistrar)
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
    const runtimeConfig = createRuntimeConfig(ENV);
    const performanceTracker = new BootstrapPerformanceTracker(runtimeConfig, null);

    const configured = performanceTracker.track(
      () => configureDependencies(container),
      (duration) => {
        // Use logger from container if available (container is validated at this point)
        const loggerResult = container.resolveWithError(loggerToken);
        if (loggerResult.ok) {
          const logger = castLogger(loggerResult.value);
          logger.debug(`Bootstrap completed in ${duration.toFixed(2)}ms`);
        }
      }
    );

    if (configured.ok) {
      this.container = container;
      return { ok: true, value: container };
    }

    createBootstrapLogger().error(
      "Failed to configure dependencies during bootstrap",
      configured.error
    );
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
