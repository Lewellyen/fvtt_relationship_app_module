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

/**
 * Strategy interface for registering a single Foundry hook.
 *
 * NOTE: Container parameter removed - all dependencies should be injected via constructor.
 * This follows the DI pattern and avoids Service Locator anti-pattern.
 *
 * @example
 * ```typescript
 * export class MyHook implements HookRegistrar {
 *   constructor(private readonly hooks: FoundryHooks) {}
 *
 *   register(): Result<void, Error> {
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
   * NOTE: Container parameter removed - all dependencies should be injected via constructor.
   *
   * @returns Result indicating success or error
   */
  register(): Result<void, Error>;

  /**
   * Clean up hook registrations and resources.
   * Called when the module is disabled or reloaded.
   */
  dispose(): void;
}
