import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FoundryGamePortV13 } from "../FoundryGamePort";
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

    it("should invalidate cache when journal version changes", () => {
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
          _source: { version: 1 },
        },
      };

      vi.stubGlobal("game", mockGame);

      const port = new FoundryGamePortV13();
      const result1 = port.getJournalEntries();
      expectResultOk(result1);

      // Change version
      mockGame.journal._source.version = 2;

      const result2 = port.getJournalEntries();
      expectResultOk(result2);

      // Should be different reference (cache invalidated)
      expect(result2.value).not.toBe(result1.value);
    });

    it("should handle missing version field gracefully", () => {
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
          // No _source.version field
        },
      });

      const port = new FoundryGamePortV13();

      // Should still work (uses timestamp fallback)
      const result1 = port.getJournalEntries();
      expectResultOk(result1);
      expect(result1.value).toHaveLength(5);

      // Second call will also work (but might use new timestamp)
      const result2 = port.getJournalEntries();
      expectResultOk(result2);
    });
  });
});
