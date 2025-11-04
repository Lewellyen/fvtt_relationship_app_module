import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * Interface for Foundry UI manipulation.
 * Abstracts DOM operations on Foundry's UI elements.
 */
export interface FoundryUI {
  /**
   * Removes a journal entry element from the journal directory UI.
   * @param journalId - The ID of the journal entry
   * @param journalName - The name of the journal entry (for error messages)
   * @param html - The HTML element containing the journal directory
   * @returns Result indicating success or a FoundryError
   */
  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, FoundryError>;

  /**
   * Finds a DOM element within a container.
   * @param container - The HTML container to search in
   * @param selector - CSS selector for the element
   * @returns Result containing the found element or null, or a FoundryError
   */
  findElement(container: HTMLElement, selector: string): Result<HTMLElement | null, FoundryError>;

  /**
   * Shows a UI notification to the user.
   * @param message - The message to display
   * @param type - Notification type ("info" | "warning" | "error")
   * @returns Result indicating success or a FoundryError
   */
  notify(message: string, type: "info" | "warning" | "error"): Result<void, FoundryError>;
}
