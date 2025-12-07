/**
 * Injection token for FoundryI18n port v13 implementation.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryV13I18nPort } from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13I18nPort";

/**
 * Injection token for FoundryI18n port v13 implementation.
 */
export const foundryV13I18nPortToken =
  createInjectionToken<FoundryV13I18nPort>("FoundryV13I18nPort");
