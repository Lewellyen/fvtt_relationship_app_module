/**
 * Injection token for the FallbackTranslationHandler.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { TranslationHandler } from "@/infrastructure/i18n/TranslationHandler.interface";

/**
 * Injection token for the FallbackTranslationHandler.
 *
 * Final handler in the translation chain: returns fallback or key itself.
 * Part of the Chain of Responsibility pattern for i18n.
 */
export const fallbackTranslationHandlerToken = createInjectionToken<TranslationHandler>(
  "FallbackTranslationHandler"
);
