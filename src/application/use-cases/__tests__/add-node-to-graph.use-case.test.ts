/**
 * Tests for AddNodeToGraphUseCase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddNodeToGraphUseCase, DIAddNodeToGraphUseCase } from "../add-node-to-graph.use-case";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import type { INodeDataService } from "@/application/services/NodeDataService";
import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { ServiceError } from "@/application/types/use-case-error.types";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";
import { RELATIONSHIP_NODE_SCHEMA_VERSION } from "@/domain/types/relationship-node-data.interface";
import { ok, err } from "@/domain/utils/result";

function createMockGraphDataService(): IGraphDataService {
  return {
    loadGraphData: vi.fn(),
    saveGraphData: vi.fn(),
    validateGraphData: vi.fn(),
  } as unknown as IGraphDataService;
}

function createMockNodeDataService(): INodeDataService {
  return {
    loadNodeData: vi.fn(),
    saveNodeData: vi.fn(),
    validateNodeData: vi.fn(),
  } as unknown as INodeDataService;
}

function createMockRepository(): PlatformRelationshipPageRepositoryPort {
  return {
    getNodePageContent: vi.fn(),
    updateNodePageContent: vi.fn(),
    getGraphPageContent: vi.fn(),
    updateGraphPageContent: vi.fn(),
    setNodeMarker: vi.fn(),
    setGraphMarker: vi.fn(),
    getNodeMarker: vi.fn(),
    getGraphMarker: vi.fn(),
  } as unknown as PlatformRelationshipPageRepositoryPort;
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
    nodeKeys: ["node-1"],
    edges: [],
  };
}

function createValidNodeData(): RelationshipNodeData {
  return {
    schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
    nodeKey: "node-2",
    name: "Test Node",
    kind: "person",
    relation: "friend",
    descriptions: {},
    reveal: {
      public: true,
      hidden: false,
    },
  };
}

describe("AddNodeToGraphUseCase", () => {
  let useCase: AddNodeToGraphUseCase;
  let mockGraphDataService: IGraphDataService;
  let mockNodeDataService: INodeDataService;
  let mockRepository: PlatformRelationshipPageRepositoryPort;
  let mockNotifications: NotificationPublisherPort;

  beforeEach(() => {
    mockGraphDataService = createMockGraphDataService();
    mockNodeDataService = createMockNodeDataService();
    mockRepository = createMockRepository();
    mockNotifications = createMockNotifications();
    useCase = new AddNodeToGraphUseCase(
      mockGraphDataService,
      mockNodeDataService,
      mockRepository,
      mockNotifications
    );
  });

  describe("execute", () => {
    it("should add node to graph successfully", async () => {
      const graphPageId = "graph-page-123";
      const nodePageId = "node-2";
      const graphData = createValidGraphData();
      const nodeData = createValidNodeData();

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockNodeDataService.loadNodeData).mockResolvedValue(ok(nodeData));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(ok(undefined));

      const result = await useCase.execute({ graphPageId, nodePageId });

      expect(result.ok).toBe(true);
      expect(mockGraphDataService.saveGraphData).toHaveBeenCalledTimes(1);
      const saveCall = vi.mocked(mockGraphDataService.saveGraphData).mock.calls[0]!;
      expect(saveCall[0]).toBe(graphPageId);
      expect(saveCall[1].nodeKeys).toContain("node-1");
      expect(saveCall[1].nodeKeys).toContain("node-2");
      expect(saveCall[1].nodeKeys).toHaveLength(2);
    });

    it("should return success when node already in graph (idempotent)", async () => {
      const graphPageId = "graph-page-123";
      const nodePageId = "node-1";
      const graphData = createValidGraphData();
      const nodeData = createValidNodeData();

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockNodeDataService.loadNodeData).mockResolvedValue(ok(nodeData));

      const result = await useCase.execute({ graphPageId, nodePageId });

      expect(result.ok).toBe(true);
      expect(mockGraphDataService.saveGraphData).not.toHaveBeenCalled();
    });

    it("should return error when graph data cannot be loaded", async () => {
      const graphPageId = "graph-page-123";
      const nodePageId = "node-2";
      const loadError: ServiceError = {
        code: "REPOSITORY_ERROR",
        message: "Graph not found",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(err(loadError));

      const result = await useCase.execute({ graphPageId, nodePageId });

      expect(result.ok).toBe(false);
      expect(mockNodeDataService.loadNodeData).not.toHaveBeenCalled();
    });

    it("should return error when node data cannot be loaded", async () => {
      const graphPageId = "graph-page-123";
      const nodePageId = "node-2";
      const graphData = createValidGraphData();
      const nodeLoadError: ServiceError = {
        code: "REPOSITORY_ERROR",
        message: "Node not found",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockNodeDataService.loadNodeData).mockResolvedValue(err(nodeLoadError));

      const result = await useCase.execute({ graphPageId, nodePageId });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("NODE_NOT_FOUND");
      }
    });

    it("should return error when save fails", async () => {
      const graphPageId = "graph-page-123";
      const nodePageId = "node-2";
      const graphData = createValidGraphData();
      const nodeData = createValidNodeData();
      const saveError: ServiceError = {
        code: "OPERATION_FAILED",
        message: "Save failed",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockNodeDataService.loadNodeData).mockResolvedValue(ok(nodeData));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(err(saveError));

      const result = await useCase.execute({ graphPageId, nodePageId });

      expect(result.ok).toBe(false);
    });
  });

  describe("DIAddNodeToGraphUseCase", () => {
    it("should extend AddNodeToGraphUseCase with DI dependencies", () => {
      expect(DIAddNodeToGraphUseCase.dependencies).toEqual([
        expect.anything(), // graphDataServiceToken
        expect.anything(), // nodeDataServiceToken
        expect.anything(), // platformRelationshipPageRepositoryPortToken
        expect.anything(), // notificationPublisherPortToken
      ]);
      expect(DIAddNodeToGraphUseCase.dependencies).toHaveLength(4);
    });

    it("should create instance correctly", () => {
      const diUseCase = new DIAddNodeToGraphUseCase(
        mockGraphDataService,
        mockNodeDataService,
        mockRepository,
        mockNotifications
      );
      expect(diUseCase).toBeInstanceOf(AddNodeToGraphUseCase);
    });
  });
});
