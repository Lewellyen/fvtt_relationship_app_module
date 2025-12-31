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
import {
  DependencyRegistrationRegistry,
  dependencyRegistry,
} from "@/framework/config/dependency-registry";
import { registerPortRegistries } from "@/framework/config/modules/port-infrastructure.config";
import { initializeCacheConfigSync } from "@/framework/config/modules/cache-services.config";

// Import dependency modules manifest to trigger their self-registration
// This follows the Open/Closed Principle: new modules are added to the manifest,
// not to this file. See dependency-modules.ts for the module list.
import "@/framework/config/dependency-modules";

// Track whether internal steps have been registered to avoid duplicate registrations
let internalStepsRegistered = false;

/**
 * Creates and initializes the dependency registration registry.
 *
 * This function registers internal/core dependency registration steps that are
 * part of the framework itself. Module-specific steps are registered via
 * the global dependencyRegistry by importing their config modules.
 *
 * REGISTRATION ORDER (via priorities):
 * - Internal/Framework Steps:
 *   1. Static Values (10) - EnvironmentConfig, RuntimeConfig, ServiceContainer
 *   2. Subcontainer Values (70) - Foundry Port Registries
 *   3. Loop Prevention Services (160) - Health checks
 *   4. Validation (170) - Container validation
 *   5. Loop Prevention Init (180) - Initialize health checks
 *   6. Cache Config Sync Init (190) - Initialize cache synchronization
 *
 * - Module Steps (registered via module config imports):
 *   See individual module config files for their priorities.
 *
 * NOTE: Internal steps are only registered once, even if this function is called multiple times.
 * This allows the function to be called multiple times (e.g., in tests) without duplicate registrations.
 */
function createDependencyRegistrationRegistry(): DependencyRegistrationRegistry {
  // Register internal/framework steps only once
  if (!internalStepsRegistered) {
    dependencyRegistry.register({
      name: "StaticValues",
      priority: 10,
      execute: registerStaticValues,
    });
    dependencyRegistry.register({
      name: "SubcontainerValues",
      priority: 70,
      execute: registerSubcontainerValues,
    });
    dependencyRegistry.register({
      name: "LoopPreventionServices",
      priority: 160,
      execute: registerLoopPreventionServices,
    });
    dependencyRegistry.register({ name: "Validation", priority: 170, execute: validateContainer });
    dependencyRegistry.register({
      name: "LoopPreventionInit",
      priority: 180,
      execute: initializeLoopPreventionValues,
    });
    dependencyRegistry.register({
      name: "CacheConfigSyncInit",
      priority: 190,
      execute: initializeCacheConfigSync,
    });
    internalStepsRegistered = true;
  }

  return dependencyRegistry;
}

/**
 * Resets the dependency registration registry.
 * This is primarily useful for testing scenarios where a clean state is needed.
 *
 * @internal
 */
export function resetDependencyRegistry(): void {
  dependencyRegistry.reset();
  internalStepsRegistered = false;
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
