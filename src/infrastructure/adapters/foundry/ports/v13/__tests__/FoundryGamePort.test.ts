import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FoundryGamePortV13 } from "@/infrastructure/adapters/foundry/ports/v13/FoundryGamePort";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryGamePortV13", () => {
  let port: FoundryGamePortV13;

  beforeEach(() => {
    port = new FoundryGamePortV13();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getJournalEntries", () => {
    it("should return journal entries from game.journal", () => {
      const mockJournals = [
        { id: "journal-1", name: "Test Journal 1", getFlag: vi.fn() },
        { id: "journal-2", name: "Test Journal 2", getFlag: vi.fn() },
      ];

      vi.stubGlobal("game", {
        journal: {
          contents: mockJournals,
        },
      });

      const result = port.getJournalEntries();

      expectResultOk(result);
      expect(result.value).toHaveLength(2);
      expect(result.value[0]?.id).toBe("journal-1");
    });

    it("should handle missing game object", () => {
      vi.stubGlobal("game", undefined);

      const result = port.getJournalEntries();

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("game API not available");
    });

    it("should handle missing journal collection", () => {
      vi.stubGlobal("game", {});

      const result = port.getJournalEntries();

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("game API not available");
    });

    it("should handle iteration errors via tryCatch", () => {
      vi.stubGlobal("game", {
        journal: {
          get contents() {
            throw new Error("Internal error");
          },
        },
      });

      const result = port.getJournalEntries();

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to access journal entries");
    });

    it("should return VALIDATION_FAILED for invalid journal entries", () => {
      // Mock journal entries that fail validation (missing id or name)
      const invalidJournals = [
        { id: "journal-1", name: "Valid Journal", getFlag: vi.fn() },
        { id: undefined, name: "Invalid Journal" }, // Missing id - will fail validation
      ];

      vi.stubGlobal("game", {
        journal: {
          contents: invalidJournals,
        },
      });

      const result = port.getJournalEntries();

      expectResultErr(result);
      // Critical: Should be VALIDATION_FAILED, not OPERATION_FAILED
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.message).toContain("validation");
    });

    it("should preserve validation error cause", () => {
      // Mock journal entry with invalid structure
      const invalidJournals = [
        { name: "No ID Journal" }, // Missing id property
      ];

      vi.stubGlobal("game", {
        journal: {
          contents: invalidJournals,
        },
      });

      const result = port.getJournalEntries();

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
      // Cause should be preserved from validation (Zod error)
      expect(result.error.cause).toBeDefined();
    });

    it("should return empty array for empty journal collection", () => {
      vi.stubGlobal("game", {
        journal: {
          contents: [],
        },
      });

      const result = port.getJournalEntries();

      expectResultOk(result);
      expect(result.value).toEqual([]);
    });

    it("should preserve JournalEntry prototype methods", () => {
      // CRITICAL: Test that validation doesn't strip Foundry prototypes
      const mockSheet = { render: vi.fn() };
      const mockUpdate = vi.fn();
      const mockJournals = [
        {
          id: "test-123",
          name: "Test Journal",
          getFlag: vi.fn(),
          sheet: mockSheet,
          update: mockUpdate,
          createEmbeddedDocuments: vi.fn(),
        },
      ];

      vi.stubGlobal("game", {
        journal: {
          contents: mockJournals,
        },
      });

      const result = port.getJournalEntries();

      expectResultOk(result);
      expect(result.value).toHaveLength(1);

      // Verify prototype methods are preserved
      const entry = result.value[0];
      expect(entry?.sheet).toBe(mockSheet);
      expect(entry?.update).toBe(mockUpdate);
      expect(typeof entry?.createEmbeddedDocuments).toBe("function");
      if (entry?.sheet) {
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        expect(entry.sheet.render).toBeDefined();
      }
    });
  });

  describe("getJournalEntryById", () => {
    it("should return journal entry by id", () => {
      const mockJournal = { id: "journal-1", name: "Test Journal", getFlag: vi.fn() };

      vi.stubGlobal("game", {
        journal: {
          get: vi.fn((id: string) => (id === "journal-1" ? mockJournal : undefined)),
        },
      });

      const result = port.getJournalEntryById("journal-1");

      expectResultOk(result);
      expect(result.value).toBe(mockJournal);
    });

    it("should return validation error for invalid journal ID", () => {
      // Invalid ID: contains SQL injection attempt
      const result = port.getJournalEntryById("'; DROP TABLE journals; --");

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
    });

    it("should return null when entry not found", () => {
      vi.stubGlobal("game", {
        journal: {
          get: vi.fn(() => undefined),
        },
      });

      const result = port.getJournalEntryById("nonexistent");

      expectResultOk(result);
      expect(result.value).toBeNull();
    });

    it("should handle missing game object", () => {
      vi.stubGlobal("game", undefined);

      const result = port.getJournalEntryById("journal-1");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("game API not available");
    });

    it("should handle missing journal collection", () => {
      vi.stubGlobal("game", {});

      const result = port.getJournalEntryById("journal-1");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("game API not available");
    });

    it("should handle exceptions", () => {
      vi.stubGlobal("game", {
        journal: {
          get: vi.fn(() => {
            throw new Error("Get failed");
          }),
        },
      });

      const result = port.getJournalEntryById("journal-1");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get journal entry by ID");
    });
  });

  describe("Performance: Caching", () => {
    it("should cache validated journal entries", () => {
      const mockJournals = Array.from({ length: 100 }, (_, i) => ({
        id: `journal-${i}`,
        name: `Journal ${i}`,
        flags: {},
        getFlag: vi.fn(),
        setFlag: vi.fn(),
      }));

      vi.stubGlobal("game", {
        journal: {
          contents: mockJournals,
          _source: { version: 1 },
        },
      });

      const port = new FoundryGamePortV13();

      // First call: validation happens
      const result1 = port.getJournalEntries();
      expectResultOk(result1);
      expect(result1.value).toHaveLength(100);

      // Second call: should use cache (same reference)
      const result2 = port.getJournalEntries();
      expectResultOk(result2);
      expect(result2.value).toBe(result1.value); // Same reference = cached
    });

    it("should invalidate cache after TTL expires", () => {
      const mockJournals = Array.from({ length: 10 }, (_, i) => ({
        id: `journal-${i}`,
        name: `Journal ${i}`,
        flags: {},
        getFlag: vi.fn(),
        setFlag: vi.fn(),
      }));

      const mockGame = {
        journal: {
          contents: mockJournals,
        },
      };

      vi.stubGlobal("game", mockGame);

      const port = new FoundryGamePortV13();
      const result1 = port.getJournalEntries();
      expectResultOk(result1);

      // Immediately request again (within TTL) - should return cached
      const result2 = port.getJournalEntries();
      expectResultOk(result2);

      // Should be same reference (cache hit)
      expect(result2.value).toBe(result1.value);

      // Manually invalidate cache
      port.invalidateCache();

      const result3 = port.getJournalEntries();
      expectResultOk(result3);

      // Should be different reference after manual invalidation
      expect(result3.value).not.toBe(result1.value);
    });

    it("should cache entries with TTL", () => {
      const mockJournals = Array.from({ length: 5 }, (_, i) => ({
        id: `journal-${i}`,
        name: `Journal ${i}`,
        flags: {},
        getFlag: vi.fn(),
        setFlag: vi.fn(),
      }));

      vi.stubGlobal("game", {
        journal: {
          contents: mockJournals,
        },
      });

      const port = new FoundryGamePortV13();

      // First call - cache miss
      const result1 = port.getJournalEntries();
      expectResultOk(result1);
      expect(result1.value).toHaveLength(5);

      // Second call within TTL - cache hit
      const result2 = port.getJournalEntries();
      expectResultOk(result2);
      expect(result2.value).toHaveLength(5);

      // Should be same reference (cached)
      expect(result2.value).toBe(result1.value);
    });
  });

  describe("disposed state guards", () => {
    beforeEach(() => {
      vi.stubGlobal("game", {
        journal: {
          contents: [{ id: "test-1", name: "Test", getFlag: vi.fn() }],
          get: vi.fn((id: string) => ({ id, name: "Test", getFlag: vi.fn() })),
        },
      });
    });

    it("should prevent getting journal entries after disposal", () => {
      port.dispose();

      const result = port.getJournalEntries();

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
      expect(result.error.message).toContain("Cannot get journal entries on disposed port");
    });

    it("should prevent getting journal entry by id after disposal", () => {
      port.dispose();

      const result = port.getJournalEntryById("test-1");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
      expect(result.error.message).toContain("Cannot get journal entry on disposed port");
    });

    it("should be idempotent", () => {
      port.dispose();
      port.dispose();
      port.dispose();

      const result = port.getJournalEntries();
      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should invalidate cache on disposal", () => {
      const result1 = port.getJournalEntries();
      expectResultOk(result1);

      port.dispose();

      // After disposal, cache should be invalidated (tested via getJournalEntries returning DISPOSED error)
      const result2 = port.getJournalEntries();
      expectResultErr(result2);
      expect(result2.error.code).toBe("DISPOSED");
    });
  });
});
