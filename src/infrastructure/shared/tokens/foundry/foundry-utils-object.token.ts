/**
 * Injection token for FoundryUtilsObjectPort.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryUtilsObjectPort } from "@/infrastructure/adapters/foundry/interfaces/FoundryUtilsObjectPort";

/**
 * Injection token for FoundryUtilsObjectPort.
 *
 * Provides object manipulation utilities from Foundry's utils API (deepClone, mergeObject, etc.).
 * Services that only need object manipulation should depend on this token instead of the full FoundryUtils.
 *
 * @example
 * ```typescript
 * const objectUtils = container.resolve(foundryUtilsObjectToken);
 * const result = objectUtils.deepClone({ a: 1, b: { c: 2 } });
 * ```
 */
export const foundryUtilsObjectToken =
  createInjectionToken<FoundryUtilsObjectPort>("FoundryUtilsObjectPort");
