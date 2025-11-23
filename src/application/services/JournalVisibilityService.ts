import type { Result } from "@/domain/types/result";
import type { PlatformJournalVisibilityPort } from "@/domain/ports/platform-journal-visibility-port.interface";
import type { JournalVisibilityError } from "@/domain/entities/journal-entry";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import type { CacheService } from "@/infrastructure/cache/cache.interface";
import type { PlatformUIPort } from "@/domain/ports/platform-ui-port.interface";
import { createCacheNamespace } from "@/infrastructure/cache/cache.interface";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import { getFirstArrayElement } from "@/infrastructure/di/types/utilities/runtime-safe-cast";
import {
  journalVisibilityPortToken,
  cacheServiceToken,
  notificationCenterToken,
  platformUIPortToken,
} from "@/infrastructure/shared/tokens";
import { sanitizeHtml } from "@/infrastructure/adapters/foundry/validation/schemas";

const buildJournalCacheKey = createCacheNamespace("journal-visibility");
const HIDDEN_JOURNAL_CACHE_KEY = buildJournalCacheKey("hidden-directory");
export const HIDDEN_JOURNAL_CACHE_TAG = "journal:hidden";

/**
 * Service for managing journal entry visibility based on module flags.
 * Handles business logic for hiding/showing journal entries in the UI.
 *
 * **Dependencies:**
 * - PlatformJournalVisibilityPort: Platform-agnostic port for journal operations
 * - NotificationCenter: For logging and notifications
 * - CacheService: For caching hidden entries
 * - PlatformUIPort: Platform-agnostic port for UI operations
 *
 * **DIP-Compliance:**
 * - Depends on domain-neutral ports, not Foundry-specific types
 * - Platform-specific adapters implement the ports
 */
export class JournalVisibilityService {
  constructor(
    private readonly port: PlatformJournalVisibilityPort,
    private readonly notificationCenter: NotificationCenter,
    private readonly cacheService: CacheService,
    private readonly platformUI: PlatformUIPort
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
      const removeResult = this.platformUI.removeJournalElement(journal.id, journalName, html);

      // Map PlatformUIError to JournalVisibilityError
      if (!removeResult.ok) {
        const journalError: JournalVisibilityError = {
          code: "DOM_MANIPULATION_FAILED",
          entryId: journal.id,
          message: removeResult.error.message,
        };
        errors.push(journalError);
        this.notificationCenter.warn("Error removing journal entry", journalError, {
          channels: ["ConsoleChannel"],
        });
      } else {
        this.notificationCenter.debug(
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
    journalVisibilityPortToken,
    notificationCenterToken,
    cacheServiceToken,
    platformUIPortToken,
  ] as const;

  constructor(
    port: PlatformJournalVisibilityPort,
    notificationCenter: NotificationCenter,
    cacheService: CacheService,
    platformUI: PlatformUIPort
  ) {
    super(port, notificationCenter, cacheService, platformUI);
  }
}
