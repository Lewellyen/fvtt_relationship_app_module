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
      expect(result.error.message).toContain("Failed to get journal entries");
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
});
