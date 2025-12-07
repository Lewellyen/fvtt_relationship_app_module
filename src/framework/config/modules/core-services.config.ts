import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { platformBootstrapEventPortToken } from "@/infrastructure/shared/tokens/ports/platform-bootstrap-event-port.token";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { metricsRecorderToken } from "@/infrastructure/shared/tokens/observability/metrics-recorder.token";
import { metricsSamplerToken } from "@/infrastructure/shared/tokens/observability/metrics-sampler.token";
import { metricsReporterToken } from "@/infrastructure/shared/tokens/observability/metrics-reporter.token";
import { traceContextToken } from "@/infrastructure/shared/tokens/observability/trace-context.token";
import { metricsStorageToken } from "@/infrastructure/shared/tokens/observability/metrics-storage.token";
import { moduleApiInitializerToken } from "@/infrastructure/shared/tokens/infrastructure/module-api-initializer.token";
import { loggerToken } from "@/infrastructure/shared/tokens/core/logger.token";
import { moduleHealthServiceToken } from "@/infrastructure/shared/tokens/core/module-health-service.token";
import { healthCheckRegistryToken } from "@/infrastructure/shared/tokens/core/health-check-registry.token";
import { runtimeConfigToken } from "@/infrastructure/shared/tokens/core/runtime-config.token";
import { bootstrapInitHookServiceToken } from "@/infrastructure/shared/tokens/core/bootstrap-init-hook-service.token";
import { bootstrapReadyHookServiceToken } from "@/infrastructure/shared/tokens/core/bootstrap-ready-hook-service.token";
import { DIMetricsCollector } from "@/infrastructure/observability/metrics-collector";
import { DIPersistentMetricsCollector } from "@/infrastructure/observability/metrics-persistence/persistent-metrics-collector";
import { DIMetricsSampler } from "@/infrastructure/observability/metrics-sampler";
import { DIMetricsReporter } from "@/infrastructure/observability/metrics-reporter";
import { createMetricsStorage } from "@/infrastructure/observability/metrics-persistence/metrics-storage-factory";
import { DIConsoleLoggerService } from "@/infrastructure/logging/ConsoleLoggerService";
import { DITraceContext } from "@/infrastructure/observability/trace/TraceContext";
import { DIModuleHealthService } from "@/application/services/ModuleHealthService";
import { DIModuleApiInitializer } from "@/framework/core/api/module-api-initializer";
import { DIHealthCheckRegistry } from "@/application/health/HealthCheckRegistry";
import { DIBootstrapInitHookService } from "@/framework/core/bootstrap-init-hook";
import { DIBootstrapReadyHookService } from "@/framework/core/bootstrap-ready-hook";
import { DIFoundryBootstrapEventAdapter } from "@/infrastructure/adapters/foundry/bootstrap-hooks-adapter";
import {
  DIModuleReadyService,
  moduleReadyServiceToken,
} from "@/application/services/module-ready-service";
import { platformModuleReadyPortToken } from "@/infrastructure/shared/tokens/ports/platform-module-ready-port.token";
import { DIFoundryModuleReadyPort } from "@/infrastructure/adapters/foundry/services/FoundryModuleReadyPort";

/**
 * Registers core infrastructure services.
 *
 * Services registered:
 * - MetricsCollector (singleton, deps: [runtimeConfigToken])
 * - MetricsSampler (singleton, deps: [runtimeConfigToken]) - separate service for SRP
 * - MetricsReporter (singleton, deps: [metricsCollectorToken, loggerToken]) - separate service for SRP
 * - MetricsRecorder (alias to MetricsCollector) - for backward compatibility
 * - Logger (singleton, self-configuring via RuntimeConfigService, optional TraceContext)
 * - TraceContext (singleton, deps: [loggerToken])
 * - HealthCheckRegistry (singleton)
 * - ContainerHealthCheck (singleton, auto-registered)
 * - MetricsHealthCheck (singleton, auto-registered)
 * - ModuleHealthService (singleton, uses HealthCheckRegistry)
 * - ModuleApiInitializer (singleton, handles API exposition)
 *
 * INITIALIZATION ORDER:
 * 1. MetricsCollector (deps: [runtimeConfigToken])
 * 2. MetricsSampler (deps: [runtimeConfigToken])
 * 3. TraceContext (no dependencies)
 * 4. Logger (klassische DI mit deps: [runtimeConfigToken, traceContextToken])
 * 5. MetricsReporter (deps: [metricsCollectorToken, loggerToken])
 * 6. HealthCheckRegistry (no dependencies)
 * 7. ContainerHealthCheck & MetricsHealthCheck (auto-register to registry)
 * 8. ModuleHealthService (deps: [healthCheckRegistryToken])
 * 9. ModuleApiInitializer (no dependencies)
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerCoreServices(container: ServiceContainer): Result<void, string> {
  const runtimeConfig = container.getRegisteredValue(runtimeConfigToken);
  if (!runtimeConfig) {
    return err("RuntimeConfigService not registered");
  }
  const enablePersistence = runtimeConfig.get("enableMetricsPersistence") === true;

  if (enablePersistence) {
    const metricsKey =
      runtimeConfig.get("metricsPersistenceKey") ?? "fvtt_relationship_app_module.metrics";
    const storageInstance = createMetricsStorage(metricsKey);
    const storageResult = container.registerValue(metricsStorageToken, storageInstance);
    if (isErr(storageResult)) {
      return err(`Failed to register MetricsStorage: ${storageResult.error.message}`);
    }

    const persistentResult = container.registerClass(
      metricsCollectorToken,
      DIPersistentMetricsCollector,
      ServiceLifecycle.SINGLETON
    );
    if (isErr(persistentResult)) {
      return err(
        `Failed to register PersistentMetricsCollector: ${persistentResult.error.message}`
      );
    }
  } else {
    const metricsResult = container.registerClass(
      metricsCollectorToken,
      DIMetricsCollector,
      ServiceLifecycle.SINGLETON
    );
    if (isErr(metricsResult)) {
      return err(`Failed to register MetricsCollector: ${metricsResult.error.message}`);
    }
  }

  // Register MetricsSampler (separate service for SRP - Single Responsibility Principle)
  const samplerResult = container.registerClass(
    metricsSamplerToken,
    DIMetricsSampler,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(samplerResult)) {
    return err(`Failed to register MetricsSampler: ${samplerResult.error.message}`);
  }

  // Register MetricsRecorder as alias to MetricsCollector (for backward compatibility)
  // MetricsSampler is now a separate service, not an alias
  container.registerAlias(metricsRecorderToken, metricsCollectorToken);

  // Register TraceContext first (no dependencies)
  // TraceContext must be registered before Logger to avoid circular dependency
  const traceContextResult = container.registerClass(
    traceContextToken,
    DITraceContext,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(traceContextResult)) {
    return err(`Failed to register TraceContext: ${traceContextResult.error.message}`);
  }

  // Register Logger with class injection (EnvironmentConfig + TraceContext)
  const loggerResult = container.registerClass(
    loggerToken,
    DIConsoleLoggerService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(loggerResult)) {
    return err(`Failed to register Logger: ${loggerResult.error.message}`);
  }

  // Register MetricsReporter (separate service for SRP - Single Responsibility Principle)
  // Must be registered after Logger (depends on loggerToken)
  const reporterResult = container.registerClass(
    metricsReporterToken,
    DIMetricsReporter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(reporterResult)) {
    return err(`Failed to register MetricsReporter: ${reporterResult.error.message}`);
  }

  // Register HealthCheckRegistry (but don't resolve yet - needs container validation first)
  const registryResult = container.registerClass(
    healthCheckRegistryToken,
    DIHealthCheckRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(registryResult)) {
    return err(`Failed to register HealthCheckRegistry: ${registryResult.error.message}`);
  }

  // Register ModuleHealthService (uses HealthCheckRegistry)
  const healthResult = container.registerClass(
    moduleHealthServiceToken,
    DIModuleHealthService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(healthResult)) {
    return err(`Failed to register ModuleHealthService: ${healthResult.error.message}`);
  }

  // Register ModuleApiInitializer (no dependencies, handles API exposition)
  const apiInitResult = container.registerClass(
    moduleApiInitializerToken,
    DIModuleApiInitializer,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(apiInitResult)) {
    return err(`Failed to register ModuleApiInitializer: ${apiInitResult.error.message}`);
  }

  // Register PlatformBootstrapEventPort (no dependencies, uses direct platform API)
  // Must be registered before Bootstrap services that depend on it
  const bootstrapEventsResult = container.registerClass(
    platformBootstrapEventPortToken,
    DIFoundryBootstrapEventAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(bootstrapEventsResult)) {
    return err(
      `Failed to register PlatformBootstrapEventPort: ${bootstrapEventsResult.error.message}`
    );
  }

  // Register BootstrapInitHookService (deps: [loggerToken, serviceContainerToken, platformBootstrapEventPortToken])
  const initHookResult = container.registerClass(
    bootstrapInitHookServiceToken,
    DIBootstrapInitHookService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(initHookResult)) {
    return err(`Failed to register BootstrapInitHookService: ${initHookResult.error.message}`);
  }

  // Register PlatformModuleReadyPort (must be before ModuleReadyService)
  // NOTE: This is a Foundry-specific port, but we register it here because ModuleReadyService needs it
  const moduleReadyPortResult = container.registerClass(
    platformModuleReadyPortToken,
    DIFoundryModuleReadyPort,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(moduleReadyPortResult)) {
    return err(
      `Failed to register PlatformModuleReadyPort: ${moduleReadyPortResult.error.message}`
    );
  }

  // Register ModuleReadyService (deps: [platformModuleReadyPortToken, loggerToken])
  // Must be registered before BootstrapReadyHookService which depends on it
  const moduleReadyResult = container.registerClass(
    moduleReadyServiceToken,
    DIModuleReadyService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(moduleReadyResult)) {
    return err(`Failed to register ModuleReadyService: ${moduleReadyResult.error.message}`);
  }

  // Register BootstrapReadyHookService (deps: [loggerToken, platformBootstrapEventPortToken, moduleReadyServiceToken])
  const readyHookResult = container.registerClass(
    bootstrapReadyHookServiceToken,
    DIBootstrapReadyHookService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(readyHookResult)) {
    return err(`Failed to register BootstrapReadyHookService: ${readyHookResult.error.message}`);
  }

  return ok(undefined);
}
