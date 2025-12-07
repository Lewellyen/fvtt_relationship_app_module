/**
 * Injection token for FoundryGame PortRegistry.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";

/**
 * Injection token for FoundryGame PortRegistry.
 */
export const foundryGamePortRegistryToken =
  createInjectionToken<PortRegistry<FoundryGame>>("FoundryGamePortRegistry");
