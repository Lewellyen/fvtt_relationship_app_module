/**
 * Use Case: Remove a node from a graph.
 *
 * Removes a node (by page ID) from a graph's nodeKeys array
 * and removes all edges involving this node.
 */

import type { Result } from "@/domain/types/result";
import type { UseCaseError } from "@/application/types/use-case-error.types";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { ok } from "@/domain/utils/result";
import { graphDataServiceToken } from "@/application/tokens/application.tokens";
import { notificationPublisherPortToken } from "@/application/tokens/domain-ports.tokens";

/**
 * Input data for removing a node from a graph.
 */
export interface RemoveNodeFromGraphInput {
  /** Graph page ID */
  graphPageId: string;
  /** Node page ID (UUID) */
  nodePageId: string;
}

/**
 * Remove Node From Graph Use Case.
 *
 * Removes a node from a graph's nodeKeys array and cleans up edges.
 */
export class RemoveNodeFromGraphUseCase {
  constructor(
    private readonly graphDataService: IGraphDataService,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Removes a node from a graph.
   *
   * Steps:
   * 1. Load graph data (with migration if needed)
   * 2. Remove nodeKey from nodeKeys array
   * 3. Remove all edges involving this nodeKey (cleanup)
   * 4. Save graph data
   */
  async execute(input: RemoveNodeFromGraphInput): Promise<Result<void, UseCaseError>> {
    // Step 1: Load graph data (with migration if needed)
    const graphDataResult = await this.graphDataService.loadGraphData(input.graphPageId);
    if (!graphDataResult.ok) {
      return graphDataResult;
    }

    const graphData = graphDataResult.value;
    const nodeKey = input.nodePageId; // nodeKey is the page UUID

    // Step 2: Remove nodeKey from nodeKeys array
    const nodeKeyIndex = graphData.nodeKeys.indexOf(nodeKey);
    if (nodeKeyIndex === -1) {
      // Node not in graph - return success (idempotent operation)
      return ok(undefined);
    }

    graphData.nodeKeys.splice(nodeKeyIndex, 1);

    // Step 3: Remove all edges involving this nodeKey (cleanup)
    graphData.edges = graphData.edges.filter(
      (edge) => edge.source !== nodeKey && edge.target !== nodeKey
    );

    // Step 4: Save graph data
    const saveResult = await this.graphDataService.saveGraphData(input.graphPageId, graphData);
    if (!saveResult.ok) {
      return saveResult;
    }

    return ok(undefined);
  }
}

/**
 * DI-enabled wrapper for RemoveNodeFromGraphUseCase.
 */
export class DIRemoveNodeFromGraphUseCase extends RemoveNodeFromGraphUseCase {
  static dependencies = [graphDataServiceToken, notificationPublisherPortToken] as const;

  constructor(graphDataService: IGraphDataService, notifications: NotificationPublisherPort) {
    super(graphDataService, notifications);
  }
}
