/**
 * Injection token for FoundryModule PortRegistry.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { FoundryModule } from "@/infrastructure/adapters/foundry/interfaces/FoundryModule";

/**
 * Injection token for FoundryModule PortRegistry.
 */
export const foundryModulePortRegistryToken = createInjectionToken<PortRegistry<FoundryModule>>(
  "FoundryModulePortRegistry"
);
