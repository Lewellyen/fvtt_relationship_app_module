import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { Disposable } from "@/infrastructure/di/interfaces";

/**
 * Options supported by Foundry's ui.notifications API.
 *
 * Based on Foundry VTT v13 API typings.
 */
export interface FoundryNotificationOptions {
  /**
   * Whether to clean the provided message string as untrusted user input.
   */
  clean?: boolean;
  /**
   * Whether to log the message to the console.
   */
  console?: boolean;
  /**
   * Whether to escape the values provided via `format`.
   */
  escape?: boolean;
  /**
   * A mapping of formatting strings passed to `game.i18n.format`.
   */
  format?: Record<string, string>;
  /**
   * Whether to localize the message content before displaying it.
   */
  localize?: boolean;
  /**
   * Keep the notification visible until manually dismissed.
   */
  permanent?: boolean;
  /**
   * Display the notification with a progress bar.
   */
  progress?: boolean;
}

/**
 * Interface for Foundry UI manipulation.
 * Abstracts DOM operations on Foundry's UI elements.
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 */
export interface FoundryUI extends Disposable {
  /**
   * Removes a journal directory entry from the journal directory UI.
   *
   * A journal directory entry is the list position in the sidebar that displays a journal.
   * This is NOT a journal entry (which is a page within a journal).
   *
   * This method is DIP-compliant as it internally fetches the directory element.
   * @param directoryId - The identifier for the directory (e.g., "journal" for Foundry)
   * @param journalId - The ID of the journal whose directory entry should be removed
   * @param journalName - The name of the journal (for error messages)
   * @returns Result indicating success or a FoundryError
   */
  removeJournalDirectoryEntry(
    directoryId: string,
    journalId: string,
    journalName: string
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
   * @param options - Additional Foundry notification options
   * @returns Result indicating success or a FoundryError
   */
  notify(
    message: string,
    type: "info" | "warning" | "error",
    options?: FoundryNotificationOptions
  ): Result<void, FoundryError>;

  /**
   * Gets the HTML element for the journal directory.
   * @param directoryId - The identifier for the directory (e.g., "journal" for Foundry)
   * @returns Result with HTMLElement or null if directory is not currently rendered, or error
   */
  getDirectoryElement(directoryId: string): Result<HTMLElement | null, FoundryError>;

  /**
   * Triggers a re-render of the journal directory if it's currently open.
   * @returns Result indicating success (true if rendered, false if not open) or error
   */
  rerenderJournalDirectory(): Result<boolean, FoundryError>;
}
