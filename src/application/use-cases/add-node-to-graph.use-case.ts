/**
 * Use Case: Add a node to a graph.
 *
 * Adds a node (by page ID) to a graph's nodeKeys array.
 */

import type { Result } from "@/domain/types/result";
import type { UseCaseError } from "@/application/types/use-case-error.types";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import type { INodeDataService } from "@/application/services/NodeDataService";
import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { ok, err } from "@/domain/utils/result";
import { graphDataServiceToken } from "@/application/tokens/application.tokens";
import { nodeDataServiceToken } from "@/application/tokens/application.tokens";
import { platformRelationshipPageRepositoryPortToken } from "@/application/tokens/domain-ports.tokens";
import { notificationPublisherPortToken } from "@/application/tokens/domain-ports.tokens";

/**
 * Input data for adding a node to a graph.
 */
export interface AddNodeToGraphInput {
  /** Graph page ID */
  graphPageId: string;
  /** Node page ID (UUID) */
  nodePageId: string;
}

/**
 * Add Node To Graph Use Case.
 *
 * Adds a node to a graph's nodeKeys array.
 */
export class AddNodeToGraphUseCase {
  constructor(
    private readonly graphDataService: IGraphDataService,
    private readonly nodeDataService: INodeDataService,
    private readonly pageRepository: PlatformRelationshipPageRepositoryPort,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Adds a node to a graph.
   *
   * Steps:
   * 1. Load graph data (with migration if needed)
   * 2. Validate node page exists and is a node type
   * 3. Add nodeKey to nodeKeys array (if not already present)
   * 4. Save graph data
   */
  async execute(input: AddNodeToGraphInput): Promise<Result<void, UseCaseError>> {
    // Step 1: Load graph data (with migration if needed)
    const graphDataResult = await this.graphDataService.loadGraphData(input.graphPageId);
    if (!graphDataResult.ok) {
      return graphDataResult;
    }

    const graphData = graphDataResult.value;

    // Step 2: Validate node page exists and is a node type
    const nodeDataResult = await this.nodeDataService.loadNodeData(input.nodePageId);
    if (!nodeDataResult.ok) {
      return err({
        code: "NODE_NOT_FOUND",
        message: `Node page ${input.nodePageId} not found or invalid: ${nodeDataResult.error.message}`,
        details: nodeDataResult.error,
      });
    }

    const nodeKey = input.nodePageId; // nodeKey is the page UUID

    // Step 3: Add nodeKey to nodeKeys array (if not already present)
    if (graphData.nodeKeys.includes(nodeKey)) {
      // Node already in graph - return success (idempotent operation)
      return ok(undefined);
    }

    graphData.nodeKeys.push(nodeKey);

    // Step 4: Save graph data
    const saveResult = await this.graphDataService.saveGraphData(input.graphPageId, graphData);
    if (!saveResult.ok) {
      return saveResult;
    }

    return ok(undefined);
  }
}

/**
 * DI-enabled wrapper for AddNodeToGraphUseCase.
 */
export class DIAddNodeToGraphUseCase extends AddNodeToGraphUseCase {
  static dependencies = [
    graphDataServiceToken,
    nodeDataServiceToken,
    platformRelationshipPageRepositoryPortToken,
    notificationPublisherPortToken,
  ] as const;

  constructor(
    graphDataService: IGraphDataService,
    nodeDataService: INodeDataService,
    pageRepository: PlatformRelationshipPageRepositoryPort,
    notifications: NotificationPublisherPort
  ) {
    super(graphDataService, nodeDataService, pageRepository, notifications);
  }
}
