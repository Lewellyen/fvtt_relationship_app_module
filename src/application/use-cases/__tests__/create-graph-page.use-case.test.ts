/**
 * Tests for CreateGraphPageUseCase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateGraphPageUseCase, DICreateGraphPageUseCase } from "../create-graph-page.use-case";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { IGraphDataService } from "@/application/services/GraphDataService";
import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { PlatformPageCreationPort } from "@/domain/ports/repositories/platform-page-creation-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import type { ServiceError } from "@/application/types/use-case-error.types";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.types";
import type { EntityCollectionError } from "@/domain/ports/collections/entity-collection-error.interface";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";
import { ok, err } from "@/domain/utils/result";

function createMockJournalRepository(): PlatformJournalRepository {
  return {
    getAll: vi.fn(),
    getById: vi.fn(),
    getByIds: vi.fn(),
    exists: vi.fn(),
    count: vi.fn(),
    search: vi.fn(),
    query: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    patch: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    getFlag: vi.fn(),
    setFlag: vi.fn(),
    unsetFlag: vi.fn(),
  } as unknown as PlatformJournalRepository;
}

function createMockGraphDataService(): IGraphDataService {
  return {
    loadGraphData: vi.fn(),
    saveGraphData: vi.fn(),
    validateGraphData: vi.fn(),
  } as unknown as IGraphDataService;
}

function createMockRepository(): PlatformRelationshipPageRepositoryPort {
  return {
    getNodePageContent: vi.fn(),
    updateNodePageContent: vi.fn(),
    getGraphPageContent: vi.fn(),
    updateGraphPageContent: vi.fn(),
    setNodeMarker: vi.fn(),
    setGraphMarker: vi.fn(),
    getNodeMarker: vi.fn(),
    getGraphMarker: vi.fn(),
  } as unknown as PlatformRelationshipPageRepositoryPort;
}

function createMockPageCreationPort(): PlatformPageCreationPort {
  return {
    createNodePage: vi.fn(),
    createGraphPage: vi.fn(),
  } as unknown as PlatformPageCreationPort;
}

function createMockNotifications(): NotificationPublisherPort {
  return {
    debug: vi.fn().mockReturnValue(ok(undefined)),
    info: vi.fn().mockReturnValue(ok(undefined)),
    warn: vi.fn().mockReturnValue(ok(undefined)),
    error: vi.fn().mockReturnValue(ok(undefined)),
  } as unknown as NotificationPublisherPort;
}

function createValidGraphData(): RelationshipGraphData {
  return {
    schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
    graphKey: "JournalEntry.page-xyz789",
    nodeKeys: [],
    edges: [],
  };
}

describe("CreateGraphPageUseCase", () => {
  let useCase: CreateGraphPageUseCase;
  let mockJournalRepository: PlatformJournalRepository;
  let mockGraphDataService: IGraphDataService;
  let mockPageRepository: PlatformRelationshipPageRepositoryPort;
  let mockPageCreationPort: PlatformPageCreationPort;
  let mockNotifications: NotificationPublisherPort;

  beforeEach(() => {
    mockJournalRepository = createMockJournalRepository();
    mockGraphDataService = createMockGraphDataService();
    mockPageRepository = createMockRepository();
    mockPageCreationPort = createMockPageCreationPort();
    mockNotifications = createMockNotifications();
    useCase = new CreateGraphPageUseCase(
      mockJournalRepository,
      mockGraphDataService,
      mockPageRepository,
      mockPageCreationPort,
      mockNotifications
    );
  });

  describe("execute", () => {
    it("should return error when page creation fails", async () => {
      const journalEntryId = "journal-123";
      const graphData = createValidGraphData();
      const creationError: EntityRepositoryError = {
        code: "OPERATION_FAILED",
        message: "Failed to create page",
      };

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(
        ok({ id: journalEntryId, name: "Test Journal" })
      );
      vi.mocked(mockGraphDataService.validateGraphData).mockReturnValue(ok(undefined));
      vi.mocked(mockPageCreationPort.createGraphPage).mockResolvedValue(err(creationError));

      const result = await useCase.execute({ journalEntryId, graphData });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
        expect(result.error.message).toContain("Failed to create graph page");
      }
    });

    it("should return error when journal entry not found", async () => {
      const journalEntryId = "journal-123";
      const graphData = createValidGraphData();
      const journalError: EntityCollectionError = {
        code: "ENTITY_NOT_FOUND",
        message: "Journal not found",
      };

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(err(journalError));

      const result = await useCase.execute({ journalEntryId, graphData });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("JOURNAL_NOT_FOUND");
      }
      expect(mockGraphDataService.validateGraphData).not.toHaveBeenCalled();
    });

    it("should return validation error when graph data is invalid", async () => {
      const journalEntryId = "journal-123";
      const graphData = createValidGraphData();
      const validationError = {
        code: "VALIDATION_FAILED" as const,
        message: "Validation failed",
        details: {},
      };

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(
        ok({ id: journalEntryId, name: "Test Journal" })
      );
      vi.mocked(mockGraphDataService.validateGraphData).mockReturnValue(err(validationError));

      const result = await useCase.execute({ journalEntryId, graphData });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });

    it("should create page successfully", async () => {
      const journalEntryId = "journal-123";
      const pageId = "page-123";
      const graphData = createValidGraphData();

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(
        ok({ id: journalEntryId, name: "Test Journal" })
      );
      vi.mocked(mockGraphDataService.validateGraphData).mockReturnValue(ok(undefined));
      vi.mocked(mockPageCreationPort.createGraphPage).mockResolvedValue(ok(pageId));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(ok(undefined));
      vi.mocked(mockPageRepository.setGraphMarker).mockResolvedValue(ok(undefined));

      const result = await useCase.execute({ journalEntryId, graphData });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(pageId);
      }
      expect(mockPageCreationPort.createGraphPage).toHaveBeenCalledWith(journalEntryId, graphData);
      expect(mockGraphDataService.saveGraphData).toHaveBeenCalledWith(pageId, graphData);
      expect(mockPageRepository.setGraphMarker).toHaveBeenCalledWith(pageId, true);
    });

    it("should return error when save fails after page creation", async () => {
      const journalEntryId = "journal-123";
      const pageId = "page-123";
      const graphData = createValidGraphData();
      const saveError: ServiceError = {
        code: "OPERATION_FAILED",
        message: "Save failed",
      };

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(
        ok({ id: journalEntryId, name: "Test Journal" })
      );
      vi.mocked(mockGraphDataService.validateGraphData).mockReturnValue(ok(undefined));
      vi.mocked(mockPageCreationPort.createGraphPage).mockResolvedValue(ok(pageId));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(err(saveError));

      const result = await useCase.execute({ journalEntryId, graphData });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
      }
      expect(mockNotifications.error).toHaveBeenCalled();
    });

    it("should warn when marker flag setting fails but continue", async () => {
      const journalEntryId = "journal-123";
      const pageId = "page-123";
      const graphData = createValidGraphData();
      const flagError: EntityRepositoryError = {
        code: "OPERATION_FAILED",
        message: "Flag failed",
      };

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(
        ok({ id: journalEntryId, name: "Test Journal" })
      );
      vi.mocked(mockGraphDataService.validateGraphData).mockReturnValue(ok(undefined));
      vi.mocked(mockPageCreationPort.createGraphPage).mockResolvedValue(ok(pageId));
      vi.mocked(mockGraphDataService.saveGraphData).mockResolvedValue(ok(undefined));
      vi.mocked(mockPageRepository.setGraphMarker).mockResolvedValue(err(flagError));

      const result = await useCase.execute({ journalEntryId, graphData });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(pageId);
      }
      expect(mockNotifications.warn).toHaveBeenCalled();
    });
  });

  describe("DICreateGraphPageUseCase", () => {
    it("should extend CreateGraphPageUseCase with DI dependencies", () => {
      expect(DICreateGraphPageUseCase.dependencies).toEqual([
        expect.anything(), // platformJournalRepositoryToken
        expect.anything(), // graphDataServiceToken
        expect.anything(), // platformRelationshipPageRepositoryPortToken
        expect.anything(), // platformPageCreationPortToken
        expect.anything(), // notificationPublisherPortToken
      ]);
      expect(DICreateGraphPageUseCase.dependencies).toHaveLength(5);
    });

    it("should create instance correctly", () => {
      const diUseCase = new DICreateGraphPageUseCase(
        mockJournalRepository,
        mockGraphDataService,
        mockPageRepository,
        mockPageCreationPort,
        mockNotifications
      );
      expect(diUseCase).toBeInstanceOf(CreateGraphPageUseCase);
      expect(diUseCase).toBeInstanceOf(DICreateGraphPageUseCase);
    });
  });
});
