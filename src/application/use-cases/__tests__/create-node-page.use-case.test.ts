/**
 * Tests for CreateNodePageUseCase
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateNodePageUseCase, DICreateNodePageUseCase } from "../create-node-page.use-case";
import type { PlatformJournalRepository } from "@/domain/ports/repositories/platform-journal-repository.interface";
import type { INodeDataService } from "@/application/services/NodeDataService";
import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { PlatformPageCreationPort } from "@/domain/ports/repositories/platform-page-creation-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { ServiceError } from "@/application/types/use-case-error.types";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.types";
import type { EntityCollectionError } from "@/domain/ports/collections/entity-collection-error.interface";
import { RELATIONSHIP_NODE_SCHEMA_VERSION } from "@/domain/types/relationship-node-data.interface";
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

function createMockNodeDataService(): INodeDataService {
  return {
    loadNodeData: vi.fn(),
    saveNodeData: vi.fn(),
    validateNodeData: vi.fn(),
  } as unknown as INodeDataService;
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

function createValidNodeData(): RelationshipNodeData {
  return {
    schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
    nodeKey: "JournalEntry.page-abc123",
    name: "Test Node",
    kind: "person",
    relation: "friend",
    descriptions: {},
    reveal: {
      public: true,
      hidden: false,
    },
  };
}

describe("CreateNodePageUseCase", () => {
  let useCase: CreateNodePageUseCase;
  let mockJournalRepository: PlatformJournalRepository;
  let mockNodeDataService: INodeDataService;
  let mockPageRepository: PlatformRelationshipPageRepositoryPort;
  let mockPageCreationPort: PlatformPageCreationPort;
  let mockNotifications: NotificationPublisherPort;

  beforeEach(() => {
    mockJournalRepository = createMockJournalRepository();
    mockNodeDataService = createMockNodeDataService();
    mockPageRepository = createMockRepository();
    mockPageCreationPort = createMockPageCreationPort();
    mockNotifications = createMockNotifications();
    useCase = new CreateNodePageUseCase(
      mockJournalRepository,
      mockNodeDataService,
      mockPageRepository,
      mockPageCreationPort,
      mockNotifications
    );
  });

  describe("execute", () => {
    it("should return error when page creation fails", async () => {
      const journalEntryId = "journal-123";
      const nodeData = createValidNodeData();
      const creationError: EntityRepositoryError = {
        code: "OPERATION_FAILED",
        message: "Failed to create page",
      };

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(
        ok({ id: journalEntryId, name: "Test Journal" })
      );
      vi.mocked(mockNodeDataService.validateNodeData).mockReturnValue(ok(undefined));
      vi.mocked(mockPageCreationPort.createNodePage).mockResolvedValue(err(creationError));

      const result = await useCase.execute({ journalEntryId, nodeData });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
        expect(result.error.message).toContain("Failed to create node page");
      }
    });

    it("should return error when journal entry not found", async () => {
      const journalEntryId = "journal-123";
      const nodeData = createValidNodeData();
      const journalError: EntityCollectionError = {
        code: "ENTITY_NOT_FOUND",
        message: "Journal not found",
      };

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(err(journalError));

      const result = await useCase.execute({ journalEntryId, nodeData });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("JOURNAL_NOT_FOUND");
      }
      expect(mockNodeDataService.validateNodeData).not.toHaveBeenCalled();
    });

    it("should return validation error when node data is invalid", async () => {
      const journalEntryId = "journal-123";
      const nodeData = createValidNodeData();
      const validationError = {
        code: "VALIDATION_FAILED" as const,
        message: "Validation failed",
        details: {},
      };

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(
        ok({ id: journalEntryId, name: "Test Journal" })
      );
      vi.mocked(mockNodeDataService.validateNodeData).mockReturnValue(err(validationError));

      const result = await useCase.execute({ journalEntryId, nodeData });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });

    it("should create page successfully", async () => {
      const journalEntryId = "journal-123";
      const pageId = "page-123";
      const nodeData = createValidNodeData();

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(
        ok({ id: journalEntryId, name: "Test Journal" })
      );
      vi.mocked(mockNodeDataService.validateNodeData).mockReturnValue(ok(undefined));
      vi.mocked(mockPageCreationPort.createNodePage).mockResolvedValue(ok(pageId));
      vi.mocked(mockNodeDataService.saveNodeData).mockResolvedValue(ok(undefined));
      vi.mocked(mockPageRepository.setNodeMarker).mockResolvedValue(ok(undefined));

      const result = await useCase.execute({ journalEntryId, nodeData });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(pageId);
      }
      expect(mockPageCreationPort.createNodePage).toHaveBeenCalledWith(journalEntryId, nodeData);
      expect(mockNodeDataService.saveNodeData).toHaveBeenCalledWith(pageId, nodeData);
      expect(mockPageRepository.setNodeMarker).toHaveBeenCalledWith(pageId, true);
    });

    it("should return error when save fails after page creation", async () => {
      const journalEntryId = "journal-123";
      const pageId = "page-123";
      const nodeData = createValidNodeData();
      const saveError: ServiceError = {
        code: "OPERATION_FAILED",
        message: "Save failed",
      };

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(
        ok({ id: journalEntryId, name: "Test Journal" })
      );
      vi.mocked(mockNodeDataService.validateNodeData).mockReturnValue(ok(undefined));
      vi.mocked(mockPageCreationPort.createNodePage).mockResolvedValue(ok(pageId));
      vi.mocked(mockNodeDataService.saveNodeData).mockResolvedValue(err(saveError));

      const result = await useCase.execute({ journalEntryId, nodeData });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("OPERATION_FAILED");
      }
      expect(mockNotifications.error).toHaveBeenCalled();
    });

    it("should warn when marker flag setting fails but continue", async () => {
      const journalEntryId = "journal-123";
      const pageId = "page-123";
      const nodeData = createValidNodeData();
      const flagError: EntityRepositoryError = {
        code: "OPERATION_FAILED",
        message: "Flag failed",
      };

      vi.mocked(mockJournalRepository.getById).mockResolvedValue(
        ok({ id: journalEntryId, name: "Test Journal" })
      );
      vi.mocked(mockNodeDataService.validateNodeData).mockReturnValue(ok(undefined));
      vi.mocked(mockPageCreationPort.createNodePage).mockResolvedValue(ok(pageId));
      vi.mocked(mockNodeDataService.saveNodeData).mockResolvedValue(ok(undefined));
      vi.mocked(mockPageRepository.setNodeMarker).mockResolvedValue(err(flagError));

      const result = await useCase.execute({ journalEntryId, nodeData });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(pageId);
      }
      expect(mockNotifications.warn).toHaveBeenCalled();
    });
  });

  describe("DICreateNodePageUseCase", () => {
    it("should extend CreateNodePageUseCase with DI dependencies", () => {
      expect(DICreateNodePageUseCase.dependencies).toEqual([
        expect.anything(), // platformJournalRepositoryToken
        expect.anything(), // nodeDataServiceToken
        expect.anything(), // platformRelationshipPageRepositoryPortToken
        expect.anything(), // platformPageCreationPortToken
        expect.anything(), // notificationPublisherPortToken
      ]);
      expect(DICreateNodePageUseCase.dependencies).toHaveLength(5);
    });

    it("should create instance correctly", () => {
      const diUseCase = new DICreateNodePageUseCase(
        mockJournalRepository,
        mockNodeDataService,
        mockPageRepository,
        mockPageCreationPort,
        mockNotifications
      );
      expect(diUseCase).toBeInstanceOf(CreateNodePageUseCase);
      expect(diUseCase).toBeInstanceOf(DICreateNodePageUseCase);
    });
  });
});
