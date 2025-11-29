/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FoundryJournalRepositoryAdapter,
  DIFoundryJournalRepositoryAdapter,
} from "../foundry-journal-repository-adapter";
import type { FoundryGame } from "@/infrastructure/adapters/foundry/interfaces/FoundryGame";
import type { FoundryDocument } from "@/infrastructure/adapters/foundry/interfaces/FoundryDocument";
import { ok, err } from "@/domain/utils/result";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";

describe("FoundryJournalRepositoryAdapter", () => {
  let mockFoundryGame: FoundryGame;
  let mockFoundryDocument: FoundryDocument;
  let adapter: FoundryJournalRepositoryAdapter;

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

    adapter = new FoundryJournalRepositoryAdapter(mockFoundryGame, mockFoundryDocument);
  });

  describe("Collection Methods (delegated)", () => {
    it("should delegate getAll to collection adapter", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-1", name: "Journal 1" }] as any)
      );

      const result = adapter.getAll();

      expectResultOk(result);
      expect(result.value).toHaveLength(1);
    });

    it("should delegate getByIds to collection adapter", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok({ id: "journal-1", name: "Journal 1" } as any))
        .mockReturnValueOnce(ok({ id: "journal-2", name: "Journal 2" } as any));

      const result = adapter.getByIds(["journal-1", "journal-2"]);

      expectResultOk(result);
      expect(result.value).toHaveLength(2);
    });

    it("should delegate count to collection adapter", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Journal 1" },
          { id: "journal-2", name: "Journal 2" },
        ] as any)
      );

      const result = adapter.count();

      expectResultOk(result);
      expect(result.value).toBe(2);
    });

    it("should delegate search to collection adapter", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([
          { id: "journal-1", name: "Quest Log" },
          { id: "journal-2", name: "Notes" },
        ] as any)
      );

      const result = adapter.search({
        filters: [{ field: "name", operator: "contains", value: "Quest" }],
      });

      expectResultOk(result);
      expect(result.value).toHaveLength(1);
    });

    it("should delegate query to collection adapter", () => {
      vi.mocked(mockFoundryGame.getJournalEntries).mockReturnValue(
        ok([{ id: "journal-1", name: "Journal 1" }] as any)
      );

      const queryBuilder = adapter.query();
      const result = queryBuilder.where("name", "equals", "Journal 1").execute();

      expectResultOk(result);
      expect(result.value).toHaveLength(1);
    });
  });

  describe("create", () => {
    it("should create journal successfully", async () => {
      // Mock global JournalEntry class
      const mockJournalEntryClass = {
        create: vi.fn(async () => ({ id: "new-id", name: "New Journal" })),
      };
      (globalThis as any).JournalEntry = mockJournalEntryClass;

      vi.mocked(mockFoundryDocument.create).mockResolvedValue(
        ok({ id: "new-id", name: "New Journal" } as any)
      );

      const result = await adapter.create({ name: "New Journal" });

      expectResultOk(result);
      expect(result.value.id).toBe("new-id");
      expect(result.value.name).toBe("New Journal");
    });

    it("should handle create errors", async () => {
      const mockJournalEntryClass = {
        create: vi.fn(),
      };
      (globalThis as any).JournalEntry = mockJournalEntryClass;

      vi.mocked(mockFoundryDocument.create).mockResolvedValue(
        err({
          code: "OPERATION_FAILED",
          message: "Create failed",
        } as any)
      );

      const result = await adapter.create({ name: "New Journal" });

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });

    it("should handle missing JournalEntry class", async () => {
      delete (globalThis as any).JournalEntry;

      const result = await adapter.create({ name: "New Journal" });

      expectResultErr(result);
      expect(result.error.code).toBe("PLATFORM_ERROR");
    });

    it("should handle create errors in catch block", async () => {
      const mockJournalEntryClass = {
        create: vi.fn().mockRejectedValue(new Error("Create failed")),
      };
      (globalThis as any).JournalEntry = mockJournalEntryClass;

      const result = await adapter.create({ name: "New Journal" });

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to create journal");
    });

    it("should handle create errors with non-Error object in catch block", async () => {
      const mockJournalEntryClass = {
        create: vi.fn(),
      };
      (globalThis as any).JournalEntry = mockJournalEntryClass;

      // Make foundryDocument.create throw a non-Error object
      vi.mocked(mockFoundryDocument.create).mockRejectedValue("String error");

      const result = await adapter.create({ name: "New Journal" });

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to create journal");
      // The error message should contain the stringified error
      expect(result.error.message).toContain("String error");
    });

    it("should handle create with undefined name", async () => {
      const mockJournalEntryClass = {
        create: vi.fn(async () => ({ id: "new-id", name: undefined })),
      };
      (globalThis as any).JournalEntry = mockJournalEntryClass;

      vi.mocked(mockFoundryDocument.create).mockResolvedValue(
        ok({ id: "new-id", name: undefined } as any)
      );

      const result = await adapter.create({ name: "New Journal" });

      expectResultOk(result);
      expect(result.value.id).toBe("new-id");
      expect(result.value.name).toBeNull(); // undefined should be converted to null
    });
  });

  describe("createMany", () => {
    it("should create multiple journals", async () => {
      const mockJournalEntryClass = {
        create: vi.fn(),
      };
      (globalThis as any).JournalEntry = mockJournalEntryClass;

      vi.mocked(mockFoundryDocument.create)
        .mockResolvedValueOnce(ok({ id: "journal-1", name: "Journal 1" } as any))
        .mockResolvedValueOnce(ok({ id: "journal-2", name: "Journal 2" } as any));

      const result = await adapter.createMany([{ name: "Journal 1" }, { name: "Journal 2" }]);

      expectResultOk(result);
      expect(result.value).toHaveLength(2);
    });

    it("should handle errors in createMany", async () => {
      const mockJournalEntryClass = {
        create: vi.fn(),
      };
      (globalThis as any).JournalEntry = mockJournalEntryClass;
      vi.mocked(mockFoundryDocument.create)
        .mockResolvedValueOnce(ok({ id: "journal-1", name: "Journal 1" } as any))
        .mockResolvedValueOnce(
          err({
            code: "OPERATION_FAILED",
            message: "Create failed",
          } as any)
        );

      const result = await adapter.createMany([{ name: "Journal 1" }, { name: "Journal 2" }]);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
    });
  });

  describe("update", () => {
    it("should update journal successfully", async () => {
      const mockEntry = { id: "journal-1", name: "Old Name", update: vi.fn() };
      const mockUpdatedEntry = { id: "journal-1", name: "Updated Name" };
      // update() calls getById() which calls getJournalEntryById() (for current entity check)
      // update() calls getJournalEntryById() again (for Foundry entry)
      // update() calls getById() again (for updated entity)
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry as any)) // getById() (current check)
        .mockReturnValueOnce(ok(mockEntry as any)) // getJournalEntryById() (Foundry entry)
        .mockReturnValueOnce(ok(mockUpdatedEntry as any)); // getById() (updated entity)
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(ok(mockUpdatedEntry as any));

      const result = await adapter.update("journal-1", { name: "Updated Name" });

      expectResultOk(result);
      expect(result.value.name).toBe("Updated Name");
    });

    it("should handle property deletion with -= notation", async () => {
      const mockEntry = { id: "journal-1", name: "Old Name", update: vi.fn() };
      const mockUpdatedEntry = { id: "journal-1", name: null };
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry as any)) // getById() (current check)
        .mockReturnValueOnce(ok(mockEntry as any)) // getJournalEntryById() (Foundry entry)
        .mockReturnValueOnce(ok(mockUpdatedEntry as any)); // getById() (updated entity)
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(ok(mockUpdatedEntry as any));

      const result = await adapter.update("journal-1", { name: null });

      expectResultOk(result);
      expect(mockFoundryDocument.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "name.-=": null,
        })
      );
    });

    it("should handle entity not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));

      const result = await adapter.update("nonexistent", { name: "Updated" });

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle getById error in update", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Collection not available"))
      );

      const result = await adapter.update("journal-1", { name: "Updated" });

      expectResultErr(result);
      // getById() wraps errors in PLATFORM_ERROR, but update() checks for null first
      // If getById returns an error, it's treated as entity not found
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle getJournalEntryById error in update", async () => {
      const mockEntry = { id: "journal-1", name: "Journal 1" };
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry as any)) // getById() check
        .mockReturnValueOnce(
          err(createFoundryError("API_NOT_AVAILABLE", "Collection not available"))
        ); // getJournalEntryById() for Foundry entry

      const result = await adapter.update("journal-1", { name: "Updated" });

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle update operation failure", async () => {
      const mockEntry = { id: "journal-1", name: "Journal 1", update: vi.fn() };
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry as any)) // getById() check
        .mockReturnValueOnce(ok(mockEntry as any)); // getJournalEntryById() for Foundry entry
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(
        err({
          code: "OPERATION_FAILED",
          message: "Update failed",
        } as any)
      );

      const result = await adapter.update("journal-1", { name: "Updated" });

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to update journal");
    });

    it("should handle document without update method", async () => {
      // Create a mock entry without update method
      const mockEntry = { id: "journal-1", name: "Journal 1" };
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry as any)) // getById() check
        .mockReturnValueOnce(ok(mockEntry as any)); // getJournalEntryById() for Foundry entry
      // castFoundryDocumentWithUpdate will fail because mockEntry has no update method
      // This tests line 209: if (!docWithUpdateResult.ok)

      const result = await adapter.update("journal-1", { name: "Updated" });

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Document does not support update");
    });

    it("should handle getById failure after update", async () => {
      const mockEntry = { id: "journal-1", name: "Journal 1", update: vi.fn() };
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry as any)) // getById() check
        .mockReturnValueOnce(ok(mockEntry as any)) // getJournalEntryById() for Foundry entry
        .mockReturnValueOnce(
          err(createFoundryError("API_NOT_AVAILABLE", "Collection not available"))
        ); // getById() after update
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(ok(mockEntry as any));

      const result = await adapter.update("journal-1", { name: "Updated" });

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to retrieve updated journal");
    });

    it("should handle update with name undefined (not in changes)", async () => {
      const mockEntry = { id: "journal-1", name: "Old Name", update: vi.fn() };
      const mockUpdatedEntry = { id: "journal-1", name: "Old Name" }; // Name unchanged
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry as any)) // getById() (current check)
        .mockReturnValueOnce(ok(mockEntry as any)) // getJournalEntryById() (Foundry entry)
        .mockReturnValueOnce(ok(mockUpdatedEntry as any)); // getById() (updated entity)
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(ok(mockUpdatedEntry as any));

      // Update with empty changes object (name is undefined)
      const result = await adapter.update("journal-1", {});

      expectResultOk(result);
      expect(result.value.name).toBe("Old Name");
      // updateData should be empty since name is undefined
      expect(mockFoundryDocument.update).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({})
      );
    });
  });

  describe("updateMany", () => {
    it("should update multiple journals", async () => {
      const mockEntry1 = { id: "journal-1", name: "Old 1", update: vi.fn() };
      const mockUpdated1 = { id: "journal-1", name: "Updated 1" };
      const mockEntry2 = { id: "journal-2", name: "Old 2", update: vi.fn() };
      const mockUpdated2 = { id: "journal-2", name: "Updated 2" };
      // Each update() call: getById() -> getJournalEntryById() -> getJournalEntryById() -> getById()
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry1 as any)) // update 1: getById() (current)
        .mockReturnValueOnce(ok(mockEntry1 as any)) // update 1: getJournalEntryById() (Foundry)
        .mockReturnValueOnce(ok(mockUpdated1 as any)) // update 1: getById() (updated)
        .mockReturnValueOnce(ok(mockEntry2 as any)) // update 2: getById() (current)
        .mockReturnValueOnce(ok(mockEntry2 as any)) // update 2: getJournalEntryById() (Foundry)
        .mockReturnValueOnce(ok(mockUpdated2 as any)); // update 2: getById() (updated)
      vi.mocked(mockFoundryDocument.update)
        .mockResolvedValueOnce(ok(mockUpdated1 as any))
        .mockResolvedValueOnce(ok(mockUpdated2 as any));

      const result = await adapter.updateMany([
        { id: "journal-1", changes: { name: "Updated 1" } },
        { id: "journal-2", changes: { name: "Updated 2" } },
      ]);

      expectResultOk(result);
      expect(result.value).toHaveLength(2);
    });

    it("should handle errors in updateMany", async () => {
      const mockEntry1 = { id: "journal-1", name: "Old 1", update: vi.fn() };
      const mockUpdated1 = { id: "journal-1", name: "Updated 1" };
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry1 as any)) // update 1: getById() (current)
        .mockReturnValueOnce(ok(mockEntry1 as any)) // update 1: getJournalEntryById() (Foundry)
        .mockReturnValueOnce(ok(mockUpdated1 as any)) // update 1: getById() (updated)
        .mockReturnValueOnce(ok(null)); // update 2: entity not found
      vi.mocked(mockFoundryDocument.update).mockResolvedValueOnce(ok(mockUpdated1 as any));

      const result = await adapter.updateMany([
        { id: "journal-1", changes: { name: "Updated 1" } },
        { id: "journal-2", changes: { name: "Updated 2" } },
      ]);

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });
  });

  describe("patch", () => {
    it("should patch journal (alias for update)", async () => {
      const mockEntry = { id: "journal-1", name: "Old Name", update: vi.fn() };
      const mockPatched = { id: "journal-1", name: "Patched Name" };
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry as any)) // getById() (current)
        .mockReturnValueOnce(ok(mockEntry as any)) // getJournalEntryById() (Foundry)
        .mockReturnValueOnce(ok(mockPatched as any)); // getById() (updated)
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(ok(mockPatched as any));

      const result = await adapter.patch("journal-1", { name: "Patched Name" });

      expectResultOk(result);
      expect(result.value.name).toBe("Patched Name");
    });
  });

  describe("upsert", () => {
    it("should create if not exists", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));
      const mockJournalEntryClass = {
        create: vi.fn(),
      };
      (globalThis as any).JournalEntry = mockJournalEntryClass;
      vi.mocked(mockFoundryDocument.create).mockResolvedValue(
        ok({ id: "new-id", name: "New Journal" } as any)
      );

      const result = await adapter.upsert("new-id", { name: "New Journal" });

      expectResultOk(result);
      expect(result.value.id).toBe("new-id");
    });

    it("should update if exists", async () => {
      const mockEntry = { id: "journal-1", name: "Old Name", update: vi.fn() };
      const mockUpdatedEntry = { id: "journal-1", name: "Updated Name" };
      // exists() calls getById() which calls getJournalEntryById()
      // update() calls getById() which calls getJournalEntryById() (for current entity check)
      // update() calls getJournalEntryById() again (for Foundry entry)
      // update() calls getById() again (for updated entity)
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok(mockEntry as any)) // exists() -> getById()
        .mockReturnValueOnce(ok(mockEntry as any)) // update() -> getById() (current check)
        .mockReturnValueOnce(ok(mockEntry as any)) // update() -> getJournalEntryById() (Foundry entry)
        .mockReturnValueOnce(ok(mockUpdatedEntry as any)); // update() -> getById() (updated entity)
      vi.mocked(mockFoundryDocument.update).mockResolvedValue(ok(mockUpdatedEntry as any));

      const result = await adapter.upsert("journal-1", { name: "Updated Name" });

      expectResultOk(result);
      expect(result.value.name).toBe("Updated Name");
    });

    it("should handle errors from exists in upsert", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        err(createFoundryError("API_NOT_AVAILABLE", "Collection not available"))
      );

      const result = await adapter.upsert("journal-1", { name: "New Journal" });

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to check if journal");
    });
  });

  describe("delete", () => {
    it("should delete journal successfully", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(
        ok({ id: "journal-1", name: "Journal 1", delete: vi.fn() } as any)
      );
      vi.mocked(mockFoundryDocument.delete).mockResolvedValue(ok(undefined));

      const result = await adapter.delete("journal-1");

      expectResultOk(result);
      expect(mockFoundryDocument.delete).toHaveBeenCalled();
    });

    it("should handle entity not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));

      const result = await adapter.delete("nonexistent");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle delete operation failure", async () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
        delete: vi.fn(),
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));
      vi.mocked(mockFoundryDocument.delete).mockResolvedValue(
        err({
          code: "OPERATION_FAILED",
          message: "Delete failed",
        } as any)
      );

      const result = await adapter.delete("journal-1");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to delete journal");
    });
  });

  describe("deleteMany", () => {
    it("should delete multiple journals", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok({ id: "journal-1", delete: vi.fn() } as any))
        .mockReturnValueOnce(ok({ id: "journal-2", delete: vi.fn() } as any));
      vi.mocked(mockFoundryDocument.delete)
        .mockResolvedValueOnce(ok(undefined))
        .mockResolvedValueOnce(ok(undefined));

      const result = await adapter.deleteMany(["journal-1", "journal-2"]);

      expectResultOk(result);
    });

    it("should handle errors in deleteMany", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById)
        .mockReturnValueOnce(ok({ id: "journal-1", delete: vi.fn() } as any))
        .mockReturnValueOnce(ok(null)); // Second journal not found
      vi.mocked(mockFoundryDocument.delete).mockResolvedValueOnce(ok(undefined));

      const result = await adapter.deleteMany(["journal-1", "journal-2"]);

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });
  });

  describe("getFlag", () => {
    it("should get flag value successfully", () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));
      vi.mocked(mockFoundryDocument.getFlag).mockReturnValue(ok("flag-value"));

      const result = adapter.getFlag("journal-1", "scope", "key");

      expectResultOk(result);
      expect(result.value).toBe("flag-value");
    });

    it("should return null for unset flag", () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));
      vi.mocked(mockFoundryDocument.getFlag).mockReturnValue(ok(null));

      const result = adapter.getFlag("journal-1", "scope", "key");

      expectResultOk(result);
      expect(result.value).toBeNull();
    });

    it("should handle entity not found", () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));

      const result = adapter.getFlag("nonexistent", "scope", "key");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle getFlag operation failure", () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));
      vi.mocked(mockFoundryDocument.getFlag).mockReturnValue(
        err({
          code: "OPERATION_FAILED",
          message: "Get flag failed",
        } as any)
      );

      const result = adapter.getFlag("journal-1", "scope", "key");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get flag");
    });

    it("should handle getFlag when document does not support flags", () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
        // No getFlag or setFlag methods
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));

      const result = adapter.getFlag("journal-1", "scope", "key");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Document does not support flags");
    });
  });

  describe("setFlag", () => {
    it("should set flag successfully", async () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));
      vi.mocked(mockFoundryDocument.setFlag).mockResolvedValue(ok(undefined));

      const result = await adapter.setFlag("journal-1", "scope", "key", "value");

      expectResultOk(result);
      expect(mockFoundryDocument.setFlag).toHaveBeenCalled();
    });

    it("should handle entity not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));

      const result = await adapter.setFlag("nonexistent", "scope", "key", "value");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle setFlag when document does not support flags", async () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));

      const result = await adapter.setFlag("journal-1", "scope", "key", "value");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Document does not support flags");
    });
  });

  describe("unsetFlag", () => {
    it("should unset flag successfully", async () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));
      vi.mocked(mockFoundryDocument.unsetFlag).mockResolvedValue(ok(undefined));

      const result = await adapter.unsetFlag("journal-1", "scope", "key");

      expectResultOk(result);
      expect(mockFoundryDocument.unsetFlag).toHaveBeenCalled();
    });

    it("should handle entity not found", async () => {
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(null));

      const result = await adapter.unsetFlag("nonexistent", "scope", "key");

      expectResultErr(result);
      expect(result.error.code).toBe("ENTITY_NOT_FOUND");
    });

    it("should handle setFlag operation failure", async () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));
      vi.mocked(mockFoundryDocument.setFlag).mockResolvedValue(
        err({
          code: "OPERATION_FAILED",
          message: "Set flag failed",
        } as any)
      );

      const result = await adapter.setFlag("journal-1", "scope", "key", "value");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to set flag");
    });

    it("should handle unsetFlag when document does not support flags", async () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));

      const result = await adapter.unsetFlag("journal-1", "scope", "key");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Document does not support flags");
    });

    it("should handle unsetFlag operation failure", async () => {
      const mockEntry = {
        id: "journal-1",
        name: "Journal 1",
        getFlag: vi.fn(),
        setFlag: vi.fn(),
      };
      vi.mocked(mockFoundryGame.getJournalEntryById).mockReturnValue(ok(mockEntry as any));
      vi.mocked(mockFoundryDocument.unsetFlag).mockResolvedValue(
        err({
          code: "OPERATION_FAILED",
          message: "Unset flag failed",
        } as any)
      );

      const result = await adapter.unsetFlag("journal-1", "scope", "key");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to unset flag");
    });
  });

  describe("DIFoundryJournalRepositoryAdapter", () => {
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

      const diAdapter = new DIFoundryJournalRepositoryAdapter(mockFoundryGame, mockFoundryDocument);

      expect(diAdapter).toBeInstanceOf(DIFoundryJournalRepositoryAdapter);
      expect(diAdapter).toBeInstanceOf(FoundryJournalRepositoryAdapter);
    });
  });
});
