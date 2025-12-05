import type { Result } from "@/domain/types/result";
import type { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";
import type { JournalRepository } from "@/domain/ports/repositories/journal-repository.interface";
import type { JournalVisibilityError } from "@/domain/entities/journal-entry";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import type { PlatformCachePort } from "@/domain/ports/platform-cache-port.interface";
import type { JournalVisibilityConfig } from "./JournalVisibilityConfig";
import { journalVisibilityConfigToken } from "@/application/tokens/application.tokens";
import {
  journalCollectionPortToken,
  journalRepositoryToken,
  platformCachePortToken,
  platformNotificationPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { sanitizeHtml } from "@/application/utils/sanitize-utils";

export const HIDDEN_JOURNAL_CACHE_TAG = "journal:hidden";

/**
 * Service for managing journal entry visibility based on module flags.
 * Handles business logic for hiding/showing journal entries.
 *
 * **Responsibilities:**
 * - Business logic for journal visibility (flag checking, caching)
 * - Does NOT handle DOM manipulation (delegated to JournalDirectoryProcessor)
 *
 * **Dependencies:**
 * - JournalCollectionPort: Platform-agnostic port for journal collection queries
 * - JournalRepository: Platform-agnostic port for journal CRUD and flag operations
 * - PlatformNotificationPort: Platform-agnostic port for logging and notifications
 * - PlatformCachePort: Platform-agnostic port for caching hidden entries
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
    private readonly config: JournalVisibilityConfig
  ) {}

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
          `Failed to read hidden flag for journal "${sanitizeHtml(journalIdentifier)}"`,
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
}

export class DIJournalVisibilityService extends JournalVisibilityService {
  static dependencies = [
    journalCollectionPortToken,
    journalRepositoryToken,
    platformNotificationPortToken,
    platformCachePortToken,
    journalVisibilityConfigToken,
  ] as const;

  constructor(
    journalCollection: JournalCollectionPort,
    journalRepository: JournalRepository,
    notifications: PlatformNotificationPort,
    cache: PlatformCachePort,
    config: JournalVisibilityConfig
  ) {
    super(journalCollection, journalRepository, notifications, cache, config);
  }
}
