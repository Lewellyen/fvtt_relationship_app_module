/**
 * Injection token for FoundrySettings PortRegistry.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PortRegistry } from "@/infrastructure/adapters/foundry/versioning/portregistry";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";

/**
 * Injection token for FoundrySettings PortRegistry.
 */
export const foundrySettingsPortRegistryToken = createInjectionToken<PortRegistry<FoundrySettings>>(
  "FoundrySettingsPortRegistry"
);
