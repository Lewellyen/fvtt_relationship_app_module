import { LOG_PREFIX } from "@/application/constants/app-constants";
import type { Result } from "@/domain/types/result";
import type { ServiceContainer } from "@/infrastructure/di/container";
import { ENV } from "@/framework/config/environment";
import { BootstrapPerformanceTracker } from "@/infrastructure/observability/bootstrap-performance-tracker";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { BootstrapErrorHandler } from "@/framework/core/bootstrap-error-handler";
import { RuntimeConfigAdapter } from "@/infrastructure/config/runtime-config-adapter";
import { castResolvedService } from "@/infrastructure/di/types/utilities/bootstrap-casts";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { IContainerFactory } from "@/framework/core/factory/container-factory";
import { ContainerFactory } from "@/framework/core/factory/container-factory";
import type { IDependencyConfigurator } from "@/framework/core/config/dependency-configurator";
import { DependencyConfigurator } from "@/framework/core/config/dependency-configurator";

/**
 * CompositionRoot
 *
 * **Responsibility:** Only coordination (Facade pattern).
 * Delegates all actual work to specialized components:
 * - ContainerFactory: Container creation
 * - DependencyConfigurator: Dependency configuration
 * - BootstrapPerformanceTracker: Performance tracking
 * - BootstrapErrorHandler: Error handling
 *
 * **Design:**
 * This class acts as a pure facade that coordinates the bootstrap process.
 * All responsibilities are delegated to specialized components following SRP.
 *
 * NOT responsible for:
 * - API exposition (handled by ModuleApiInitializer)
 * - Event listener registration (handled by ModuleEventRegistrar)
 * - Settings registration (handled by ModuleSettingsRegistrar)
 */
export class CompositionRoot {
  private container: ServiceContainer | null = null;
  private readonly containerFactory: IContainerFactory;
  private readonly dependencyConfigurator: IDependencyConfigurator;
  private readonly performanceTracker: BootstrapPerformanceTracker;
  private readonly errorHandler: typeof BootstrapErrorHandler;

  /**
   * Creates a new CompositionRoot instance.
   *
   * @param containerFactory - Factory for creating containers (defaults to ContainerFactory)
   * @param dependencyConfigurator - Configurator for setting up dependencies (defaults to DependencyConfigurator)
   * @param performanceTracker - Optional performance tracker (created internally if not provided)
   * @param errorHandler - Optional error handler (defaults to BootstrapErrorHandler)
   */
  constructor(
    containerFactory?: IContainerFactory,
    dependencyConfigurator?: IDependencyConfigurator,
    performanceTracker?: BootstrapPerformanceTracker,
    errorHandler?: typeof BootstrapErrorHandler
  ) {
    this.containerFactory = containerFactory ?? new ContainerFactory();
    this.dependencyConfigurator = dependencyConfigurator ?? new DependencyConfigurator();
    this.performanceTracker =
      performanceTracker ?? new BootstrapPerformanceTracker(new RuntimeConfigAdapter(ENV), null);
    this.errorHandler = errorHandler ?? BootstrapErrorHandler;
  }

  /**
   * Attempts to log bootstrap completion message.
   * Extracted to separate method for better testability.
   *
   * @param container - The service container to resolve logger from
   * @param duration - The bootstrap duration in milliseconds
   * @internal For testing purposes - public to allow direct testing
   */
  tryLogBootstrapCompletion(container: ServiceContainer, duration: number): void {
    // Use logger from container if available (container is validated at this point)
    const loggerResult = container.resolveWithError(loggerToken);
    if (loggerResult.ok) {
      const logger = castResolvedService<Logger>(loggerResult.value);
      logger.debug(`Bootstrap completed in ${duration.toFixed(2)}ms`);
    } else {
      // Logger not available - silently continue (graceful degradation)
    }
  }

  /**
   * Erstellt den ServiceContainer und führt Basis-Registrierungen aus.
   * Misst Performance für Diagnose-Zwecke.
   *
   * **Coordination Flow:**
   * 1. ContainerFactory creates container
   * 2. BootstrapPerformanceTracker tracks performance
   * 3. DependencyConfigurator configures dependencies
   * 4. BootstrapErrorHandler handles errors if needed
   *
   * **Performance Tracking:**
   * Uses BootstrapPerformanceTracker with ENV (direct import) and null MetricsCollector.
   * MetricsCollector is not yet available during bootstrap phase.
   *
   * @returns Result mit initialisiertem Container oder Fehlermeldung
   */
  bootstrap(): Result<ServiceContainer, string> {
    // 1. Create container via ContainerFactory
    const container = this.containerFactory.createRoot(ENV);

    // 2. Track bootstrap performance and configure dependencies
    const configured = this.performanceTracker.track(
      () => this.dependencyConfigurator.configure(container),
      (duration) => {
        this.tryLogBootstrapCompletion(container, duration);
      }
    );

    if (configured.ok) {
      this.container = container;
      return { ok: true, value: container };
    }

    // 3. Handle error via BootstrapErrorHandler
    this.errorHandler.logError(configured.error, {
      phase: "bootstrap",
      component: "CompositionRoot",
      metadata: { error: configured.error },
    });

    return { ok: false, error: configured.error };
  }

  /**
   * Liefert den initialisierten Container als Result.
   * @returns Result mit Container oder Fehlermeldung
   */
  getContainer(): Result<ServiceContainer, string> {
    if (!this.container) {
      return { ok: false, error: `${LOG_PREFIX} Container not initialized` };
    }
    return { ok: true, value: this.container };
  }
}
