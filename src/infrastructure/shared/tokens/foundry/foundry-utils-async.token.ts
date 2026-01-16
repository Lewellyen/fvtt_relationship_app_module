/**
 * Injection token for FoundryUtilsAsyncPort.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryUtilsAsyncPort } from "@/infrastructure/adapters/foundry/interfaces/FoundryUtilsAsyncPort";

/**
 * Injection token for FoundryUtilsAsyncPort.
 *
 * Provides async and timeout utilities from Foundry's utils API (fetchWithTimeout, fetchJsonWithTimeout).
 * Services that only need async utilities should depend on this token instead of the full FoundryUtils.
 *
 * @example
 * ```typescript
 * const asyncUtils = container.resolve(foundryUtilsAsyncToken);
 * const result = await asyncUtils.fetchJsonWithTimeout("/api/data", {}, 5000);
 * ```
 */
export const foundryUtilsAsyncToken =
  createInjectionToken<FoundryUtilsAsyncPort>("FoundryUtilsAsyncPort");
