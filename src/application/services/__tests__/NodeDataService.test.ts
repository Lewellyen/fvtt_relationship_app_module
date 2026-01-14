/**
 * Tests for NodeDataService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NodeDataService, DINodeDataService } from "../NodeDataService";
import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { IMigrationService } from "../MigrationService";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.types";
import { RELATIONSHIP_NODE_SCHEMA_VERSION } from "@/domain/types/relationship-node-data.interface";
import { ok, err } from "@/domain/utils/result";

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

function createMockMigrationService(): IMigrationService {
  return {
    migrateToLatest: vi.fn(),
    getCurrentSchemaVersion: vi.fn(),
    needsMigration: vi.fn(),
  } as unknown as IMigrationService;
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

describe("NodeDataService", () => {
  let service: NodeDataService;
  let mockRepository: PlatformRelationshipPageRepositoryPort;
  let mockMigrationService: IMigrationService;
  let mockNotifications: NotificationPublisherPort;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockMigrationService = createMockMigrationService();
    mockNotifications = createMockNotifications();
    service = new NodeDataService(mockRepository, mockMigrationService, mockNotifications);
  });

  describe("validateNodeData", () => {
    it("should validate valid node data", () => {
      const data = createValidNodeData();
      const result = service.validateNodeData(data);

      expect(result.ok).toBe(true);
    });

    it("should reject invalid node data", () => {
      const invalidData = {
        schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
        // missing required fields
      } as unknown as RelationshipNodeData;

      const result = service.validateNodeData(invalidData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });
  });

  describe("loadNodeData", () => {
    it("should load node data successfully when no migration needed", async () => {
      const pageId = "page-123";
      const nodeData = createValidNodeData();

      vi.mocked(mockRepository.getNodePageContent).mockResolvedValue(ok(nodeData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(false);

      const result = await service.loadNodeData(pageId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(nodeData);
      }
      expect(mockRepository.getNodePageContent).toHaveBeenCalledWith(pageId);
    });

    it("should return error when repository returns error", async () => {
      const pageId = "page-123";
      const repositoryError: EntityRepositoryError = {
        code: "ENTITY_NOT_FOUND",
        message: "Page not found",
      };

      vi.mocked(mockRepository.getNodePageContent).mockResolvedValue(err(repositoryError));

      const result = await service.loadNodeData(pageId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REPOSITORY_ERROR");
      }
    });

    it("should migrate and save when migration is needed", async () => {
      const pageId = "page-123";
      const oldData = { schemaVersion: 0 } as unknown as RelationshipNodeData;
      const migratedData = createValidNodeData();

      vi.mocked(mockRepository.getNodePageContent).mockResolvedValue(ok(oldData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(true);
      vi.mocked(mockMigrationService.getCurrentSchemaVersion).mockReturnValue(0);
      vi.mocked(mockMigrationService.migrateToLatest).mockResolvedValue(ok(migratedData));
      vi.mocked(mockRepository.updateNodePageContent).mockResolvedValue(ok(undefined));

      const result = await service.loadNodeData(pageId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // The result should include lastVersion backup
        expect(result.value).toEqual({
          ...migratedData,
          lastVersion: oldData,
        });
      }
      expect(mockNotifications.debug).toHaveBeenCalledWith(
        `Node data at page ${pageId} needs migration`,
        { pageId, currentVersion: 0 },
        { channels: ["ConsoleChannel"] }
      );
      expect(mockMigrationService.migrateToLatest).toHaveBeenCalledWith(oldData, "node");
      // The saved data should include lastVersion backup
      expect(mockRepository.updateNodePageContent).toHaveBeenCalledWith(pageId, {
        ...migratedData,
        lastVersion: oldData,
      });
    });

    it("should return error when migration fails", async () => {
      const pageId = "page-123";
      const oldData = { schemaVersion: 0 } as unknown as RelationshipNodeData;
      const migrationError = {
        code: "MIGRATION_FAILED" as const,
        message: "Migration failed",
        details: {},
      };

      vi.mocked(mockRepository.getNodePageContent).mockResolvedValue(ok(oldData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(true);
      vi.mocked(mockMigrationService.getCurrentSchemaVersion).mockReturnValue(0);
      vi.mocked(mockMigrationService.migrateToLatest).mockResolvedValue(err(migrationError));

      const result = await service.loadNodeData(pageId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_FAILED");
      }
      expect(mockNotifications.error).toHaveBeenCalled();
    });

    it("should return error when save after migration fails", async () => {
      const pageId = "page-123";
      const oldData = { schemaVersion: 0 } as unknown as RelationshipNodeData;
      const migratedData = createValidNodeData();
      const saveError: EntityRepositoryError = {
        code: "OPERATION_FAILED",
        message: "Save failed",
      };

      vi.mocked(mockRepository.getNodePageContent).mockResolvedValue(ok(oldData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(true);
      vi.mocked(mockMigrationService.getCurrentSchemaVersion).mockReturnValue(0);
      vi.mocked(mockMigrationService.migrateToLatest).mockResolvedValue(ok(migratedData));
      vi.mocked(mockRepository.updateNodePageContent).mockResolvedValue(err(saveError));

      const result = await service.loadNodeData(pageId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REPOSITORY_ERROR");
      }
      expect(mockNotifications.error).toHaveBeenCalled();
    });

    it("should return validation error when raw data is invalid", async () => {
      const pageId = "page-123";
      const invalidData = { invalid: "data" } as unknown as RelationshipNodeData;

      vi.mocked(mockRepository.getNodePageContent).mockResolvedValue(ok(invalidData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(false);

      const result = await service.loadNodeData(pageId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });

    it("should return error when migrated data doesn't match schema", async () => {
      const pageId = "page-123";
      const oldData = { schemaVersion: 0 } as unknown as RelationshipNodeData;
      const invalidMigratedData = { schemaVersion: 1, invalid: "data" }; // Invalid schema

      vi.mocked(mockRepository.getNodePageContent).mockResolvedValue(ok(oldData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(true);
      vi.mocked(mockMigrationService.getCurrentSchemaVersion).mockReturnValue(0);
      vi.mocked(mockMigrationService.migrateToLatest).mockResolvedValue(
        ok(invalidMigratedData as any)
      );

      const result = await service.loadNodeData(pageId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
        expect(result.error.message).toContain(
          "Migrated node data does not match RelationshipNodeData schema"
        );
      }
    });
  });

  describe("saveNodeData", () => {
    it("should save node data successfully", async () => {
      const pageId = "page-123";
      const nodeData = createValidNodeData();

      vi.mocked(mockRepository.updateNodePageContent).mockResolvedValue(ok(undefined));

      const result = await service.saveNodeData(pageId, nodeData);

      expect(result.ok).toBe(true);
      expect(mockRepository.updateNodePageContent).toHaveBeenCalledWith(pageId, nodeData);
    });

    it("should return validation error for invalid data", async () => {
      const pageId = "page-123";
      const invalidData = {
        schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
        // missing required fields
      } as unknown as RelationshipNodeData;

      const result = await service.saveNodeData(pageId, invalidData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
      expect(mockRepository.updateNodePageContent).not.toHaveBeenCalled();
    });

    it("should return error when repository returns error", async () => {
      const pageId = "page-123";
      const nodeData = createValidNodeData();
      const repositoryError: EntityRepositoryError = {
        code: "OPERATION_FAILED",
        message: "Update failed",
      };

      vi.mocked(mockRepository.updateNodePageContent).mockResolvedValue(err(repositoryError));

      const result = await service.saveNodeData(pageId, nodeData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REPOSITORY_ERROR");
      }
    });
  });

  describe("DINodeDataService", () => {
    it("should extend NodeDataService with DI dependencies", () => {
      expect(DINodeDataService.dependencies).toEqual([
        expect.anything(), // platformRelationshipPageRepositoryPortToken
        expect.anything(), // migrationServiceToken
        expect.anything(), // notificationPublisherPortToken
      ]);
      expect(DINodeDataService.dependencies).toHaveLength(3);
    });

    it("should create instance correctly", () => {
      const diService = new DINodeDataService(
        mockRepository,
        mockMigrationService,
        mockNotifications
      );
      expect(diService).toBeInstanceOf(NodeDataService);
    });
  });
});
