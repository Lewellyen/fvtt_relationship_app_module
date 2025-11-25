/**
 * Tests for FoundryJournalFacade
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FoundryJournalFacade,
  DIFoundryJournalFacade,
} from "@/infrastructure/adapters/foundry/facades/foundry-journal-facade";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import type { FoundryJournalEntry } from "@/infrastructure/adapters/foundry/types";
import { ok, err } from "@/infrastructure/shared/utils/result";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";
import * as v from "valibot";

describe("FoundryJournalFacade", () => {
  let facade: FoundryJournalFacade;
  let mockGame: FoundryGame;
  let mockDocument: FoundryDocument;
  let mockUI: FoundryUI;

  beforeEach(() => {
    mockGame = {
      getJournalEntries: vi.fn(),
      getJournalEntryById: vi.fn(),
      invalidateCache: vi.fn(),
      dispose: vi.fn(),
    };

    mockDocument = {
      getFlag: vi.fn(),
      setFlag: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      unsetFlag: vi.fn(),
      dispose: vi.fn(),
    };

    mockUI = {
      removeJournalElement: vi.fn(),
      findElement: vi.fn(),
      notify: vi.fn(),
      rerenderJournalDirectory: vi.fn(),
      dispose: vi.fn(),
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
    it("should delegate to FoundryDocument.getFlag with module scope and schema", () => {
      // Entry must have both getFlag and setFlag methods for castFoundryDocumentForFlag validation

      const entry = {
        id: "j1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      mockDocument.getFlag = vi.fn().mockReturnValue(ok(true));

      const result = facade.getEntryFlag<boolean>(entry, "hidden", v.boolean());

      expect(mockDocument.getFlag).toHaveBeenCalled();
      // Verify document was called with correct arguments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calls = (mockDocument.getFlag as any).mock.calls;
      expect(calls[0][0]).toBe(entry);
      expect(calls[0][1]).toBe(MODULE_CONSTANTS.MODULE.ID);
      expect(calls[0][2]).toBe("hidden");
      expect(calls[0][3]).toBeDefined(); // schema
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should propagate errors from FoundryDocument", () => {
      // Entry must have both getFlag and setFlag methods for castFoundryDocumentForFlag validation

      const entry = {
        id: "j1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      const error = { code: "OPERATION_FAILED" as const, message: "Flag read failed" };
      mockDocument.getFlag = vi.fn().mockReturnValue(err(error));

      const result = facade.getEntryFlag(entry, "hidden", v.boolean());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
      }
    });

    it("should return VALIDATION_FAILED when entry lacks required methods", () => {
      // Entry missing setFlag method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = { id: "j1", getFlag: vi.fn() } as any;

      const result = facade.getEntryFlag(entry, "hidden", v.boolean());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
        expect(result.error.message).toContain("required methods");
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

  describe("setEntryFlag", () => {
    it("should delegate to FoundryDocument.setFlag with module scope", async () => {
      // Entry must have both getFlag and setFlag methods for castFoundryDocumentForFlag validation

      const entry = {
        id: "j1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      mockDocument.setFlag = vi.fn().mockResolvedValue(ok(undefined));

      const result = await facade.setEntryFlag(entry, "hidden", true);

      expect(mockDocument.setFlag).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calls = (mockDocument.setFlag as any).mock.calls;
      expect(calls[0][0]).toBe(entry);
      expect(calls[0][1]).toBe(MODULE_CONSTANTS.MODULE.ID);
      expect(calls[0][2]).toBe("hidden");
      expect(calls[0][3]).toBe(true);
      expect(result.ok).toBe(true);
    });

    it("should propagate errors from FoundryDocument", async () => {
      // Entry must have both getFlag and setFlag methods for castFoundryDocumentForFlag validation

      const entry = {
        id: "j1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;
      const error = { code: "OPERATION_FAILED" as const, message: "Flag set failed" };
      mockDocument.setFlag = vi.fn().mockResolvedValue(err(error));

      const result = await facade.setEntryFlag(entry, "hidden", true);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
      }
    });

    it("should return VALIDATION_FAILED when entry lacks required methods", async () => {
      // Entry missing getFlag method
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const entry = { id: "j1", setFlag: vi.fn() } as any;

      const result = await facade.setEntryFlag(entry, "hidden", true);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
        expect(result.error.message).toContain("required methods");
      }
    });
  });

  describe("static dependencies", () => {
    it("should have correct static dependencies", () => {
      expect(DIFoundryJournalFacade.dependencies).toEqual([
        expect.any(Symbol), // foundryGameToken
        expect.any(Symbol), // foundryDocumentToken
        expect.any(Symbol), // foundryUIToken
      ]);
      expect(DIFoundryJournalFacade.dependencies).toHaveLength(3);
    });
  });
});
