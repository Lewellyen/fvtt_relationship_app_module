/**
 * Tests for GraphDataService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GraphDataService, DIGraphDataService } from "../GraphDataService";
import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { IMigrationService } from "../MigrationService";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.types";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";
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

function createValidGraphData(): RelationshipGraphData {
  return {
    schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
    graphKey: "JournalEntry.page-xyz789",
    nodeKeys: ["node-1"],
    edges: [],
  };
}

describe("GraphDataService", () => {
  let service: GraphDataService;
  let mockRepository: PlatformRelationshipPageRepositoryPort;
  let mockMigrationService: IMigrationService;
  let mockNotifications: NotificationPublisherPort;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockMigrationService = createMockMigrationService();
    mockNotifications = createMockNotifications();
    service = new GraphDataService(mockRepository, mockMigrationService, mockNotifications);
  });

  describe("validateGraphData", () => {
    it("should validate valid graph data", () => {
      const data = createValidGraphData();
      const result = service.validateGraphData(data);

      expect(result.ok).toBe(true);
    });

    it("should reject invalid graph data", () => {
      const invalidData = {
        schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
        // missing required fields
      } as unknown as RelationshipGraphData;

      const result = service.validateGraphData(invalidData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });
  });

  describe("loadGraphData", () => {
    it("should load graph data successfully when no migration needed", async () => {
      const pageId = "page-123";
      const graphData = createValidGraphData();

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(ok(graphData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(false);

      const result = await service.loadGraphData(pageId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(graphData);
      }
      expect(mockRepository.getGraphPageContent).toHaveBeenCalledWith(pageId);
    });

    it("should return error when repository returns error", async () => {
      const pageId = "page-123";
      const repositoryError: EntityRepositoryError = {
        code: "ENTITY_NOT_FOUND",
        message: "Page not found",
      };

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(err(repositoryError));

      const result = await service.loadGraphData(pageId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REPOSITORY_ERROR");
      }
    });

    it("should migrate and save when migration is needed", async () => {
      const pageId = "page-123";
      const oldData = { schemaVersion: 0 } as unknown as RelationshipGraphData;
      const migratedData = createValidGraphData();

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(ok(oldData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(true);
      vi.mocked(mockMigrationService.getCurrentSchemaVersion).mockReturnValue(0);
      vi.mocked(mockMigrationService.migrateToLatest).mockResolvedValue(ok(migratedData));
      vi.mocked(mockRepository.updateGraphPageContent).mockResolvedValue(ok(undefined));

      const result = await service.loadGraphData(pageId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // The result should include lastVersion backup
        expect(result.value).toEqual({
          ...migratedData,
          lastVersion: oldData,
        });
      }
      expect(mockNotifications.debug).toHaveBeenCalledWith(
        `Graph data at page ${pageId} needs migration`,
        { pageId, currentVersion: 0 },
        { channels: ["ConsoleChannel"] }
      );
      expect(mockMigrationService.migrateToLatest).toHaveBeenCalledWith(oldData, "graph");
      // The saved data should include lastVersion backup
      expect(mockRepository.updateGraphPageContent).toHaveBeenCalledWith(pageId, {
        ...migratedData,
        lastVersion: oldData,
      });
    });

    it("should return error when migration fails", async () => {
      const pageId = "page-123";
      const oldData = { schemaVersion: 0 } as unknown as RelationshipGraphData;
      const migrationError = {
        code: "MIGRATION_FAILED" as const,
        message: "Migration failed",
        details: {},
      };

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(ok(oldData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(true);
      vi.mocked(mockMigrationService.getCurrentSchemaVersion).mockReturnValue(0);
      vi.mocked(mockMigrationService.migrateToLatest).mockResolvedValue(err(migrationError));

      const result = await service.loadGraphData(pageId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_FAILED");
      }
      expect(mockNotifications.error).toHaveBeenCalled();
    });

    it("should return error when save after migration fails", async () => {
      const pageId = "page-123";
      const oldData = { schemaVersion: 0 } as unknown as RelationshipGraphData;
      const migratedData = createValidGraphData();
      const saveError: EntityRepositoryError = {
        code: "OPERATION_FAILED",
        message: "Save failed",
      };

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(ok(oldData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(true);
      vi.mocked(mockMigrationService.getCurrentSchemaVersion).mockReturnValue(0);
      vi.mocked(mockMigrationService.migrateToLatest).mockResolvedValue(ok(migratedData));
      vi.mocked(mockRepository.updateGraphPageContent).mockResolvedValue(err(saveError));

      const result = await service.loadGraphData(pageId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REPOSITORY_ERROR");
      }
      expect(mockNotifications.error).toHaveBeenCalled();
    });

    it("should return validation error when raw data is invalid", async () => {
      const pageId = "page-123";
      const invalidData = { invalid: "data" } as unknown as RelationshipGraphData;

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(ok(invalidData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(false);

      const result = await service.loadGraphData(pageId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });

    it("should return error when migrated data doesn't match schema", async () => {
      const pageId = "page-123";
      const oldData = { schemaVersion: 0 } as unknown as RelationshipGraphData;
      const invalidMigratedData = { schemaVersion: 1, invalid: "data" }; // Invalid schema

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(ok(oldData));
      vi.mocked(mockMigrationService.needsMigration).mockReturnValue(true);
      vi.mocked(mockMigrationService.getCurrentSchemaVersion).mockReturnValue(0);
      vi.mocked(mockMigrationService.migrateToLatest).mockResolvedValue(
        ok(invalidMigratedData as any)
      );

      const result = await service.loadGraphData(pageId);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
        expect(result.error.message).toContain(
          "Migrated graph data does not match RelationshipGraphData schema"
        );
      }
    });
  });

  describe("saveGraphData", () => {
    it("should save graph data successfully", async () => {
      const pageId = "page-123";
      const graphData = createValidGraphData();

      const notFoundError: EntityRepositoryError = {
        code: "ENTITY_NOT_FOUND",
        message: "Page not found",
      };
      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(err(notFoundError));
      vi.mocked(mockRepository.updateGraphPageContent).mockResolvedValue(ok(undefined));

      const result = await service.saveGraphData(pageId, graphData);

      expect(result.ok).toBe(true);
      expect(mockRepository.updateGraphPageContent).toHaveBeenCalledWith(pageId, graphData);
    });

    it("should clean layout data and keep valid entries", async () => {
      const pageId = "page-123";
      const graphData: RelationshipGraphData = {
        ...createValidGraphData(),
        layout: {
          positions: {
            node1: { x: 10, y: 20 },
            node2: { x: "invalid" as unknown as number, y: 30 },
          },
          zoom: 1.25,
          pan: { x: 5, y: 15 },
        },
      };

      const notFoundError: EntityRepositoryError = {
        code: "ENTITY_NOT_FOUND",
        message: "Page not found",
      };
      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(err(notFoundError));
      vi.mocked(mockRepository.updateGraphPageContent).mockResolvedValue(ok(undefined));

      const result = await service.saveGraphData(pageId, graphData);

      expect(result.ok).toBe(true);
      const savedData = vi.mocked(mockRepository.updateGraphPageContent).mock.calls[0]?.[1];
      expect(savedData).toEqual({
        ...graphData,
        layout: {
          positions: {
            node1: { x: 10, y: 20 },
          },
          zoom: 1.25,
          pan: { x: 5, y: 15 },
        },
      });
    });

    it("should remove layout when no valid entries remain", async () => {
      const pageId = "page-123";
      const graphData: RelationshipGraphData = {
        ...createValidGraphData(),
        layout: {
          positions: {
            node1: { x: "invalid" as unknown as number, y: 30 },
          },
          zoom: "invalid" as unknown as number,
          pan: { x: "invalid" as unknown as number, y: 15 },
        },
      };

      const notFoundError: EntityRepositoryError = {
        code: "ENTITY_NOT_FOUND",
        message: "Page not found",
      };
      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(err(notFoundError));
      vi.mocked(mockRepository.updateGraphPageContent).mockResolvedValue(ok(undefined));

      const result = await service.saveGraphData(pageId, graphData);

      expect(result.ok).toBe(true);
      const savedData = vi.mocked(mockRepository.updateGraphPageContent).mock.calls[0]?.[1];
      const { layout: _layout, ...expected } = graphData;
      expect(savedData).toEqual(expected);
    });

    it("should keep zoom when positions and pan are missing", async () => {
      const pageId = "page-123";
      const graphData: RelationshipGraphData = {
        ...createValidGraphData(),
        layout: {
          zoom: 2,
        },
      };

      const notFoundError: EntityRepositoryError = {
        code: "ENTITY_NOT_FOUND",
        message: "Page not found",
      };
      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(err(notFoundError));
      vi.mocked(mockRepository.updateGraphPageContent).mockResolvedValue(ok(undefined));

      const result = await service.saveGraphData(pageId, graphData);

      expect(result.ok).toBe(true);
      const savedData = vi.mocked(mockRepository.updateGraphPageContent).mock.calls[0]?.[1];
      expect(savedData).toEqual({
        ...graphData,
        layout: {
          zoom: 2,
        },
      });
    });

    it("should warn when lastVersion exists (conflict detected)", async () => {
      const pageId = "page-123";
      const graphData = createValidGraphData();
      const existingData = {
        ...createValidGraphData(),
        lastVersion: { schemaVersion: 0 },
      };

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(ok(existingData));
      vi.mocked(mockRepository.updateGraphPageContent).mockResolvedValue(ok(undefined));

      const result = await service.saveGraphData(pageId, graphData);

      expect(result.ok).toBe(true);
      expect(mockNotifications.warn).toHaveBeenCalled();
      expect(mockRepository.updateGraphPageContent).toHaveBeenCalledWith(pageId, graphData);
    });

    it("should not warn when lastVersion does not exist", async () => {
      const pageId = "page-123";
      const graphData = createValidGraphData();
      const existingData = createValidGraphData();

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(ok(existingData));
      vi.mocked(mockRepository.updateGraphPageContent).mockResolvedValue(ok(undefined));

      const result = await service.saveGraphData(pageId, graphData);

      expect(result.ok).toBe(true);
      expect(mockNotifications.warn).not.toHaveBeenCalled();
      expect(mockRepository.updateGraphPageContent).toHaveBeenCalledWith(pageId, graphData);
    });

    it("should not warn when getGraphPageContent returns error", async () => {
      const pageId = "page-123";
      const graphData = createValidGraphData();
      const notFoundError: EntityRepositoryError = {
        code: "ENTITY_NOT_FOUND",
        message: "Page not found",
      };

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(err(notFoundError));
      vi.mocked(mockRepository.updateGraphPageContent).mockResolvedValue(ok(undefined));

      const result = await service.saveGraphData(pageId, graphData);

      expect(result.ok).toBe(true);
      expect(mockNotifications.warn).not.toHaveBeenCalled();
      expect(mockRepository.updateGraphPageContent).toHaveBeenCalledWith(pageId, graphData);
    });

    it("should return validation error for invalid data", async () => {
      const pageId = "page-123";
      const invalidData = {
        schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
        // missing required fields
      } as unknown as RelationshipGraphData;

      const result = await service.saveGraphData(pageId, invalidData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
      expect(mockRepository.updateGraphPageContent).not.toHaveBeenCalled();
    });

    it("should return error when repository returns error", async () => {
      const pageId = "page-123";
      const graphData = createValidGraphData();
      const repositoryError: EntityRepositoryError = {
        code: "OPERATION_FAILED",
        message: "Update failed",
      };
      const notFoundError: EntityRepositoryError = {
        code: "ENTITY_NOT_FOUND",
        message: "Page not found",
      };

      vi.mocked(mockRepository.getGraphPageContent).mockResolvedValue(err(notFoundError));
      vi.mocked(mockRepository.updateGraphPageContent).mockResolvedValue(err(repositoryError));

      const result = await service.saveGraphData(pageId, graphData);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("REPOSITORY_ERROR");
      }
    });
  });

  describe("DIGraphDataService", () => {
    it("should extend GraphDataService with DI dependencies", () => {
      expect(DIGraphDataService.dependencies).toEqual([
        expect.anything(), // platformRelationshipPageRepositoryPortToken
        expect.anything(), // migrationServiceToken
        expect.anything(), // notificationPublisherPortToken
      ]);
      expect(DIGraphDataService.dependencies).toHaveLength(3);
    });

    it("should create instance correctly", () => {
      const diService = new DIGraphDataService(
        mockRepository,
        mockMigrationService,
        mockNotifications
      );
      expect(diService).toBeInstanceOf(GraphDataService);
    });
  });
});
