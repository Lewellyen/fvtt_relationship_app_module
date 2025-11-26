import type { JournalContextMenuEvent } from "@/domain/ports/events/platform-journal-event-port.interface";

/**
 * Port for registering callbacks to context menu events.
 *
 * Platform-agnostic interface for adding/removing context menu handlers.
 * Foundry implementation uses libWrapper internally.
 *
 * @example
 * ```typescript
 * const port = container.resolve(contextMenuRegistrationPortToken);
 *
 * // Add callback
 * const callback = (event: JournalContextMenuEvent) => {
 *   event.options.push({ name: "Custom", icon: "...", callback: () => {} });
 * };
 * port.addCallback(callback);
 *
 * // Later: Remove callback
 * port.removeCallback(callback);
 * ```
 */
export interface ContextMenuRegistrationPort {
  /**
   * Add a callback that will be called when a journal context menu is rendered.
   *
   * @param callback - Callback function that receives the context menu event
   */
  addCallback(callback: (event: JournalContextMenuEvent) => void): void;

  /**
   * Remove a previously registered callback.
   *
   * @param callback - The callback function to remove
   */
  removeCallback(callback: (event: JournalContextMenuEvent) => void): void;
}
