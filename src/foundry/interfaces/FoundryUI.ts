import type { Result } from "@/types/result";

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
   * @returns Result indicating success or failure
   */
  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, string>;

  /**
   * Finds a DOM element within a container.
   * @param container - The HTML container to search in
   * @param selector - CSS selector for the element
   * @returns Result containing the found element or null, or an error message
   */
  findElement(container: HTMLElement, selector: string): Result<HTMLElement | null, string>;
}
