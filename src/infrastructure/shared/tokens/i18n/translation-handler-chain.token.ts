/**
 * Injection token for the TranslationHandlerChain.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { TranslationHandler } from "@/infrastructure/i18n/TranslationHandler.interface";

/**
 * Injection token for the TranslationHandlerChain.
 *
 * Fully configured chain: Foundry → Local → Fallback.
 * Built via factory in DI container.
 */
export const translationHandlerChainToken =
  createInjectionToken<TranslationHandler>("TranslationHandlerChain");
