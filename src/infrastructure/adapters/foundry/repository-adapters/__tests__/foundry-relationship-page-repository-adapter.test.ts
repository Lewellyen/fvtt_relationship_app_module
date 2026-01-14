import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FoundryRelationshipPageRepositoryAdapter,
  DIRelationshipPageRepositoryAdapter,
  extractFlagKey,
} from "../foundry-relationship-page-repository-adapter";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
import { ok, err } from "@/domain/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { JOURNAL_PAGE_SHEET_TYPE } from "@/application/constants/app-constants";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";

describe("FoundryRelationshipPageRepositoryAdapter", () => {
  let mockFoundryGame: FoundryGame;
  let mockFoundryDocument: FoundryDocument;
  let adapter: FoundryRelationshipPageRepositoryAdapter;

  const mockNodePage = {
    id: "page-node-1",
    type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
    system: {
      schemaVersion: 1,
      nodeKey: "page-node-1",
      name: "Test Node",
      kind: "person" as const,
      relation: "friend" as const,
      descriptions: {},
      reveal: { public: true, hidden: false },
    } as RelationshipNodeData,
    getFlag: vi.fn(),
    setFlag: vi.fn(),
  };

  const mockGraphPage = {
    id: "page-graph-1",
    type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
    system: {
      schemaVersion: 1,
      graphKey: "page-graph-1",
      nodeKeys: [],
      edges: [],
    } as RelationshipGraphData,
    getFlag: vi.fn(),
    setFlag: vi.fn(),
  };

  const mockJournal = {
    id: "journal-1",
    name: "Test Journal",
    pages: {
      get: vi.fn(),
      contents: [mockNodePage, mockGraphPage],
    },
  };

  beforeEach(() => {
    mockFoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };

    mockFoundryDocument = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getFlag: vi.fn(),
      setFlag: vi.fn(),
      unsetFlag: vi.fn(),
      dispose: vi.fn(),
    } as any;

    adapter = new FoundryRelationshipPageRepositoryAdapter(mockFoundryGame, mockFoundryDocument);

    // Reset mocks
    vi.mocked(mockJournal.pages.get).mockImplementation((id: string) => {
      if (id === "page-node-1") return mockNodePage;
      if (id === "page-graph-1") return mockGraphPage;
      return undefined;
    });
    vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(ok([mockJournal as any]));
  });

  describe("getNodePageContent", () => {
    it("should get node page content successfully", async () => {
      const result = await adapter.getNodePageContent("page-node-1");

      expectResultOk(result);
      expect(result.value).toEqual(mockNodePage.system);
    });

    it("should return error when page not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(ok([]));

      const result = await adapter.getNodePageContent("non-existent");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should return error when page is not a node page", async () => {
      const result = await adapter.getNodePageContent("page-graph-1");

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.message).toContain("is not a relationship node page");
    });

    it("should return error when page has no system data", async () => {
      const pageWithoutSystem = {
        ...mockNodePage,
        system: undefined,
      };
      vi.mocked(mockJournal.pages.get).mockReturnValue(pageWithoutSystem as any);

      const result = await adapter.getNodePageContent("page-node-1");

      expectResultErr(result);
      expect(result.error.code).toBe("INVALID_ENTITY_DATA");
    });

    it("should handle getJournalEntries error", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journals"))
      );

      const result = await adapter.getNodePageContent("page-node-1");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });
  });

  describe("updateNodePageContent", () => {
    it("should update node page content successfully", async () => {
      const updatedData: RelationshipNodeData = {
        ...mockNodePage.system,
        name: "Updated Node",
      };
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(ok({ id: "page-node-1" }));

      const result = await adapter.updateNodePageContent("page-node-1", updatedData);

      expectResultOk(result);
      expect(mockFoundryDocument.update).toHaveBeenCalledWith(
        expect.anything(),
        {
          system: updatedData,
        },
        { render: false }
      );
    });

    it("should return error when page not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(ok([]));

      const result = await adapter.updateNodePageContent("non-existent", mockNodePage.system);

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should return error when page is not a node page", async () => {
      const result = await adapter.updateNodePageContent("page-graph-1", mockNodePage.system);

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
    });

    it("should handle update error", async () => {
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(
        err(createFoundryError("OPERATION_FAILED", "Update failed"))
      );

      const result = await adapter.updateNodePageContent("page-node-1", mockNodePage.system);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });

    it("should handle findPageById error with non-ENTITY_NOT_FOUND code", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journals"))
      );

      const result = await adapter.updateNodePageContent("page-node-1", mockNodePage.system);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });
  });

  describe("getGraphPageContent", () => {
    it("should get graph page content successfully", async () => {
      const result = await adapter.getGraphPageContent("page-graph-1");

      expectResultOk(result);
      expect(result.value).toEqual(mockGraphPage.system);
    });

    it("should return error when page not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(ok([]));

      const result = await adapter.getGraphPageContent("non-existent");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should return error when page is not a graph page", async () => {
      const result = await adapter.getGraphPageContent("page-node-1");

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.message).toContain("is not a relationship graph page");
    });

    it("should return error when page has no system data", async () => {
      const pageWithoutSystem = {
        ...mockGraphPage,
        system: undefined,
      };
      vi.mocked(mockJournal.pages.get).mockReturnValue(pageWithoutSystem as any);

      const result = await adapter.getGraphPageContent("page-graph-1");

      expectResultErr(result);
      expect(result.error.code).toBe("INVALID_ENTITY_DATA");
    });

    it("should handle findPageById error with non-ENTITY_NOT_FOUND code", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journals"))
      );

      const result = await adapter.getGraphPageContent("page-graph-1");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });
  });

  describe("updateGraphPageContent", () => {
    it("should update graph page content successfully", async () => {
      const updatedData: RelationshipGraphData = {
        ...mockGraphPage.system,
        nodeKeys: ["node-1"],
      };
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(ok({ id: "page-graph-1" }));

      const result = await adapter.updateGraphPageContent("page-graph-1", updatedData);

      expectResultOk(result);
      expect(mockFoundryDocument.update).toHaveBeenCalledWith(
        expect.anything(),
        {
          system: updatedData,
        },
        { render: false }
      );
    });

    it("should return error when page not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(ok([]));

      const result = await adapter.updateGraphPageContent("non-existent", mockGraphPage.system);

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should return error when page is not a graph page", async () => {
      const result = await adapter.updateGraphPageContent("page-node-1", mockGraphPage.system);

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
    });

    it("should handle update error", async () => {
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(
        err(createFoundryError("OPERATION_FAILED", "Update failed"))
      );

      const result = await adapter.updateGraphPageContent("page-graph-1", mockGraphPage.system);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });

    it("should handle findPageById error with non-ENTITY_NOT_FOUND code", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journals"))
      );

      const result = await adapter.updateGraphPageContent("page-graph-1", mockGraphPage.system);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });
  });

  describe("setNodeMarker", () => {
    it("should set node marker successfully", async () => {
      vi.mocked(mockFoundryDocument.setFlag).mockResolvedValue(ok(undefined));

      const result = await adapter.setNodeMarker("page-node-1", true);

      expectResultOk(result);
      expect(mockFoundryDocument.setFlag).toHaveBeenCalledWith(
        expect.anything(),
        "fvtt_relationship_app_module",
        "isRelationshipNode",
        true
      );
    });

    it("should return error when page not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(ok([]));

      const result = await adapter.setNodeMarker("non-existent", true);

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle setFlag error", async () => {
      vi.mocked(mockFoundryDocument.setFlag).mockResolvedValue(
        err(createFoundryError("OPERATION_FAILED", "Set flag failed"))
      );

      const result = await adapter.setNodeMarker("page-node-1", true);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });

    it("should return error when document does not support flags", async () => {
      const pageWithoutFlagMethods = {
        id: "page-node-1",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
        system: mockNodePage.system,
      };
      vi.mocked(mockJournal.pages.get).mockReturnValue(pageWithoutFlagMethods as any);

      const result = await adapter.setNodeMarker("page-node-1", true);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("does not support flags");
    });
  });

  describe("setGraphMarker", () => {
    it("should set graph marker successfully", async () => {
      vi.mocked(mockFoundryDocument.setFlag).mockResolvedValue(ok(undefined));

      const result = await adapter.setGraphMarker("page-graph-1", true);

      expectResultOk(result);
      expect(mockFoundryDocument.setFlag).toHaveBeenCalledWith(
        expect.anything(),
        "fvtt_relationship_app_module",
        "isRelationshipGraph",
        true
      );
    });

    it("should return error when document does not support flags", async () => {
      const pageWithoutFlagMethods = {
        id: "page-graph-1",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
        system: mockGraphPage.system,
      };
      vi.mocked(mockJournal.pages.get).mockReturnValue(pageWithoutFlagMethods as any);

      const result = await adapter.setGraphMarker("page-graph-1", true);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("does not support flags");
    });
  });

  describe("getNodeMarker", () => {
    it("should get node marker successfully", async () => {
      vi.mocked(mockFoundryDocument.getFlag).mockReturnValue(ok(true));

      const result = await adapter.getNodeMarker("page-node-1");

      expectResultOk(result);
      expect(result.value).toBe(true);
    });

    it("should return false when flag is null", async () => {
      vi.mocked(mockFoundryDocument.getFlag).mockReturnValue(ok(null));

      const result = await adapter.getNodeMarker("page-node-1");

      expectResultOk(result);
      expect(result.value).toBe(false);
    });

    it("should return error when page not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(ok([]));

      const result = await adapter.getNodeMarker("non-existent");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should return error when document does not support flags", async () => {
      const pageWithoutFlagMethods = {
        id: "page-node-1",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
        system: mockNodePage.system,
      };
      vi.mocked(mockJournal.pages.get).mockReturnValue(pageWithoutFlagMethods as any);

      const result = await adapter.getNodeMarker("page-node-1");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("does not support flags");
    });

    it("should handle getFlag error", async () => {
      vi.mocked(mockFoundryDocument.getFlag).mockReturnValue(
        err(createFoundryError("OPERATION_FAILED", "Get flag failed"))
      );

      const result = await adapter.getNodeMarker("page-node-1");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get flag");
    });
  });

  describe("getGraphMarker", () => {
    it("should get graph marker successfully", async () => {
      vi.mocked(mockFoundryDocument.getFlag).mockReturnValue(ok(true));

      const result = await adapter.getGraphMarker("page-graph-1");

      expectResultOk(result);
      expect(result.value).toBe(true);
    });

    it("should return error when document does not support flags", async () => {
      const pageWithoutFlagMethods = {
        id: "page-node-1",
        type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
        system: mockNodePage.system,
      };
      vi.mocked(mockJournal.pages.get).mockReturnValue(pageWithoutFlagMethods as any);

      const result = await adapter.getGraphMarker("page-node-1");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("does not support flags");
    });

    it("should handle getFlag error", async () => {
      vi.mocked(mockFoundryDocument.getFlag).mockReturnValue(
        err(createFoundryError("OPERATION_FAILED", "Get flag failed"))
      );

      const result = await adapter.getGraphMarker("page-graph-1");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get flag");
    });
  });

  describe("findPageById helper", () => {
    it("should handle pages as array where page is not found", async () => {
      const journalWithArrayPages = {
        id: "journal-array",
        pages: [
          { id: "page-other", type: "text" },
          { id: "page-other-2", type: "image" },
        ],
      };
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([journalWithArrayPages as any])
      );

      const result = await adapter.getNodePageContent("non-existent-page");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle journal with no pages property", async () => {
      const journalWithoutPages = {
        id: "journal-no-pages",
        name: "Journal without pages",
      };
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([journalWithoutPages as any])
      );

      const result = await adapter.getNodePageContent("non-existent-page");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle pages that are neither get function nor array (fallback)", async () => {
      const journalWithInvalidPages = {
        id: "journal-invalid",
        pages: { someOtherProperty: "value" }, // Not a get function and not an array
      };
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([journalWithInvalidPages as any])
      );

      const result = await adapter.getNodePageContent("non-existent-page");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle pages.get() returning undefined (coverage for page ?? null branch)", async () => {
      const journalWithGetReturningUndefined = {
        id: "journal-undefined",
        pages: {
          get: vi.fn().mockReturnValue(undefined), // get() returns undefined, not null
        },
      };
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([journalWithGetReturningUndefined as any])
      );

      const result = await adapter.getNodePageContent("non-existent-page");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });
  });
});

describe("extractFlagKey", () => {
  it("should extract key from flag path with dot", () => {
    const result = extractFlagKey("fvtt_relationship_app_module.isRelationshipNode");
    expect(result).toBe("isRelationshipNode");
  });

  it("should return full path when no dot is present (coverage for else branch)", () => {
    const result = extractFlagKey("simpleFlagKey");
    expect(result).toBe("simpleFlagKey");
  });

  it("should return empty string when split results in empty array (coverage for lastPart === undefined branch)", () => {
    // Mock split() to return an empty array, so pop() returns undefined
    const originalSplit = String.prototype.split;
    String.prototype.split = vi.fn(function (this: string) {
      if (this === "test.with.dot") {
        // Return empty array so pop() returns undefined
        return [];
      }
      return originalSplit.call(this, "." as any);
    }) as typeof String.prototype.split;

    const result = extractFlagKey("test.with.dot");

    // Restore
    String.prototype.split = originalSplit;

    expect(result).toBe("");
  });
});

describe("DIRelationshipPageRepositoryAdapter", () => {
  it("should have static dependencies", () => {
    expect(DIRelationshipPageRepositoryAdapter.dependencies).toBeDefined();
    expect(DIRelationshipPageRepositoryAdapter.dependencies).toHaveLength(2);
  });

  it("should create DI wrapper instance", () => {
    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };
    const mockFoundryDocument: FoundryDocument = {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getFlag: vi.fn(),
      setFlag: vi.fn(),
      unsetFlag: vi.fn(),
      dispose: vi.fn(),
    } as any;

    const diAdapter = new DIRelationshipPageRepositoryAdapter(mockFoundryGame, mockFoundryDocument);

    expect(diAdapter).toBeInstanceOf(DIRelationshipPageRepositoryAdapter);
    expect(diAdapter).toBeInstanceOf(FoundryRelationshipPageRepositoryAdapter);
  });
});
