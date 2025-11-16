import { ServiceContainer } from "@/di_infrastructure/container";
import { ok, err, isErr } from "@/utils/functional/result";
import type { Result } from "@/types/result";
import type { Logger } from "@/interfaces/logger";
import {
  environmentConfigToken,
  loggerToken,
  containerHealthCheckToken,
  metricsHealthCheckToken,
  healthCheckRegistryToken,
  metricsCollectorToken,
  serviceContainerToken,
  runtimeConfigToken,
} from "@/tokens/tokenindex";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { ENV, LogLevel } from "@/config/environment";
import type { EnvironmentConfig } from "@/config/environment";
import { MODULE_CONSTANTS } from "@/constants";
import { RuntimeConfigService } from "@/core/runtime-config/runtime-config.service";
import { DIContainerHealthCheck } from "@/core/health/container-health-check";
import { DIMetricsHealthCheck } from "@/core/health/metrics-health-check";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";

// Import config modules
import { registerCoreServices } from "@/config/modules/core-services.config";
import { registerObservability } from "@/config/modules/observability.config";
import {
  registerPortInfrastructure,
  registerPortRegistries,
} from "@/config/modules/port-infrastructure.config";
import { registerFoundryServices } from "@/config/modules/foundry-services.config";
import { registerUtilityServices } from "@/config/modules/utility-services.config";
import { registerCacheServices } from "@/config/modules/cache-services.config";
import { registerI18nServices } from "@/config/modules/i18n-services.config";
import { registerNotifications } from "@/config/modules/notifications.config";
import { registerRegistrars } from "@/config/modules/registrars.config";

/**
 * Registers fallback factories for critical services.
 * Fallbacks are used when normal resolution fails.
 */
function registerFallbacks(container: ServiceContainer): void {
  container.registerFallback<Logger>(loggerToken, (): Logger => {
    // Fallback without EnvironmentConfig - DEBUG-Level for maximum transparency
    const fallbackConfig: EnvironmentConfig = {
      logLevel: LogLevel.DEBUG,
      isDevelopment: false,
      isProduction: false,
      enablePerformanceTracking: false,
      enableMetricsPersistence: false,
      metricsPersistenceKey: "fallback.metrics",
      performanceSamplingRate: 1.0,
      enableCacheService: true,
      cacheDefaultTtlMs: MODULE_CONSTANTS.DEFAULTS.CACHE_TTL_MS,
    };
    return new ConsoleLoggerService(new RuntimeConfigService(fallbackConfig));
  });
}

/**
 * Registers static bootstrap values that already exist outside the container.
 */
function registerStaticValues(container: ServiceContainer): Result<void, string> {
  const envResult = container.registerValue(environmentConfigToken, ENV);
  if (isErr(envResult)) {
    return err(`Failed to register EnvironmentConfig: ${envResult.error.message}`);
  }

  const runtimeConfigResult = container.registerValue(
    runtimeConfigToken,
    new RuntimeConfigService(ENV)
  );
  if (isErr(runtimeConfigResult)) {
    return err(`Failed to register RuntimeConfigService: ${runtimeConfigResult.error.message}`);
  }

  const containerResult = container.registerValue(serviceContainerToken, container);
  if (isErr(containerResult)) {
    return err(`Failed to register ServiceContainer: ${containerResult.error.message}`);
  }

  return ok(undefined);
}

/**
 * Registers sub-container style values (e.g., Foundry Port registries).
 */
function registerSubcontainerValues(container: ServiceContainer): Result<void, string> {
  return registerPortRegistries(container);
}

/**
 * Registers loop-prevention health checks with DI metadata.
 */
function registerLoopPreventionServices(container: ServiceContainer): Result<void, string> {
  const containerCheckResult = container.registerClass(
    containerHealthCheckToken,
    DIContainerHealthCheck,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(containerCheckResult)) {
    return err(`Failed to register ContainerHealthCheck: ${containerCheckResult.error.message}`);
  }

  const metricsCheckResult = container.registerClass(
    metricsHealthCheckToken,
    DIMetricsHealthCheck,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(metricsCheckResult)) {
    return err(`Failed to register MetricsHealthCheck: ${metricsCheckResult.error.message}`);
  }

  return ok(undefined);
}

/**
 * Instantiates loop-prevention services (health checks) after validation.
 */
function initializeLoopPreventionValues(container: ServiceContainer): Result<void, string> {
  const registryRes = container.resolveWithError(healthCheckRegistryToken);
  const metricsRes = container.resolveWithError(metricsCollectorToken);
  if (!registryRes.ok) {
    return err(`Failed to resolve HealthCheckRegistry: ${registryRes.error.message}`);
  }
  if (!metricsRes.ok) {
    return err(`Failed to resolve MetricsCollector: ${metricsRes.error.message}`);
  }

  const containerCheckResult = container.resolveWithError(containerHealthCheckToken);
  if (!containerCheckResult.ok) {
    return err(`Failed to resolve ContainerHealthCheck: ${containerCheckResult.error.message}`);
  }

  const metricsCheckResult = container.resolveWithError(metricsHealthCheckToken);
  if (!metricsCheckResult.ok) {
    return err(`Failed to resolve MetricsHealthCheck: ${metricsCheckResult.error.message}`);
  }
  return ok(undefined);
}

/**
 * Validates the container configuration.
 * Ensures all dependencies are resolvable and no circular dependencies exist.
 */
function validateContainer(container: ServiceContainer): Result<void, string> {
  const validateResult = container.validate();
  if (isErr(validateResult)) {
    const errorMessages = validateResult.error.map((e) => e.message).join(", ");
    return err(`Validation failed: ${errorMessages}`);
  }
  return ok(undefined);
}

/**
 * Configures all dependency injection mappings for the application.
 *
 * RESPONSIBILITY: Orchestrate registration of all service modules.
 *
 * DESIGN PRINCIPLES:
 * - Services are self-configuring via constructor dependencies
 * - Observability uses self-registration pattern
 * - No manual wiring - all connections via DI
 * - Modular config files by domain
 *
 * REGISTRATION ORDER:
 * 1. Fallbacks (Logger emergency fallback)
 * 2. Static Values (EnvironmentConfig)
 * 3. Core Services (Logger, Metrics, ModuleHealth)
 * 4. Observability (EventEmitter, ObservabilityRegistry)
 * 5. Utility Services (Performance, Retry)
 * 6. Port Infrastructure (PortSelector)
 * 7. Subcontainer Values (Foundry Port Registries)
 * 8. Foundry Services (Game, Hooks, Document, UI, Settings, Journal)
 * 9. I18n Services (FoundryI18n, LocalI18n, I18nFacade, TranslationHandlers)
 * 10. Notifications (NotificationCenter, ConsoleChannel, UIChannel)
 * 11. Registrars (ModuleSettingsRegistrar, ModuleHookRegistrar)
 * 12. Validation (Check dependency graph)
 * 13. Loop-Prevention Services (Health checks referencing validated services)
 *
 * @param container - The service container to configure
 * @returns Result indicating success or configuration errors
 *
 * @example
 * ```typescript
 * const container = ServiceContainer.createRoot();
 * const result = configureDependencies(container);
 * if (isOk(result)) {
 *   const logger = container.resolve(loggerToken);
 * }
 * ```
 */
export function configureDependencies(container: ServiceContainer): Result<void, string> {
  registerFallbacks(container);

  const staticValuesResult = registerStaticValues(container);
  if (isErr(staticValuesResult)) return staticValuesResult;

  // Register all service modules in order
  const coreResult = registerCoreServices(container);
  if (isErr(coreResult)) return coreResult;

  const observabilityResult = registerObservability(container);
  /* c8 ignore next 2 -- Error propagation: Tested in registerObservability module tests; deep module mocking too complex */
  if (isErr(observabilityResult)) return observabilityResult;

  const utilityResult = registerUtilityServices(container);
  if (isErr(utilityResult)) return utilityResult;

  const cacheServiceResult = registerCacheServices(container);
  /* c8 ignore next 2 -- Error propagation: Tested in registerCacheServices module tests; tie-in hier ist dünne Delegationsschicht */
  if (isErr(cacheServiceResult)) return cacheServiceResult;

  const portInfraResult = registerPortInfrastructure(container);
  /* c8 ignore next 2 -- Error propagation tested in registerPortInfrastructure unit tests */
  if (isErr(portInfraResult)) return portInfraResult;

  const subcontainerValuesResult = registerSubcontainerValues(container);
  if (isErr(subcontainerValuesResult)) return subcontainerValuesResult;

  const foundryServicesResult = registerFoundryServices(container);
  if (isErr(foundryServicesResult)) return foundryServicesResult;

  const i18nServicesResult = registerI18nServices(container);
  /* c8 ignore next 2 -- Error propagation: Tested in registerI18nServices module tests; deep module mocking too complex */
  if (isErr(i18nServicesResult)) return i18nServicesResult;

  const notificationsResult = registerNotifications(container);
  /* c8 ignore next 2 -- Error propagation: Tested in registerNotifications module tests; deep module mocking too complex */
  if (isErr(notificationsResult)) return notificationsResult;

  const registrarsResult = registerRegistrars(container);
  if (isErr(registrarsResult)) return registrarsResult;

  const loopServiceResult = registerLoopPreventionServices(container);
  if (isErr(loopServiceResult)) return loopServiceResult;

  // Validate container configuration
  const validationResult = validateContainer(container);
  if (isErr(validationResult)) return validationResult;

  const loopPreventionInitResult = initializeLoopPreventionValues(container);
  if (isErr(loopPreventionInitResult)) return loopPreventionInitResult;

  return ok(undefined);
}
