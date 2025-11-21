/**
 * Interface for event registration strategies.
 *
 * Implements Strategy Pattern for extensible event listener registration.
 * Each event listener gets its own implementation class.
 *
 * **Design Rationale:**
 * - Single Responsibility: Each event handler is its own class
 * - Open/Closed: Easy to add new events without modifying ModuleEventRegistrar
 * - Testability: Each event handler can be tested in isolation
 * - Platform-agnostic: Works with any event system (Foundry Hooks, Roll20, etc.)
 *
 * @see ModuleEventRegistrar for usage
 */

import type { Result } from "@/domain/types/result";

/**
 * Strategy interface for registering platform-agnostic event listeners.
 *
 * NOTE: All dependencies should be injected via constructor.
 * This follows the DI pattern and avoids Service Locator anti-pattern.
 *
 * @example
 * ```typescript
 * export class MyEventListener implements EventRegistrar {
 *   constructor(private readonly eventPort: JournalEventPort) {}
 *
 *   register(): Result<void, Error> {
 *     eventPort.onJournalCreated((event) => {
 *       // Handle event
 *     });
 *     return { ok: true, value: undefined };
 *   }
 *
 *   dispose(): void {
 *     // Cleanup if needed
 *   }
 * }
 * ```
 */
export interface EventRegistrar {
  /**
   * Register event listeners.
   *
   * NOTE: All dependencies should be injected via constructor.
   *
   * @returns Result indicating success or error
   */
  register(): Result<void, Error>;

  /**
   * Clean up event registrations and resources.
   * Called when the module is disabled or reloaded.
   */
  dispose(): void;
}
