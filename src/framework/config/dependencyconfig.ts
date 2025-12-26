import { ServiceContainer } from "@/infrastructure/di/container";
import { ok, err, isErr } from "@/domain/utils/result";
import type { Result } from "@/domain/types/result";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { environmentConfigToken } from "@/infrastructure/shared/tokens/core/environment-config.token";
import { containerHealthCheckToken } from "@/infrastructure/shared/tokens/core/container-health-check.token";
import { metricsHealthCheckToken } from "@/infrastructure/shared/tokens/core/metrics-health-check.token";
import { healthCheckRegistryToken } from "@/application/tokens/health-check-registry.token";
import { serviceContainerToken } from "@/infrastructure/shared/tokens/core/service-container.token";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import { platformContainerPortToken } from "@/application/tokens/domain-ports.tokens";
import { ENV } from "@/framework/config/environment";
import { createRuntimeConfigAdapter } from "@/infrastructure/config/runtime-config-adapter";
import { getDIContainerHealthCheckClass } from "@/application/health/ContainerHealthCheck";
import { getDIMetricsHealthCheckClass } from "@/application/health/MetricsHealthCheck";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { castContainerTokenToPlatformContainerPortToken } from "@/infrastructure/di/types/utilities/runtime-safe-cast";
import { moduleIdToken } from "@/infrastructure/shared/tokens/infrastructure/module-id.token";
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
import {
  registerCacheServices,
  initializeCacheConfigSync,
} from "@/framework/config/modules/cache-services.config";
import { registerI18nServices } from "@/framework/config/modules/i18n-services.config";
import { registerNotifications } from "@/framework/config/modules/notifications.config";
import { registerRegistrars } from "@/framework/config/modules/registrars.config";
import { registerEventPorts } from "@/framework/config/modules/event-ports.config";
import { registerEntityPorts } from "@/framework/config/modules/entity-ports.config";
import { registerSettingsPorts } from "@/framework/config/modules/settings-ports.config";
import { registerJournalVisibilityConfig } from "@/framework/config/modules/journal-visibility.config";

/**
 * Represents a single step in the dependency registration process.
 * Steps are executed in priority order (lower priority = earlier execution).
 */
interface DependencyRegistrationStep {
  /** Human-readable name for logging and error messages */
  name: string;
  /** Priority determines execution order (lower = earlier). Use increments of 10 for flexibility. */
  priority: number;
  /** Function to execute for this registration step */
  execute: (container: ServiceContainer) => Result<void, string>;
}

/**
 * Registry for dependency registration steps.
 * Allows adding new registration steps without modifying configureDependencies.
 *
 * DESIGN: Uses Registry Pattern to follow Open/Closed Principle:
 * - Open for extension: New steps can be added via register()
 * - Closed for modification: configureDependencies doesn't need to change
 */
class DependencyRegistrationRegistry {
  private steps: DependencyRegistrationStep[] = [];

  /**
   * Registers a new dependency registration step.
   * Steps are automatically sorted by priority after registration.
   *
   * @param step - The registration step to add
   */
  register(step: DependencyRegistrationStep): void {
    this.steps.push(step);
    this.steps.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Executes all registered steps in priority order.
   * Stops at first error and returns it.
   *
   * @param container - The service container to configure
   * @returns Result indicating success or the first error encountered
   */
  configure(container: ServiceContainer): Result<void, string> {
    for (const step of this.steps) {
      const result = step.execute(container);
      if (isErr(result)) {
        return err(`Failed at step '${step.name}': ${result.error}`);
      }
    }
    return ok(undefined);
  }
}

/**
 * Creates and initializes the dependency registration registry with all default steps.
 * This function centralizes the registration order configuration.
 *
 * REGISTRATION ORDER (via priorities):
 * 1. Static Values (10) - EnvironmentConfig, RuntimeConfig, ServiceContainer
 * 2. Core Services (20) - Logger, Metrics, ModuleHealth
 * 3. Observability (30) - EventEmitter, ObservabilityRegistry
 * 4. Utility Services (40) - Performance, Retry
 * 5. Cache Services (50) - Cache infrastructure
 * 6. Port Infrastructure (60) - PortSelector
 * 7. Subcontainer Values (70) - Foundry Port Registries
 * 8. Foundry Services (80) - Game, Hooks, Document, UI, Settings, Journal
 * 9. Settings Ports (90) - PlatformSettingsPort
 * 10. Entity Ports (100) - Entity port implementations
 * 11. Journal Visibility Config (110) - Journal visibility service
 * 12. I18n Services (120) - FoundryI18n, LocalI18n, I18nFacade
 * 13. Notifications (130) - NotificationCenter, ConsoleChannel, UIChannel
 * 14. Event Ports (140) - PlatformJournalEventPort, Use-Cases, ModuleEventRegistrar
 * 15. Registrars (150) - ModuleSettingsRegistrar, ModuleHookRegistrar
 * 16. Loop Prevention Services (160) - Health checks
 * 17. Validation (170) - Container validation
 * 18. Loop Prevention Init (180) - Initialize health checks
 * 19. Cache Config Sync Init (190) - Initialize cache synchronization
 */
function createDependencyRegistrationRegistry(): DependencyRegistrationRegistry {
  const registry = new DependencyRegistrationRegistry();

  registry.register({ name: "StaticValues", priority: 10, execute: registerStaticValues });
  registry.register({ name: "CoreServices", priority: 20, execute: registerCoreServices });
  registry.register({ name: "Observability", priority: 30, execute: registerObservability });
  registry.register({ name: "UtilityServices", priority: 40, execute: registerUtilityServices });
  registry.register({ name: "CacheServices", priority: 50, execute: registerCacheServices });
  registry.register({
    name: "PortInfrastructure",
    priority: 60,
    execute: registerPortInfrastructure,
  });
  registry.register({
    name: "SubcontainerValues",
    priority: 70,
    execute: registerSubcontainerValues,
  });
  registry.register({ name: "FoundryServices", priority: 80, execute: registerFoundryServices });
  registry.register({ name: "SettingsPorts", priority: 90, execute: registerSettingsPorts });
  registry.register({ name: "EntityPorts", priority: 100, execute: registerEntityPorts });
  registry.register({
    name: "JournalVisibilityConfig",
    priority: 110,
    execute: registerJournalVisibilityConfig,
  });
  registry.register({ name: "I18nServices", priority: 120, execute: registerI18nServices });
  registry.register({ name: "Notifications", priority: 130, execute: registerNotifications });
  registry.register({ name: "EventPorts", priority: 140, execute: registerEventPorts });
  registry.register({ name: "Registrars", priority: 150, execute: registerRegistrars });
  registry.register({
    name: "LoopPreventionServices",
    priority: 160,
    execute: registerLoopPreventionServices,
  });
  registry.register({ name: "Validation", priority: 170, execute: validateContainer });
  registry.register({
    name: "LoopPreventionInit",
    priority: 180,
    execute: initializeLoopPreventionValues,
  });
  registry.register({
    name: "CacheConfigSyncInit",
    priority: 190,
    execute: initializeCacheConfigSync,
  });

  return registry;
}

/**
 * Registers EnvironmentConfig as a static bootstrap value.
 */
function registerEnvironmentConfig(container: ServiceContainer): Result<void, string> {
  const envResult = container.registerValue(environmentConfigToken, ENV);
  if (isErr(envResult)) {
    return err(`Failed to register EnvironmentConfig: ${envResult.error.message}`);
  }
  return ok(undefined);
}

/**
 * Registers RuntimeConfigAdapter as a static bootstrap value.
 */
function registerRuntimeConfig(container: ServiceContainer): Result<void, string> {
  const runtimeConfigAdapter = createRuntimeConfigAdapter(ENV);
  const runtimeConfigResult = container.registerValue(runtimeConfigToken, runtimeConfigAdapter);
  if (isErr(runtimeConfigResult)) {
    return err(`Failed to register RuntimeConfigAdapter: ${runtimeConfigResult.error.message}`);
  }
  return ok(undefined);
}

/**
 * Registers ServiceContainer as a static bootstrap value (self-reference).
 */
function registerServiceContainer(container: ServiceContainer): Result<void, string> {
  const containerResult = container.registerValue(serviceContainerToken, container);
  if (isErr(containerResult)) {
    return err(`Failed to register ServiceContainer: ${containerResult.error.message}`);
  }
  return ok(undefined);
}

/**
 * Registers PlatformContainerPort as an alias to ServiceContainer.
 *
 * ServiceContainer implements PlatformContainerPort, so this provides the abstraction
 * for Framework layer without duplicating the instance.
 * Note: Type assertion is required because PlatformContainerPort and Container are different types,
 * even though ServiceContainer implements both. This is a known limitation of the type system
 * when dealing with interface aliases. The runtime behavior is correct.
 * The cast function is in runtime-safe-cast.ts which is excluded from type coverage,
 * so we use a direct assertion here.
 */
function registerPlatformContainerPortAlias(container: ServiceContainer): Result<void, string> {
  const aliasResult = container.registerAlias(
    platformContainerPortToken,
    castContainerTokenToPlatformContainerPortToken(serviceContainerToken)
  );
  if (isErr(aliasResult)) {
    return err(`Failed to register PlatformContainerPort alias: ${aliasResult.error.message}`);
  }
  return ok(undefined);
}

/**
 * Registers ModuleId as a static bootstrap value.
 *
 * This allows Infrastructure services to access module ID without importing from Application layer.
 */
function registerModuleId(container: ServiceContainer): Result<void, string> {
  const moduleIdResult = container.registerValue(moduleIdToken, MODULE_METADATA.ID);
  if (isErr(moduleIdResult)) {
    return err(`Failed to register ModuleId: ${moduleIdResult.error.message}`);
  }
  return ok(undefined);
}

/**
 * Registers static bootstrap values that already exist outside the container.
 *
 * This function orchestrates the registration of all static values by calling
 * individual registration functions. Each registration function has a single
 * responsibility (SRP), improving testability and maintainability.
 */
function registerStaticValues(container: ServiceContainer): Result<void, string> {
  const results = [
    registerEnvironmentConfig(container),
    registerRuntimeConfig(container),
    registerServiceContainer(container),
    registerPlatformContainerPortAlias(container),
    registerModuleId(container),
  ];

  for (const result of results) {
    if (isErr(result)) return result;
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
    getDIContainerHealthCheckClass(),
    ServiceLifecycle.SINGLETON
  );
  if (isErr(containerCheckResult)) {
    return err(`Failed to register ContainerHealthCheck: ${containerCheckResult.error.message}`);
  }

  const metricsCheckResult = container.registerClass(
    metricsHealthCheckToken,
    getDIMetricsHealthCheckClass(),
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
 * - Uses Registry Pattern for extensibility (Open/Closed Principle)
 *
 * REGISTRATION ORDER:
 * See createDependencyRegistrationRegistry() for the complete ordered list.
 * The registry manages the execution order via priority values.
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
  const registry = createDependencyRegistrationRegistry();
  return registry.configure(container);
}
