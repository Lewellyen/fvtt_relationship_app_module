import type { Result } from "@/domain/types/result";
import type { PlatformUIError } from "./platform-ui-port.interface";

/**
 * Platform-agnostic port for journal directory UI operations.
 *
 * Focused interface for DOM manipulation operations on the journal directory.
 * Separated from notification operations to follow Interface Segregation Principle.
 *
 * Implementations:
 * - Foundry: FoundryJournalDirectoryUIAdapter (wraps FoundryV13UIPort)
 * - Roll20: Roll20JournalDirectoryUIAdapter
 * - CSV/Headless: NoOpJournalDirectoryUIAdapter
 */
export interface JournalDirectoryUiPort {
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
}
