import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryJournalVisibilityAdapter } from "@/infrastructure/adapters/foundry/domain-adapters/journal-visibility-adapter";
import type { FoundryJournalFacade } from "@/infrastructure/adapters/foundry/facades/foundry-journal-facade.interface";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { ok, err } from "@/infrastructure/shared/utils/result";

function createMockFoundryJournalFacade(): FoundryJournalFacade {
  return {
    getJournalEntries: vi.fn().mockReturnValue(ok([])),
    getEntryFlag: vi.fn().mockReturnValue(ok(null)),
    setEntryFlag: vi.fn().mockResolvedValue(ok(undefined)),
    removeJournalElement: vi.fn().mockReturnValue(ok(undefined)),
  };
}

describe("FoundryJournalVisibilityAdapter", () => {
  let adapter: FoundryJournalVisibilityAdapter;
  let mockFacade: FoundryJournalFacade;

  beforeEach(() => {
    mockFacade = createMockFoundryJournalFacade();
    adapter = new FoundryJournalVisibilityAdapter(mockFacade);
  });

  describe("getAllEntries", () => {
    it("should map FoundryJournalEntry to JournalEntry", () => {
      const foundryEntries: FoundryJournalEntry[] = [
        { id: "1", name: "Entry 1", getFlag: vi.fn() } as unknown as FoundryJournalEntry,
        { id: "2", name: null, getFlag: vi.fn() } as unknown as FoundryJournalEntry,
        { id: "3", name: "Entry 3", getFlag: vi.fn() } as unknown as FoundryJournalEntry,
      ];

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue({
        ok: true,
        value: foundryEntries,
      });

      const result = adapter.getAllEntries();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([
          { id: "1", name: "Entry 1" },
          { id: "2", name: null },
          { id: "3", name: "Entry 3" },
        ]);
      }
    });

    it("should map FoundryError to JournalVisibilityError", () => {
      const foundryError: FoundryError = {
        code: "API_NOT_AVAILABLE",
        message: "Foundry API not available",
      };

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(err(foundryError));

      const result = adapter.getAllEntries();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_ENTRY_DATA");
        expect(result.error.message).toBe("Foundry API not available");
      }
    });

    it("should return empty array when no entries", () => {
      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(ok([]));

      const result = adapter.getAllEntries();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });
  });

  describe("getEntryFlag", () => {
    it("should read flag from found entry", () => {
      const foundryEntry = {
        id: "1",
        name: "Entry 1",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;
      const domainEntry = { id: "1", name: "Entry 1" };

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(ok([foundryEntry]));
      vi.mocked(mockFacade.getEntryFlag).mockReturnValue(ok(true));

      const result = adapter.getEntryFlag(domainEntry, "hidden");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(mockFacade.getEntryFlag).toHaveBeenCalledWith(
        foundryEntry,
        "hidden",
        expect.anything()
      );
    });

    it("should return ENTRY_NOT_FOUND when entry not found", () => {
      const foundryEntry = {
        id: "1",
        name: "Entry 1",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;
      const domainEntry = { id: "2", name: "Entry 2" }; // Different ID

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(ok([foundryEntry]));

      const result = adapter.getEntryFlag(domainEntry, "hidden");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ENTRY_NOT_FOUND");
        if (result.error.code === "ENTRY_NOT_FOUND") {
          expect(result.error.entryId).toBe("2");
        }
      }
    });

    it("should map FoundryError to FLAG_READ_FAILED when getJournalEntries fails", () => {
      const domainEntry = { id: "1", name: "Entry 1" };
      const foundryError: FoundryError = {
        code: "API_NOT_AVAILABLE",
        message: "API not available",
      };

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(err(foundryError));

      const result = adapter.getEntryFlag(domainEntry, "hidden");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FLAG_READ_FAILED");
        if (result.error.code === "FLAG_READ_FAILED") {
          expect(result.error.entryId).toBe("1");
          expect(result.error.message).toBe("API not available");
        }
      }
    });

    it("should map FoundryError to FLAG_READ_FAILED when getEntryFlag fails", () => {
      const foundryEntry = {
        id: "1",
        name: "Entry 1",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;
      const domainEntry = { id: "1", name: "Entry 1" };
      const foundryError: FoundryError = {
        code: "VALIDATION_FAILED",
        message: "Flag validation failed",
      };

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(ok([foundryEntry]));
      vi.mocked(mockFacade.getEntryFlag).mockReturnValue(err(foundryError));

      const result = adapter.getEntryFlag(domainEntry, "hidden");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FLAG_READ_FAILED");
        if (result.error.code === "FLAG_READ_FAILED") {
          expect(result.error.entryId).toBe("1");
          expect(result.error.message).toBe("Flag validation failed");
        }
      }
    });

    it("should return null when flag is not set", () => {
      const foundryEntry = {
        id: "1",
        name: "Entry 1",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;
      const domainEntry = { id: "1", name: "Entry 1" };

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(ok([foundryEntry]));
      vi.mocked(mockFacade.getEntryFlag).mockReturnValue(ok(null));

      const result = adapter.getEntryFlag(domainEntry, "hidden");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(null);
      }
    });
  });

  describe("setEntryFlag", () => {
    it("should set flag on found entry", async () => {
      const foundryEntry = {
        id: "1",
        name: "Entry 1",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;
      const domainEntry = { id: "1", name: "Entry 1" };

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(ok([foundryEntry]));
      vi.mocked(mockFacade.setEntryFlag).mockResolvedValue(ok(undefined));

      const result = await adapter.setEntryFlag(domainEntry, "hidden", true);

      expect(result.ok).toBe(true);
      expect(mockFacade.setEntryFlag).toHaveBeenCalledWith(foundryEntry, "hidden", true);
    });

    it("should return ENTRY_NOT_FOUND when entry not found", async () => {
      const foundryEntry = {
        id: "1",
        name: "Entry 1",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;
      const domainEntry = { id: "2", name: "Entry 2" }; // Different ID

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(ok([foundryEntry]));

      const result = await adapter.setEntryFlag(domainEntry, "hidden", true);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ENTRY_NOT_FOUND");
        if (result.error.code === "ENTRY_NOT_FOUND") {
          expect(result.error.entryId).toBe("2");
        }
      }
      expect(mockFacade.setEntryFlag).not.toHaveBeenCalled();
    });

    it("should map FoundryError to FLAG_SET_FAILED when getJournalEntries fails", async () => {
      const domainEntry = { id: "1", name: "Entry 1" };
      const foundryError: FoundryError = {
        code: "API_NOT_AVAILABLE",
        message: "API not available",
      };

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(err(foundryError));

      const result = await adapter.setEntryFlag(domainEntry, "hidden", true);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FLAG_SET_FAILED");
        if (result.error.code === "FLAG_SET_FAILED") {
          expect(result.error.entryId).toBe("1");
          expect(result.error.message).toBe("API not available");
        }
      }
      expect(mockFacade.setEntryFlag).not.toHaveBeenCalled();
    });

    it("should map FoundryError to FLAG_SET_FAILED when setEntryFlag fails", async () => {
      const foundryEntry = {
        id: "1",
        name: "Entry 1",
        getFlag: vi.fn(),
      } as unknown as FoundryJournalEntry;
      const domainEntry = { id: "1", name: "Entry 1" };
      const foundryError: FoundryError = {
        code: "VALIDATION_FAILED",
        message: "Flag validation failed",
      };

      vi.mocked(mockFacade.getJournalEntries).mockReturnValue(ok([foundryEntry]));
      vi.mocked(mockFacade.setEntryFlag).mockResolvedValue(err(foundryError));

      const result = await adapter.setEntryFlag(domainEntry, "hidden", true);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("FLAG_SET_FAILED");
        if (result.error.code === "FLAG_SET_FAILED") {
          expect(result.error.entryId).toBe("1");
          expect(result.error.message).toBe("Flag validation failed");
        }
      }
      expect(mockFacade.setEntryFlag).toHaveBeenCalledWith(foundryEntry, "hidden", true);
    });
  });
});
