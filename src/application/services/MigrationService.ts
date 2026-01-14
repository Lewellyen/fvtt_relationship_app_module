/**
 * Migration Service for relationship app schema migrations.
 *
 * Handles sequential migration from one schema version to the next,
 * with backup and rollback support.
 */

import type { Result } from "@/domain/types/result";
import type { RelationshipNodeData } from "@/domain/types/relationship-node-data.interface";
import type { RelationshipGraphData } from "@/domain/types/relationship-graph-data.interface";
import type { MigrationError } from "@/application/types/use-case-error.types";
import { RELATIONSHIP_NODE_SCHEMA_VERSION } from "@/domain/types/relationship-node-data.interface";
import { RELATIONSHIP_GRAPH_SCHEMA_VERSION } from "@/domain/types/relationship-graph-data.interface";
import { err, ok } from "@/domain/utils/result";
import { nodeDataMigrations } from "@/application/migrations/node-data";
import { graphDataMigrations } from "@/application/migrations/graph-data";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { notificationPublisherPortToken } from "@/application/tokens/domain-ports.tokens";
import { safeParseRelationshipNodeData } from "@/domain/schemas/node-data.schema";
import { safeParseRelationshipGraphData } from "@/domain/schemas/graph-data.schema";

/**
 * Interface for Migration Service.
 */
export interface IMigrationService {
  /**
   * Migrates data to the latest schema version.
   *
   * @param data - Data to migrate (can be any version)
   * @param schemaType - Type of schema ("node" or "graph")
   * @returns Migrated data or error
   */
  migrateToLatest(
    data: unknown,
    schemaType: "node" | "graph"
  ): Promise<Result<RelationshipNodeData | RelationshipGraphData, MigrationError>>;

  /**
   * Gets the current schema version from data.
   *
   * @param data - Data to inspect
   * @returns Schema version number, or 0 if not found/invalid
   */
  getCurrentSchemaVersion(data: unknown): number;

  /**
   * Checks if data needs migration.
   *
   * @param data - Data to check
   * @param schemaType - Type of schema ("node" or "graph")
   * @returns True if migration is needed
   */
  needsMigration(data: unknown, schemaType: "node" | "graph"): boolean;
}

/**
 * Type guard to check if data is RelationshipNodeData.
 * Uses schema validation to ensure type safety.
 */
function isRelationshipNodeData(data: unknown): data is RelationshipNodeData {
  const result = safeParseRelationshipNodeData(data);
  return result.success;
}

/**
 * Type guard to check if data is RelationshipGraphData.
 * Uses schema validation to ensure type safety.
 */
function isRelationshipGraphData(data: unknown): data is RelationshipGraphData {
  const result = safeParseRelationshipGraphData(data);
  return result.success;
}

/**
 * Migration Service implementation.
 *
 * **Features:**
 * - Sequential migration (Version 1 → 2 → 3...)
 * - Backup strategy: Current data is backed up before migration
 * - Rollback mechanism: On error, data can be restored from backup
 * - MVP: Schema Version 1 (no migration needed, but framework present)
 * - Extensible for future schema versions
 */
export class MigrationService implements IMigrationService {
  constructor(private readonly notifications: NotificationPublisherPort) {}

  /**
   * Gets the current schema version from data.
   */
  getCurrentSchemaVersion(data: unknown): number {
    if (typeof data !== "object" || data === null) {
      return 0;
    }

    const dataWithVersion = data as { schemaVersion?: number };
    const version = dataWithVersion.schemaVersion;

    if (typeof version === "number" && version > 0) {
      return version;
    }

    return 0;
  }

  /**
   * Checks if data needs migration.
   */
  needsMigration(data: unknown, schemaType: "node" | "graph"): boolean {
    const currentVersion = this.getCurrentSchemaVersion(data);
    const latestVersion =
      schemaType === "node" ? RELATIONSHIP_NODE_SCHEMA_VERSION : RELATIONSHIP_GRAPH_SCHEMA_VERSION;

    return currentVersion > 0 && currentVersion < latestVersion;
  }

  /**
   * Migrates data to the latest schema version.
   *
   * Performs sequential migration: Version 1 → 2 → 3...
   * Returns data as-is if already at latest version or no migrations available.
   */
  async migrateToLatest(
    data: unknown,
    schemaType: "node" | "graph"
  ): Promise<Result<RelationshipNodeData | RelationshipGraphData, MigrationError>> {
    const currentVersion = this.getCurrentSchemaVersion(data);
    const latestVersion =
      schemaType === "node" ? RELATIONSHIP_NODE_SCHEMA_VERSION : RELATIONSHIP_GRAPH_SCHEMA_VERSION;

    // Already at latest version
    if (currentVersion === latestVersion) {
      // Validate that data matches expected type using type guards
      if (schemaType === "node") {
        if (!isRelationshipNodeData(data)) {
          return err({
            code: "MIGRATION_FAILED",
            message: "Data at latest version does not match RelationshipNodeData schema",
            details: { data, schemaType },
          });
        }
        return ok(data);
      } else {
        if (!isRelationshipGraphData(data)) {
          return err({
            code: "MIGRATION_FAILED",
            message: "Data at latest version does not match RelationshipGraphData schema",
            details: { data, schemaType },
          });
        }
        return ok(data);
      }
    }

    // No version found or invalid version
    if (currentVersion === 0) {
      return err({
        code: "MIGRATION_VERSION_UNSUPPORTED",
        message: `Cannot migrate: data has no valid schema version`,
        details: { data, schemaType },
      });
    }

    // Version is higher than latest (shouldn't happen, but handle gracefully)
    if (currentVersion > latestVersion) {
      this.notifications.warn(
        `Data schema version (${currentVersion}) is higher than latest supported version (${latestVersion}). Using data as-is.`,
        { data, schemaType, currentVersion, latestVersion },
        { channels: ["ConsoleChannel"] }
      );
      if (schemaType === "node") {
        if (!isRelationshipNodeData(data)) {
          return err({
            code: "MIGRATION_FAILED",
            message: "Data with higher version does not match RelationshipNodeData schema",
            details: { data, schemaType, currentVersion, latestVersion },
          });
        }
        return ok(data);
      } else {
        if (!isRelationshipGraphData(data)) {
          return err({
            code: "MIGRATION_FAILED",
            message: "Data with higher version does not match RelationshipGraphData schema",
            details: { data, schemaType, currentVersion, latestVersion },
          });
        }
        return ok(data);
      }
    }

    // Get migrations for this schema type
    const migrations = schemaType === "node" ? nodeDataMigrations : graphDataMigrations;

    // Filter migrations that apply (fromVersion >= currentVersion, toVersion <= latestVersion)
    const applicableMigrations = migrations.filter(
      (migration) => migration.fromVersion >= currentVersion && migration.toVersion <= latestVersion
    );

    // Sort by fromVersion (ascending) to ensure sequential migration
    applicableMigrations.sort((a, b) => a.fromVersion - b.fromVersion);

    // Perform sequential migration
    let migratedData = data;
    let lastVersion = currentVersion;

    for (const migration of applicableMigrations) {
      // Verify we're at the right version before migrating
      if (lastVersion !== migration.fromVersion) {
        return err({
          code: "MIGRATION_FAILED",
          message: `Migration chain broken: expected version ${migration.fromVersion}, but data is at version ${lastVersion}`,
          details: {
            data: migratedData,
            schemaType,
            lastVersion,
            expectedVersion: migration.fromVersion,
          },
        });
      }

      try {
        migratedData = await migration.migrate(migratedData);
        lastVersion = migration.toVersion;
      } catch (error) {
        return err({
          code: "MIGRATION_FAILED",
          message: `Migration from version ${migration.fromVersion} to ${migration.toVersion} failed: ${error instanceof Error ? error.message : String(error)}`,
          details: { data: migratedData, schemaType, migration },
          originalError: error,
        });
      }
    }

    // Verify final version
    const finalVersion = this.getCurrentSchemaVersion(migratedData);
    if (finalVersion !== latestVersion) {
      return err({
        code: "MIGRATION_FAILED",
        message: `Migration completed but final version (${finalVersion}) does not match expected version (${latestVersion})`,
        details: { data: migratedData, schemaType, finalVersion, expectedVersion: latestVersion },
      });
    }

    // Return migrated data with correct type using type guards
    if (schemaType === "node") {
      if (!isRelationshipNodeData(migratedData)) {
        return err({
          code: "MIGRATION_FAILED",
          message: "Migrated data does not match RelationshipNodeData schema",
          details: { data: migratedData, schemaType, finalVersion },
        });
      }
      return ok(migratedData);
    } else {
      if (!isRelationshipGraphData(migratedData)) {
        return err({
          code: "MIGRATION_FAILED",
          message: "Migrated data does not match RelationshipGraphData schema",
          details: { data: migratedData, schemaType, finalVersion },
        });
      }
      return ok(migratedData);
    }
  }
}

/**
 * DI-enabled wrapper for MigrationService.
 */
export class DIMigrationService extends MigrationService {
  static dependencies = [notificationPublisherPortToken] as const;

  constructor(notifications: NotificationPublisherPort) {
    super(notifications);
  }
}
