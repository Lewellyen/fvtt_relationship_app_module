/**
 * Core application tokens for logging, domain services, configuration, and health.
 */
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { EnvironmentConfig } from "@/framework/config/environment";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { ModuleHealthService } from "@/application/services/ModuleHealthService";
import type { HealthCheckRegistry } from "@/application/health/HealthCheckRegistry";
import type { ContainerHealthCheck } from "@/application/health/ContainerHealthCheck";
import type { MetricsHealthCheck } from "@/application/health/MetricsHealthCheck";
import type { Container } from "@/infrastructure/di/interfaces";
import type { ModuleSettingsRegistrar } from "@/application/services/ModuleSettingsRegistrar";
import type { BootstrapInitHookService } from "@/framework/core/bootstrap-init-hook";
import type { BootstrapReadyHookService } from "@/framework/core/bootstrap-ready-hook";

/**
 * Injection token for the application logger service.
 *
 * Resolves to ConsoleLoggerService, providing structured logging
 * with configurable log levels (DEBUG, INFO, WARN, ERROR).
 *
 * @example
 * ```typescript
 * const logger = container.resolve(loggerToken);
 * logger.info("Application started");
 * logger.error("Error occurred", { code: 500, details: error });
 * ```
 */
export const loggerToken = createInjectionToken<Logger>("Logger");

/**
 * @deprecated JournalVisibilityService and JournalVisibilityConfig tokens are now exported from @/application/tokens.
 * This file re-exports them for backward compatibility.
 */
export { journalVisibilityServiceToken, journalVisibilityConfigToken } from "@/application/tokens";

/**
 * Injection token for the EnvironmentConfig.
 *
 * Provides access to environment configuration (development/production mode,
 * log levels, performance tracking settings, etc.).
 *
 * Injecting ENV as a service improves testability and follows DIP
 * (Dependency Inversion Principle) by depending on abstraction rather than
 * concrete global state.
 *
 * @example
 * ```typescript
 * export class MyService {
 *   static dependencies = [environmentConfigToken] as const;
 *
 *   constructor(private readonly env: EnvironmentConfig) {}
 *
 *   doSomething() {
 *     if (this.env.isDevelopment) {
 *       // Development-specific logic
 *     }
 *   }
 * }
 * ```
 */
export const environmentConfigToken = createInjectionToken<EnvironmentConfig>("EnvironmentConfig");

/**
 * Injection token for the RuntimeConfigService.
 *
 * Provides access to the merged configuration layer that combines build-time
 * environment defaults with runtime Foundry settings and notifies consumers
 * of live changes.
 */
export const runtimeConfigToken =
  createInjectionToken<RuntimeConfigService>("RuntimeConfigService");

/**
 * Injection token for the ModuleHealthService.
 *
 * Provides module health monitoring and diagnostics.
 * Checks container validation, port selection, and metrics for health assessment.
 *
 * @example
 * ```typescript
 * const healthService = container.resolve(moduleHealthServiceToken);
 * const health = healthService.getHealth();
 * console.log(`Module status: ${health.status}`);
 * ```
 */
export const moduleHealthServiceToken =
  createInjectionToken<ModuleHealthService>("ModuleHealthService");

/**
 * Injection token for the HealthCheckRegistry.
 *
 * Central registry for health checks that can be dynamically registered.
 * Services implement HealthCheck interface and register themselves.
 *
 * @example
 * ```typescript
 * const registry = container.resolve(healthCheckRegistryToken);
 * registry.register(new ContainerHealthCheck(container));
 * const results = registry.runAll();
 * ```
 */
export const healthCheckRegistryToken =
  createInjectionToken<HealthCheckRegistry>("HealthCheckRegistry");

/**
 * Injection token for the ContainerHealthCheck.
 *
 * Health check that validates the DI container state.
 *
 * @example
 * ```typescript
 * const check = container.resolve(containerHealthCheckToken);
 * const isHealthy = check.check(); // Returns true if container is validated
 * ```
 */
export const containerHealthCheckToken =
  createInjectionToken<ContainerHealthCheck>("ContainerHealthCheck");

/**
 * Injection token for the MetricsHealthCheck.
 *
 * Health check that validates metrics and port selection status.
 *
 * @example
 * ```typescript
 * const check = container.resolve(metricsHealthCheckToken);
 * const isHealthy = check.check(); // Returns true if no port failures
 * ```
 */
export const metricsHealthCheckToken =
  createInjectionToken<MetricsHealthCheck>("MetricsHealthCheck");

/**
 * Injection token for accessing the ServiceContainer itself.
 *
 * Primarily used for infrastructure services (e.g., health checks) that need
 * direct insight into the container state.
 */
export const serviceContainerToken = createInjectionToken<Container>("ServiceContainer");

/**
 * Injection token for the ModuleSettingsRegistrar.
 *
 * Manages registration of all Foundry module settings.
 * Must be called during or after the 'init' hook.
 *
 * @example
 * ```typescript
 * const settingsRegistrar = container.resolve(moduleSettingsRegistrarToken);
 * settingsRegistrar.registerAll(container);
 * ```
 */
export const moduleSettingsRegistrarToken =
  createInjectionToken<ModuleSettingsRegistrar>("ModuleSettingsRegistrar");

/**
 * Injection token for the BootstrapInitHookService.
 *
 * Service responsible for registering the Foundry 'init' hook.
 * Uses direct Hooks.on() to avoid chicken-egg problem with version detection.
 *
 * @example
 * ```typescript
 * const initHookService = container.resolve(bootstrapInitHookServiceToken);
 * initHookService.register();
 * ```
 */
export const bootstrapInitHookServiceToken = createInjectionToken<BootstrapInitHookService>(
  "BootstrapInitHookService"
);

/**
 * Injection token for the BootstrapReadyHookService.
 *
 * Service responsible for registering the Foundry 'ready' hook.
 * Uses direct Hooks.on() to avoid chicken-egg problem with version detection.
 *
 * @example
 * ```typescript
 * const readyHookService = container.resolve(bootstrapReadyHookServiceToken);
 * readyHookService.register();
 * ```
 */
export const bootstrapReadyHookServiceToken = createInjectionToken<BootstrapReadyHookService>(
  "BootstrapReadyHookService"
);
