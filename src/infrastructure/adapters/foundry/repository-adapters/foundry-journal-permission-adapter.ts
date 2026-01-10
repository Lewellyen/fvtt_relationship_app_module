import type { Result } from "@/domain/types/result";
import type { PlatformJournalPermissionPort } from "@/domain/ports/repositories/platform-journal-permission-port.interface";
import type { JournalVisibilityError } from "@/domain/entities/journal-entry";
import { ok } from "@/domain/utils/result";
import { createFoundryError } from "../errors/FoundryErrors";
import { tryCatch } from "@/domain/utils/result";

/**
 * Foundry-specific implementation of PlatformJournalPermissionPort.
 *
 * Uses Foundry's testUserPermission API to check if the current user
 * has OBSERVER-level permission (or higher) on journal entries.
 *
 * **Fail-Open Strategy:**
 * - If game.user is not available, returns ok(true) (allows viewing)
 * - If journal cannot be found, returns ok(false) (no permission)
 * - If an error occurs during permission check, returns ok(true) (fail-open)
 */
export class FoundryJournalPermissionAdapter implements PlatformJournalPermissionPort {
  /**
   * Checks if the current user has permission to view a journal entry.
   *
   * Uses Foundry's journal.testUserPermission(game.user, "OBSERVER") API.
   *
   * @param journalId - The ID of the journal entry to check
   * @returns Result indicating whether the user can view the journal
   */
  canUserViewJournal(journalId: string): Result<boolean, JournalVisibilityError> {
    // Fail-open: If game is not available, allow viewing (safety)
    if (typeof game === "undefined" || !game?.journal) {
      return ok(true);
    }

    // Fail-open: If user is not available, allow viewing (safety)
    if (!game.user) {
      return ok(true);
    }

    // Get journal entry from Foundry
    const journalResult = tryCatch(
      () => game.journal.get(journalId),
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to get journal entry for permission check: ${error instanceof Error ? error.message : String(error)}`,
          { journalId },
          error
        )
    );

    if (!journalResult.ok) {
      // Journal not found or error accessing it -> no permission
      return ok(false);
    }

    const journal = journalResult.value;

    // Journal not found
    if (!journal) {
      return ok(false);
    }

    // Check permission using Foundry's testUserPermission API
    // OBSERVER is the minimum permission level for viewing journals in the sidebar
    const permissionResult = tryCatch(
      () => {
        // testUserPermission returns boolean: true if user has OBSERVER or higher permission
        return journal.testUserPermission(game.user, "OBSERVER");
      },
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to check journal permission: ${error instanceof Error ? error.message : String(error)}`,
          { journalId },
          error
        )
    );

    if (!permissionResult.ok) {
      // Fail-open: If permission check fails, allow viewing (safety)
      return ok(true);
    }

    return ok(permissionResult.value);
  }
}
