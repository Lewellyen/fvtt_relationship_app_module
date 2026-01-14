/**
 * Tests for RemoveNodeFromGraphUseCase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  RemoveNodeFromGraphUseCase,
  DIRemoveNodeFromGraphUseCase,
} from "../remove-node-from-graph.use-case";
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
    nodeKeys: ["node-1", "node-2", "node-3"],
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
        target: "node-3",
        knowledge: "hidden",
      },
      {
        id: "edge-3",
        source: "node-3",
        target: "node-1",
        knowledge: "secret",
      },
    ],
  };
}

describe("RemoveNodeFromGraphUseCase", () => {
  let useCase: RemoveNodeFromGraphUseCase;
  let mockGraphDataService: IGraphDataService;
  let mockNotifications: NotificationPublisherPort;

  beforeEach(() => {
    mockGraphDataService = createMockGraphDataService();
    mockNotifications = createMockNotifications();
    useCase = new RemoveNodeFromGraphUseCase(mockGraphDataService, mockNotifications);
  });

  describe("execute", () => {
    it("should remove node and related edges successfully", async () => {
      const graphPageId = "graph-page-123";
      const nodePageId = "node-2";
      const graphData = createValidGraphData();

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(ok(undefined));

      const result = await useCase.execute({ graphPageId, nodePageId });

      expect(result.ok).toBe(true);
      expect(mockGraphDataService.saveGraphData).toHaveBeenCalledTimes(1);
      const saveCall = vi.mocked(mockGraphDataService.saveGraphData).mock.calls[0];
      expect(saveCall).toBeDefined();
      if (!saveCall) return;
      expect(saveCall[0]).toBe(graphPageId);
      expect(saveCall[1].nodeKeys).not.toContain("node-2");
      expect(saveCall[1].nodeKeys).toContain("node-1");
      expect(saveCall[1].nodeKeys).toContain("node-3");
      // All edges involving node-2 should be removed
      expect(
        saveCall[1].edges.every((edge) => edge.source !== "node-2" && edge.target !== "node-2")
      ).toBe(true);
      expect(saveCall[1].edges).toHaveLength(1); // Only edge-3 remains
    });

    it("should return success when node not found (idempotent)", async () => {
      const graphPageId = "graph-page-123";
      const nodePageId = "non-existent-node";
      const graphData = createValidGraphData();

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));

      const result = await useCase.execute({ graphPageId, nodePageId });

      expect(result.ok).toBe(true);
      expect(mockGraphDataService.saveGraphData).not.toHaveBeenCalled();
    });

    it("should return error when graph data cannot be loaded", async () => {
      const graphPageId = "graph-page-123";
      const nodePageId = "node-1";
      const loadError: ServiceError = {
        code: "REPOSITORY_ERROR",
        message: "Graph not found",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(err(loadError));

      const result = await useCase.execute({ graphPageId, nodePageId });

      expect(result.ok).toBe(false);
      expect(mockGraphDataService.saveGraphData).not.toHaveBeenCalled();
    });

    it("should return error when save fails", async () => {
      const graphPageId = "graph-page-123";
      const nodePageId = "node-1";
      const graphData = createValidGraphData();
      const saveError: ServiceError = {
        code: "OPERATION_FAILED",
        message: "Save failed",
      };

      vi.mocked(mockGraphDataService.loadGraphData).mockResolvedValue(ok(graphData));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(err(saveError));

      const result = await useCase.execute({ graphPageId, nodePageId });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Save failed");
      }
    });
  });

  describe("DIRemoveNodeFromGraphUseCase", () => {
    it("should extend RemoveNodeFromGraphUseCase with DI dependencies", () => {
      expect(DIRemoveNodeFromGraphUseCase.dependencies).toEqual([
        expect.anything(), // graphDataServiceToken
        expect.anything(), // notificationPublisherPortToken
      ]);
      expect(DIRemoveNodeFromGraphUseCase.dependencies).toHaveLength(2);
    });

    it("should create instance correctly", () => {
      const diUseCase = new DIRemoveNodeFromGraphUseCase(mockGraphDataService, mockNotifications);
      expect(diUseCase).toBeInstanceOf(RemoveNodeFromGraphUseCase);
    });
  });
});
