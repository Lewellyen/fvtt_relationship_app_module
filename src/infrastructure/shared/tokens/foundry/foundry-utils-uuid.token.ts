/**
 * Injection token for FoundryUtilsUuidPort.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryUtilsUuidPort } from "@/infrastructure/adapters/foundry/interfaces/FoundryUtilsUuidPort";

/**
 * Injection token for FoundryUtilsUuidPort.
 *
 * Provides UUID and document resolution utilities from Foundry's utils API.
 * Services that only need UUID functionality should depend on this token instead of the full FoundryUtils.
 *
 * @example
 * ```typescript
 * const uuidUtils = container.resolve(foundryUtilsUuidToken);
 * const id = uuidUtils.randomID();
 * const result = await uuidUtils.fromUuid("JournalEntry.abc123");
 * ```
 */
export const foundryUtilsUuidToken =
  createInjectionToken<FoundryUtilsUuidPort>("FoundryUtilsUuidPort");
