import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import {
  JournalOverviewService,
  DIJournalOverviewService,
} from "@/application/services/JournalOverviewService";
import type { PlatformJournalCollectionPort } from "@/domain/ports/collections/platform-journal-collection-port.interface";
import type { JournalVisibilityService } from "@/application/services/JournalVisibilityService";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";
import { ok, err } from "@/domain/utils/result";

function createMockJournalCollectionPort(): PlatformJournalCollectionPort {
  return {
    getAll: vi.fn().mockReturnValue(ok([])),
    getById: vi.fn().mockReturnValue(ok(null)),
    getByIds: vi.fn().mockReturnValue(ok([])),
    exists: vi.fn().mockReturnValue(ok(false)),
    count: vi.fn().mockReturnValue(ok(0)),
    search: vi.fn().mockReturnValue(ok([])),
    query: vi.fn(),
  } as unknown as PlatformJournalCollectionPort;
}

function createMockJournalVisibilityService(): JournalVisibilityService {
  return {
    getHiddenJournalEntries: vi.fn().mockReturnValue(ok([])),
  } as unknown as JournalVisibilityService;
}

function createMockNotificationPort(): NotificationPublisherPort {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as NotificationPublisherPort;
}

describe("JournalOverviewService", () => {
  let service: JournalOverviewService;
  let mockCollection: PlatformJournalCollectionPort;
  let mockVisibility: JournalVisibilityService;
  let mockNotifications: NotificationPublisherPort;

  beforeEach(() => {
    mockCollection = createMockJournalCollectionPort();
    mockVisibility = createMockJournalVisibilityService();
    mockNotifications = createMockNotificationPort();
    service = new JournalOverviewService(mockCollection, mockVisibility, mockNotifications);
  });

  describe("getAllJournalsWithVisibilityStatus", () => {
    it("should return all journals with visibility status", () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
        { id: "journal-3", name: "Journal 3" },
      ];

      const hiddenJournals: JournalEntry[] = [{ id: "journal-2", name: "Journal 2" }];

      (mockCollection.getAll as Mock).mockReturnValue(ok(journals));
      (mockVisibility.getHiddenJournalEntries as Mock).mockReturnValue(ok(hiddenJournals));

      const result = service.getAllJournalsWithVisibilityStatus();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({
          id: "journal-1",
          name: "Journal 1",
          isHidden: false,
        });
        expect(result.value[1]).toEqual({
          id: "journal-2",
          name: "Journal 2",
          isHidden: true,
        });
        expect(result.value[2]).toEqual({
          id: "journal-3",
          name: "Journal 3",
          isHidden: false,
        });
      }
    });

    it("should handle empty journal list", () => {
      (mockCollection.getAll as Mock).mockReturnValue(ok([]));
      (mockVisibility.getHiddenJournalEntries as Mock).mockReturnValue(ok([]));

      const result = service.getAllJournalsWithVisibilityStatus();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(0);
      }
    });

    it("should handle journals with null names", () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: null },
        { id: "journal-2", name: "Journal 2" },
      ];

      (mockCollection.getAll as Mock).mockReturnValue(ok(journals));
      (mockVisibility.getHiddenJournalEntries as Mock).mockReturnValue(ok([]));

      const result = service.getAllJournalsWithVisibilityStatus();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]).toEqual({
          id: "journal-1",
          name: null,
          isHidden: false,
        });
      }
    });

    it("should return error when collection getAll fails", () => {
      (mockCollection.getAll as Mock).mockReturnValue(
        err({ code: "COLLECTION_NOT_AVAILABLE", message: "Collection error" })
      );

      const result = service.getAllJournalsWithVisibilityStatus();

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Failed to get all journals");
      }
    });

    it("should continue with empty hidden list when visibility service fails", () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
      ];

      (mockCollection.getAll as Mock).mockReturnValue(ok(journals));
      (mockVisibility.getHiddenJournalEntries as Mock).mockReturnValue(
        err({ code: "PLATFORM_ERROR", message: "Visibility error" })
      );

      const result = service.getAllJournalsWithVisibilityStatus();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
        // All journals should be shown as visible when visibility service fails
        expect(result.value[0]?.isHidden).toBe(false);
        expect(result.value[1]?.isHidden).toBe(false);
      }

      // Should log warning
      expect(mockNotifications.warn).toHaveBeenCalledWith(
        "Failed to get hidden journals, showing all as visible",
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should log debug message with statistics", () => {
      const journals: JournalEntry[] = [
        { id: "journal-1", name: "Journal 1" },
        { id: "journal-2", name: "Journal 2" },
      ];

      const hiddenJournals: JournalEntry[] = [{ id: "journal-2", name: "Journal 2" }];

      (mockCollection.getAll as Mock).mockReturnValue(ok(journals));
      (mockVisibility.getHiddenJournalEntries as Mock).mockReturnValue(ok(hiddenJournals));

      service.getAllJournalsWithVisibilityStatus();

      expect(mockNotifications.debug).toHaveBeenCalledWith(
        expect.stringContaining("Retrieved"),
        expect.objectContaining({
          total: 2,
          hidden: 1,
          visible: 1,
        }),
        expect.any(Object)
      );
    });
  });

  describe("DIJournalOverviewService", () => {
    it("should have correct dependencies", () => {
      expect(DIJournalOverviewService.dependencies).toBeDefined();
      expect(DIJournalOverviewService.dependencies.length).toBe(3);
    });

    it("should extend JournalOverviewService", () => {
      const diService = new DIJournalOverviewService(
        mockCollection,
        mockVisibility,
        mockNotifications
      );
      expect(diService).toBeInstanceOf(JournalOverviewService);
    });
  });
});
