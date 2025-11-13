import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";

/**
 * Action button configuration for Foundry UI notifications.
 * Mirrors Foundry's NotificationAction structure.
 */
export interface FoundryNotificationAction {
  /**
   * Text displayed on the action button.
   */
  label: string;
  /**
   * Callback executed when the action button is clicked.
   */
  callback: () => void;
  /**
   * Optional CSS classes applied to the action button.
   */
  classes?: string | string[];
}

/**
 * Options supported by Foundry's ui.notifications API.
 *
 * Based on Foundry VTT v13 API typings.
 */
export interface FoundryNotificationOptions {
  /**
   * Keeps the notification visible until manually dismissed.
   */
  permanent?: boolean;
  /**
   * Enables translation of the message via game.i18n.
   */
  localize?: boolean;
  /**
   * Arguments passed to the localization formatter.
   */
  i18nArgs?: Record<string, unknown>;
  /**
   * Logs the notification message to the console as well.
   */
  console?: boolean;
  /**
   * Only display the notification when CONFIG.debug.notifications is enabled.
   */
  debug?: boolean;
  /**
   * Optional title rendered above the message.
   */
  title?: string;
  /**
   * Identifier of another notification to replace.
   */
  replaces?: string;
  /**
   * Overrides the notification type when using ui.notifications.notify directly.
   */
  type?: "info" | "warning" | "error" | string;
  /**
   * FontAwesome icon class applied to the notification.
   */
  icon?: string;
  /**
   * Additional CSS classes for the notification element.
   */
  classes?: string | string[];
  /**
   * Action buttons rendered inside the notification.
   */
  actions?: FoundryNotificationAction[];
  /**
   * Duration in milliseconds before the notification auto-dismisses.
   */
  duration?: number;
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
