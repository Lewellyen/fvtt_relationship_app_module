/**
 * Use Case: Upsert (insert or update) an edge in a graph.
 *
 * Adds a new edge or updates an existing edge in a graph's edges array.
 */

import type { Result } from "@/domain/types/result";
import type { UseCaseError } from "@/application/types/use-case-error.types";
import type { RelationshipEdge } from "@/domain/types/relationship-graph-data.interface";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { ok } from "@/domain/utils/result";
import { graphDataServiceToken } from "@/application/tokens/application.tokens";
import { notificationPublisherPortToken } from "@/application/tokens/domain-ports.tokens";

/**
 * Input data for upserting an edge.
 */
export interface UpsertEdgeInput {
  /** Graph page ID */
  graphPageId: string;
  /** Edge data */
  edge: RelationshipEdge;
}

/**
 * Upsert Edge Use Case.
 *
 * Adds or updates an edge in a graph's edges array.
 */
export class UpsertEdgeUseCase {
  constructor(
    private readonly graphDataService: IGraphDataService,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Upserts an edge in a graph.
   *
   * Steps:
   * 1. Load graph data (with migration if needed)
   * 2. Find existing edge by ID, update or insert
   * 3. Save graph data
   */
  async execute(input: UpsertEdgeInput): Promise<Result<void, UseCaseError>> {
    // Step 1: Load graph data (with migration if needed)
    const graphDataResult = await this.graphDataService.loadGraphData(input.graphPageId);
    if (!graphDataResult.ok) {
      return graphDataResult;
    }

    const graphData = graphDataResult.value;

    // Step 2: Find existing edge by ID, update or insert
    const existingEdgeIndex = graphData.edges.findIndex((edge) => edge.id === input.edge.id);
    if (existingEdgeIndex !== -1) {
      // Update existing edge
      graphData.edges[existingEdgeIndex] = input.edge;
    } else {
      // Insert new edge
      graphData.edges.push(input.edge);
    }

    // Step 3: Save graph data
    const saveResult = await this.graphDataService.saveGraphData(input.graphPageId, graphData);
    if (!saveResult.ok) {
      return saveResult;
    }

    return ok(undefined);
  }
}

/**
 * DI-enabled wrapper for UpsertEdgeUseCase.
 */
export class DIUpsertEdgeUseCase extends UpsertEdgeUseCase {
  static dependencies = [graphDataServiceToken, notificationPublisherPortToken] as const;

  constructor(graphDataService: IGraphDataService, notifications: NotificationPublisherPort) {
    super(graphDataService, notifications);
  }
}
