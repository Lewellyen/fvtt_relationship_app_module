/**
 * Core application tokens for logging, domain services, configuration, and health.
 *
 * WICHTIG: Diese Datei importiert KEINE Service-Types mehr!
 * Token-Generics werden erst beim resolve() aufgelöst.
 * Dies verhindert zirkuläre Dependencies zwischen Tokens und Services.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { EnvironmentConfig } from "@/domain/types/environment-config";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { Container } from "@/infrastructure/di/interfaces";

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
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 *
 * @example
 * ```typescript
 * const healthService = container.resolve(moduleHealthServiceToken);
 * const health = healthService.getHealth();
 * console.log(`Module status: ${health.status}`);
 * ```
 */

export const moduleHealthServiceToken = createInjectionToken<any>("ModuleHealthService");

/**
 * Injection token for the HealthCheckRegistry.
 *
 * Central registry for health checks that can be dynamically registered.
 * Services implement HealthCheck interface and register themselves.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 *
 * @example
 * ```typescript
 * const registry = container.resolve(healthCheckRegistryToken);
 * registry.register(new ContainerHealthCheck(container));
 * const results = registry.runAll();
 * ```
 */

export const healthCheckRegistryToken = createInjectionToken<any>("HealthCheckRegistry");

/**
 * Injection token for the ContainerHealthCheck.
 *
 * Health check that validates the DI container state.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 *
 * @example
 * ```typescript
 * const check = container.resolve(containerHealthCheckToken);
 * const isHealthy = check.check(); // Returns true if container is validated
 * ```
 */

export const containerHealthCheckToken = createInjectionToken<any>("ContainerHealthCheck");

/**
 * Injection token for the MetricsHealthCheck.
 *
 * Health check that validates metrics and port selection status.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 *
 * @example
 * ```typescript
 * const check = container.resolve(metricsHealthCheckToken);
 * const isHealthy = check.check(); // Returns true if no port failures
 * ```
 */

export const metricsHealthCheckToken = createInjectionToken<any>("MetricsHealthCheck");

/**
 * Injection token for accessing the ServiceContainer itself.
 *
 * Primarily used for infrastructure services (e.g., health checks) that need
 * direct insight into the container state.
 */
export const serviceContainerToken = createInjectionToken<Container>("ServiceContainer");

// platformContainerPortToken moved to @/application/tokens/domain-ports.tokens
// This maintains Clean Architecture: Application layer defines tokens for Domain Ports it uses

/**
 * Injection token for the ModuleSettingsRegistrar.
 *
 * Manages registration of all Foundry module settings.
 * Must be called during or after the 'init' hook.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 *
 * @example
 * ```typescript
 * const settingsRegistrar = container.resolve(moduleSettingsRegistrarToken);
 * settingsRegistrar.registerAll(container);
 * ```
 */

export const moduleSettingsRegistrarToken = createInjectionToken<any>("ModuleSettingsRegistrar");

/**
 * Injection token for the BootstrapInitHookService.
 *
 * Service responsible for registering the Foundry 'init' hook.
 * Uses direct Hooks.on() to avoid chicken-egg problem with version detection.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 *
 * @example
 * ```typescript
 * const initHookService = container.resolve(bootstrapInitHookServiceToken);
 * initHookService.register();
 * ```
 */

export const bootstrapInitHookServiceToken = createInjectionToken<any>("BootstrapInitHookService");

/**
 * Injection token for the BootstrapReadyHookService.
 *
 * Service responsible for registering the Foundry 'ready' hook.
 * Uses direct Hooks.on() to avoid chicken-egg problem with version detection.
 *
 * Generic Type wird beim resolve() aufgelöst - kein Import nötig!
 *
 * @example
 * ```typescript
 * const readyHookService = container.resolve(bootstrapReadyHookServiceToken);
 * readyHookService.register();
 * ```
 */

export const bootstrapReadyHookServiceToken = createInjectionToken<any>(
  "BootstrapReadyHookService"
);
