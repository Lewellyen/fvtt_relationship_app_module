/**
 * Injection token for FoundryUI port.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryUIPort } from "@/infrastructure/adapters/foundry/services/FoundryUIPort";

/**
 * Injection token for FoundryUI port.
 *
 * Provides access to Foundry's UI manipulation API for notifications
 * and DOM element management.
 *
 * @example
 * ```typescript
 * const ui = container.resolve(foundryUIToken);
 * ui.notify("Operation successful", "info");
 * ```
 */
export const foundryUIToken = createInjectionToken<FoundryUIPort>("FoundryUI");
