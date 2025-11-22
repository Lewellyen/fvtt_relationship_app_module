import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic error for UI operations.
 */
export interface PlatformUIError {
  code: string;
  message: string;
  operation?: string;
  details?: unknown;
}

/**
 * Platform-agnostic port for UI operations.
 *
 * Abstraction that allows domain/application layers to work with UI
 * without knowing about the underlying platform (Foundry, Roll20, etc.).
 *
 * Implementations:
 * - Foundry: FoundryUIAdapter (wraps FoundryUIPortV13)
 * - Roll20: Roll20UIAdapter
 * - CSV/Headless: NoOpUIAdapter
 */
export interface PlatformUIPort {
  /**
   * Removes a journal entry element from the journal directory UI.
   * @param journalId - The ID of the journal entry
   * @param journalName - The name of the journal entry (for error messages)
   * @param html - The HTML element containing the journal directory
   * @returns Result indicating success or error
   */
  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, PlatformUIError>;

  /**
   * Triggers a re-render of the journal directory if it's currently open.
   * Platform-specific behavior:
   * - Foundry: Calls ui.sidebar.tabs.journal.render(false)
   * - Roll20: Triggers sidebar refresh
   * - CSV/Headless: No-op
   * @returns Result with boolean (true if rendered, false if not applicable) or error
   */
  rerenderJournalDirectory(): Result<boolean, PlatformUIError>;

  /**
   * Shows a notification to the user.
   * @param message - The message to display
   * @param type - Notification severity
   * @returns Result indicating success or error
   */
  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformUIError>;
}
