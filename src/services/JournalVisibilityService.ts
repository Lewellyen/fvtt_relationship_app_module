import type { Result } from "@/types/result";
import type { JournalVisibilityPort } from "@/core/ports/journal-visibility-port.interface";
import type { JournalVisibilityError } from "@/core/domain/journal-entry";
import type { NotificationCenter } from "@/notifications/NotificationCenter";
import type { JournalEntry } from "@/core/domain/journal-entry";
import type { CacheService } from "@/interfaces/cache";
import { createCacheNamespace } from "@/interfaces/cache";
import { MODULE_CONSTANTS } from "@/constants";
import { match } from "@/utils/functional/result";
import { getFirstArrayElement } from "@/di_infrastructure/types/runtime-safe-cast";
import { journalVisibilityPortToken } from "@/tokens/tokenindex";
import { cacheServiceToken, notificationCenterToken } from "@/tokens/tokenindex";
import { sanitizeHtml } from "@/foundry/validation/schemas";

const buildJournalCacheKey = createCacheNamespace("journal-visibility");
const HIDDEN_JOURNAL_CACHE_KEY = buildJournalCacheKey("hidden-directory");
export const HIDDEN_JOURNAL_CACHE_TAG = "journal:hidden";

/**
 * Service for managing journal entry visibility based on module flags.
 * Handles business logic for hiding/showing journal entries in the UI.
 *
 * **Dependencies:**
 * - JournalVisibilityPort: Platform-agnostic port for journal operations
 * - NotificationCenter: For logging and notifications
 * - CacheService: For caching hidden entries
 *
 * **DIP-Compliance:**
 * - Depends on domain-neutral JournalVisibilityPort, not Foundry-specific types
 * - Platform-specific adapters (e.g., FoundryJournalVisibilityAdapter) implement the port
 */
export class JournalVisibilityService {
  constructor(
    private readonly port: JournalVisibilityPort,
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
  getHiddenJournalEntries(): Result<JournalEntry[], JournalVisibilityError> {
    const cached = this.cacheService.get<JournalEntry[]>(HIDDEN_JOURNAL_CACHE_KEY);
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

    const allEntriesResult = this.port.getAllEntries();
    if (!allEntriesResult.ok) return allEntriesResult;

    const hidden: JournalEntry[] = [];

    for (const journal of allEntriesResult.value) {
      const flagResult = this.port.getEntryFlag(journal, MODULE_CONSTANTS.FLAGS.HIDDEN);

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
  processJournalDirectory(htmlElement: HTMLElement): Result<void, JournalVisibilityError> {
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
    entries: JournalEntry[],
    html: HTMLElement
  ): Result<void, JournalVisibilityError> {
    const errors: JournalVisibilityError[] = [];

    for (const journal of entries) {
      const journalName = journal.name ?? MODULE_CONSTANTS.DEFAULTS.UNKNOWN_NAME;
      const removeResult = this.port.removeEntryFromDOM(journal.id, journalName, html);
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
    journalVisibilityPortToken,
    notificationCenterToken,
    cacheServiceToken,
  ] as const;

  constructor(
    port: JournalVisibilityPort,
    notificationCenter: NotificationCenter,
    cacheService: CacheService
  ) {
    super(port, notificationCenter, cacheService);
  }
}
