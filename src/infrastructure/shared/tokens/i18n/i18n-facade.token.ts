/**
 * Injection token for the I18nFacadeService.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";

/**
 * Injection token for the I18nFacadeService.
 *
 * Combines Foundry's i18n and local translations with intelligent fallback.
 * This is the recommended token to use for all internationalization needs.
 *
 * @example
 * ```typescript
 * const i18n = container.resolve(i18nFacadeToken);
 * const text = i18n.translate("MODULE.SETTINGS.logLevel.name", "Log Level");
 * console.log(text);
 * ```
 */
export const i18nFacadeToken = createInjectionToken<I18nFacadeService>("I18nFacadeService");
