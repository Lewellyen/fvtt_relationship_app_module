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
 * Service for processing journal directory DOM to hide flagged entries.
 * Handles DOM manipulation and UI coordination.
 *
 * **Responsibilities:**
 * - DOM manipulation for journal directory
 * - UI coordination via PlatformJournalDirectoryUiPort
 * - Error handling and logging for DOM operations
 *
 * **Dependencies:**
 * - PlatformJournalDirectoryUiPort: Platform-agnostic port for journal directory UI operations
 * - PlatformNotificationPort: Platform-agnostic port for logging and notifications
 * - JournalVisibilityConfig: Configuration for default names and cache keys
 *
 * **DIP-Compliance:**
 * - Depends on domain-neutral ports, not Foundry-specific types
 * - Platform-specific adapters implement the ports
 */
export class JournalDirectoryProcessor {
  constructor(
    private readonly journalDirectoryUI: PlatformJournalDirectoryUiPort,
    private readonly notifications: NotificationPublisherPort,
    private readonly config: JournalVisibilityConfig
  ) {}

  /**
   * Processes journal directory HTML to hide flagged entries.
   * @param htmlElement - The HTML element containing the journal directory
   * @param hiddenEntries - Array of journal entries that should be hidden
   * @returns Result indicating success or failure with aggregated errors
   */
  processDirectory(
    htmlElement: HTMLElement,
    hiddenEntries: JournalEntry[]
  ): Result<void, JournalVisibilityError> {
    this.notifications.debug(
      "Processing journal directory for hidden entries",
      { context: { htmlElement, hiddenCount: hiddenEntries.length } },
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

    return this.hideEntries(hiddenEntries, htmlElement);
  }

  /**
   * Hides multiple journal entries in the DOM.
   * @param entries - Array of journal entries to hide
   * @param html - The HTML element containing the journal directory
   * @returns Result indicating success or failure with aggregated errors
   */
  private hideEntries(
    entries: JournalEntry[],
    html: HTMLElement
  ): Result<void, JournalVisibilityError> {
    const errors: JournalVisibilityError[] = [];

    for (const journal of entries) {
      const journalName = journal.name ?? this.config.unknownName;
      const removeResult = this.journalDirectoryUI.removeJournalElement(
        journal.id,
        journalName,
        html
      );

      // Map PlatformUIError to JournalVisibilityError
      if (!removeResult.ok) {
        const journalError: JournalVisibilityError = {
          code: "DOM_MANIPULATION_FAILED",
          entryId: journal.id,
          message: removeResult.error.message,
        };
        errors.push(journalError);
        this.notifications.warn("Error removing journal entry", journalError, {
          channels: ["ConsoleChannel"],
        });
      } else {
        this.notifications.debug(
          `Removing journal entry: ${sanitizeHtml(journalName)}`,
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
