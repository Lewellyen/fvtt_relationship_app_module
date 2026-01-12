import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FoundryRelationshipPageCollectionAdapter,
  DIRelationshipPageCollectionAdapter,
} from "../foundry-relationship-page-collection-adapter";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import { ok, err } from "@/domain/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { JOURNAL_PAGE_SHEET_TYPE } from "@/application/constants/app-constants";

describe("FoundryRelationshipPageCollectionAdapter", () => {
  let mockFoundryGame: FoundryGame;
  let adapter: FoundryRelationshipPageCollectionAdapter;

  const mockNodePage = {
    id: "page-node-1",
    type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE,
    getFlag: vi.fn(),
  };

  const mockGraphPage = {
    id: "page-graph-1",
    type: JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH,
    getFlag: vi.fn(),
  };

  const mockOtherPage = {
    id: "page-other-1",
    type: "text",
    getFlag: vi.fn(),
  };

  const mockJournal1 = {
    id: "journal-1",
    name: "Journal 1",
    pages: [mockNodePage, mockGraphPage, mockOtherPage],
  };

  const mockJournal2 = {
    id: "journal-2",
    name: "Journal 2",
    pages: [mockNodePage],
  };

  beforeEach(() => {
    mockFoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };

    adapter = new FoundryRelationshipPageCollectionAdapter(mockFoundryGame);

    vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
      ok([mockJournal1, mockJournal2] as any)
    );
    vi.mocked(mockFoundryGame.getJournalEntryById).mockImplementation((id: string) => {
      if (id === "journal-1") return ok(mockJournal1 as any);
      if (id === "journal-2") return ok(mockJournal2 as any);
      return ok(null);
    });
  });

  describe("findPagesByType", () => {
    it("should find node pages when type is node", async () => {
      const result = await adapter.findPagesByType("node");

      expectResultOk(result);
      expect(result.value).toHaveLength(2); // 2 node pages across both journals
      expect(
        result.value.every(
          (p) => (p as { type: string }).type === JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE
        )
      ).toBe(true);
    });

    it("should find graph pages when type is graph", async () => {
      const result = await adapter.findPagesByType("graph");

      expectResultOk(result);
      expect(result.value).toHaveLength(1); // 1 graph page
      expect(
        result.value.every(
          (p) => (p as { type: string }).type === JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH
        )
      ).toBe(true);
    });

    it("should handle getJournalEntries error for node type", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journals"))
      );

      const result = await adapter.findPagesByType("node");

      expectResultErr(result);
      expect(result.error.code).toBe("COLLECTION_NOT_AVAILABLE");
    });

    it("should handle getJournalEntries error for graph type", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journals"))
      );

      const result = await adapter.findPagesByType("graph");

      expectResultErr(result);
      expect(result.error.code).toBe("COLLECTION_NOT_AVAILABLE");
    });
  });

  describe("findNodePages", () => {
    it("should find all node pages", async () => {
      const result = await adapter.findNodePages();

      expectResultOk(result);
      expect(result.value).toHaveLength(2);
      expect(
        result.value.every(
          (p) => (p as { type: string }).type === JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE
        )
      ).toBe(true);
    });

    it("should return empty array when no node pages found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-3", pages: [mockGraphPage] }] as any)
      );

      const result = await adapter.findNodePages();

      expectResultOk(result);
      expect(result.value).toHaveLength(0);
    });

    it("should handle getJournalEntries error", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journals"))
      );

      const result = await adapter.findNodePages();

      expectResultErr(result);
      expect(result.error.code).toBe("COLLECTION_NOT_AVAILABLE");
    });
  });

  describe("findGraphPages", () => {
    it("should find all graph pages", async () => {
      const result = await adapter.findGraphPages();

      expectResultOk(result);
      expect(result.value).toHaveLength(1);
      expect(
        result.value.every(
          (p) => (p as { type: string }).type === JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH
        )
      ).toBe(true);
    });

    it("should return empty array when no graph pages found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-3", pages: [mockNodePage] }] as any)
      );

      const result = await adapter.findGraphPages();

      expectResultOk(result);
      expect(result.value).toHaveLength(0);
    });

    it("should handle getJournalEntries error", async () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journals"))
      );

      const result = await adapter.findGraphPages();

      expectResultErr(result);
      expect(result.error.code).toBe("COLLECTION_NOT_AVAILABLE");
    });
  });

  describe("findPagesByJournalEntry", () => {
    it("should find all pages in a journal entry", async () => {
      const result = await adapter.findPagesByJournalEntry("journal-1");

      expectResultOk(result);
      expect(result.value).toHaveLength(3); // node, graph, other
    });

    it("should return empty array when journal has no pages", async () => {
      const emptyJournal = {
        id: "journal-empty",
        pages: [],
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(emptyJournal as any));

      const result = await adapter.findPagesByJournalEntry("journal-empty");

      expectResultOk(result);
      expect(result.value).toHaveLength(0);
    });

    it("should return error when journal not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));

      const result = await adapter.findPagesByJournalEntry("non-existent");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle getJournalEntryById error", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journal"))
      );

      const result = await adapter.findPagesByJournalEntry("journal-1");

      expectResultErr(result);
      expect(result.error.code).toBe("COLLECTION_NOT_AVAILABLE");
    });
  });

  describe("findNodePagesByJournalEntry", () => {
    it("should find node pages in a journal entry", async () => {
      const result = await adapter.findNodePagesByJournalEntry("journal-1");

      expectResultOk(result);
      expect(result.value).toHaveLength(1);
      if (result.ok && result.value.length > 0) {
        expect((result.value[0] as { type: string }).type).toBe(
          JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_NODE
        );
      }
    });

    it("should return empty array when no node pages in journal", async () => {
      const journalWithoutNodes = {
        id: "journal-graph-only",
        pages: [mockGraphPage],
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        ok(journalWithoutNodes as any)
      );

      const result = await adapter.findNodePagesByJournalEntry("journal-graph-only");

      expectResultOk(result);
      expect(result.value).toHaveLength(0);
    });

    it("should propagate error when findPagesByJournalEntry fails", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journal"))
      );

      const result = await adapter.findNodePagesByJournalEntry("journal-1");

      expectResultErr(result);
      expect(result.error.code).toBe("COLLECTION_NOT_AVAILABLE");
    });
  });

  describe("findGraphPagesByJournalEntry", () => {
    it("should find graph pages in a journal entry", async () => {
      const result = await adapter.findGraphPagesByJournalEntry("journal-1");

      expectResultOk(result);
      expect(result.value).toHaveLength(1);
      if (result.ok && result.value.length > 0) {
        expect((result.value[0] as { type: string }).type).toBe(
          JOURNAL_PAGE_SHEET_TYPE.RELATIONSHIP_GRAPH
        );
      }
    });

    it("should return empty array when no graph pages in journal", async () => {
      const journalWithoutGraphs = {
        id: "journal-node-only",
        pages: [mockNodePage],
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        ok(journalWithoutGraphs as any)
      );

      const result = await adapter.findGraphPagesByJournalEntry("journal-node-only");

      expectResultOk(result);
      expect(result.value).toHaveLength(0);
    });

    it("should propagate error when findPagesByJournalEntry fails", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Failed to get journal"))
      );

      const result = await adapter.findGraphPagesByJournalEntry("journal-1");

      expectResultErr(result);
      expect(result.error.code).toBe("COLLECTION_NOT_AVAILABLE");
    });
  });

  describe("extractPagesFromJournal helper", () => {
    it("should handle EmbeddedCollection with contents property", async () => {
      const journalWithEmbeddedCollection = {
        id: "journal-embedded",
        pages: {
          contents: [mockNodePage, mockGraphPage],
        },
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        ok(journalWithEmbeddedCollection as any)
      );

      const result = await adapter.findPagesByJournalEntry("journal-embedded");

      expectResultOk(result);
      expect(result.value).toHaveLength(2);
    });

    it("should handle empty pages", async () => {
      const journalWithNoPages = {
        id: "journal-no-pages",
        pages: null,
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(journalWithNoPages as any));

      const result = await adapter.findPagesByJournalEntry("journal-no-pages");

      expectResultOk(result);
      expect(result.value).toHaveLength(0);
    });

    it("should handle pages that are neither array nor object with contents (fallback)", async () => {
      const journalWithInvalidPages = {
        id: "journal-invalid-pages",
        pages: { someOtherProperty: "value" }, // Not an array and no contents property
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        ok(journalWithInvalidPages as any)
      );

      const result = await adapter.findPagesByJournalEntry("journal-invalid-pages");

      expectResultOk(result);
      expect(result.value).toHaveLength(0);
    });
  });
});

describe("DIRelationshipPageCollectionAdapter", () => {
  it("should have static dependencies", () => {
    expect(DIRelationshipPageCollectionAdapter.dependencies).toBeDefined();
    expect(DIRelationshipPageCollectionAdapter.dependencies).toHaveLength(1);
  });

  it("should create DI wrapper instance", () => {
    const mockFoundryGame: FoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };

    const diAdapter = new DIRelationshipPageCollectionAdapter(mockFoundryGame);

    expect(diAdapter).toBeInstanceOf(DIRelationshipPageCollectionAdapter);
    expect(diAdapter).toBeInstanceOf(FoundryRelationshipPageCollectionAdapter);
  });
});
