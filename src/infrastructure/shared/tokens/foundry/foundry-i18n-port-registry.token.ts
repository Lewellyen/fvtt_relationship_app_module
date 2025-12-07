/**
 * Injection token for FoundryI18n PortRegistry.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { FoundryI18n } from "@/infrastructure/adapters/foundry/interfaces/FoundryI18n";

/**
 * Injection token for FoundryI18n PortRegistry.
 */
export const foundryI18nPortRegistryToken =
  createInjectionToken<PortRegistry<FoundryI18n>>("FoundryI18nPortRegistry");
