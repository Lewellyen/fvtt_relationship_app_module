import type { Result } from "@/domain/types/result";
import type { JournalEntry, JournalVisibilityError } from "@/domain/entities/journal-entry";
import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalVisibilityConfig } from "./JournalVisibilityConfig";
import { getFirstArrayElement } from "@/application/utils/array-utils";
import { sanitizeHtml } from "@/application/utils/sanitize-utils";
import {
  platformJournalDirectoryUiPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { journalVisibilityConfigToken } from "@/application/tokens/application.tokens";

/**
 * Service for processing journal directory to hide flagged entries.
 * Handles UI coordination via ports (DIP-compliant).
 *
 * **Responsibilities:**
 * - Orchestrates hiding of journal entries via PlatformJournalDirectoryUiPort
 * - Error handling and logging for UI operations
 *
 * **Dependencies:**
 * - PlatformJournalDirectoryUiPort: Platform-agnostic port for journal directory UI operations
 * - PlatformNotificationPort: Platform-agnostic port for logging and notifications
 * - JournalVisibilityConfig: Configuration for default names and cache keys
 *
 * **DIP-Compliance:**
 * - Depends on domain-neutral ports, not Foundry-specific types
 * - Does not depend on HTMLElement or other DOM types
 * - Platform-specific adapters implement the ports and handle DOM operations
 */
export class JournalDirectoryProcessor {
  constructor(
    private readonly journalDirectoryUI: PlatformJournalDirectoryUiPort,
    private readonly notifications: NotificationPublisherPort,
    private readonly config: JournalVisibilityConfig
  ) {}

  /**
   * Processes journal directory to hide flagged journal directory entries.
   *
   * A journal directory entry is the list position in the sidebar that displays a journal.
   * This is NOT a journal entry (which is a page within a journal).
   *
   * DIP-compliant: Works with directoryId instead of HTMLElement.
   * @param directoryId - The identifier for the directory (e.g., "journal" for Foundry)
   * @param hiddenEntries - Array of journals whose directory entries should be hidden
   * @returns Result indicating success or failure with aggregated errors
   */
  processDirectory(
    directoryId: string,
    hiddenEntries: JournalEntry[]
  ): Result<void, JournalVisibilityError> {
    this.notifications.debug(
      "Processing journal directory for hidden entries",
      { context: { directoryId, hiddenCount: hiddenEntries.length } },
      {
        channels: ["ConsoleChannel"],
      }
    );

    if (hiddenEntries.length === 0) {
      this.notifications.debug(
        "No hidden entries to process",
        { context: {} },
        {
          channels: ["ConsoleChannel"],
        }
      );
      return { ok: true, value: undefined };
    }

    this.notifications.debug(
      `Found ${hiddenEntries.length} hidden journal entries`,
      { context: { hidden: hiddenEntries } },
      {
        channels: ["ConsoleChannel"],
      }
    );

    return this.hideEntries(directoryId, hiddenEntries);
  }

  /**
   * Hides multiple journal directory entries in the directory.
   *
   * A journal directory entry is the list position in the sidebar that displays a journal.
   * This is NOT a journal entry (which is a page within a journal).
   *
   * DIP-compliant: Uses directoryId instead of HTMLElement.
   * @param directoryId - The identifier for the directory
   * @param entries - Array of journals whose directory entries should be hidden
   * @returns Result indicating success or failure with aggregated errors
   */
  private hideEntries(
    directoryId: string,
    entries: JournalEntry[]
  ): Result<void, JournalVisibilityError> {
    const errors: JournalVisibilityError[] = [];

    for (const journal of entries) {
      const journalName = journal.name ?? this.config.unknownName;
      const removeResult = this.journalDirectoryUI.removeJournalDirectoryEntry(
        directoryId,
        journal.id,
        journalName
      );

      // Map PlatformUIError to JournalVisibilityError
      if (!removeResult.ok) {
        const journalError: JournalVisibilityError = {
          code: "DOM_MANIPULATION_FAILED",
          entryId: journal.id,
          message: removeResult.error.message,
        };
        errors.push(journalError);
        this.notifications.warn("Error removing journal directory entry", journalError, {
          channels: ["ConsoleChannel"],
        });
      } else {
        this.notifications.debug(
          `Removing journal directory entry: ${sanitizeHtml(journalName)}`,
          { context: { journal } },
          { channels: ["ConsoleChannel"] }
        );
      }
    }

    // If any errors occurred, return the first one
    // In future, could aggregate multiple errors into a single error
    if (errors.length > 0) {
      // errors[0] is always defined when errors.length > 0
      // Use helper from runtime-safe-cast to maintain type coverage
      const firstError = getFirstArrayElement(errors);
      return { ok: false, error: firstError };
    }

    return { ok: true, value: undefined };
  }
}

/**
 * DI-enabled wrapper for JournalDirectoryProcessor.
 */
export class DIJournalDirectoryProcessor extends JournalDirectoryProcessor {
  static dependencies = [
    platformJournalDirectoryUiPortToken,
    notificationPublisherPortToken,
    journalVisibilityConfigToken,
  ] as const;

  constructor(
    journalDirectoryUI: PlatformJournalDirectoryUiPort,
    notifications: NotificationPublisherPort,
    config: JournalVisibilityConfig
  ) {
    super(journalDirectoryUI, notifications, config);
  }
}
