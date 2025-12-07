/**
 * Injection token for the LocalI18nService.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { LocalI18nService } from "@/infrastructure/i18n/LocalI18nService";

/**
 * Injection token for the LocalI18nService.
 *
 * Provides Foundry-independent JSON-based translations.
 * Used as fallback when Foundry's i18n is unavailable.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(localI18nToken);
 * const result = i18n.translate("MODULE.SETTINGS.logLevel.name");
 * console.log(result.value);
 * ```
 */
export const localI18nToken = createInjectionToken<LocalI18nService>("LocalI18nService");
