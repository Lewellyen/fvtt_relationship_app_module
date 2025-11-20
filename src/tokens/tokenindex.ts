import { createInjectionToken } from "@/di_infrastructure/tokenutilities";
import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Logger } from "@/interfaces/logger";
import type { JournalVisibilityService } from "@/services/JournalVisibilityService";
import type { MetricsCollector } from "@/observability/metrics-collector";
import type { MetricsRecorder } from "@/observability/interfaces/metrics-recorder";
import type { MetricsSampler } from "@/observability/interfaces/metrics-sampler";
import type { MetricsStorage } from "@/observability/metrics-persistence/metrics-storage";
import type { TraceContext } from "@/observability/trace/TraceContext";
import type { FoundryI18nService } from "@/foundry/services/FoundryI18nService";
import type { LocalI18nService } from "@/services/LocalI18nService";
import type { I18nFacadeService } from "@/services/I18nFacadeService";
import type { TranslationHandler } from "@/services/i18n/TranslationHandler.interface";
import type { NotificationChannel } from "@/notifications/notification-channel.interface";
import type { NotificationCenter as INotificationCenter } from "@/notifications/NotificationCenter";
import type { EnvironmentConfig } from "@/config/environment";
import type { ModuleHealthService } from "@/core/module-health-service";
import type { PerformanceTrackingService } from "@/services/PerformanceTrackingService";
import type { RetryService } from "@/services/RetryService";
import type { HealthCheckRegistry } from "@/core/health/health-check-registry";
import type { ContainerHealthCheck } from "@/core/health/container-health-check";
import type { MetricsHealthCheck } from "@/core/health/metrics-health-check";
import type { CacheService, CacheServiceConfig } from "@/interfaces/cache";
import type { RuntimeConfigService } from "@/core/runtime-config/runtime-config.service";
import type { JournalVisibilityPort } from "@/core/ports/journal-visibility-port.interface";

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
 * Injection token for the MetricsCollector service.
 *
 * Provides observability and performance tracking for the DI container.
 * Collects metrics about service resolutions, port selections, and cache performance.
 *
 * @example
 * ```typescript
 * const metrics = container.resolve(metricsCollectorToken);
 * metrics.recordResolution(someToken, 2.5, true);
 * const snapshot = metrics.getSnapshot();
 * console.table(snapshot);
 * ```
 */
export const metricsCollectorToken = createInjectionToken<MetricsCollector>("MetricsCollector");

/**
 * Injection token for the MetricsRecorder interface.
 *
 * Provides minimal recording capability without full MetricsCollector features.
 * Use this token when you only need to record metrics, not query or sample them.
 *
 * **Design:** Implements Interface Segregation Principle - depend on minimal interface.
 *
 * @example
 * ```typescript
 * class MyService {
 *   static dependencies = [metricsRecorderToken] as const;
 *   constructor(private recorder: MetricsRecorder) {}
 *   // Can record but not query metrics
 * }
 * ```
 */
export const metricsRecorderToken = createInjectionToken<MetricsRecorder>("MetricsRecorder");

/**
 * Injection token for the MetricsSampler interface.
 *
 * Provides sampling decision capability without full MetricsCollector features.
 * Use this token when you only need to check if sampling should occur.
 *
 * **Design:** Implements Interface Segregation Principle - depend on minimal interface.
 *
 * @example
 * ```typescript
 * class PerformanceTracker {
 *   static dependencies = [metricsSamplerToken] as const;
 *   constructor(private sampler: MetricsSampler) {}
 *   // Can check sampling but not record or query
 * }
 * ```
 */
export const metricsSamplerToken = createInjectionToken<MetricsSampler>("MetricsSampler");

/**
 * Injection token for metrics persistence storage.
 */
export const metricsStorageToken = createInjectionToken<MetricsStorage>("MetricsStorage");

/**
 * Injection token for the TraceContext service.
 *
 * Provides automatic trace ID propagation across nested function calls.
 * Eliminates the need to manually pass trace IDs through function parameters.
 *
 * **Key Features:**
 * - Automatic trace ID generation
 * - Context stacking for nested traces
 * - Support for both sync and async operations
 * - Integration with Logger for automatic trace ID injection
 *
 * @example
 * ```typescript
 * const traceContext = container.resolve(traceContextToken);
 *
 * // Automatic trace propagation
 * traceContext.trace(() => {
 *   logger.info("Starting operation"); // Automatically traced
 *   doSomething(); // Nested calls see the same trace ID
 * });
 *
 * // Async operation
 * await traceContext.traceAsync(async () => {
 *   const result = await fetchData();
 *   return result;
 * });
 * ```
 */
export const traceContextToken = createInjectionToken<TraceContext>("TraceContext");

/**
 * Injection token for the JournalVisibilityPort.
 *
 * Port for journal visibility operations, abstracting platform details.
 * Implementations are provided by platform-specific adapters
 * (e.g., FoundryJournalVisibilityAdapter).
 *
 * @example
 * ```typescript
 * const port = container.resolve(journalVisibilityPortToken);
 * const entries = port.getAllEntries();
 * if (entries.ok) {
 *   console.log(`Found ${entries.value.length} entries`);
 * }
 * ```
 */
export const journalVisibilityPortToken =
  createInjectionToken<JournalVisibilityPort>("JournalVisibilityPort");

/**
 * Injection token for the JournalVisibilityService.
 *
 * Manages visibility of journal entries based on module flags.
 * Handles hiding/showing entries in the Foundry UI and processes
 * journal directory rendering.
 *
 * @example
 * ```typescript
 * const service = container.resolve(journalVisibilityServiceToken);
 * const hidden = service.getHiddenJournalEntries();
 * if (hidden.ok) {
 *   console.log(`Found ${hidden.value.length} hidden entries`);
 * }
 * ```
 */
export const journalVisibilityServiceToken = createInjectionToken<JournalVisibilityService>(
  "JournalVisibilityService"
);

/**
 * Injection token for the FoundryI18nService.
 *
 * Provides access to Foundry VTT's i18n API via Port-Adapter pattern.
 * Automatically selects the correct port based on Foundry version.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(foundryI18nToken);
 * const result = i18n.localize("MODULE.SETTINGS.logLevel.name");
 * if (result.ok) {
 *   console.log(result.value);
 * }
 * ```
 */
export const foundryI18nToken = createInjectionToken<FoundryI18nService>("FoundryI18nService");

/**
 * Injection token for the LocalI18nService.
 *
 * Provides Foundry-independent JSON-based translations.
 * Used as fallback when Foundry's i18n is unavailable.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(localI18nToken);
 * const result = i18n.translate("MODULE.SETTINGS.logLevel.name");
 * console.log(result.value);
 * ```
 */
export const localI18nToken = createInjectionToken<LocalI18nService>("LocalI18nService");

/**
 * Injection token for the I18nFacadeService.
 *
 * Combines Foundry's i18n and local translations with intelligent fallback.
 * This is the recommended token to use for all internationalization needs.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(i18nFacadeToken);
 * const text = i18n.translate("MODULE.SETTINGS.logLevel.name", "Log Level");
 * console.log(text);
 * ```
 */
export const i18nFacadeToken = createInjectionToken<I18nFacadeService>("I18nFacadeService");

/**
 * Injection token for the FoundryTranslationHandler.
 *
 * First handler in the translation chain: tries Foundry's i18n first.
 * Part of the Chain of Responsibility pattern for i18n.
 */
export const foundryTranslationHandlerToken = createInjectionToken<TranslationHandler>(
  "FoundryTranslationHandler"
);

/**
 * Injection token for the LocalTranslationHandler.
 *
 * Second handler in the translation chain: provides local JSON-based translations.
 * Part of the Chain of Responsibility pattern for i18n.
 */
export const localTranslationHandlerToken =
  createInjectionToken<TranslationHandler>("LocalTranslationHandler");

/**
 * Injection token for the FallbackTranslationHandler.
 *
 * Final handler in the translation chain: returns fallback or key itself.
 * Part of the Chain of Responsibility pattern for i18n.
 */
export const fallbackTranslationHandlerToken = createInjectionToken<TranslationHandler>(
  "FallbackTranslationHandler"
);

/**
 * Injection token for the TranslationHandlerChain.
 *
 * Fully configured chain: Foundry → Local → Fallback.
 * Built via factory in DI container.
 */
export const translationHandlerChainToken =
  createInjectionToken<TranslationHandler>("TranslationHandlerChain");

/**
 * Injection token for the NotificationCenter.
 *
 * Central message bus for all application notifications (debug, info, warn, error).
 * Routes notifications to registered channels (Console, UI, Sentry, etc.).
 *
 * @example
 * ```typescript
 * const notifications = container.resolve(notificationCenterToken);
 * notifications.debug("Processing data");
 * notifications.error("Operation failed", error);
 * ```
 */
export const notificationCenterToken =
  createInjectionToken<INotificationCenter>("NotificationCenter");

/**
 * Injection token for ConsoleChannel.
 */
export const consoleChannelToken = createInjectionToken<NotificationChannel>("ConsoleChannel");

/**
 * Injection token for UIChannel.
 */
export const uiChannelToken = createInjectionToken<NotificationChannel>("UIChannel");

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
export const serviceContainerToken = createInjectionToken<ServiceContainer>("ServiceContainer");

/**
 * Injection token for the CacheService configuration.
 */
export const cacheServiceConfigToken =
  createInjectionToken<CacheServiceConfig>("CacheServiceConfig");

/**
 * Injection token for the CacheService.
 */
export const cacheServiceToken = createInjectionToken<CacheService>("CacheService");

/**
 * Injection token for the PerformanceTrackingService.
 *
 * Provides centralized performance tracking with sampling support.
 * Automatically injects EnvironmentConfig and MetricsCollector.
 *
 * @example
 * ```typescript
 * const perfService = container.resolve(performanceTrackingServiceToken);
 * const result = perfService.track(() => expensiveOperation());
 * ```
 */
export const performanceTrackingServiceToken = createInjectionToken<PerformanceTrackingService>(
  "PerformanceTrackingService"
);

/**
 * Injection token for the RetryService.
 *
 * Provides retry operations with exponential backoff and automatic logging.
 * Automatically injects Logger and MetricsCollector.
 *
 * @example
 * ```typescript
 * const retryService = container.resolve(retryServiceToken);
 * const result = await retryService.retry(
 *   () => fetchData(),
 *   { maxAttempts: 3, operationName: "fetchData" }
 * );
 * ```
 */
export const retryServiceToken = createInjectionToken<RetryService>("RetryService");

/**
 * Injection token for the PortSelectionEventEmitter.
 *
 * Provides event emission infrastructure for PortSelector observability.
 * Registered as TRANSIENT - each service gets its own instance.
 *
 * @example
 * ```typescript
 * class PortSelector {
 *   constructor(emitter: PortSelectionEventEmitter) {
 *     this.emitter = emitter;
 *   }
 * }
 * ```
 */
export const portSelectionEventEmitterToken = createInjectionToken<
  import("@/foundry/versioning/port-selection-events").PortSelectionEventEmitter
>("PortSelectionEventEmitter");

/**
 * Injection token for the ObservabilityRegistry.
 *
 * Central registry for self-registering observable services.
 * Services register themselves at construction time for automatic observability.
 *
 * @example
 * ```typescript
 * class PortSelector {
 *   constructor(observability: ObservabilityRegistry) {
 *     observability.registerPortSelector(this);
 *   }
 * }
 * ```
 */
export const observabilityRegistryToken =
  createInjectionToken<import("@/observability/observability-registry").ObservabilityRegistry>(
    "ObservabilityRegistry"
  );

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
  createInjectionToken<import("@/core/module-settings-registrar").ModuleSettingsRegistrar>(
    "ModuleSettingsRegistrar"
  );

/**
 * Injection token for the ModuleHookRegistrar.
 *
 * Manages registration of all Foundry hooks using Strategy Pattern.
 * Hooks are injected as dependencies for full DI architecture.
 *
 * @example
 * ```typescript
 * const hookRegistrar = container.resolve(moduleHookRegistrarToken);
 * hookRegistrar.registerAll(container);
 * ```
 */
export const moduleHookRegistrarToken =
  createInjectionToken<import("@/core/module-hook-registrar").ModuleHookRegistrar>(
    "ModuleHookRegistrar"
  );

/**
 * Injection token for the RenderJournalDirectoryHook.
 *
 * Hook that triggers when journal directory is rendered.
 * Registered via DI to enable proper dependency injection.
 *
 * @example
 * ```typescript
 * const hook = container.resolve(renderJournalDirectoryHookToken);
 * ```
 */
export const renderJournalDirectoryHookToken = createInjectionToken<
  import("@/core/hooks/render-journal-directory-hook").RenderJournalDirectoryHook
>("RenderJournalDirectoryHook");

export const journalCacheInvalidationHookToken = createInjectionToken<
  import("@/core/hooks/journal-cache-invalidation-hook").JournalCacheInvalidationHook
>("JournalCacheInvalidationHook");

export const moduleApiInitializerToken =
  createInjectionToken<import("@/core/api/module-api-initializer").ModuleApiInitializer>(
    "ModuleApiInitializer"
  );

/**
 * Re-export port-related tokens for convenience.
 * These are defined in @/foundry/foundrytokens but exported here for easier access.
 */
export { portSelectorToken } from "@/foundry/foundrytokens";
