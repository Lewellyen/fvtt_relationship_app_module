/**
 * Injection token for SettingsErrorMapper.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { SettingsErrorMapper } from "@/infrastructure/adapters/foundry/settings-adapters/mappers/settings-error-mapper.interface";

/**
 * Injection token for SettingsErrorMapper.
 *
 * Provides mapping from Foundry-specific errors to platform-agnostic SettingsError.
 * Enables Open/Closed Principle by allowing new error mapping strategies without modifying adapters.
 *
 * @example
 * ```typescript
 * const mapper = container.resolve(settingsErrorMapperToken);
 * const settingsError = mapper.map(foundryError, context);
 * ```
 */
export const settingsErrorMapperToken =
  createInjectionToken<SettingsErrorMapper>("SettingsErrorMapper");
