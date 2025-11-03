import type { Result } from "@/types/result";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Logger } from "@/interfaces/logger";
import type { FoundryJournalEntry } from "@/foundry/types";
import { MODULE_CONSTANTS } from "@/constants";
import { match } from "@/utils/result";
import { foundryGameToken, foundryDocumentToken, foundryUIToken } from "@/foundry/foundrytokens";
import { loggerToken } from "@/tokens/tokenindex";

/**
 * Service for managing journal entry visibility based on module flags.
 * Handles business logic for hiding/showing journal entries in the UI.
 */
export class JournalVisibilityService {
  static dependencies = [
    foundryGameToken,
    foundryDocumentToken,
    foundryUIToken,
    loggerToken,
  ] as const;

  constructor(
    private readonly game: FoundryGame,
    private readonly document: FoundryDocument,
    private readonly ui: FoundryUI,
    private readonly logger: Logger
  ) {}

  /**
   * Gets journal entries marked as hidden via module flag.
   * Logs warnings for entries where flag reading fails to aid diagnosis.
   */
  getHiddenJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    const allEntriesResult = this.game.getJournalEntries();
    if (!allEntriesResult.ok) return allEntriesResult;

    const hidden: FoundryJournalEntry[] = [];

    for (const journal of allEntriesResult.value) {
      const flagResult = this.document.getFlag<boolean>(
        journal as { getFlag: (scope: string, key: string) => unknown },
        MODULE_CONSTANTS.MODULE.ID,
        MODULE_CONSTANTS.FLAGS.HIDDEN
      );

      if (flagResult.ok) {
        if (flagResult.value === true) {
          hidden.push(journal);
        }
      } else {
        // Log flag read errors for diagnosis without interrupting processing
        this.logger.warn(`Failed to read hidden flag for journal "${journal.name ?? journal.id}"`, {
          errorCode: flagResult.error.code,
          errorMessage: flagResult.error.message,
        });
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
        this.logger.error(`Error getting hidden journal entries: ${error}`);
      },
    });
  }

  private hideEntries(entries: FoundryJournalEntry[], html: HTMLElement): void {
    for (const journal of entries) {
      const removeResult = this.ui.removeJournalElement(
        journal.id,
        journal.name ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME,
        html
      );
      match(removeResult, {
        onOk: () => {
          this.logger.debug(
            `Removing journal entry: ${journal.name ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME}`
          );
        },
        onErr: (error) => {
          this.logger.warn(`Error removing journal entry: ${error}`);
        },
      });
    }
  }
}
