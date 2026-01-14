/**
 * Tests for UpsertEdgeUseCase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpsertEdgeUseCase, DIUpsertEdgeUseCase } from "../upsert-edge.use-case";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type {
  RelationshipGraphData,
  RelationshipEdge,
} from "@/domain/types/relationship-graph-data.interface";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";
import type { ServiceError } from "@/application/types/use-case-error.types";
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
    ],
  };
}

describe("UpsertEdgeUseCase", () => {
  let useCase: UpsertEdgeUseCase;
  let mockGraphDataService: IGraphDataService;
  let mockNotifications: NotificationPublisherPort;

  beforeEach(() => {
    mockGraphDataService = createMockGraphDataService();
    mockNotifications = createMockNotifications();
    useCase = new UpsertEdgeUseCase(mockGraphDataService, mockNotifications);
  });

  describe("execute", () => {
    it("should insert new edge when edge does not exist", async () => {
      const graphPageId = "graph-page-123";
      const graphData = createValidGraphData();
      const newEdge: RelationshipEdge = {
        id: "edge-2",
        source: "node-2",
        target: "node-1",
        knowledge: "hidden",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(ok(undefined));

      const result = await useCase.execute({ graphPageId, edge: newEdge });

      expect(result.ok).toBe(true);
      expect(mockGraphDataService.saveGraphData).toHaveBeenCalledTimes(1);
      const saveCall = vi.mocked(mockGraphDataService.saveGraphData).mock.calls[0]!;
      expect(saveCall[0]).toBe(graphPageId);
      expect(saveCall[1].edges).toHaveLength(2);
      expect(saveCall[1].edges).toContainEqual(newEdge);
    });

    it("should update existing edge when edge already exists", async () => {
      const graphPageId = "graph-page-123";
      const graphData = createValidGraphData();
      const updatedEdge: RelationshipEdge = {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        knowledge: "secret",
        label: "Updated label",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(ok(undefined));

      const result = await useCase.execute({ graphPageId, edge: updatedEdge });

      expect(result.ok).toBe(true);
      expect(mockGraphDataService.saveGraphData).toHaveBeenCalledTimes(1);
      const saveCall = vi.mocked(mockGraphDataService.saveGraphData).mock.calls[0]!;
      expect(saveCall[0]).toBe(graphPageId);
      expect(saveCall[1].edges).toHaveLength(1);
      expect(saveCall[1].edges[0]).toEqual(updatedEdge);
    });

    it("should return error when graph data cannot be loaded", async () => {
      const graphPageId = "graph-page-123";
      const edge: RelationshipEdge = {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        knowledge: "public",
      };
      const loadError: ServiceError = {
        code: "REPOSITORY_ERROR",
        message: "Graph not found",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(err(loadError));

      const result = await useCase.execute({ graphPageId, edge });

      expect(result.ok).toBe(false);
      expect(mockGraphDataService.saveGraphData).not.toHaveBeenCalled();
    });

    it("should return error when save fails", async () => {
      const graphPageId = "graph-page-123";
      const graphData = createValidGraphData();
      const edge: RelationshipEdge = {
        id: "edge-2",
        source: "node-2",
        target: "node-1",
        knowledge: "hidden",
      };
      const saveError: ServiceError = {
        code: "OPERATION_FAILED",
        message: "Save failed",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(err(saveError));

      const result = await useCase.execute({ graphPageId, edge });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Save failed");
      }
    });
  });

  describe("DIUpsertEdgeUseCase", () => {
    it("should extend UpsertEdgeUseCase with DI dependencies", () => {
      expect(DIUpsertEdgeUseCase.dependencies).toEqual([
        expect.anything(), // graphDataServiceToken
        expect.anything(), // notificationPublisherPortToken
      ]);
      expect(DIUpsertEdgeUseCase.dependencies).toHaveLength(2);
    });

    it("should create instance correctly", () => {
      const diUseCase = new DIUpsertEdgeUseCase(mockGraphDataService, mockNotifications);
      expect(diUseCase).toBeInstanceOf(UpsertEdgeUseCase);
    });
  });
});
