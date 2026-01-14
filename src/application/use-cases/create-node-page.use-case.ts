/**
 * Use Case: Create a new relationship node page.
 *
 * Creates a new JournalEntryPage with type "relationship_app_node"
 * and initializes it with the provided node data.
 */

import type { Result } from "@/domain/types/result";
import type { UseCaseError } from "@/application/types/use-case-error.types";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { INodeDataService } from "@/application/services/NodeDataService";
import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { PlatformPageCreationPort } from "@/domain/ports/repositories/platform-page-creation-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
// NOTE: Return type should be JournalEntryPage domain type when available
// For now using string (pageId) as placeholder
import { err, ok } from "@/domain/utils/result";
import { platformJournalRepositoryToken } from "@/application/tokens/domain-ports.tokens";
import { nodeDataServiceToken } from "@/application/tokens/application.tokens";
import {
  platformRelationshipPageRepositoryPortToken,
  platformPageCreationPortToken,
  notificationPublisherPortToken,
} from "@/application/tokens/domain-ports.tokens";

/**
 * Input data for creating a node page.
 */
export interface CreateNodePageInput {
  /** Journal Entry ID where the page should be created */
  journalEntryId: string;
  /** Initial node data */
  nodeData: RelationshipNodeData;
}

/**
 * Create Node Page Use Case.
 *
 * Creates a new relationship node page in the specified journal entry.
 */
export class CreateNodePageUseCase {
  constructor(
    private readonly journalRepository: PlatformJournalRepository,
    private readonly nodeDataService: INodeDataService,
    private readonly pageRepository: PlatformRelationshipPageRepositoryPort,
    private readonly pageCreationPort: PlatformPageCreationPort,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Creates a new node page.
   *
   * Steps:
   * 1. Validate journal entry exists
   * 2. Validate node data
   * 3. Create page (via Foundry API - requires infrastructure access)
   * 4. Save node data to page
   * 5. Set marker flag
   * 6. Return created page
   */
  async execute(input: CreateNodePageInput): Promise<Result<string, UseCaseError>> {
    // Step 1: Validate journal entry exists
    const journalResult = await this.journalRepository.getById(input.journalEntryId);
    if (!journalResult.ok) {
      return err({
        code: "JOURNAL_NOT_FOUND",
        message: `Journal entry ${input.journalEntryId} not found: ${journalResult.error.message}`,
        details: journalResult.error,
      });
    }

    // Step 2: Validate node data
    const validationResult = this.nodeDataService.validateNodeData(input.nodeData);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Step 3: Create page
    const pageCreationResult = await this.pageCreationPort.createNodePage(
      input.journalEntryId,
      input.nodeData
    );
    if (!pageCreationResult.ok) {
      return err({
        code: "OPERATION_FAILED",
        message: `Failed to create node page: ${pageCreationResult.error.message}`,
        details: pageCreationResult.error,
      });
    }

    const pageId = pageCreationResult.value;

    // Step 4: Save node data to page
    const saveResult = await this.nodeDataService.saveNodeData(pageId, input.nodeData);
    if (!saveResult.ok) {
      this.notifications.error(`Failed to save node data to page ${pageId}`, saveResult.error, {
        channels: ["ConsoleChannel"],
      });
      return saveResult;
    }

    // Step 5: Set marker flag
    const flagResult = await this.pageRepository.setNodeMarker(pageId, true);
    if (!flagResult.ok) {
      this.notifications.warn(
        `Failed to set node marker flag for page ${pageId}`,
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
 * DI-enabled wrapper for CreateNodePageUseCase.
 */
export class DICreateNodePageUseCase extends CreateNodePageUseCase {
  static dependencies = [
    platformJournalRepositoryToken,
    nodeDataServiceToken,
    platformRelationshipPageRepositoryPortToken,
    platformPageCreationPortToken,
    notificationPublisherPortToken,
  ] as const;

  constructor(
    journalRepository: PlatformJournalRepository,
    nodeDataService: INodeDataService,
    pageRepository: PlatformRelationshipPageRepositoryPort,
    pageCreationPort: PlatformPageCreationPort,
    notifications: NotificationPublisherPort
  ) {
    super(journalRepository, nodeDataService, pageRepository, pageCreationPort, notifications);
  }
}
