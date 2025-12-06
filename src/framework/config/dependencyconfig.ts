import { ServiceContainer } from "@/infrastructure/di/container";
import { ok, err, isErr } from "@/domain/utils/result";
import type { Result } from "@/domain/types/result";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability.tokens";
import {
  environmentConfigToken,
  containerHealthCheckToken,
  metricsHealthCheckToken,
  healthCheckRegistryToken,
  serviceContainerToken,
  platformContainerPortToken,
  runtimeConfigToken,
} from "@/infrastructure/shared/tokens/core.tokens";
import { ENV } from "@/framework/config/environment";
import { createRuntimeConfig } from "@/application/services/runtime-config-factory";
import { DIContainerHealthCheck } from "@/application/health/ContainerHealthCheck";
import { DIMetricsHealthCheck } from "@/application/health/MetricsHealthCheck";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { castContainerTokenToPlatformContainerPortToken } from "@/infrastructure/di/types/utilities/runtime-safe-cast";
import { moduleIdToken } from "@/infrastructure/shared/tokens/infrastructure.tokens";
import { MODULE_METADATA } from "@/application/constants/app-constants";

// Import config modules
import { registerCoreServices } from "@/framework/config/modules/core-services.config";
import { registerObservability } from "@/framework/config/modules/observability.config";
import {
  registerPortInfrastructure,
  registerPortRegistries,
} from "@/framework/config/modules/port-infrastructure.config";
import { registerFoundryServices } from "@/framework/config/modules/foundry-services.config";
import { registerUtilityServices } from "@/framework/config/modules/utility-services.config";
import { registerCacheServices } from "@/framework/config/modules/cache-services.config";
import { registerI18nServices } from "@/framework/config/modules/i18n-services.config";
import { registerNotifications } from "@/framework/config/modules/notifications.config";
import { registerRegistrars } from "@/framework/config/modules/registrars.config";
import { registerEventPorts } from "@/framework/config/modules/event-ports.config";
import { registerEntityPorts } from "@/framework/config/modules/entity-ports.config";
import { registerSettingsPorts } from "@/framework/config/modules/settings-ports.config";
import { registerJournalVisibilityConfig } from "@/framework/config/modules/journal-visibility.config";

/**
 * Registers static bootstrap values that already exist outside the container.
 */
function registerStaticValues(container: ServiceContainer): Result<void, string> {
  const envResult = container.registerValue(environmentConfigToken, ENV);
  if (isErr(envResult)) {
    return err(`Failed to register EnvironmentConfig: ${envResult.error.message}`);
  }

  const runtimeConfigResult = container.registerValue(runtimeConfigToken, createRuntimeConfig(ENV));
  if (isErr(runtimeConfigResult)) {
    return err(`Failed to register RuntimeConfigService: ${runtimeConfigResult.error.message}`);
  }

  const containerResult = container.registerValue(serviceContainerToken, container);
  if (isErr(containerResult)) {
    return err(`Failed to register ServiceContainer: ${containerResult.error.message}`);
  }

  // Register PlatformContainerPort as alias to ServiceContainer
  // ServiceContainer implements PlatformContainerPort, so this provides the abstraction
  // for Framework layer without duplicating the instance
  // Note: Type assertion is required because PlatformContainerPort and Container are different types,
  // even though ServiceContainer implements both. This is a known limitation of the type system
  // when dealing with interface aliases. The runtime behavior is correct.
  // Type assertion needed because PlatformContainerPort and Container are different types,
  // even though ServiceContainer implements both. The cast function is in runtime-safe-cast.ts
  // which is excluded from type coverage, so we use a direct assertion here.
  const aliasResult = container.registerAlias(
    platformContainerPortToken,
    castContainerTokenToPlatformContainerPortToken(serviceContainerToken)
  );
  if (isErr(aliasResult)) {
    return err(`Failed to register PlatformContainerPort alias: ${aliasResult.error.message}`);
  }

  // Register module ID as static value
  // This allows Infrastructure services to access module ID without importing from Application layer
  const moduleIdResult = container.registerValue(moduleIdToken, MODULE_METADATA.ID);
  if (isErr(moduleIdResult)) {
    return err(`Failed to register ModuleId: ${moduleIdResult.error.message}`);
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
 * 1. Static Values (EnvironmentConfig)
 * 2. Core Services (Logger, Metrics, ModuleHealth)
 * 3. Observability (EventEmitter, ObservabilityRegistry)
 * 4. Utility Services (Performance, Retry)
 * 5. Port Infrastructure (PortSelector)
 * 6. Subcontainer Values (Foundry Port Registries)
 * 7. Foundry Services (Game, Hooks, Document, UI, Settings, Journal)
 * 8. Settings Ports (PlatformSettingsPort)
 * 9. I18n Services (FoundryI18n, LocalI18n, I18nFacade, TranslationHandlers)
 * 10. Notifications (NotificationCenter, ConsoleChannel, UIChannel)
 * 11. Event Ports (PlatformJournalEventPort, Use-Cases, ModuleEventRegistrar)
 * 12. Registrars (ModuleSettingsRegistrar, ModuleHookRegistrar)
 * 13. Validation (Check dependency graph)
 * 14. Loop-Prevention Services (Health checks referencing validated services)
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
  const staticValuesResult = registerStaticValues(container);
  if (isErr(staticValuesResult)) return staticValuesResult;

  // Register all service modules in order
  const coreResult = registerCoreServices(container);
  if (isErr(coreResult)) return coreResult;

  const observabilityResult = registerObservability(container);
  if (isErr(observabilityResult)) return observabilityResult;

  const utilityResult = registerUtilityServices(container);
  if (isErr(utilityResult)) return utilityResult;

  const cacheServiceResult = registerCacheServices(container);
  if (isErr(cacheServiceResult)) return cacheServiceResult;

  const portInfraResult = registerPortInfrastructure(container);
  if (isErr(portInfraResult)) return portInfraResult;

  const subcontainerValuesResult = registerSubcontainerValues(container);
  if (isErr(subcontainerValuesResult)) return subcontainerValuesResult;

  const foundryServicesResult = registerFoundryServices(container);
  if (isErr(foundryServicesResult)) return foundryServicesResult;

  const settingsPortsResult = registerSettingsPorts(container);
  if (isErr(settingsPortsResult)) return settingsPortsResult;

  const entityPortsResult = registerEntityPorts(container);
  if (isErr(entityPortsResult)) return entityPortsResult;

  const journalVisibilityConfigResult = registerJournalVisibilityConfig(container);
  if (isErr(journalVisibilityConfigResult)) return journalVisibilityConfigResult;

  const i18nServicesResult = registerI18nServices(container);
  if (isErr(i18nServicesResult)) return i18nServicesResult;

  const notificationsResult = registerNotifications(container);
  if (isErr(notificationsResult)) return notificationsResult;

  const eventPortsResult = registerEventPorts(container);
  if (isErr(eventPortsResult)) return eventPortsResult;

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
