import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/infrastructure/shared/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { performanceTrackingServiceToken, retryServiceToken } from "@/infrastructure/shared/tokens";
import { DIPerformanceTrackingService } from "@/infrastructure/performance/PerformanceTrackingService";
import { DIRetryService } from "@/infrastructure/retry/RetryService";

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
    DIPerformanceTrackingService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(perfTrackingResult)) {
    return err(
      `Failed to register PerformanceTrackingService: ${perfTrackingResult.error.message}`
    );
  }

  // Register RetryService
  const retryServiceResult = container.registerClass(
    retryServiceToken,
    DIRetryService,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(retryServiceResult)) {
    return err(`Failed to register RetryService: ${retryServiceResult.error.message}`);
  }

  return ok(undefined);
}
