import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ShowAllHiddenJournalsUseCase,
  DIShowAllHiddenJournalsUseCase,
} from "../show-all-hidden-journals.use-case";
import type { PlatformJournalCollectionPort } from "@/domain/ports/collections/platform-journal-collection-port.interface";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { PlatformJournalDirectoryUiPort } from "@/domain/ports/platform-journal-directory-ui-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalVisibilityConfig } from "@/application/services/JournalVisibilityConfig";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import { ok, err } from "@/domain/utils/result";

describe("ShowAllHiddenJournalsUseCase", () => {
  let mockJournalCollection: PlatformJournalCollectionPort;
  let mockJournalRepository: PlatformJournalRepository;
  let mockJournalDirectoryUI: PlatformJournalDirectoryUiPort;
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

    mockJournalDirectoryUI = {
      rerenderJournalDirectory: vi.fn(),
    } as unknown as PlatformJournalDirectoryUiPort;

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
      mockJournalDirectoryUI,
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

      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

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

      expect(mockJournalDirectoryUI.rerenderJournalDirectory).toHaveBeenCalledTimes(1);
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

      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0); // No journals changed
      }

      expect(mockJournalRepository.setFlag).not.toHaveBeenCalled();
      expect(mockJournalDirectoryUI.rerenderJournalDirectory).toHaveBeenCalledTimes(1);
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

      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

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

      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

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

      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(1); // Only 1 journal changed (journal-1 failed)
      }

      expect(mockNotifications.warn).toHaveBeenCalled();
    });

    it("should trigger UI re-render after processing", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(false));
      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      expect(mockJournalDirectoryUI.rerenderJournalDirectory).toHaveBeenCalledTimes(1);
    });

    it("should log warning if rerender fails", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(false));
      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(
        err({ code: "OPERATION_FAILED", message: "Rerender failed" })
      );

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        "Journal-Verzeichnis konnte nicht neu gerendert werden",
        expect.any(Object),
        expect.any(Object)
      );
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
      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

      await useCase.execute();

      expect(mockNotifications.info).toHaveBeenCalledWith("2 Journale wieder eingeblendet", {
        count: 2,
      });
    });

    it("should show info notification when no journals are hidden", async () => {
      const journals: JournalEntry[] = [{ id: "journal-1", name: "Journal 1" }];

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(ok(false));
      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

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
      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

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
      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(0); // No journals changed due to error
      }
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected error processing journal"),
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
      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

      const result = await useCase.execute();

      expect(result.ok).toBe(true);
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected error processing journal"),
        expect.objectContaining({
          error: "String error",
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
      // First journal: getFlag fails
      vi.mocked(mockJournalRepository.getFlag)
        .mockReturnValueOnce(err({ code: "OPERATION_FAILED", message: "Failed to read flag" }))
        .mockReturnValueOnce(ok(true));
      vi.mocked(mockJournalRepository.setFlag).mockResolvedValueOnce(ok(undefined));
      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

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
      // Create 7 journals, all failing to get flag
      const journals: JournalEntry[] = Array.from({ length: 7 }, (_, i) => ({
        id: `journal-${i + 1}`,
        name: `Journal ${i + 1}`,
      }));

      vi.mocked(mockJournalCollection.getAll).mockReturnValue(ok(journals));
      vi.mocked(mockJournalRepository.getFlag).mockReturnValue(
        err({ code: "OPERATION_FAILED", message: "Failed to read flag" })
      );
      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

      await useCase.execute();

      // Should log warning with errorCount = 7, but errors array should be limited to 5
      const warnCall = vi.mocked(mockNotifications.warn).mock.calls.find((call) =>
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
      vi.mocked(mockJournalDirectoryUI.rerenderJournalDirectory).mockReturnValue(ok(true));

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
  });

  describe("DIShowAllHiddenJournalsUseCase", () => {
    it("should have correct dependencies", () => {
      expect(DIShowAllHiddenJournalsUseCase.dependencies).toBeDefined();
      expect(DIShowAllHiddenJournalsUseCase.dependencies.length).toBe(5);
    });
  });
});
