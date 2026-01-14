/**
 * Tests for MigrationService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MigrationService, DIMigrationService } from "../MigrationService";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import { RELATIONSHIP_NODE_SCHEMA_VERSION } from "@/domain/types/relationship-node-data.interface";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";
import { ok } from "@/domain/utils/result";

// Mock migrations modules
vi.mock("@/application/migrations/node-data", () => ({
  nodeDataMigrations: [],
}));

vi.mock("@/application/migrations/graph-data", () => ({
  graphDataMigrations: [],
}));

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

function createValidGraphData(): RelationshipGraphData {
  return {
    schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
    graphKey: "JournalEntry.page-xyz789",
    nodeKeys: ["node-1"],
    edges: [],
  };
}

describe("MigrationService", () => {
  let service: MigrationService;
  let mockNotifications: NotificationPublisherPort;

  beforeEach(async () => {
    mockNotifications = createMockNotifications();
    service = new MigrationService(mockNotifications);
    // Reset migrations arrays
    const { nodeDataMigrations } = await import("@/application/migrations/node-data");
    const { graphDataMigrations } = await import("@/application/migrations/graph-data");
    (nodeDataMigrations as any).length = 0;
    (graphDataMigrations as any).length = 0;
  });

  afterEach(async () => {
    // Cleanup migrations arrays
    const { nodeDataMigrations } = await import("@/application/migrations/node-data");
    const { graphDataMigrations } = await import("@/application/migrations/graph-data");
    (nodeDataMigrations as any).length = 0;
    (graphDataMigrations as any).length = 0;
  });

  describe("getCurrentSchemaVersion", () => {
    it("should return version from valid node data", () => {
      const data = createValidNodeData();
      const version = service.getCurrentSchemaVersion(data);
      expect(version).toBe(RELATIONSHIP_NODE_SCHEMA_VERSION);
    });

    it("should return version from valid graph data", () => {
      const data = createValidGraphData();
      const version = service.getCurrentSchemaVersion(data);
      expect(version).toBe(RELATIONSHIP_GRAPH_SCHEMA_VERSION);
    });

    it("should return 0 for data without schemaVersion", () => {
      const data = { someProperty: "value" };
      const version = service.getCurrentSchemaVersion(data);
      expect(version).toBe(0);
    });

    it("should return 0 for null", () => {
      const version = service.getCurrentSchemaVersion(null);
      expect(version).toBe(0);
    });

    it("should return 0 for non-object", () => {
      const version = service.getCurrentSchemaVersion("string");
      expect(version).toBe(0);
    });

    it("should return 0 for invalid version (0)", () => {
      const data = { schemaVersion: 0 };
      const version = service.getCurrentSchemaVersion(data);
      expect(version).toBe(0);
    });

    it("should return version for valid positive number", () => {
      const data = { schemaVersion: 2 };
      const version = service.getCurrentSchemaVersion(data);
      expect(version).toBe(2);
    });

    it("should return 0 for negative version", () => {
      const data = { schemaVersion: -1 };
      const version = service.getCurrentSchemaVersion(data);
      expect(version).toBe(0);
    });

    it("should return 0 for version as string", () => {
      const data = { schemaVersion: "1" };
      const version = service.getCurrentSchemaVersion(data);
      expect(version).toBe(0);
    });

    it("should return 0 for undefined version", () => {
      const data = { schemaVersion: undefined };
      const version = service.getCurrentSchemaVersion(data);
      expect(version).toBe(0);
    });
  });

  describe("needsMigration", () => {
    it("should return false for node data at latest version", () => {
      const data = createValidNodeData();
      const needs = service.needsMigration(data, "node");
      expect(needs).toBe(false);
    });

    it("should return false for graph data at latest version", () => {
      const data = createValidGraphData();
      const needs = service.needsMigration(data, "graph");
      expect(needs).toBe(false);
    });

    it("should return false for data without version", () => {
      const data = { someProperty: "value" };
      const needs = service.needsMigration(data, "node");
      expect(needs).toBe(false);
    });

    it("should return true when node data version is less than latest", () => {
      // Since latest version is 1, we can't test this with real data
      // But we can test the logic with a mock
      const data = { schemaVersion: 0.5 }; // Less than 1
      const needs = service.needsMigration(data, "node");
      expect(needs).toBe(true);
    });

    it("should return true when graph data version is less than latest", () => {
      const data = { schemaVersion: 0.5 }; // Less than 1
      const needs = service.needsMigration(data, "graph");
      expect(needs).toBe(true);
    });
  });

  describe("migrateToLatest", () => {
    it("should return node data as-is when already at latest version", async () => {
      const data = createValidNodeData();
      const result = await service.migrateToLatest(data, "node");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(data);
      }
    });

    it("should return graph data as-is when already at latest version", async () => {
      const data = createValidGraphData();
      const result = await service.migrateToLatest(data, "graph");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(data);
      }
    });

    it("should return error for data without schema version", async () => {
      const data = { someProperty: "value" };
      const result = await service.migrateToLatest(data, "node");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_VERSION_UNSUPPORTED");
      }
    });

    it("should return error for node data without valid schema version", async () => {
      const data = { schemaVersion: 0 };
      const result = await service.migrateToLatest(data, "node");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_VERSION_UNSUPPORTED");
      }
    });

    it("should return error when node data at latest version has invalid schema", async () => {
      const invalidData = {
        schemaVersion: RELATIONSHIP_NODE_SCHEMA_VERSION,
        // Missing required fields
      };
      const result = await service.migrateToLatest(invalidData, "node");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_FAILED");
        expect(result.error.message).toContain("does not match RelationshipNodeData schema");
      }
    });

    it("should return error when graph data at latest version has invalid schema", async () => {
      const invalidData = {
        schemaVersion: RELATIONSHIP_GRAPH_SCHEMA_VERSION,
        // Missing required fields
      };
      const result = await service.migrateToLatest(invalidData, "graph");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_FAILED");
        expect(result.error.message).toContain("does not match RelationshipGraphData schema");
      }
    });

    it("should warn and return error when node data version is higher than latest but invalid schema", async () => {
      // Note: Schema only accepts version 1, so version 999 will always fail schema validation
      const invalidData = {
        ...createValidNodeData(),
        schemaVersion: 999, // This makes the schema invalid
      };
      const result = await service.migrateToLatest(invalidData, "node");

      expect(mockNotifications.warn).toHaveBeenCalled();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_FAILED");
        expect(result.error.message).toContain(
          "Data with higher version does not match RelationshipNodeData schema"
        );
      }
    });

    it("should warn and return error when graph data version is higher than latest but invalid schema", async () => {
      // Note: Schema only accepts version 1, so version 999 will always fail schema validation
      const invalidData = {
        ...createValidGraphData(),
        schemaVersion: 999, // This makes the schema invalid
      };
      const result = await service.migrateToLatest(invalidData, "graph");

      expect(mockNotifications.warn).toHaveBeenCalled();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_FAILED");
        expect(result.error.message).toContain(
          "Data with higher version does not match RelationshipGraphData schema"
        );
      }
    });

    it("should warn and return error when node data version is higher than latest but invalid schema", async () => {
      const invalidData = {
        schemaVersion: 999,
        // Missing required fields
      };
      const result = await service.migrateToLatest(invalidData, "node");

      expect(mockNotifications.warn).toHaveBeenCalled();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_FAILED");
        expect(result.error.message).toContain("does not match RelationshipNodeData schema");
      }
    });

    it("should warn and return error when graph data version is higher than latest but invalid schema", async () => {
      const invalidData = {
        schemaVersion: 999,
        // Missing required fields
      };
      const result = await service.migrateToLatest(invalidData, "graph");

      expect(mockNotifications.warn).toHaveBeenCalled();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_FAILED");
        expect(result.error.message).toContain("does not match RelationshipGraphData schema");
      }
    });

    it("should handle migrated data that doesn't match node schema", async () => {
      const { nodeDataMigrations } = await import("@/application/migrations/node-data");
      const mockMigration = {
        fromVersion: 1,
        toVersion: 1, // Migration to same version (shouldn't happen, but test the guard)
        migrate: vi.fn().mockResolvedValue({ schemaVersion: 1, invalid: "data" }), // Invalid schema
      };

      (nodeDataMigrations as any).length = 0;
      (nodeDataMigrations as any).push(mockMigration);

      const data = { schemaVersion: 1 };
      const result = await service.migrateToLatest(data, "node");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_FAILED");
        expect(result.error.message).toContain("does not match RelationshipNodeData schema");
      }

      (nodeDataMigrations as any).length = 0;
    });

    it("should handle migrated data that doesn't match graph schema", async () => {
      const { graphDataMigrations } = await import("@/application/migrations/graph-data");
      const mockMigration = {
        fromVersion: 1,
        toVersion: 1,
        migrate: vi.fn().mockResolvedValue({ schemaVersion: 1, invalid: "data" }),
      };

      (graphDataMigrations as any).length = 0;
      (graphDataMigrations as any).push(mockMigration);

      const data = { schemaVersion: 1 };
      const result = await service.migrateToLatest(data, "graph");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MIGRATION_FAILED");
        expect(result.error.message).toContain("does not match RelationshipGraphData schema");
      }

      (graphDataMigrations as any).length = 0;
    });
  });

  describe("DIMigrationService", () => {
    it("should create service with dependencies", () => {
      const mockNotifications = createMockNotifications();
      const diService = new DIMigrationService(mockNotifications);

      expect(diService).toBeInstanceOf(MigrationService);
    });
  });
});
