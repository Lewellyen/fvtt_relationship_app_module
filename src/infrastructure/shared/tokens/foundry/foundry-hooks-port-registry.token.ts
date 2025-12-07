/**
 * Injection token for FoundryHooks PortRegistry.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { FoundryHooks } from "@/infrastructure/adapters/foundry/interfaces/FoundryHooks";

/**
 * Injection token for FoundryHooks PortRegistry.
 */
export const foundryHooksPortRegistryToken = createInjectionToken<PortRegistry<FoundryHooks>>(
  "FoundryHooksPortRegistry"
);
