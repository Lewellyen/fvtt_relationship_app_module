/**
 * Use Case: Create a new relationship graph page.
 *
 * Creates a new JournalEntryPage with type "relationship_app_graph"
 * and initializes it with the provided graph data.
 */

import type { Result } from "@/domain/types/result";
import type { UseCaseError } from "@/application/types/use-case-error.types";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { PlatformPageCreationPort } from "@/domain/ports/repositories/platform-page-creation-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
// NOTE: Return type should be JournalEntryPage domain type when available
// For now using string (pageId) as placeholder
import { err, ok } from "@/domain/utils/result";
import { platformJournalRepositoryToken } from "@/application/tokens/domain-ports.tokens";
import { graphDataServiceToken } from "@/application/tokens/application.tokens";
import {
  platformRelationshipPageRepositoryPortToken,
  platformPageCreationPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";

/**
 * Input data for creating a graph page.
 */
export interface CreateGraphPageInput {
  /** Journal Entry ID where the page should be created */
  journalEntryId: string;
  /** Initial graph data */
  graphData: RelationshipGraphData;
}

/**
 * Create Graph Page Use Case.
 *
 * Creates a new relationship graph page in the specified journal entry.
 */
export class CreateGraphPageUseCase {
  constructor(
    private readonly journalRepository: PlatformJournalRepository,
    private readonly graphDataService: IGraphDataService,
    private readonly pageRepository: PlatformRelationshipPageRepositoryPort,
    private readonly pageCreationPort: PlatformPageCreationPort,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Creates a new graph page.
   *
   * Steps:
   * 1. Validate journal entry exists
   * 2. Validate graph data
   * 3. Create page (via Foundry API - requires infrastructure access)
   * 4. Save graph data to page (lastVersion initial empty)
   * 5. Set marker flag
   * 6. Return created page
   */
  async execute(input: CreateGraphPageInput): Promise<Result<string, UseCaseError>> {
    // Step 1: Validate journal entry exists
    const journalResult = await this.journalRepository.getById(input.journalEntryId);
    if (!journalResult.ok) {
      return err({
        code: "JOURNAL_NOT_FOUND",
        message: `Journal entry ${input.journalEntryId} not found: ${journalResult.error.message}`,
        details: journalResult.error,
      });
    }

    // Step 2: Validate graph data
    const validationResult = this.graphDataService.validateGraphData(input.graphData);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Step 3: Create page
    const pageCreationResult = await this.pageCreationPort.createGraphPage(
      input.journalEntryId,
      input.graphData
    );
    if (!pageCreationResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to create graph page: ${pageCreationResult.error.message}`,
        details: pageCreationResult.error,
      });
    }

    const pageId = pageCreationResult.value;

    // Step 4: Save graph data to page (lastVersion initial empty)
    const saveResult = await this.graphDataService.saveGraphData(pageId, input.graphData);
    if (!saveResult.ok) {
      this.notifications.error(`Failed to save graph data to page ${pageId}`, saveResult.error, {
        channels: ["ConsoleChannel"],
      });
      return saveResult;
    }

    // Step 5: Set marker flag
    const flagResult = await this.pageRepository.setGraphMarker(pageId, true);
    if (!flagResult.ok) {
      this.notifications.warn(
        `Failed to set graph marker flag for page ${pageId}`,
        flagResult.error,
        { channels: ["ConsoleChannel"] }
      );
      // Non-critical error - continue
    }

    // Step 6: Return created page ID
    // TODO: Return full page object when domain type is available
    return ok(pageId);
  }
}

/**
 * DI-enabled wrapper for CreateGraphPageUseCase.
 */
export class DICreateGraphPageUseCase extends CreateGraphPageUseCase {
  static dependencies = [
    platformJournalRepositoryToken,
    graphDataServiceToken,
    platformRelationshipPageRepositoryPortToken,
    platformPageCreationPortToken,
    notificationPublisherPortToken,
  ] as const;

  constructor(
    journalRepository: PlatformJournalRepository,
    graphDataService: IGraphDataService,
    pageRepository: PlatformRelationshipPageRepositoryPort,
    pageCreationPort: PlatformPageCreationPort,
    notifications: NotificationPublisherPort
  ) {
    super(journalRepository, graphDataService, pageRepository, pageCreationPort, notifications);
  }
}
