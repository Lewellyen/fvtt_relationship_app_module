/**
 * Tests for RemoveEdgeUseCase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { RemoveEdgeUseCase, DIRemoveEdgeUseCase } from "../remove-edge.use-case";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import type { ServiceError } from "@/application/types/use-case-error.types";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";
import { ok, err } from "@/domain/utils/result";

function createMockGraphDataService(): IGraphDataService {
  return {
    loadGraphData: vi.fn(),
    saveGraphData: vi.fn(),
    validateGraphData: vi.fn(),
  } as unknown as IGraphDataService;
}

function createMockNotifications(): NotificationPublisherPort {
  return {
    debug: vi.fn().mockReturnValue(ok(undefined)),
    info: vi.fn().mockReturnValue(ok(undefined)),
    warn: vi.fn().mockReturnValue(ok(undefined)),
    error: vi.fn().mockReturnValue(ok(undefined)),
  } as unknown as NotificationPublisherPort;
}

function createValidGraphData(): RelationshipGraphData {
  return {
    schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
    graphKey: "JournalEntry.page-xyz789",
    nodeKeys: ["node-1", "node-2"],
    edges: [
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        knowledge: "public",
      },
      {
        id: "edge-2",
        source: "node-2",
        target: "node-1",
        knowledge: "hidden",
      },
    ],
  };
}

describe("RemoveEdgeUseCase", () => {
  let useCase: RemoveEdgeUseCase;
  let mockGraphDataService: IGraphDataService;
  let mockNotifications: NotificationPublisherPort;

  beforeEach(() => {
    mockGraphDataService = createMockGraphDataService();
    mockNotifications = createMockNotifications();
    useCase = new RemoveEdgeUseCase(mockGraphDataService, mockNotifications);
  });

  describe("execute", () => {
    it("should remove edge successfully", async () => {
      const graphPageId = "graph-page-123";
      const edgeId = "edge-1";
      const graphData = createValidGraphData();

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(ok(undefined));

      const result = await useCase.execute({ graphPageId, edgeId });

      expect(result.ok).toBe(true);
      expect(mockGraphDataService.loadGraphData).toHaveBeenCalledWith(graphPageId);
      expect(mockGraphDataService.saveGraphData).toHaveBeenCalledTimes(1);
      const saveCall = vi.mocked(mockGraphDataService.saveGraphData).mock.calls[0]!;
      expect(saveCall[0]).toBe(graphPageId);
      expect(saveCall[1]!.edges).toHaveLength(1);
      expect(saveCall[1]!.edges[0]!.id).toBe("edge-2");
    });

    it("should return success when edge not found (idempotent)", async () => {
      const graphPageId = "graph-page-123";
      const edgeId = "non-existent-edge";
      const graphData = createValidGraphData();

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));

      const result = await useCase.execute({ graphPageId, edgeId });

      expect(result.ok).toBe(true);
      expect(mockGraphDataService.saveGraphData).not.toHaveBeenCalled();
    });

    it("should return error when graph data cannot be loaded", async () => {
      const graphPageId = "graph-page-123";
      const edgeId = "edge-1";
      const loadError: ServiceError = {
        code: "REPOSITORY_ERROR",
        message: "Graph not found",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(err(loadError));

      const result = await useCase.execute({ graphPageId, edgeId });

      expect(result.ok).toBe(false);
      expect(mockGraphDataService.saveGraphData).not.toHaveBeenCalled();
    });

    it("should return error when save fails", async () => {
      const graphPageId = "graph-page-123";
      const edgeId = "edge-1";
      const graphData = createValidGraphData();
      const saveError: ServiceError = {
        code: "OPERATION_FAILED",
        message: "Save failed",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(err(saveError));

      const result = await useCase.execute({ graphPageId, edgeId });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Save failed");
      }
    });
  });

  describe("DIRemoveEdgeUseCase", () => {
    it("should extend RemoveEdgeUseCase with DI dependencies", () => {
      expect(DIRemoveEdgeUseCase.dependencies).toEqual([
        expect.anything(), // graphDataServiceToken
        expect.anything(), // notificationPublisherPortToken
      ]);
      expect(DIRemoveEdgeUseCase.dependencies).toHaveLength(2);
    });

    it("should create instance correctly", () => {
      const diUseCase = new DIRemoveEdgeUseCase(mockGraphDataService, mockNotifications);
      expect(diUseCase).toBeInstanceOf(RemoveEdgeUseCase);
    });
  });
});
