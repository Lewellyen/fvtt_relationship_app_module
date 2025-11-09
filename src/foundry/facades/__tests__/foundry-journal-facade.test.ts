/**
 * Tests for FoundryJournalFacade
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryJournalFacade } from "../foundry-journal-facade";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundryJournalEntry } from "@/foundry/types";
import { ok, err } from "@/utils/functional/result";
import { MODULE_CONSTANTS } from "@/constants";

describe("FoundryJournalFacade", () => {
  let facade: FoundryJournalFacade;
  let mockGame: FoundryGame;
  let mockDocument: FoundryDocument;
  let mockUI: FoundryUI;

  beforeEach(() => {
    mockGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
    };

    mockDocument = {
      getFlag: vi.fn(),
      setFlag: vi.fn(),
    };

    mockUI = {
      removeJournalElement: vi.fn(),
      findElement: vi.fn(),
      notify: vi.fn(),
    };

    facade = new FoundryJournalFacade(mockGame, mockDocument, mockUI);
  });

  describe("getJournalEntries", () => {
    it("should delegate to FoundryGame.getJournalEntries", () => {
      const entries: FoundryJournalEntry[] = [
        { id: "j1", name: "Journal 1" } as FoundryJournalEntry,
      ];
      mockGame.getJournalEntries = vi.fn().mockReturnValue(ok(entries));

      const result = facade.getJournalEntries();

      expect(mockGame.getJournalEntries).toHaveBeenCalled();
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(entries);
      }
    });

    it("should propagate errors from FoundryGame", () => {
      const error = { code: "API_NOT_AVAILABLE" as const, message: "Game not ready" };
      mockGame.getJournalEntries = vi.fn().mockReturnValue(err(error));

      const result = facade.getJournalEntries();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("API_NOT_AVAILABLE");
      }
    });
  });

  describe("getEntryFlag", () => {
    it("should delegate to FoundryDocument.getFlag with module scope", () => {
      const entry = { id: "j1", getFlag: vi.fn() };
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(true));

      const result = facade.getEntryFlag<boolean>(entry, "hidden");

      expect(mockDocument.getFlag).toHaveBeenCalledWith(
        entry,
        MODULE_CONSTANTS.MODULE.ID,
        "hidden"
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should propagate errors from FoundryDocument", () => {
      const entry = { id: "j1", getFlag: vi.fn() };
      const error = { code: "OPERATION_FAILED" as const, message: "Flag read failed" };
      mockDocument.getFlag = vi.fn().mockReturnValue(err(error));

      const result = facade.getEntryFlag(entry, "hidden");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
      }
    });
  });

  describe("removeJournalElement", () => {
    it("should delegate to FoundryUI.removeJournalElement", () => {
      const htmlElement = document.createElement("div");
      mockUI.removeJournalElement = vi.fn().mockReturnValue(ok(undefined));

      const result = facade.removeJournalElement("j1", "Journal 1", htmlElement);

      expect(mockUI.removeJournalElement).toHaveBeenCalledWith("j1", "Journal 1", htmlElement);
      expect(result.ok).toBe(true);
    });

    it("should propagate errors from FoundryUI", () => {
      const htmlElement = document.createElement("div");
      const error = { code: "ELEMENT_NOT_FOUND" as const, message: "Element not in DOM" };
      mockUI.removeJournalElement = vi.fn().mockReturnValue(err(error));

      const result = facade.removeJournalElement("j1", "Journal 1", htmlElement);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("ELEMENT_NOT_FOUND");
      }
    });
  });

  describe("static dependencies", () => {
    it("should have correct static dependencies", () => {
      expect(FoundryJournalFacade.dependencies).toEqual([
        expect.any(Symbol), // foundryGameToken
        expect.any(Symbol), // foundryDocumentToken
        expect.any(Symbol), // foundryUIToken
      ]);
      expect(FoundryJournalFacade.dependencies).toHaveLength(3);
    });
  });
});
