import type { Result } from "@/domain/types/result";
import type { PlatformJournalCollectionPort } from "@/domain/ports/collections/platform-journal-collection-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { PlatformJournalPermissionPort } from "@/domain/ports/repositories/platform-journal-permission-port.interface";
import type { JournalVisibilityService } from "./JournalVisibilityService";
import {
  platformJournalCollectionPortToken,
  platformJournalPermissionPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { journalVisibilityServiceToken } from "@/application/tokens/application.tokens";

/**
 * Journal with visibility status for overview display.
 */
export interface JournalWithVisibility {
  readonly id: string;
  readonly name: string | null;
  readonly isHidden: boolean;
}

/**
 * Service for retrieving all journals with their visibility status.
 *
 * Combines data from PlatformJournalCollectionPort and JournalVisibilityService
 * to provide a complete overview of all journals with their visibility status.
 *
 * **Responsibilities:**
 * - Fetch all journals from collection
 * - Determine visibility status for each journal
 * - Combine data into unified structure
 *
 * **Dependencies:**
 * - PlatformJournalCollectionPort: Platform-agnostic port for journal collection queries
 * - JournalVisibilityService: Service for determining hidden journals
 * - NotificationPublisherPort: Platform-agnostic port for logging and notifications
 *
 * **DIP-Compliance:**
 * - Depends on domain-neutral ports, not Foundry-specific types
 * - Platform-specific adapters implement the ports
 */
export class JournalOverviewService {
  constructor(
    private readonly journalCollection: PlatformJournalCollectionPort,
    private readonly journalVisibility: JournalVisibilityService,
    private readonly journalPermission: PlatformJournalPermissionPort,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Gets all journals with their visibility status.
   *
   * @returns Result with array of journals and their visibility status, or error
   */
  getAllJournalsWithVisibilityStatus(): Result<JournalWithVisibility[], Error> {
    // 1. Get all journals
    const allJournalsResult = this.journalCollection.getAll();
    if (!allJournalsResult.ok) {
      return {
        ok: false,
        error: new Error(`Failed to get all journals: ${allJournalsResult.error.message}`),
      };
    }

    let allJournals = allJournalsResult.value;

    // 2. Filter journals by permission (only show journals user can view)
    const accessibleJournals: typeof allJournals = [];
    for (const journal of allJournals) {
      const permissionResult = this.journalPermission.canUserViewJournal(journal.id);
      if (!permissionResult.ok) {
        // Fail-open: If permission check fails, show journal (safety)
        this.notifications.warn(
          `Failed to check permission for journal "${journal.name ?? journal.id}", showing it anyway`,
          {
            errorCode: permissionResult.error.code,
            errorMessage: permissionResult.error.message,
            journalId: journal.id,
          },
          { channels: ["ConsoleChannel"] }
        );
        accessibleJournals.push(journal);
      } else if (permissionResult.value) {
        // User has permission to view this journal
        accessibleJournals.push(journal);
      }
      // If permissionResult.value is false, skip this journal (no permission)
    }

    allJournals = accessibleJournals;

    // 3. Get hidden journals
    const hiddenJournalsResult = this.journalVisibility.getHiddenJournalEntries();
    if (!hiddenJournalsResult.ok) {
      this.notifications.warn(
        "Failed to get hidden journals, showing all as visible",
        {
          errorCode: hiddenJournalsResult.error.code,
          errorMessage: hiddenJournalsResult.error.message,
        },
        { channels: ["ConsoleChannel"] }
      );
      // Continue with empty hidden list - all journals will be shown as visible
    }

    const hiddenJournals = hiddenJournalsResult.ok ? hiddenJournalsResult.value : [];
    const hiddenJournalIds = new Set(hiddenJournals.map((j) => j.id));

    // 4. Combine data
    const journalsWithVisibility: JournalWithVisibility[] = allJournals.map((journal) => ({
      id: journal.id,
      name: journal.name,
      isHidden: hiddenJournalIds.has(journal.id),
    }));

    this.notifications.debug(
      `Retrieved ${journalsWithVisibility.length} journals with visibility status`,
      {
        total: journalsWithVisibility.length,
        hidden: hiddenJournalIds.size,
        visible: journalsWithVisibility.length - hiddenJournalIds.size,
      },
      { channels: ["ConsoleChannel"] }
    );

    return {
      ok: true,
      value: journalsWithVisibility,
    };
  }
}

/**
 * DI-enabled wrapper for JournalOverviewService.
 */
export class DIJournalOverviewService extends JournalOverviewService {
  static dependencies = [
    platformJournalCollectionPortToken,
    journalVisibilityServiceToken,
    platformJournalPermissionPortToken,
    notificationPublisherPortToken,
  ] as const;

  constructor(
    journalCollection: PlatformJournalCollectionPort,
    journalVisibility: JournalVisibilityService,
    journalPermission: PlatformJournalPermissionPort,
    notifications: NotificationPublisherPort
  ) {
    super(journalCollection, journalVisibility, journalPermission, notifications);
  }
}
