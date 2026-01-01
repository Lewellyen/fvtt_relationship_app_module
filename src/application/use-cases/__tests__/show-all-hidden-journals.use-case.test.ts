import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ShowAllHiddenJournalsUseCase,
  DIShowAllHiddenJournalsUseCase,
} from "../show-all-hidden-journals.use-case";
import type { PlatformJournalCollectionPort } from "@/domain/ports/collections/platform-journal-collection-port.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalVisibilityConfig } from "@/application/services/JournalVisibilityConfig";
import type { JournalDirectoryRerenderScheduler } from "@/application/services/JournalDirectoryRerenderScheduler";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import { ok, err } from "@/domain/utils/result";

describe("ShowAllHiddenJournalsUseCase", () => {
  let mockJournalCollection: PlatformJournalCollectionPort;
  let mockJournalRepository: PlatformJournalRepository;
  let mockScheduler: JournalDirectoryRerenderScheduler;
  let mockNotifications: NotificationPublisherPort;
  let mockConfig: JournalVisibilityConfig;
  let useCase: ShowAllHiddenJournalsUseCase;

  beforeEach(() => {
    mockJournalCollection = {
      getAll: vi.fn(),
    } as unknown as PlatformJournalCollectionPort;

    mockJournalRepository = {
      getFlag: vi.fn(),
      setFlag: vi.fn(),
    } as unknown as PlatformJournalRepository;

    mockScheduler = {
      requestRerender: vi.fn(),
      cancelPending: vi.fn(),
    } as unknown as JournalDirectoryRerenderScheduler;

    mockNotifications = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as NotificationPublisherPort;

    mockConfig = {
      moduleNamespace: "fvtt_relationship_app_module",
      hiddenFlagKey: "hidden",
      unknownName: "Unknown",
      cacheKeyFactory: vi.fn(),
    };

    useCase = new ShowAllHiddenJournalsUseCase(
      mockJournalCollection,
      mockJournalRepository,
      mockScheduler,
      mockNotifications,
      mockConfig
    );
  });

  describe("execute", () => {
    it("should return error if getAll fails", async () => {
      vi.mocked(mockJournalCollection.getAll).mockReturnValue(
        err({ code: "PLATFORM_ERROR", message: "Failed to get journals" })
      );

      const result = await useCase.execute();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Failed to get all journals");
      }
    });

    it("should set hidden flag to false for journals with hidden=true", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
        { id: "journal-3", name: "Journal 3" },
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));

      // Journal 1: hidden=true -> should be changed
      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(ok(true))
        .mockReturnValueOnce(ok(false)) // Journal 2: already false
        .mockReturnValueOnce(ok(true)); // Journal 3: hidden=true -> should be changed

      vi.mocked(mockJournalRepository.setFlag)
        .mockResolvedValueOnce(ok(undefined))
        .mockResolvedValueOnce(ok(undefined));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(2); // 2 journals changed
      }

      expect(mockJournalRepository.setFlag).toHaveBeenCalledTimes(2);
      expect(mockJournalRepository.setFlag).toHaveBeenCalledWith(
        "journal-1",
        "fvtt_relationship_app_module",
        "hidden",
        false
      );
      expect(mockJournalRepository.setFlag).toHaveBeenCalledWith(
        "journal-3",
        "fvtt_relationship_app_module",
        "hidden",
        false
      );

      // Verify scheduler is called when journals are changed
      expect(mockScheduler.requestRerender).toHaveBeenCalledTimes(1);
    });

    it("should not change journals that already have hidden=false", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));

      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(ok(false))
        .mockReturnValueOnce(ok(false));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0); // No journals changed
      }

      expect(mockJournalRepository.setFlag).not.toHaveBeenCalled();
      // No journals changed, so scheduler should not be called
      expect(mockScheduler.requestRerender).not.toHaveBeenCalled();
    });

    it("should handle journals with undefined or null hidden flag", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));

      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(ok(undefined))
        .mockReturnValueOnce(ok(null));

      vi.mocked(mockJournalRepository.setFlag)
        .mockResolvedValueOnce(ok(undefined))
        .mockResolvedValueOnce(ok(undefined));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(2); // Both changed (undefined and null are not false)
      }

      expect(mockJournalRepository.setFlag).toHaveBeenCalledTimes(2);
    });

    it("should continue processing other journals if one fails", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
        { id: "journal-3", name: "Journal 3" },
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));

      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(ok(true))
        .mockReturnValueOnce(err({ code: "OPERATION_FAILED", message: "Failed to read flag" }))
        .mockReturnValueOnce(ok(true));

      vi.mocked(mockJournalRepository.setFlag)
        .mockResolvedValueOnce(ok(undefined))
        .mockResolvedValueOnce(ok(undefined));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(2); // 2 journals changed (journal-2 failed but didn't stop processing)
      }

      expect(mockNotifications.warn).toHaveBeenCalled();
    });

    it("should handle setFlag failures gracefully", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));

      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(ok(true))
        .mockReturnValueOnce(ok(true));

      vi.mocked(mockJournalRepository.setFlag)
        .mockResolvedValueOnce(err({ code: "OPERATION_FAILED", message: "Failed to set flag" }))
        .mockResolvedValueOnce(ok(undefined));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(1); // Only 1 journal changed (journal-1 failed)
      }

      expect(mockNotifications.warn).toHaveBeenCalled();
    });

    it("should request re-render via scheduler when journals are changed", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));
      vi.mocked(mockJournalRepository.setFlag).mockResolvedValue(ok(undefined));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      expect(mockScheduler.requestRerender).toHaveBeenCalledTimes(1);
    });

    it("should not request re-render when no journals are changed", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(false));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      expect(mockScheduler.requestRerender).not.toHaveBeenCalled();
    });

    it("should show info notification with count", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(ok(true))
        .mockReturnValueOnce(ok(true));
      vi.mocked(mockJournalRepository.setFlag)
        .mockResolvedValueOnce(ok(undefined))
        .mockResolvedValueOnce(ok(undefined));

      await useCase.execute();

      expect(mockNotifications.info).toHaveBeenCalledWith("2 Journale wieder eingeblendet", {
        count: 2,
      });
    });

    it("should show info notification when no journals are hidden", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(false));

      await useCase.execute();

      expect(mockNotifications.info).toHaveBeenCalledWith(
        "Keine versteckten Journale gefunden",
        {}
      );
    });

    it("should show singular notification when exactly one journal is unhidden", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));
      vi.mocked(mockJournalRepository.setFlag).mockResolvedValue(ok(undefined));

      await useCase.execute();

      expect(mockNotifications.info).toHaveBeenCalledWith("1 Journal wieder eingeblendet", {
        count: 1,
      });
    });

    it("should handle unexpected errors in try-catch block", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0); // No journals changed due to error
      }
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected error checking journal"),
        expect.objectContaining({
          error: "Unexpected error",
          journalId: "journal-1",
        }),
        expect.any(Object)
      );
    });

    it("should handle non-Error exceptions in try-catch block", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockImplementation(() => {
        throw "String error"; // Non-Error exception
      });

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected error checking journal"),
        expect.objectContaining({
          error: "String error",
          journalId: "journal-1",
        }),
        expect.any(Object)
      );
    });

    it("should handle non-Error object exceptions in getFlag try-catch block", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockImplementation(() => {
        throw { code: "CUSTOM_ERROR", message: "Custom error object" }; // Non-Error object exception
      });

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected error checking journal"),
        expect.objectContaining({
          error: expect.stringContaining("[object Object]"), // String() converts object to string
          journalId: "journal-1",
        }),
        expect.any(Object)
      );
    });

    it("should log warning when errors array has entries", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      // Both journals need to be updated
      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(ok(true))
        .mockReturnValueOnce(ok(true));
      // First journal: setFlag fails
      vi.mocked(mockJournalRepository.setFlag)
        .mockResolvedValueOnce(err({ code: "OPERATION_FAILED", message: "Failed to set flag" }))
        .mockResolvedValueOnce(ok(undefined));

      await useCase.execute();

      // Should log warning about errors
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Fehler beim Verarbeiten von Journals"),
        expect.objectContaining({
          errorCount: 1,
          errors: expect.any(Array),
        }),
        expect.any(Object)
      );
    });

    it("should limit errors array to first 5 entries when logging warnings", async () => {
      // Create 7 journals, all need to be updated
      const journals: JournalEntry[] = Array.from({ length: 7 }, (_, i) => ({
        id: `journal-${i + 1}`,
        name: `Journal ${i + 1}`,
      }));

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      // All journals have hidden=true
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true));
      // All setFlag calls fail
      vi.mocked(mockJournalRepository.setFlag).mockResolvedValue(
        err({ code: "OPERATION_FAILED", message: "Failed to set flag" })
      );

      await useCase.execute();

      // Should log warning with errorCount = 7, but errors array should be limited to 5
      const warnCall = vi
        .mocked(mockNotifications.warn)
        .mock.calls.find((call) =>
          call[0]?.toString().includes("Fehler beim Verarbeiten von Journals")
        );
      expect(warnCall).toBeDefined();
      if (warnCall) {
        const errorDetails = warnCall[1] as { errorCount: number; errors: unknown[] };
        expect(errorDetails.errorCount).toBe(7);
        expect(errorDetails.errors).toHaveLength(5); // Should be limited to 5
      }
    });

    it("should use journal name when available, otherwise journal id in error messages", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: null }, // No name
        { id: "journal-2", name: "Journal 2" }, // Has name
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(err({ code: "OPERATION_FAILED", message: "Failed to read flag" }))
        .mockReturnValueOnce(err({ code: "OPERATION_FAILED", message: "Failed to read flag" }));

      await useCase.execute();

      // Check that warnings use journal.id when name is null
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("journal-1"),
        expect.any(Object),
        expect.any(Object)
      );
      // Check that warnings use journal.name when available
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Journal 2"),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should handle exception thrown by setFlag during update", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: null }, // No name - to test journalId fallback
        { id: "journal-2", name: "Journal 2" }, // Has name
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(ok(true)) // Journal 1 needs update
        .mockReturnValueOnce(ok(true)); // Journal 2 needs update
      // First setFlag succeeds, second throws exception
      vi.mocked(mockJournalRepository.setFlag)
        .mockResolvedValueOnce(ok(undefined))
        .mockRejectedValueOnce(new Error("Unexpected exception during setFlag"));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(1); // Only first journal was updated successfully
      }

      // Should log warning with journalId (since journal-2 has no name)
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected error processing journal"),
        expect.objectContaining({
          error: "Unexpected exception during setFlag",
          journalId: "journal-2",
        }),
        expect.any(Object)
      );

      // Should have one error in errors array
      const warnCall = vi
        .mocked(mockNotifications.warn)
        .mock.calls.find((call) =>
          call[0]?.toString().includes("Fehler beim Verarbeiten von Journals")
        );
      expect(warnCall).toBeDefined();
      if (warnCall) {
        const errorDetails = warnCall[1] as { errorCount: number; errors: unknown[] };
        expect(errorDetails.errorCount).toBe(1);
        expect(errorDetails.errors[0]).toMatchObject({
          journalId: "journal-2",
          error: "Unexpected exception during setFlag",
        });
      }
    });

    it("should handle non-Error exception thrown by setFlag during update", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true)); // Needs update
      // setFlag throws non-Error exception (String)
      vi.mocked(mockJournalRepository.setFlag).mockRejectedValueOnce("String error during setFlag");

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0); // No journals were updated due to exception
      }

      // Should log warning with String error message
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected error processing journal"),
        expect.objectContaining({
          error: "String error during setFlag",
          journalId: "journal-1",
        }),
        expect.any(Object)
      );

      // Should have one error in errors array
      const warnCall = vi
        .mocked(mockNotifications.warn)
        .mock.calls.find((call) =>
          call[0]?.toString().includes("Fehler beim Verarbeiten von Journals")
        );
      expect(warnCall).toBeDefined();
      if (warnCall) {
        const errorDetails = warnCall[1] as { errorCount: number; errors: unknown[] };
        expect(errorDetails.errorCount).toBe(1);
        expect(errorDetails.errors[0]).toMatchObject({
          journalId: "journal-1",
          error: "String error during setFlag",
        });
      }
    });

    it("should use journalId when journal name is null in setFlag exception message", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: null }, // No name - to test journalId fallback in setFlag catch block
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true)); // Needs update
      // setFlag throws non-Error exception (String)
      vi.mocked(mockJournalRepository.setFlag).mockRejectedValueOnce("String error during setFlag");

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0); // No journals were updated due to exception
      }

      // Should log warning with journalId (since journal has no name)
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("journal-1"), // Should use journalId when name is null
        expect.objectContaining({
          error: "String error during setFlag",
          journalId: "journal-1",
        }),
        expect.any(Object)
      );
    });

    it("should use journalId when journal name is null in setFlag error message", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: null }, // No name
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(true)); // Needs update
      vi.mocked(mockJournalRepository.setFlag).mockResolvedValue(
        err({ code: "OPERATION_FAILED", message: "Failed to set flag" })
      );

      await useCase.execute();

      // Should use journalId when name is null
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("journal-1"),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should handle exception thrown by getFlag during check (with null journal name)", async () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: null }, // No name - to test journal.id fallback
      ];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      // getFlag throws exception instead of returning Result
      vi.mocked(mockJournalRepository.getFlag).mockImplementation(() => {
        throw new Error("Unexpected exception during getFlag");
      });

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0); // No journals were updated due to exception
      }

      // Should log warning with journal.id (since journal has no name)
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected error checking journal"),
        expect.objectContaining({
          error: "Unexpected exception during getFlag",
          journalId: "journal-1",
        }),
        expect.any(Object)
      );
    });
  });

  describe("DIShowAllHiddenJournalsUseCase", () => {
    it("should have correct dependencies", () => {
      expect(DIShowAllHiddenJournalsUseCase.dependencies).toBeDefined();
      expect(DIShowAllHiddenJournalsUseCase.dependencies.length).toBe(5);
    });
  });
});
