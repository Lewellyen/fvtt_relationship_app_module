/**
 * Tests for FoundryPageCreationAdapter
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FoundryPageCreationAdapter,
  DIFoundryPageCreationAdapter,
} from "../foundry-page-creation-adapter";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import { ok, err } from "@/domain/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import { RELATIONSHIP_NODE_SCHEMA_VERSION } from "@/domain/types/relationship-node-data.interface";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";

describe("FoundryPageCreationAdapter", () => {
  let mockFoundryGame: FoundryGame;
  let adapter: FoundryPageCreationAdapter;

  function createValidNodeData(): RelationshipNodeData {
    return {
      schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
      nodeKey: "JournalEntry.page-abc123",
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

  function createValidGraphData(): RelationshipGraphData {
    return {
      schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
      graphKey: "JournalEntry.page-xyz789",
      nodeKeys: [],
      edges: [],
    };
  }

  beforeEach(() => {
    mockFoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };

    adapter = new FoundryPageCreationAdapter(mockFoundryGame);
  });

  describe("createNodePage", () => {
    it("should create node page successfully with uuid", async () => {
      const journalEntryId = "journal-1";
      const nodeData = createValidNodeData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([{ uuid: "page-uuid-123" }]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createNodePage(journalEntryId, nodeData);

      expectResultOk(result);
      expect(result.value).toBe("page-uuid-123");
      expect(mockJournalEntry.createEmbeddedDocuments).toHaveBeenCalledWith(
        "JournalEntryPage",
        expect.arrayContaining([
          expect.objectContaining({
            name: nodeData.name,
            system: nodeData,
          }),
        ])
      );
    });

    it("should create node page successfully with id fallback", async () => {
      const journalEntryId = "journal-1";
      const nodeData = createValidNodeData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([{ id: "page-id-456" }]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createNodePage(journalEntryId, nodeData);

      expectResultOk(result);
      expect(result.value).toBe("page-id-456");
    });

    it("should create node page successfully with _id fallback", async () => {
      const journalEntryId = "journal-1";
      const nodeData = createValidNodeData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([{ _id: "page-_id-789" }]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createNodePage(journalEntryId, nodeData);

      expectResultOk(result);
      expect(result.value).toBe("page-_id-789");
    });

    it("should return error when journal entry not found (error result)", async () => {
      const journalEntryId = "journal-1";
      const nodeData = createValidNodeData();

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        err({ message: "Journal not found" } as any)
      );

      const result = await adapter.createNodePage(journalEntryId, nodeData);

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
      expect(result.error.message).toContain(journalEntryId);
    });

    it("should return error when journal entry not found (null value)", async () => {
      const journalEntryId = "journal-1";
      const nodeData = createValidNodeData();

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));

      const result = await adapter.createNodePage(journalEntryId, nodeData);

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
      expect(result.error.message).toContain(journalEntryId);
    });

    it("should return error when createEmbeddedDocuments fails with Error", async () => {
      const journalEntryId = "journal-1";
      const nodeData = createValidNodeData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockRejectedValue(new Error("Creation failed")),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createNodePage(journalEntryId, nodeData);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to create node page");
    });

    it("should return error when createEmbeddedDocuments fails with non-Error value", async () => {
      const journalEntryId = "journal-1";
      const nodeData = createValidNodeData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockRejectedValue("String error"),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createNodePage(journalEntryId, nodeData);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to create node page");
    });

    it("should return error when createEmbeddedDocuments returns empty array", async () => {
      const journalEntryId = "journal-1";
      const nodeData = createValidNodeData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createNodePage(journalEntryId, nodeData);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("empty array");
    });

    it("should return error when created page has no ID", async () => {
      const journalEntryId = "journal-1";
      const nodeData = createValidNodeData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([{}]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createNodePage(journalEntryId, nodeData);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("no ID");
    });

    it("should return error when created pages array first element is undefined", async () => {
      const journalEntryId = "journal-1";
      const nodeData = createValidNodeData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([undefined]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createNodePage(journalEntryId, nodeData);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Created pages array is empty");
    });
  });

  describe("createGraphPage", () => {
    it("should create graph page successfully with uuid", async () => {
      const journalEntryId = "journal-1";
      const graphData = createValidGraphData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([{ uuid: "graph-uuid-123" }]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createGraphPage(journalEntryId, graphData);

      expectResultOk(result);
      expect(result.value).toBe("graph-uuid-123");
      expect(mockJournalEntry.createEmbeddedDocuments).toHaveBeenCalledWith(
        "JournalEntryPage",
        expect.arrayContaining([
          expect.objectContaining({
            name: graphData.graphKey,
            system: graphData,
          }),
        ])
      );
    });

    it("should create graph page with default name when graphKey is missing", async () => {
      const journalEntryId = "journal-1";
      const graphData = { ...createValidGraphData(), graphKey: undefined };
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([{ uuid: "graph-uuid-456" }]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createGraphPage(journalEntryId, graphData as any);

      expectResultOk(result);
      expect(mockJournalEntry.createEmbeddedDocuments).toHaveBeenCalledWith(
        "JournalEntryPage",
        expect.arrayContaining([
          expect.objectContaining({
            name: "Graph Page",
          }),
        ])
      );
    });

    it("should create graph page successfully with id fallback", async () => {
      const journalEntryId = "journal-1";
      const graphData = createValidGraphData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([{ id: "graph-id-789" }]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createGraphPage(journalEntryId, graphData);

      expectResultOk(result);
      expect(result.value).toBe("graph-id-789");
    });

    it("should create graph page successfully with _id fallback", async () => {
      const journalEntryId = "journal-1";
      const graphData = createValidGraphData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([{ _id: "graph-_id-012" }]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createGraphPage(journalEntryId, graphData);

      expectResultOk(result);
      expect(result.value).toBe("graph-_id-012");
    });

    it("should return error when journal entry not found (error result)", async () => {
      const journalEntryId = "journal-1";
      const graphData = createValidGraphData();

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        err({ message: "Journal not found" } as any)
      );

      const result = await adapter.createGraphPage(journalEntryId, graphData);

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
      expect(result.error.message).toContain(journalEntryId);
    });

    it("should return error when journal entry not found (null value)", async () => {
      const journalEntryId = "journal-1";
      const graphData = createValidGraphData();

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));

      const result = await adapter.createGraphPage(journalEntryId, graphData);

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
      expect(result.error.message).toContain(journalEntryId);
    });

    it("should return error when createEmbeddedDocuments fails with Error", async () => {
      const journalEntryId = "journal-1";
      const graphData = createValidGraphData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockRejectedValue(new Error("Creation failed")),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createGraphPage(journalEntryId, graphData);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to create graph page");
    });

    it("should return error when createEmbeddedDocuments fails with non-Error value", async () => {
      const journalEntryId = "journal-1";
      const graphData = createValidGraphData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockRejectedValue("String error"),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createGraphPage(journalEntryId, graphData);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to create graph page");
    });

    it("should return error when createEmbeddedDocuments returns empty array", async () => {
      const journalEntryId = "journal-1";
      const graphData = createValidGraphData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createGraphPage(journalEntryId, graphData);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("empty array");
    });

    it("should return error when created page has no ID", async () => {
      const journalEntryId = "journal-1";
      const graphData = createValidGraphData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([{}]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createGraphPage(journalEntryId, graphData);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("no ID");
    });

    it("should return error when created pages array first element is undefined", async () => {
      const journalEntryId = "journal-1";
      const graphData = createValidGraphData();
      const mockJournalEntry = {
        id: journalEntryId,
        createEmbeddedDocuments: vi.fn().mockResolvedValue([undefined]),
      };

      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockJournalEntry as any));

      const result = await adapter.createGraphPage(journalEntryId, graphData);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Created pages array is empty");
    });
  });

  describe("DIFoundryPageCreationAdapter", () => {
    it("should create adapter with dependencies", () => {
      const mockGame = {
        getJournalEntries: vi.fn(),
        getJournalEntryById: vi.fn(),
        invalidateCache: vi.fn(),
        dispose: vi.fn(),
      };

      const adapter = new DIFoundryPageCreationAdapter(mockGame as any);

      expect(adapter).toBeInstanceOf(FoundryPageCreationAdapter);
    });
  });
});
