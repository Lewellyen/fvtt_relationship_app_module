import type { JournalContextMenuEvent } from "@/domain/ports/events/journal-event-port.interface";

/**
 * Handler interface for journal context menu customization.
 * Allows multiple handlers to be registered for the same event.
 *
 * Each handler can add custom menu items to the journal context menu.
 * The event.options array is mutable and can be modified directly.
 *
 * @example
 * ```typescript
 * class HideJournalHandler implements JournalContextMenuHandler {
 *   handle(event: JournalContextMenuEvent): void {
 *     // Add "Journal ausblenden" menu item
 *     event.options.push({
 *       name: "Journal ausblenden",
 *       icon: '<i class="fas fa-eye-slash"></i>',
 *       callback: async (li) => {
 *         // Handle hiding journal
 *       },
 *     });
 *   }
 * }
 * ```
 */
export interface JournalContextMenuHandler {
  /**
   * Handle context menu event by potentially adding menu items.
   * The event.options array is mutable and can be modified.
   *
   * @param event - The context menu event with mutable options array
   */
  handle(event: JournalContextMenuEvent): void;
}
