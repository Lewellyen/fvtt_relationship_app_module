/**
 * Injection token for the RetryService.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { RetryService } from "@/infrastructure/retry/RetryService";

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
