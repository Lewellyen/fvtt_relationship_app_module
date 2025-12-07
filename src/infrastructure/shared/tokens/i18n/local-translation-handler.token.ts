/**
 * Injection token for the LocalTranslationHandler.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { TranslationHandler } from "@/infrastructure/i18n/TranslationHandler.interface";

/**
 * Injection token for the LocalTranslationHandler.
 *
 * Second handler in the translation chain: provides local JSON-based translations.
 * Part of the Chain of Responsibility pattern for i18n.
 */
export const localTranslationHandlerToken =
  createInjectionToken<TranslationHandler>("LocalTranslationHandler");
