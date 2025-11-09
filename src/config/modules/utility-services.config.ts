import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import { performanceTrackingServiceToken, retryServiceToken } from "@/tokens/tokenindex";
import { PerformanceTrackingService } from "@/services/PerformanceTrackingService";
import { RetryService } from "@/services/RetryService";

/**
 * Registers utility services.
 *
 * Services registered:
 * - PerformanceTrackingService (singleton)
 * - RetryService (singleton)
 *
 * These services provide cross-cutting concerns like performance tracking
 * and retry logic with exponential backoff.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerUtilityServices(container: ServiceContainer): Result<void, string> {
  // Register PerformanceTrackingService
  const perfTrackingResult = container.registerClass(
    performanceTrackingServiceToken,
    PerformanceTrackingService,
    ServiceLifecycle.SINGLETON
  );
  /* c8 ignore start -- Defensive: Service registration */
  if (isErr(perfTrackingResult)) {
    return err(
      `Failed to register PerformanceTrackingService: ${perfTrackingResult.error.message}`
    );
  }
  /* c8 ignore stop */

  // Register RetryService
  const retryServiceResult = container.registerClass(
    retryServiceToken,
    RetryService,
    ServiceLifecycle.SINGLETON
  );
  /* c8 ignore start -- Defensive: Service registration */
  if (isErr(retryServiceResult)) {
    return err(`Failed to register RetryService: ${retryServiceResult.error.message}`);
  }
  /* c8 ignore stop */

  return ok(undefined);
}
