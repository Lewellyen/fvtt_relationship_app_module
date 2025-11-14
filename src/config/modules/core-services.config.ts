import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import {
  metricsCollectorToken,
  metricsRecorderToken,
  metricsSamplerToken,
  loggerToken,
  traceContextToken,
  moduleHealthServiceToken,
  moduleApiInitializerToken,
  healthCheckRegistryToken,
  environmentConfigToken,
  metricsStorageToken,
} from "@/tokens/tokenindex";
import { DIMetricsCollector } from "@/observability/metrics-collector";
import { DIPersistentMetricsCollector } from "@/observability/metrics-persistence/persistent-metrics-collector";
import { LocalStorageMetricsStorage } from "@/observability/metrics-persistence/local-storage-metrics-storage";
import { DIConsoleLoggerService } from "@/services/consolelogger";
import { DITraceContext } from "@/observability/trace/TraceContext";
import { DIModuleHealthService } from "@/core/module-health-service";
import { DIModuleApiInitializer } from "@/core/api/module-api-initializer";
import { DIHealthCheckRegistry } from "@/core/health/health-check-registry";

/**
 * Registers core infrastructure services.
 *
 * Services registered:
 * - MetricsCollector (singleton)
 * - MetricsRecorder/MetricsSampler (aliases to MetricsCollector)
 * - Logger (singleton, self-configuring with EnvironmentConfig, optional TraceContext)
 * - TraceContext (singleton, deps: [loggerToken])
 * - HealthCheckRegistry (singleton)
 * - ContainerHealthCheck (singleton, auto-registered)
 * - MetricsHealthCheck (singleton, auto-registered)
 * - ModuleHealthService (singleton, uses HealthCheckRegistry)
 * - ModuleApiInitializer (singleton, handles API exposition)
 *
 * INITIALIZATION ORDER:
 * 1. MetricsCollector (deps: [environmentConfigToken])
 * 2. TraceContext (no dependencies)
 * 3. Logger (klassische DI mit deps: [environmentConfigToken, traceContextToken])
 * 4. HealthCheckRegistry (no dependencies)
 * 5. ContainerHealthCheck & MetricsHealthCheck (auto-register to registry)
 * 6. ModuleHealthService (deps: [healthCheckRegistryToken])
 * 7. ModuleApiInitializer (no dependencies)
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerCoreServices(container: ServiceContainer): Result<void, string> {
  const envResult = container.resolveWithError(environmentConfigToken);
  const env = envResult.ok ? envResult.value : null;

  const enablePersistence = env?.enableMetricsPersistence === true;

  if (enablePersistence) {
    const storageInstance = new LocalStorageMetricsStorage(env.metricsPersistenceKey);
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

  // Register MetricsRecorder and MetricsSampler as aliases to MetricsCollector
  // This provides segregated interfaces (ISP - Interface Segregation Principle)
  container.registerAlias(metricsRecorderToken, metricsCollectorToken);
  container.registerAlias(metricsSamplerToken, metricsCollectorToken);

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

  return ok(undefined);
}
