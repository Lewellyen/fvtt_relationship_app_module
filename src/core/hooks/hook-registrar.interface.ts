/**
 * Interface for hook registration strategies.
 *
 * Implements Strategy Pattern for extensible hook registration.
 * Each hook gets its own implementation class.
 *
 * **Design Rationale:**
 * - Single Responsibility: Each hook handler is its own class
 * - Open/Closed: Easy to add new hooks without modifying ModuleHookRegistrar
 * - Testability: Each hook can be tested in isolation
 *
 * @see ModuleHookRegistrar for usage
 */

import type { Result } from "@/types/result";
import type { ServiceContainer } from "@/di_infrastructure/container";

/**
 * Strategy interface for registering a single Foundry hook.
 *
 * @example
 * ```typescript
 * export class MyHook implements HookRegistrar {
 *   register(container: ServiceContainer): Result<void, Error> {
 *     const hooks = container.resolve(foundryHooksToken);
 *     hooks.on("hookName", callback);
 *     return { ok: true, value: undefined };
 *   }
 *
 *   dispose(): void {
 *     // Cleanup if needed
 *   }
 * }
 * ```
 */
export interface HookRegistrar {
  /**
   * Register the hook with Foundry VTT.
   *
   * @param container - DI container to resolve dependencies
   * @returns Result indicating success or error
   */
  register(container: ServiceContainer): Result<void, Error>;

  /**
   * Clean up hook registrations and resources.
   * Called when the module is disabled or reloaded.
   */
  dispose(): void;
}
