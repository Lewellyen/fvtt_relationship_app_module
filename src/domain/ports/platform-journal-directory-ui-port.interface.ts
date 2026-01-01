import type { Result } from "@/domain/types/result";
import type { PlatformUIError } from "./errors/platform-ui-error.interface";

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
export interface PlatformJournalDirectoryUiPort {
  /**
   * Removes a journal directory entry from the journal directory UI.
   *
   * A journal directory entry is the list position in the sidebar that displays a journal.
   * This is NOT a journal entry (which is a page within a journal).
   *
   * This method is DIP-compliant as it does not require HTMLElement in the Application layer.
   * The port implementation will internally fetch the directory element.
   *
   * @param directoryId - The identifier for the directory (e.g., "journal" for Foundry)
   * @param journalId - The ID of the journal whose directory entry should be removed
   * @param journalName - The name of the journal (for error messages)
   * @returns Result indicating success or error
   */
  removeJournalDirectoryEntry(
    directoryId: string,
    journalId: string,
    journalName: string
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
