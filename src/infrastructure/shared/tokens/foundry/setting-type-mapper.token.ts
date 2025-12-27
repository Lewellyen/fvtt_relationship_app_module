/**
 * Injection token for SettingTypeMapper.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { SettingTypeMapper } from "@/infrastructure/adapters/foundry/settings-adapters/mappers/setting-type-mapper.interface";

/**
 * Injection token for SettingTypeMapper.
 *
 * Provides mapping from platform-agnostic SettingType to Foundry-specific type constructors.
 * Enables Open/Closed Principle by allowing new mapping strategies without modifying adapters.
 *
 * @example
 * ```typescript
 * const mapper = container.resolve(settingTypeMapperToken);
 * const result = mapper.map(String);
 * ```
 */
export const settingTypeMapperToken = createInjectionToken<SettingTypeMapper>("SettingTypeMapper");
