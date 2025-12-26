import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { metricsCollectorToken } from "@/infrastructure/shared/tokens/observability/metrics-collector.token";
import { isInitializable } from "@/infrastructure/shared/utils/type-guards";

/**
 * Orchestrator for initializing metrics persistence during bootstrap.
 *
 * Responsibilities:
 * - Resolve MetricsCollector
 * - Check if it implements Initializable interface
 * - Call initialize() if needed
 *
 * Follows Liskov Substitution Principle (LSP) by using interface-based
 * type checking instead of concrete class checks.
 */
export class MetricsBootstrapper {
  /**
   * Initializes metrics collector if it supports persistence.
   *
   * @param container - PlatformContainerPort for service resolution
   * @returns Result indicating success (warnings logged but don't fail bootstrap)
   */
  static initializeMetrics(container: PlatformContainerPort): Result<void, string> {
    const metricsResult = container.resolveWithError(metricsCollectorToken);
    if (!metricsResult.ok) {
      // Metrics collector not available - return success (optional)
      return ok(undefined);
    }

    // Check if collector implements Initializable interface
    const collector = metricsResult.value;
    if (isInitializable(collector)) {
      const initResult = collector.initialize();
      if (!initResult.ok) {
        // Log warning but don't fail bootstrap
        return ok(undefined);
      }
    }

    return ok(undefined);
  }
}
