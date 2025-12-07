/**
 * Injection token for the FoundryI18nPort.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryI18nPort } from "@/infrastructure/adapters/foundry/services/FoundryI18nPort";

/**
 * Injection token for the FoundryI18nPort.
 *
 * Provides access to Foundry VTT's i18n API via Port-Adapter pattern.
 * Automatically selects the correct port based on Foundry version.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(foundryI18nToken);
 * const result = i18n.localize("MODULE.SETTINGS.logLevel.name");
 * if (result.ok) {
 *   console.log(result.value);
 * }
 * ```
 */
export const foundryI18nToken = createInjectionToken<FoundryI18nPort>("FoundryI18nPort");
