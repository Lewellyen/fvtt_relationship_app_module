import type { Result } from "@/types/result";
import type { FoundryJournalFacade } from "@/foundry/facades/foundry-journal-facade.interface";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { FoundryJournalEntry } from "@/foundry/types";
import type { CacheService } from "@/interfaces/cache";
import { createCacheNamespace } from "@/interfaces/cache";
import { MODULE_CONSTANTS } from "@/constants";
import { match } from "@/utils/functional/result";
import { getFirstArrayElement } from "@/di_infrastructure/types/runtime-safe-cast";
import { foundryJournalFacadeToken } from "@/foundry/foundrytokens";
import { cacheServiceToken, notificationCenterToken } from "@/tokens/tokenindex";
import { BOOLEAN_FLAG_SCHEMA } from "@/foundry/validation/setting-schemas";
import { sanitizeHtml } from "@/foundry/validation/schemas";

const buildJournalCacheKey = createCacheNamespace("journal-visibility");
const HIDDEN_JOURNAL_CACHE_KEY = buildJournalCacheKey("hidden-directory");
export const HIDDEN_JOURNAL_CACHE_TAG = "journal:hidden";

/**
 * Service for managing journal entry visibility based on module flags.
 * Handles business logic for hiding/showing journal entries in the UI.
 *
 * **Dependencies Reduced:**
 * - Before: 4 dependencies (FoundryGame, FoundryDocument, FoundryUI, Logger)
 * - After: 3 dependencies (FoundryJournalFacade, NotificationCenter, CacheService)
 * - Improvement: 25% reduction via Facade Pattern
 */
export class JournalVisibilityService {
  constructor(
    private readonly facade: FoundryJournalFacade,
    private readonly notificationCenter: NotificationCenter,
    private readonly cacheService: CacheService
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
    const cached = this.cacheService.get<FoundryJournalEntry[]>(HIDDEN_JOURNAL_CACHE_KEY);
    if (cached?.hit && cached.value) {
      this.notificationCenter.debug(
        `Serving ${cached.value.length} hidden journal entries from cache (ttl=${
          cached.metadata.expiresAt ?? "∞"
        })`,
        { context: { cached } },
        { channels: ["ConsoleChannel"] }
      );
      return { ok: true, value: cached.value };
    }

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
      } else {
        // Log flag read errors for diagnosis without interrupting processing
        const journalIdentifier = journal.name ?? journal.id;
        this.notificationCenter.warn(
          `Failed to read hidden flag for journal "${this.sanitizeForLog(journalIdentifier)}"`,
          {
            errorCode: flagResult.error.code,
            errorMessage: flagResult.error.message,
          },
          { channels: ["ConsoleChannel"] }
        );

        // Note: UI notifications would need to be added to FoundryJournalFacade
        // if needed, or accessed through a separate FoundryUI service injection

        // Continue processing other entries
      }
    }

    this.cacheService.set(HIDDEN_JOURNAL_CACHE_KEY, hidden.slice(), {
      tags: [HIDDEN_JOURNAL_CACHE_TAG],
    });

    return { ok: true, value: hidden };
  }

  /**
   * Processes journal directory HTML to hide flagged entries.
   * @returns Result indicating success or failure with aggregated errors
   */
  processJournalDirectory(htmlElement: HTMLElement): Result<void, FoundryError> {
    this.notificationCenter.debug(
      "Processing journal directory for hidden entries",
      { context: { htmlElement } },
      {
        channels: ["ConsoleChannel"],
      }
    );

    const hiddenResult = this.getHiddenJournalEntries();
    if (!hiddenResult.ok) {
      // Log error but return it for caller to handle
      this.notificationCenter.error("Error getting hidden journal entries", hiddenResult.error, {
        channels: ["ConsoleChannel"],
      });
      return hiddenResult;
    }

    const hidden = hiddenResult.value;
    this.notificationCenter.debug(
      `Found ${hidden.length} hidden journal entries`,
      { context: { hidden } },
      {
        channels: ["ConsoleChannel"],
      }
    );

    return this.hideEntries(hidden, htmlElement);
  }

  private hideEntries(
    entries: FoundryJournalEntry[],
    html: HTMLElement
  ): Result<void, FoundryError> {
    const errors: FoundryError[] = [];

    for (const journal of entries) {
      const journalName = journal.name ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME;
      const removeResult = this.facade.removeJournalElement(journal.id, journalName, html);
      match(removeResult, {
        onOk: () => {
          this.notificationCenter.debug(
            `Removing journal entry: ${this.sanitizeForLog(journalName)}`,
            { context: { journal } },
            { channels: ["ConsoleChannel"] }
          );
        },
        onErr: (error) => {
          errors.push(error);
          this.notificationCenter.warn("Error removing journal entry", error, {
            channels: ["ConsoleChannel"],
          });
        },
      });
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
    foundryJournalFacadeToken,
    notificationCenterToken,
    cacheServiceToken,
  ] as const;

  constructor(
    facade: FoundryJournalFacade,
    notificationCenter: NotificationCenter,
    cacheService: CacheService
  ) {
    super(facade, notificationCenter, cacheService);
  }
}
