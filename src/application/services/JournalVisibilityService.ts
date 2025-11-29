import type { Result } from "@/domain/types/result";
import type { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";
import type { JournalRepository } from "@/domain/ports/repositories/journal-repository.interface";
import type { JournalVisibilityError } from "@/domain/entities/journal-entry";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import type { PlatformCachePort } from "@/domain/ports/platform-cache-port.interface";
import type { JournalDirectoryUiPort } from "@/domain/ports/journal-directory-ui-port.interface";
import type { JournalVisibilityConfig } from "./JournalVisibilityConfig";
import { getFirstArrayElement } from "@/infrastructure/di/types/utilities/runtime-safe-cast";
import {
  journalCollectionPortToken,
  journalRepositoryToken,
  platformCachePortToken,
  platformNotificationPortToken,
  journalDirectoryUiPortToken,
  journalVisibilityConfigToken,
} from "@/application/tokens";
import { sanitizeHtml } from "@/infrastructure/shared/utils/sanitize";

export const HIDDEN_JOURNAL_CACHE_TAG = "journal:hidden";

/**
 * Service for managing journal entry visibility based on module flags.
 * Handles business logic for hiding/showing journal entries in the UI.
 *
 * **Dependencies:**
 * - JournalCollectionPort: Platform-agnostic port for journal collection queries
 * - JournalRepository: Platform-agnostic port for journal CRUD and flag operations
 * - PlatformNotificationPort: Platform-agnostic port for logging and notifications
 * - PlatformCachePort: Platform-agnostic port for caching hidden entries
 * - PlatformUIPort: Platform-agnostic port for UI operations
 *
 * **DIP-Compliance:**
 * - Depends on domain-neutral ports, not Foundry-specific types
 * - Platform-specific adapters implement the ports
 */
export class JournalVisibilityService {
  constructor(
    private readonly journalCollection: JournalCollectionPort,
    private readonly journalRepository: JournalRepository,
    private readonly notifications: PlatformNotificationPort,
    private readonly cache: PlatformCachePort,
    private readonly journalDirectoryUI: JournalDirectoryUiPort,
    private readonly config: JournalVisibilityConfig
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
  getHiddenJournalEntries(): Result<JournalEntry[], JournalVisibilityError> {
    const cacheKey = this.config.cacheKeyFactory("hidden-directory");
    const cached = this.cache.get<JournalEntry[]>(cacheKey);
    if (cached?.hit && cached.value) {
      this.notifications.debug(
        `Serving ${cached.value.length} hidden journal entries from cache (ttl=${
          cached.metadata.expiresAt ?? "∞"
        })`,
        { context: { cached } },
        { channels: ["ConsoleChannel"] }
      );
      return { ok: true, value: cached.value };
    }

    const allEntriesResult = this.journalCollection.getAll();
    if (!allEntriesResult.ok) {
      // Map EntityCollectionError to JournalVisibilityError
      return {
        ok: false,
        error: {
          code: "PLATFORM_ERROR",
          message: allEntriesResult.error.message,
        },
      };
    }

    const hidden: JournalEntry[] = [];

    for (const journal of allEntriesResult.value) {
      const flagResult = this.journalRepository.getFlag(
        journal.id,
        this.config.moduleNamespace,
        this.config.hiddenFlagKey
      );

      if (flagResult.ok) {
        if (flagResult.value === true) {
          hidden.push(journal);
        }
      } else {
        // Log flag read errors for diagnosis without interrupting processing
        const journalIdentifier = journal.name ?? journal.id;
        this.notifications.warn(
          `Failed to read hidden flag for journal "${this.sanitizeForLog(journalIdentifier)}"`,
          {
            errorCode: flagResult.error.code,
            errorMessage: flagResult.error.message,
          },
          { channels: ["ConsoleChannel"] }
        );

        // Continue processing other entries
      }
    }

    this.cache.set(cacheKey, hidden.slice(), {
      tags: [HIDDEN_JOURNAL_CACHE_TAG],
    });

    return { ok: true, value: hidden };
  }

  /**
   * Processes journal directory HTML to hide flagged entries.
   * @returns Result indicating success or failure with aggregated errors
   */
  processJournalDirectory(htmlElement: HTMLElement): Result<void, JournalVisibilityError> {
    this.notifications.debug(
      "Processing journal directory for hidden entries",
      { context: { htmlElement } },
      {
        channels: ["ConsoleChannel"],
      }
    );

    const hiddenResult = this.getHiddenJournalEntries();
    if (!hiddenResult.ok) {
      // Log error but return it for caller to handle
      this.notifications.error("Error getting hidden journal entries", hiddenResult.error, {
        channels: ["ConsoleChannel"],
      });
      return hiddenResult;
    }

    const hidden = hiddenResult.value;
    this.notifications.debug(
      `Found ${hidden.length} hidden journal entries`,
      { context: { hidden } },
      {
        channels: ["ConsoleChannel"],
      }
    );

    return this.hideEntries(hidden, htmlElement);
  }

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
          `Removing journal entry: ${this.sanitizeForLog(journalName)}`,
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

export class DIJournalVisibilityService extends JournalVisibilityService {
  static dependencies = [
    journalCollectionPortToken,
    journalRepositoryToken,
    platformNotificationPortToken,
    platformCachePortToken,
    journalDirectoryUiPortToken,
    journalVisibilityConfigToken,
  ] as const;

  constructor(
    journalCollection: JournalCollectionPort,
    journalRepository: JournalRepository,
    notifications: PlatformNotificationPort,
    cache: PlatformCachePort,
    journalDirectoryUI: JournalDirectoryUiPort,
    config: JournalVisibilityConfig
  ) {
    super(journalCollection, journalRepository, notifications, cache, journalDirectoryUI, config);
  }
}
