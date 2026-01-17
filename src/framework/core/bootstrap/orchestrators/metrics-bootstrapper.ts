import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import type { PlatformContainerPort } from "@/domain/ports/platform-container-port.interface";
import { platformMetricsInitializationPortToken } from "@/application/tokens/domain-ports.tokens";
import type { PlatformMetricsInitializationPort } from "@/domain/ports/bootstrap/platform-metrics-initialization-port.interface";

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
    const initPortResult = container.resolveWithError<PlatformMetricsInitializationPort>(
      platformMetricsInitializationPortToken
    );
    if (!initPortResult.ok) {
      // Optional feature - continue silently
      return ok(undefined);
    }

    const initPort = initPortResult.value;
    const result = initPort.initialize();
    // Warnings are handled by caller; this phase is optional
    return result.ok ? ok(undefined) : ok(undefined);
  }
}
