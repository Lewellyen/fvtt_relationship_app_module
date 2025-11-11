import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import {
  environmentConfigToken,
  metricsCollectorToken,
  metricsRecorderToken,
  metricsSamplerToken,
  loggerToken,
  moduleHealthServiceToken,
  moduleApiInitializerToken,
  healthCheckRegistryToken,
} from "@/tokens/tokenindex";
import { ENV } from "@/config/environment";
import { MetricsCollector } from "@/observability/metrics-collector";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { ModuleHealthService } from "@/core/module-health-service";
import { ModuleApiInitializer } from "@/core/api/module-api-initializer";
import { HealthCheckRegistry } from "@/core/health/health-check-registry";

/**
 * Registers core infrastructure services.
 *
 * Services registered:
 * - EnvironmentConfig (singleton value)
 * - MetricsCollector (singleton)
 * - MetricsRecorder/MetricsSampler (aliases to MetricsCollector)
 * - Logger (singleton, self-configuring with EnvironmentConfig)
 * - HealthCheckRegistry (singleton)
 * - ContainerHealthCheck (singleton, auto-registered)
 * - MetricsHealthCheck (singleton, auto-registered)
 * - ModuleHealthService (singleton, uses HealthCheckRegistry)
 * - ModuleApiInitializer (singleton, handles API exposition)
 *
 * INITIALIZATION ORDER:
 * 1. EnvironmentConfig (no dependencies)
 * 2. MetricsCollector (deps: [environmentConfigToken])
 * 3. Logger (deps: [environmentConfigToken])
 * 4. HealthCheckRegistry (no dependencies)
 * 5. ContainerHealthCheck & MetricsHealthCheck (auto-register to registry)
 * 6. ModuleHealthService (deps: [healthCheckRegistryToken])
 * 7. ModuleApiInitializer (no dependencies)
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerCoreServices(container: ServiceContainer): Result<void, string> {
  // Register EnvironmentConfig as singleton value
  const envResult = container.registerValue(environmentConfigToken, ENV);
  if (isErr(envResult)) {
    return err(`Failed to register EnvironmentConfig: ${envResult.error.message}`);
  }

  // Register MetricsCollector
  const metricsResult = container.registerClass(
    metricsCollectorToken,
    MetricsCollector,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(metricsResult)) {
    return err(`Failed to register MetricsCollector: ${metricsResult.error.message}`);
  }

  // Register MetricsRecorder and MetricsSampler as aliases to MetricsCollector
  // This provides segregated interfaces (ISP - Interface Segregation Principle)
  container.registerAlias(metricsRecorderToken, metricsCollectorToken);
  container.registerAlias(metricsSamplerToken, metricsCollectorToken);

  // Register Logger (self-configuring with EnvironmentConfig dependency)
  const loggerResult = container.registerClass(
    loggerToken,
    ConsoleLoggerService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(loggerResult)) {
    return err(`Failed to register Logger: ${loggerResult.error.message}`);
  }

  // Register HealthCheckRegistry (but don't resolve yet - needs container validation first)
  const registryResult = container.registerClass(
    healthCheckRegistryToken,
    HealthCheckRegistry,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(registryResult)) {
    return err(`Failed to register HealthCheckRegistry: ${registryResult.error.message}`);
  }

  // Register ModuleHealthService (uses HealthCheckRegistry)
  const healthResult = container.registerClass(
    moduleHealthServiceToken,
    ModuleHealthService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(healthResult)) {
    return err(`Failed to register ModuleHealthService: ${healthResult.error.message}`);
  }

  // Register ModuleApiInitializer (no dependencies, handles API exposition)
  const apiInitResult = container.registerClass(
    moduleApiInitializerToken,
    ModuleApiInitializer,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(apiInitResult)) {
    return err(`Failed to register ModuleApiInitializer: ${apiInitResult.error.message}`);
  }

  return ok(undefined);
}
