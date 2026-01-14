/**
 * Use Case: Remove an edge from a graph.
 *
 * Removes an edge from a graph's edges array by edge ID.
 */

import type { Result } from "@/domain/types/result";
import type { UseCaseError } from "@/application/types/use-case-error.types";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { ok } from "@/domain/utils/result";
import { graphDataServiceToken } from "@/application/tokens/application.tokens";
import { notificationPublisherPortToken } from "@/application/tokens/domain-ports.tokens";

/**
 * Input data for removing an edge.
 */
export interface RemoveEdgeInput {
  /** Graph page ID */
  graphPageId: string;
  /** Edge ID */
  edgeId: string;
}

/**
 * Remove Edge Use Case.
 *
 * Removes an edge from a graph's edges array.
 */
export class RemoveEdgeUseCase {
  constructor(
    private readonly graphDataService: IGraphDataService,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Removes an edge from a graph.
   *
   * Steps:
   * 1. Load graph data (with migration if needed)
   * 2. Remove edge from edges array
   * 3. Save graph data
   */
  async execute(input: RemoveEdgeInput): Promise<Result<void, UseCaseError>> {
    // Step 1: Load graph data (with migration if needed)
    const graphDataResult = await this.graphDataService.loadGraphData(input.graphPageId);
    if (!graphDataResult.ok) {
      return graphDataResult;
    }

    const graphData = graphDataResult.value;

    // Step 2: Remove edge from edges array
    const edgeIndex = graphData.edges.findIndex((edge) => edge.id === input.edgeId);
    if (edgeIndex === -1) {
      // Edge not found - return success (idempotent operation)
      return ok(undefined);
    }

    graphData.edges.splice(edgeIndex, 1);

    // Step 3: Save graph data
    const saveResult = await this.graphDataService.saveGraphData(input.graphPageId, graphData);
    if (!saveResult.ok) {
      return saveResult;
    }

    return ok(undefined);
  }
}

/**
 * DI-enabled wrapper for RemoveEdgeUseCase.
 */
export class DIRemoveEdgeUseCase extends RemoveEdgeUseCase {
  static dependencies = [graphDataServiceToken, notificationPublisherPortToken] as const;

  constructor(graphDataService: IGraphDataService, notifications: NotificationPublisherPort) {
    super(graphDataService, notifications);
  }
}
