/**
 * Injection token for the FoundryTranslationHandler.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { TranslationHandler } from "@/infrastructure/i18n/TranslationHandler.interface";

/**
 * Injection token for the FoundryTranslationHandler.
 *
 * First handler in the translation chain: tries Foundry's i18n first.
 * Part of the Chain of Responsibility pattern for i18n.
 */
export const foundryTranslationHandlerToken = createInjectionToken<TranslationHandler>(
  "FoundryTranslationHandler"
);
