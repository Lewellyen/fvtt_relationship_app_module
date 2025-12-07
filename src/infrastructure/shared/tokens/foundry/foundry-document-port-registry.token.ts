/**
 * Injection token for FoundryDocument PortRegistry.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";

/**
 * Injection token for FoundryDocument PortRegistry.
 */
export const foundryDocumentPortRegistryToken = createInjectionToken<PortRegistry<FoundryDocument>>(
  "FoundryDocumentPortRegistry"
);
