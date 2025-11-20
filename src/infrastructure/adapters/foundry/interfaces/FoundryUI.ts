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
   * @param options - Additional Foundry notification options
   * @returns Result indicating success or a FoundryError
   */
  notify(
    message: string,
    type: "info" | "warning" | "error",
    options?: FoundryNotificationOptions
  ): Result<void, FoundryError>;
}
