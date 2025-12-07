/**
 * Injection token for FoundryHooks port.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryHooksPort } from "@/infrastructure/adapters/foundry/services/FoundryHooksPort";

/**
 * Injection token for FoundryHooks port.
 *
 * Provides access to Foundry's hook system for event registration.
 * Automatically selects version-appropriate port implementation.
 *
 * @example
 * ```typescript
 * const hooks = container.resolve(foundryHooksToken);
 * hooks.on("renderJournalDirectory", (app, html) => {
 *   console.log("Journal directory rendered");
 * });
 * ```
 */
export const foundryHooksToken = createInjectionToken<FoundryHooksPort>("FoundryHooks");
