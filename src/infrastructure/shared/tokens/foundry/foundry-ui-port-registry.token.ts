/**
 * Injection token for FoundryUI PortRegistry.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";

/**
 * Injection token for FoundryUI PortRegistry.
 */
export const foundryUIPortRegistryToken =
  createInjectionToken<PortRegistry<FoundryUI>>("FoundryUIPortRegistry");
