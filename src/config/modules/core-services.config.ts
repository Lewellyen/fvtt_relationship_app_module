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
} from "@/tokens/tokenindex";
import { ENV } from "@/config/environment";
import { MetricsCollector } from "@/observability/metrics-collector";
import { ConsoleLoggerService } from "@/services/consolelogger";
import { ModuleHealthService } from "@/core/module-health-service";

/**
 * Registers core infrastructure services.
 *
 * Services registered:
 * - EnvironmentConfig (singleton value)
 * - MetricsCollector (singleton)
 * - MetricsRecorder/MetricsSampler (aliases to MetricsCollector)
 * - Logger (singleton, self-configuring with EnvironmentConfig)
 * - ModuleHealthService (singleton, with container self-reference)
 *
 * INITIALIZATION ORDER:
 * 1. EnvironmentConfig (no dependencies)
 * 2. MetricsCollector (deps: [environmentConfigToken])
 * 3. Logger (deps: [environmentConfigToken])
 * 4. ModuleHealthService (deps: [container, metricsCollectorToken])
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

  // Register ModuleHealthService (special case: needs container reference)
  const healthResult = container.registerFactory(
    moduleHealthServiceToken,
    () => {
      const metricsResult = container.resolveWithError(metricsCollectorToken);
      /* c8 ignore start -- Defensive: MetricsCollector is always registered at this point */
      if (!metricsResult.ok) {
        throw new Error("MetricsCollector not available for ModuleHealthService");
      }
      /* c8 ignore stop */
      return new ModuleHealthService(container, metricsResult.value);
    },
    ServiceLifecycle.SINGLETON,
    [metricsCollectorToken]
  );

  if (isErr(healthResult)) {
    return err(`Failed to register ModuleHealthService: ${healthResult.error.message}`);
  }

  return ok(undefined);
}
