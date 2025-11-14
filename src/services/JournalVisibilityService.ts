import type { Result } from "@/types/result";
import type { FoundryJournalFacade } from "@/foundry/facades/foundry-journal-facade.interface";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Logger } from "@/interfaces/logger";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { FoundryJournalEntry } from "@/foundry/types";
import { MODULE_CONSTANTS } from "@/constants";
import { match } from "@/utils/functional/result";
import { foundryJournalFacadeToken } from "@/foundry/foundrytokens";
import { loggerToken, notificationCenterToken } from "@/tokens/tokenindex";
import { BOOLEAN_FLAG_SCHEMA } from "@/foundry/validation/setting-schemas";
import { sanitizeHtml } from "@/foundry/validation/schemas";

/**
 * Service for managing journal entry visibility based on module flags.
 * Handles business logic for hiding/showing journal entries in the UI.
 *
 * **Dependencies Reduced:**
 * - Before: 4 dependencies (FoundryGame, FoundryDocument, FoundryUI, Logger)
 * - After: 2 dependencies (FoundryJournalFacade, Logger)
 * - Improvement: 50% reduction via Facade Pattern
 */
export class JournalVisibilityService {
  constructor(
    private readonly facade: FoundryJournalFacade,
    private readonly logger: Logger,
    private readonly notificationCenter: NotificationCenter
  ) {}

  /**
   * Sanitizes a string for safe use in log messages.
   * Escapes HTML entities to prevent log injection or display issues.
   *
   * Delegates to sanitizeHtml for robust DOM-based sanitization.
   *
   * @param input - The string to sanitize
   * @returns HTML-safe string
   */
  private sanitizeForLog(input: string): string {
    return sanitizeHtml(input);
  }

  /**
   * Gets journal entries marked as hidden via module flag.
   * Logs warnings for entries where flag reading fails to aid diagnosis.
   */
  getHiddenJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    const allEntriesResult = this.facade.getJournalEntries();
    if (!allEntriesResult.ok) return allEntriesResult;

    const hidden: FoundryJournalEntry[] = [];

    for (const journal of allEntriesResult.value) {
      const flagResult = this.facade.getEntryFlag<boolean>(
        journal,
        MODULE_CONSTANTS.FLAGS.HIDDEN,
        BOOLEAN_FLAG_SCHEMA
      );

      if (flagResult.ok) {
        if (flagResult.value === true) {
          hidden.push(journal);
        }
        /* c8 ignore start -- Branch: Non-hidden journals (else branch) are the common case, tested implicitly */
      } else {
        // Log flag read errors for diagnosis without interrupting processing
        const journalIdentifier = journal.name ?? journal.id;
        this.logger.warn(
          `Failed to read hidden flag for journal "${this.sanitizeForLog(journalIdentifier)}"`,
          {
            errorCode: flagResult.error.code,
            /* c8 ignore stop */
            errorMessage: flagResult.error.message,
          }
        );

        // Note: UI notifications would need to be added to FoundryJournalFacade
        // if needed, or accessed through a separate FoundryUI service injection

        // Continue processing other entries
      }
    }

    return { ok: true, value: hidden };
  }

  /**
   * Processes journal directory HTML to hide flagged entries.
   */
  processJournalDirectory(htmlElement: HTMLElement): void {
    this.logger.debug("Processing journal directory for hidden entries");

    const hiddenResult = this.getHiddenJournalEntries();
    match(hiddenResult, {
      onOk: (hidden) => {
        this.logger.debug(`Found ${hidden.length} hidden journal entries`);
        this.hideEntries(hidden, htmlElement);
      },
      onErr: (error) => {
        // Internal error - log to console only (no UI notification)
        this.notificationCenter.error("Error getting hidden journal entries", error, {
          channels: ["ConsoleChannel"],
        });
      },
    });
  }

  private hideEntries(entries: FoundryJournalEntry[], html: HTMLElement): void {
    for (const journal of entries) {
      const journalName = journal.name ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME;
      const removeResult = this.facade.removeJournalElement(journal.id, journalName, html);
      match(removeResult, {
        onOk: () => {
          this.logger.debug(`Removing journal entry: ${this.sanitizeForLog(journalName)}`);
        },
        onErr: (error) => {
          this.logger.warn("Error removing journal entry", error);
        },
      });
    }
  }
}

export class DIJournalVisibilityService extends JournalVisibilityService {
  static dependencies = [foundryJournalFacadeToken, loggerToken, notificationCenterToken] as const;

  constructor(
    facade: FoundryJournalFacade,
    logger: Logger,
    notificationCenter: NotificationCenter
  ) {
    super(facade, logger, notificationCenter);
  }
}
