/**
 * Injection token for FoundrySettings port v13 implementation.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryV13SettingsPort } from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13SettingsPort";

/**
 * Injection token for FoundrySettings port v13 implementation.
 */
export const foundryV13SettingsPortToken =
  createInjectionToken<FoundryV13SettingsPort>("FoundryV13SettingsPort");
