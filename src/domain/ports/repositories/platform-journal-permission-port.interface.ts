import type { Result } from "@/domain/types/result";
import type { JournalVisibilityError } from "@/domain/entities/journal-entry";

/**
 * Platform-agnostic port for checking journal permission access.
 *
 * Provides a way to check if the current user has permission to view a journal entry.
 * This port abstracts away platform-specific permission checking logic.
 *
 * **DIP-Compliance:**
 * - Platform-agnostic interface
 * - Platform-specific adapters implement this port
 * - Uses Result pattern for error handling
 *
 * @example
 * ```typescript
 * const permissionPort = container.resolve(platformJournalPermissionPortToken);
 * const result = permissionPort.canUserViewJournal("journal-123");
 * if (result.ok && result.value) {
 *   console.log("User can view journal");
 * }
 * ```
 */
export interface PlatformJournalPermissionPort {
  /**
   * Checks if the current user has permission to view a journal entry.
   *
   * The current user is determined by the platform implementation (e.g., game.user in Foundry).
   * This method checks for OBSERVER-level permission (or higher) on the journal.
   *
   * **Fail-Open Strategy:**
   * - If the current user cannot be determined, returns ok(true) (allows viewing)
   * - If the journal cannot be found, returns ok(false) (no permission)
   * - If an error occurs, returns ok(true) (fail-open: allows viewing for safety)
   *
   * @param journalId - The ID of the journal entry to check
   * @returns Result indicating whether the user can view the journal (true) or not (false), or an error
   */
  canUserViewJournal(journalId: string): Result<boolean, JournalVisibilityError>;
}
