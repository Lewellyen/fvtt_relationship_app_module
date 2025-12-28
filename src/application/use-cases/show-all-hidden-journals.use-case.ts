import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import type { PlatformJournalCollectionPort } from "@/domain/ports/collections/platform-journal-collection-port.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalVisibilityConfig } from "@/application/services/JournalVisibilityConfig";
import {
  platformJournalCollectionPortToken,
  platformJournalRepositoryToken,
  platformJournalDirectoryUiPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { journalVisibilityConfigToken } from "@/application/tokens/application.tokens";

/**
 * Use-Case: Show all hidden journals by setting their hidden flag to false.
 *
 * Platform-agnostic - works with any PlatformJournalCollectionPort and PlatformJournalRepository implementation.
 *
 * Iterates through all journal entries, checks if they have the hidden flag set,
 * and sets it to false if it's not already false. Then triggers a UI re-render.
 *
 * @example
 * ```typescript
 * const useCase = new ShowAllHiddenJournalsUseCase(
 *   journalCollection,
 *   journalRepository,
 *   journalDirectoryUI,
 *   notifications,
 *   config
 * );
 *
 * const result = await useCase.execute();
 * if (result.ok) {
 *   console.log(`Unhidden ${result.value} journals`);
 * }
 * ```
 */
export class ShowAllHiddenJournalsUseCase {
  constructor(
    private readonly journalCollection: PlatformJournalCollectionPort,
    private readonly journalRepository: PlatformJournalRepository,
    private readonly journalDirectoryUI: PlatformJournalDirectoryUiPort,
    private readonly notifications: NotificationPublisherPort,
    private readonly config: JournalVisibilityConfig
  ) {}

  /**
   * Execute the use-case: Show all hidden journals.
   *
   * @returns Result with number of journals that were unhidden, or error
   */
  async execute(): Promise<Result<number, Error>> {
    // Get all journals
    const allJournalsResult = this.journalCollection.getAll();
    if (!allJournalsResult.ok) {
      return err(new Error(`Failed to get all journals: ${allJournalsResult.error.message}`));
    }

    const allJournals = allJournalsResult.value;
    let changedCount = 0;
    const errors: Array<{ journalId: string; error: string }> = [];

    // Process each journal
    for (const journal of allJournals) {
      try {
        // Check current flag value
        const flagResult = this.journalRepository.getFlag(
          journal.id,
          this.config.moduleNamespace,
          this.config.hiddenFlagKey
        );

        if (!flagResult.ok) {
          // Log error but continue with other journals
          errors.push({
            journalId: journal.id,
            error: `Failed to read flag: ${flagResult.error.message}`,
          });
          this.notifications.warn(
            `Failed to read hidden flag for journal "${journal.name ?? journal.id}"`,
            {
              errorCode: flagResult.error.code,
              errorMessage: flagResult.error.message,
              journalId: journal.id,
            },
            { channels: ["ConsoleChannel"] }
          );
          continue;
        }

        const currentFlag = flagResult.value;

        // Only set flag if it's not already false
        // This matches the console code: if (current !== false && current !== undefined && current !== null)
        // Which means: set flag if current is true, undefined, or null (but not if it's already false)
        if (currentFlag !== false) {
          const setFlagResult = await this.journalRepository.setFlag(
            journal.id,
            this.config.moduleNamespace,
            this.config.hiddenFlagKey,
            false
          );

          if (!setFlagResult.ok) {
            // Log error but continue with other journals
            errors.push({
              journalId: journal.id,
              error: `Failed to set flag: ${setFlagResult.error.message}`,
            });
            this.notifications.warn(
              `Failed to set hidden flag for journal "${journal.name ?? journal.id}"`,
              {
                errorCode: setFlagResult.error.code,
                errorMessage: setFlagResult.error.message,
                journalId: journal.id,
              },
              { channels: ["ConsoleChannel"] }
            );
            continue;
          }

          changedCount++;
        }
      } catch (error) {
        // Catch any unexpected errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({
          journalId: journal.id,
          error: errorMessage,
        });
        this.notifications.warn(
          `Unexpected error processing journal "${journal.name ?? journal.id}"`,
          {
            error: errorMessage,
            journalId: journal.id,
          },
          { channels: ["ConsoleChannel"] }
        );
      }
    }

    // Log summary
    if (changedCount > 0) {
      this.notifications.info(
        `${changedCount} ${changedCount === 1 ? "Journal" : "Journale"} wieder eingeblendet`,
        {
          count: changedCount,
        }
      );
    } else {
      this.notifications.info("Keine versteckten Journale gefunden", {});
    }

    // Log errors if any
    if (errors.length > 0) {
      this.notifications.warn(
        `${errors.length} Fehler beim Verarbeiten von Journals`,
        {
          errorCount: errors.length,
          errors: errors.slice(0, 5), // Only show first 5 errors
        },
        { channels: ["ConsoleChannel"] }
      );
    }

    // Trigger UI re-render
    const rerenderResult = this.journalDirectoryUI.rerenderJournalDirectory();
    if (!rerenderResult.ok) {
      this.notifications.warn(
        "Journal-Verzeichnis konnte nicht neu gerendert werden",
        {
          errorCode: rerenderResult.error.code,
          errorMessage: rerenderResult.error.message,
        },
        { channels: ["ConsoleChannel"] }
      );
    }

    return ok(changedCount);
  }
}

/**
 * DI-enabled wrapper for ShowAllHiddenJournalsUseCase.
 */
export class DIShowAllHiddenJournalsUseCase extends ShowAllHiddenJournalsUseCase {
  static dependencies = [
    platformJournalCollectionPortToken,
    platformJournalRepositoryToken,
    platformJournalDirectoryUiPortToken,
    notificationPublisherPortToken,
    journalVisibilityConfigToken,
  ] as const;

  constructor(
    journalCollection: PlatformJournalCollectionPort,
    journalRepository: PlatformJournalRepository,
    journalDirectoryUI: PlatformJournalDirectoryUiPort,
    notifications: NotificationPublisherPort,
    config: JournalVisibilityConfig
  ) {
    super(journalCollection, journalRepository, journalDirectoryUI, notifications, config);
  }
}
