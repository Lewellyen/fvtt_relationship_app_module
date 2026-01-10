/**
 * Injection token for the FallbackTranslationHandler.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { TerminalTranslationHandler } from "@/infrastructure/i18n/TerminalTranslationHandler.interface";

/**
 * Injection token for the FallbackTranslationHandler.
 *
 * Final handler in the translation chain: returns fallback or key itself.
 * This is a terminal handler (cannot be chained further).
 * Part of the Chain of Responsibility pattern for i18n.
 */
export const fallbackTranslationHandlerToken = createInjectionToken<TerminalTranslationHandler>(
  "FallbackTranslationHandler"
);
