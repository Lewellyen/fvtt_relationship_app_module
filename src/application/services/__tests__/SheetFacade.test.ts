import { describe, it, expect, vi, beforeEach } from "vitest";
import { SheetFacade, DISheetFacade } from "@/application/services/SheetFacade";
import type { INodeDataService } from "@/application/services/NodeDataService";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import { ok, err } from "@/domain/utils/result";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";

describe("SheetFacade", () => {
  let nodeData: INodeDataService;
  let graphData: IGraphDataService;
  let facade: SheetFacade;

  const validNodeData: RelationshipNodeData = {
    schemaVersion: 1,
    nodeKey: "page1",
    name: "Node 1",
    kind: "person",
    relation: "neutral",
    descriptions: { public: "p", hidden: "h", gm: "g" },
    reveal: { public: true, hidden: false },
  };

  const validGraphData: RelationshipGraphData = {
    schemaVersion: 1,
    graphKey: "graph-1",
    nodeKeys: ["page1"],
    edges: [{ id: "e1", source: "page1", target: "page1", knowledge: "public", label: "x" }],
    layout: { zoom: 1, pan: { x: 0, y: 0 }, positions: { page1: { x: 1, y: 2 } } },
  };

  beforeEach(() => {
    nodeData = {
      loadNodeData: vi.fn(),
      saveNodeData: vi.fn(),
      validateNodeData: vi.fn(),
    } as unknown as INodeDataService;

    graphData = {
      loadGraphData: vi.fn(),
      saveGraphData: vi.fn(),
      validateGraphData: vi.fn(),
    } as unknown as IGraphDataService;

    facade = new SheetFacade(nodeData, graphData);
  });

  describe("loadNodeData", () => {
    it("should return ok with data when service succeeds", async () => {
      vi.mocked(nodeData.loadNodeData).mockResolvedValue(ok(validNodeData));

      const result = await facade.loadNodeData("page1");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(validNodeData);
      }
    });

    it("should map service error", async () => {
      vi.mocked(nodeData.loadNodeData).mockResolvedValue(
        err({ code: "SERVICE_ERROR", message: "nope", details: { x: 1 } })
      );

      const result = await facade.loadNodeData("page1");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SERVICE_ERROR");
        expect(result.error.message).toBe("nope");
        expect(result.error.details).toEqual({ x: 1 });
      }
    });
  });

  describe("saveNodeData", () => {
    it("should validate and call service with parsed node data", async () => {
      vi.mocked(nodeData.saveNodeData).mockResolvedValue(ok(undefined));

      const result = await facade.saveNodeData("page1", validNodeData);

      expect(result.ok).toBe(true);
      expect(vi.mocked(nodeData.saveNodeData)).toHaveBeenCalledWith("page1", validNodeData);
    });

    it("should return validation error when payload is invalid", async () => {
      const result = await facade.saveNodeData("page1", { schemaVersion: 1 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
      expect(vi.mocked(nodeData.saveNodeData)).not.toHaveBeenCalled();
    });

    it("should map service error", async () => {
      vi.mocked(nodeData.saveNodeData).mockResolvedValue(
        err({ code: "SERVICE_ERROR", message: "nope", details: { y: 2 } })
      );

      const result = await facade.saveNodeData("page1", validNodeData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SERVICE_ERROR");
        expect(result.error.message).toBe("nope");
        expect(result.error.details).toEqual({ y: 2 });
      }
    });
  });

  describe("validateNodeData", () => {
    it("should return ok for valid payload", () => {
      const result = facade.validateNodeData(validNodeData);
      expect(result.ok).toBe(true);
    });

    it("should return validation error for invalid payload", () => {
      const result = facade.validateNodeData({ schemaVersion: 1 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });
  });

  describe("loadGraphData", () => {
    it("should return ok with data when service succeeds", async () => {
      vi.mocked(graphData.loadGraphData).mockResolvedValue(ok(validGraphData));

      const result = await facade.loadGraphData("graph-1");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(validGraphData);
      }
    });

    it("should map service error", async () => {
      vi.mocked(graphData.loadGraphData).mockResolvedValue(
        err({ code: "SERVICE_ERROR", message: "nope", details: { x: 1 } })
      );

      const result = await facade.loadGraphData("graph-1");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SERVICE_ERROR");
        expect(result.error.message).toBe("nope");
        expect(result.error.details).toEqual({ x: 1 });
      }
    });
  });

  describe("saveGraphData", () => {
    it("should validate and call service with parsed graph data", async () => {
      vi.mocked(graphData.saveGraphData).mockResolvedValue(ok(undefined));

      const result = await facade.saveGraphData("graph-1", validGraphData);

      expect(result.ok).toBe(true);
      expect(vi.mocked(graphData.saveGraphData)).toHaveBeenCalledWith("graph-1", validGraphData);
    });

    it("should return validation error when payload is invalid", async () => {
      const result = await facade.saveGraphData("graph-1", { schemaVersion: 1 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
      expect(vi.mocked(graphData.saveGraphData)).not.toHaveBeenCalled();
    });

    it("should map service error", async () => {
      vi.mocked(graphData.saveGraphData).mockResolvedValue(
        err({ code: "SERVICE_ERROR", message: "nope", details: { y: 2 } })
      );

      const result = await facade.saveGraphData("graph-1", validGraphData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SERVICE_ERROR");
        expect(result.error.message).toBe("nope");
        expect(result.error.details).toEqual({ y: 2 });
      }
    });
  });

  describe("validateGraphData", () => {
    it("should return ok for valid payload", () => {
      const result = facade.validateGraphData(validGraphData);
      expect(result.ok).toBe(true);
    });

    it("should return validation error for invalid payload", () => {
      const result = facade.validateGraphData({ schemaVersion: 1 });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });
  });

  describe("DISheetFacade", () => {
    it("should construct and behave like SheetFacade", () => {
      const di = new DISheetFacade(nodeData, graphData);
      const result = di.validateNodeData(validNodeData);
      expect(result.ok).toBe(true);
    });
  });
});
