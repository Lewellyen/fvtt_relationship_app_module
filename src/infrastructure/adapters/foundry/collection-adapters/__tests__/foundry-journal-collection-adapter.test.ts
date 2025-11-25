/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FoundryJournalCollectionAdapter,
  DIFoundryJournalCollectionAdapter,
} from "../foundry-journal-collection-adapter";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import { ok, err } from "@/infrastructure/shared/utils/result";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";

describe("FoundryJournalCollectionAdapter", () => {
  let mockFoundryGame: FoundryGame;
  let adapter: FoundryJournalCollectionAdapter;

  beforeEach(() => {
    mockFoundryGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };

    adapter = new FoundryJournalCollectionAdapter(mockFoundryGame);
  });

  describe("getAll", () => {
    it("should return all journals from Foundry", () => {
      const foundryJournals = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
      ];

      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(ok(foundryJournals as any));

      const result = adapter.getAll();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([
          { id: "journal-1", name: "Journal 1" },
          { id: "journal-2", name: "Journal 2" },
        ]);
      }
    });

    it("should handle journals with undefined name", () => {
      const foundryJournals = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: undefined },
      ];

      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(ok(foundryJournals as any));

      const result = adapter.getAll();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([
          { id: "journal-1", name: "Journal 1" },
          { id: "journal-2", name: null },
        ]);
      }
    });
  });

  describe("getById", () => {
    it("should return journal when found", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        ok({ id: "journal-1", name: "Journal 1" } as any)
      );

      const result = adapter.getById("journal-1");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ id: "journal-1", name: "Journal 1" });
      }
    });

    it("should handle journal with undefined name", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        ok({ id: "journal-1", name: undefined } as any)
      );

      const result = adapter.getById("journal-1");

      expect(result.ok).toBe(true);
      if (result.ok) {
        // This tests line 67: name: result.value.name ?? null
        expect(result.value).toEqual({ id: "journal-1", name: null });
      }
    });

    it("should return null when not found", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));

      const result = adapter.getById("nonexistent");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });
  });

  describe("getByIds", () => {
    it("should return multiple journals", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok({ id: "journal-1", name: "Journal 1" } as any))
        .mockReturnValueOnce(ok({ id: "journal-2", name: "Journal 2" } as any));

      const result = adapter.getByIds(["journal-1", "journal-2"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });

    it("should skip not found journals in getByIds", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok({ id: "journal-1", name: "Journal 1" } as any))
        .mockReturnValueOnce(ok(null)); // Second journal not found

      const result = adapter.getByIds(["journal-1", "journal-2"]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.id).toBe("journal-1");
      }
    });

    it("should handle errors in getByIds", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok({ id: "journal-1", name: "Journal 1" } as any))
        .mockReturnValueOnce(
          err(createFoundryError("API_NOT_AVAILABLE", "Collection not available"))
        );

      const result = adapter.getByIds(["journal-1", "journal-2"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PLATFORM_ERROR");
      }
    });

    it("should handle multiple errors in getByIds", () => {
      // This test ensures line 84 (else if (!result.ok)) is covered
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(
          err(createFoundryError("API_NOT_AVAILABLE", "Collection not available"))
        )
        .mockReturnValueOnce(err(createFoundryError("NOT_FOUND", "Entity not found")));

      const result = adapter.getByIds(["journal-1", "journal-2"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PLATFORM_ERROR");
      }
    });

    it("should handle error in getByIds as first item", () => {
      // This test ensures line 84 (else if (!result.ok)) is covered when error occurs first
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(
          err(createFoundryError("API_NOT_AVAILABLE", "Collection not available"))
        )
        .mockReturnValueOnce(ok({ id: "journal-2", name: "Journal 2" } as any));

      const result = adapter.getByIds(["journal-1", "journal-2"]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PLATFORM_ERROR");
      }
    });
  });

  describe("exists", () => {
    it("should return true when journal exists", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        ok({ id: "journal-1", name: "Journal 1" } as any)
      );

      const result = adapter.exists("journal-1");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should return false when journal does not exist", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));

      const result = adapter.exists("nonexistent");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it("should propagate errors from getById", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Collection not available"))
      );

      const result = adapter.exists("journal-1");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        // getById() wraps errors in PLATFORM_ERROR, so exists() propagates that
        expect(result.error.code).toBe("PLATFORM_ERROR");
      }
    });
  });

  describe("count", () => {
    it("should return count of all journals", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Journal 1" },
          { id: "journal-2", name: "Journal 2" },
        ] as any)
      );

      const result = adapter.count();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(2);
      }
    });

    it("should handle errors from getAll", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Collection not available"))
      );

      const result = adapter.count();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("COLLECTION_NOT_AVAILABLE");
      }
    });
  });

  describe("search", () => {
    it("should filter journals by name", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Notes" },
          { id: "journal-3", name: "Quest Items" },
        ] as any)
      );

      const result = adapter.search({
        filters: [{ field: "name", operator: "contains", value: "Quest" }],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value.map((j) => j.name)).toEqual(["Quest Log", "Quest Items"]);
      }
    });

    it("should handle errors from getAll", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Collection not available"))
      );

      const result = adapter.search({
        filters: [{ field: "name", operator: "contains", value: "Quest" }],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("COLLECTION_NOT_AVAILABLE");
      }
    });

    it("should sort results", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "B Journal" },
          { id: "journal-2", name: "A Journal" },
          { id: "journal-3", name: "C Journal" },
        ] as any)
      );

      const result = adapter.search({
        sortBy: "name",
        sortOrder: "asc",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]?.name).toBe("A Journal");
        expect(result.value[1]?.name).toBe("B Journal");
        expect(result.value[2]?.name).toBe("C Journal");
      }
    });

    it("should handle sorting with equal values", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "A Journal" },
          { id: "journal-2", name: "A Journal" },
          { id: "journal-3", name: "B Journal" },
        ] as any)
      );

      const result = adapter.search({
        sortBy: "name",
        sortOrder: "asc",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Both "A Journal" entries should be first (order may vary for equal values)
        expect(result.value[0]?.name).toBe("A Journal");
        expect(result.value[1]?.name).toBe("A Journal");
        expect(result.value[2]?.name).toBe("B Journal");
      }
    });

    it("should sort results in descending order", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "A Journal" },
          { id: "journal-2", name: "B Journal" },
          { id: "journal-3", name: "C Journal" },
        ] as any)
      );

      const result = adapter.search({
        sortBy: "name",
        sortOrder: "desc",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]?.name).toBe("C Journal");
        expect(result.value[1]?.name).toBe("B Journal");
        expect(result.value[2]?.name).toBe("A Journal");
      }
    });

    it("should handle sorting with null values", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "A Journal" },
          { id: "journal-2", name: null },
          { id: "journal-3", name: "B Journal" },
        ] as any)
      );

      const result = adapter.search({
        sortBy: "name",
        sortOrder: "asc",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Null values should be sorted to the end
        expect(result.value[0]?.name).toBe("A Journal");
        expect(result.value[1]?.name).toBe("B Journal");
        expect(result.value[2]?.name).toBeNull();
      }
    });

    it("should handle empty filter groups", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-1", name: "Quest Log" }] as any)
      );

      const result = adapter.search({
        filterGroups: [
          {
            logic: "AND",
            filters: [], // Empty filter group
          },
        ],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });

    it("should paginate results", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Journal 1" },
          { id: "journal-2", name: "Journal 2" },
          { id: "journal-3", name: "Journal 3" },
        ] as any)
      );

      const result = adapter.search({
        limit: 2,
        offset: 1,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });
  });

  describe("query", () => {
    it("should build and execute AND query", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Notes" },
        ] as any)
      );

      const result = adapter.query().where("name", "contains", "Quest").limit(10).execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.name).toBe("Quest Log");
      }
    });

    it("should build and execute OR query with orWhere", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Quest Items" },
          { id: "journal-3", name: "Notes" },
        ] as any)
      );

      const result = adapter
        .query()
        .where("name", "contains", "Quest")
        .orWhere("name", "contains", "Item")
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(2);
        expect(result.value.map((j) => j.name)).toContain("Quest Log");
        expect(result.value.map((j) => j.name)).toContain("Quest Items");
      }
    });

    it("should handle orWhere when currentOrGroup is null and filters exist", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Quest Items" },
          { id: "journal-3", name: "Notes" },
        ] as any)
      );

      // First where() creates a filter, then orWhere() should move it to OR group
      // This tests lines 259-262: orWhere() when currentOrGroup is null and filters exist
      const result = adapter
        .query()
        .where("name", "contains", "Quest")
        .orWhere("name", "contains", "Item")
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should handle orWhere when currentOrGroup is null and no filters exist", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Quest Items" },
        ] as any)
      );

      // orWhere() without previous where() - tests line 262 when filters is empty
      const result = adapter.query().orWhere("name", "contains", "Quest").execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should handle orWhere when currentOrGroup is not null", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Quest Items" },
          { id: "journal-3", name: "Notes" },
        ] as any)
      );

      // First orWhere() creates OR group, second orWhere() adds to existing OR group
      // This tests line 259: else branch when currentOrGroup is not null
      const result = adapter
        .query()
        .where("name", "contains", "Quest")
        .orWhere("name", "contains", "Item")
        .orWhere("name", "contains", "Note")
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should build and execute OR query with or() callback", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Quest Items" },
          { id: "journal-3", name: "Notes" },
        ] as any)
      );

      const result = adapter
        .query()
        .where("name", "contains", "Quest")
        .or((qb) => {
          qb.where("name", "contains", "Item");
        })
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        // OR group: name contains "Quest" OR name contains "Item"
        expect(result.value.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("should build complex query with AND and OR groups", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Quest Items" },
          { id: "journal-3", name: "Notes" },
        ] as any)
      );

      const result = adapter
        .query()
        .and((qb) => {
          qb.where("name", "contains", "Quest");
        })
        .or((qb) => {
          qb.where("name", "contains", "Item");
        })
        .execute();

      expect(result.ok).toBe(true);
      // (name contains "Quest") OR (name contains "Item")
    });

    it("should handle and() callback with no filters (empty group)", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-1", name: "Quest Log" }] as any)
      );

      const result = adapter
        .query()
        .and((_qb) => {
          // No where() calls inside callback
        })
        .execute();

      expect(result.ok).toBe(true);
    });

    it("should handle or() callback with empty orGroup", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-1", name: "Quest Log" }] as any)
      );

      const result = adapter
        .query()
        .or((_qb) => {
          // No where() calls inside callback - empty orGroup
        })
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });

    it("should handle and() callback when originalFilters is undefined", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-1", name: "Quest Log" }] as any)
      );

      const qb = adapter.query();
      // Ensure query.filters is undefined by not calling where() first
      // This simulates the case where originalFilters is undefined
      const result = qb
        .and((qb) => {
          qb.where("name", "contains", "Quest");
        })
        .execute();

      expect(result.ok).toBe(true);
    });

    it("should handle and() callback when originalFilters is defined", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Notes" },
        ] as any)
      );

      // Call where() first to set originalFilters
      const result = adapter
        .query()
        .where("name", "contains", "Quest")
        .and((qb) => {
          qb.where("id", "equals", "journal-1");
        })
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.id).toBe("journal-1");
      }
    });

    it("should initialize filterGroups in and() when not present", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-1", name: "Quest Log" }] as any)
      );

      // This tests line 348: if (!this.query.filterGroups) in and()
      const result = adapter
        .query()
        .and((qb) => {
          qb.where("name", "contains", "Quest");
        })
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
      }
    });

    it("should handle and() when filterGroups already exists", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Quest Items" },
        ] as any)
      );

      // First and() creates filterGroups, second and() uses existing filterGroups
      // This tests line 348: else branch when filterGroups already exists
      const result = adapter
        .query()
        .and((qb) => {
          qb.where("name", "contains", "Quest");
        })
        .and((qb) => {
          qb.where("id", "equals", "journal-1");
        })
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.id).toBe("journal-1");
      }
    });

    it("should handle offset()", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Journal 1" },
          { id: "journal-2", name: "Journal 2" },
          { id: "journal-3", name: "Journal 3" },
        ] as any)
      );

      const result = adapter
        .query()
        .where("name", "contains", "Journal")
        .offset(1)
        .limit(2)
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });

    it("should handle sortBy()", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "C Journal" },
          { id: "journal-2", name: "A Journal" },
          { id: "journal-3", name: "B Journal" },
        ] as any)
      );

      const result = adapter
        .query()
        .where("name", "contains", "Journal")
        .sortBy("name", "asc")
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value[0]?.name).toBe("A Journal");
        expect(result.value[1]?.name).toBe("B Journal");
        expect(result.value[2]?.name).toBe("C Journal");
      }
    });

    it("should handle closeOrGroup when filterGroups is undefined", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Quest Items" },
        ] as any)
      );

      // Create OR group, then call sortBy() which triggers closeOrGroup()
      // This tests line 390: if (!this.query.filterGroups) in closeOrGroup()
      const result = adapter
        .query()
        .where("name", "contains", "Quest")
        .orWhere("name", "contains", "Item")
        .sortBy("name", "asc")
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should handle closeOrGroup when filterGroups is undefined with limit", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Quest Items" },
        ] as any)
      );

      // Create OR group, then call limit() which triggers closeOrGroup()
      // This tests line 390: if (!this.query.filterGroups) in closeOrGroup()
      const result = adapter
        .query()
        .where("name", "contains", "Quest")
        .orWhere("name", "contains", "Item")
        .limit(10)
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should handle closeOrGroup when filterGroups already exists", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Quest Items" },
          { id: "journal-3", name: "Notes" },
        ] as any)
      );

      // First or() creates filterGroups, then orWhere() creates OR group and closeOrGroup() uses existing filterGroups
      // This tests line 390: else branch when filterGroups already exists
      const result = adapter
        .query()
        .or((qb) => {
          qb.where("name", "contains", "Quest");
        })
        .where("name", "contains", "Item")
        .orWhere("name", "contains", "Note")
        .execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        // The query should match at least one journal (Quest Log, Quest Items, or Notes)
        expect(result.value.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should test all filter operators", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Test Journal" },
          { id: "journal-2", name: "Other Journal" },
          { id: "journal-3", name: "Test Item" },
        ] as any)
      );

      // Test notEquals
      const notEqualsResult = adapter.search({
        filters: [{ field: "name", operator: "notEquals", value: "Test Journal" }],
      });
      expect(notEqualsResult.ok).toBe(true);
      if (notEqualsResult.ok) {
        expect(notEqualsResult.value.length).toBeGreaterThan(0);
      }

      // Test startsWith
      const startsWithResult = adapter.search({
        filters: [{ field: "name", operator: "startsWith", value: "Test" }],
      });
      expect(startsWithResult.ok).toBe(true);
      if (startsWithResult.ok) {
        expect(startsWithResult.value.length).toBeGreaterThanOrEqual(1);
      }

      // Test endsWith
      const endsWithResult = adapter.search({
        filters: [{ field: "name", operator: "endsWith", value: "Journal" }],
      });
      expect(endsWithResult.ok).toBe(true);
      if (endsWithResult.ok) {
        expect(endsWithResult.value.length).toBeGreaterThanOrEqual(1);
      }

      // Test in
      const inResult = adapter.search({
        filters: [{ field: "name", operator: "in", value: ["Test Journal", "Other Journal"] }],
      });
      expect(inResult.ok).toBe(true);
      if (inResult.ok) {
        expect(inResult.value.length).toBeGreaterThanOrEqual(1);
      }

      // Test notIn
      const notInResult = adapter.search({
        filters: [{ field: "name", operator: "notIn", value: ["Test Journal"] }],
      });
      expect(notInResult.ok).toBe(true);
      if (notInResult.ok) {
        expect(notInResult.value.length).toBeGreaterThanOrEqual(1);
      }

      // Test greaterThan (using id as numeric field)
      const greaterThanResult = adapter.search({
        filters: [{ field: "id", operator: "greaterThan", value: "journal-0" }],
      });
      expect(greaterThanResult.ok).toBe(true);

      // Test lessThan
      const lessThanResult = adapter.search({
        filters: [{ field: "id", operator: "lessThan", value: "journal-9" }],
      });
      expect(lessThanResult.ok).toBe(true);

      // Test greaterThanOrEqual
      const greaterThanOrEqualResult = adapter.search({
        filters: [{ field: "id", operator: "greaterThanOrEqual", value: "journal-1" }],
      });
      expect(greaterThanOrEqualResult.ok).toBe(true);

      // Test lessThanOrEqual
      const lessThanOrEqualResult = adapter.search({
        filters: [{ field: "id", operator: "lessThanOrEqual", value: "journal-9" }],
      });
      expect(lessThanOrEqualResult.ok).toBe(true);

      // Test default case (should not happen, but for coverage)
      // This tests the default case in the switch statement
      // Use a truly invalid operator that's not in the union type
      const invalidOperatorResult = adapter.search({
        filters: [{ field: "name", operator: "invalidOperator" as any, value: "Test" }],
      });
      expect(invalidOperatorResult.ok).toBe(true);
      // The default case returns false, so no results should match
      if (invalidOperatorResult.ok) {
        expect(invalidOperatorResult.value).toHaveLength(0);
      }
    });

    it("should handle non-array filterValue for 'in' operator", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-1", name: "Test Journal" }] as any)
      );

      // Test "in" operator with non-array value (should return false)
      // This tests line 214: if (!Array.isArray(filterValue)) return false
      const result = adapter.search({
        filters: [{ field: "name", operator: "in" as any, value: "not-an-array" as any }],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Non-array filterValue should not match anything
        expect(result.value).toHaveLength(0);
      }
    });

    it("should handle non-array filterValue for 'notIn' operator", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-1", name: "Test Journal" }] as any)
      );

      // Test "notIn" operator with non-array value (should return false)
      // This tests line 222: if (!Array.isArray(filterValue)) return false
      const result = adapter.search({
        filters: [{ field: "name", operator: "notIn" as any, value: "not-an-array" as any }],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Non-array filterValue should not match anything (returns false, so filter excludes all)
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe("DIFoundryJournalCollectionAdapter", () => {
    it("should create DI wrapper instance", () => {
      const mockFoundryGame: FoundryGame = {
        getJournalEntries: vi.fn(),
        getJournalEntryById: vi.fn(),
        invalidateCache: vi.fn(),
        dispose: vi.fn(),
      };

      const diAdapter = new DIFoundryJournalCollectionAdapter(mockFoundryGame);

      expect(diAdapter).toBeInstanceOf(DIFoundryJournalCollectionAdapter);
      expect(diAdapter).toBeInstanceOf(FoundryJournalCollectionAdapter);
    });
  });
});
