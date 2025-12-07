/**
 * Injection token for PortSelector.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PortSelector } from "@/infrastructure/adapters/foundry/versioning/portselector";

/**
 * Injection token for PortSelector.
 *
 * Selects the appropriate port implementation based on the current
 * Foundry VTT version. Uses factory-based selection to prevent crashes
 * from incompatible port constructors.
 *
 * @remarks
 * This is a core infrastructure service used internally by Foundry services.
 * Typically not accessed directly by application code.
 */
export const portSelectorToken = createInjectionToken<PortSelector>("PortSelector");
