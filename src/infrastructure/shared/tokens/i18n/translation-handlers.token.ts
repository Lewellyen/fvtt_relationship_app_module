/**
 * Injection token for array of TranslationHandler instances.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { TranslationHandler } from "@/infrastructure/i18n/TranslationHandler.interface";

/**
 * Injection token for array of TranslationHandler instances.
 *
 * Allows multiple handlers to be registered and composed via DI.
 * Handlers are chained in the order they appear in the array.
 */
export const translationHandlersToken =
  createInjectionToken<TranslationHandler[]>("TranslationHandlers");
