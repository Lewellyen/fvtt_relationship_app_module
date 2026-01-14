/**
 * Service for managing relationship graph data.
 *
 * Handles loading, saving, and validation of graph data with schema validation
 * and migration support.
 */

import type { Result } from "@/domain/types/result";
import type {
  RelationshipGraphData,
  GraphDataLastVersion,
} from "@/domain/types/relationship-graph-data.interface";
import type { ServiceError, ValidationError } from "@/application/types/use-case-error.types";
import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.types";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { IMigrationService } from "./MigrationService";
import { ok, err } from "@/domain/utils/result";
import { safeParseRelationshipGraphData } from "@/domain/schemas/graph-data.schema";
import { platformRelationshipPageRepositoryPortToken } from "@/application/tokens/domain-ports.tokens";
import { notificationPublisherPortToken } from "@/application/tokens/domain-ports.tokens";
import { migrationServiceToken } from "@/application/tokens/application.tokens";

/**
 * Type guard to check if data is RelationshipGraphData.
 * Uses schema validation to ensure type safety.
 */
function isRelationshipGraphData(data: unknown): data is RelationshipGraphData {
  const result = safeParseRelationshipGraphData(data);
  return result.success;
}

/**
 * Interface for Graph Data Service.
 */
export interface IGraphDataService {
  /**
   * Loads graph data from a page.
   *
   * @param pageId - The page ID
   * @returns Graph data or error
   */
  loadGraphData(pageId: string): Promise<Result<RelationshipGraphData, ServiceError>>;

  /**
   * Saves graph data to a page.
   *
   * @param pageId - The page ID
   * @param data - The graph data to save
   * @returns Success or error
   */
  saveGraphData(pageId: string, data: RelationshipGraphData): Promise<Result<void, ServiceError>>;

  /**
   * Validates graph data.
   *
   * @param data - The graph data to validate
   * @returns Success or validation error
   */
  validateGraphData(data: RelationshipGraphData): Result<void, ValidationError>;
}

/**
 * Graph Data Service implementation.
 *
 * **Features:**
 * - Schema validation using Valibot
 * - Migration integration (automatic migration on load)
 * - Repository access via PlatformRelationshipPageRepositoryPort
 * - Error handling with Result pattern
 * - Conflict Policy MVP: Last-write-wins + Warning Banner
 */
export class GraphDataService implements IGraphDataService {
  constructor(
    private readonly repository: PlatformRelationshipPageRepositoryPort,
    private readonly migrationService: IMigrationService,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Validates graph data against the schema.
   */
  validateGraphData(data: RelationshipGraphData): Result<void, ValidationError> {
    const validationResult = safeParseRelationshipGraphData(data);

    if (!validationResult.success) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Graph data validation failed: ${validationResult.issues.map((i) => i.message).join(", ")}`,
        details: validationResult.issues,
      });
    }

    return ok(undefined);
  }

  /**
   * Loads graph data from a page.
   *
   * Performs migration if needed before returning data.
   */
  async loadGraphData(pageId: string): Promise<Result<RelationshipGraphData, ServiceError>> {
    // Load raw data from repository
    const loadResult = await this.repository.getGraphPageContent(pageId);
    if (!loadResult.ok) {
      return this.mapRepositoryError(loadResult.error);
    }

    const rawData = loadResult.value;

    // Check if migration is needed
    if (this.migrationService.needsMigration(rawData, "graph")) {
      this.notifications.debug(
        `Graph data at page ${pageId} needs migration`,
        { pageId, currentVersion: this.migrationService.getCurrentSchemaVersion(rawData) },
        { channels: ["ConsoleChannel"] }
      );

      // Backup: Store current data in lastVersion before migration
      // Note: rawData already contains schemaVersion, which will be used in backup
      const backup: GraphDataLastVersion = {
        ...rawData,
      } as GraphDataLastVersion;

      // Perform migration
      const migrationResult = await this.migrationService.migrateToLatest(rawData, "graph");
      if (!migrationResult.ok) {
        this.notifications.error(
          `Failed to migrate graph data at page ${pageId}`,
          migrationResult.error,
          { channels: ["ConsoleChannel"] }
        );
        return migrationResult;
      }

      // Save migrated data back (with backup)
      // Type guard: migrationResult.value is RelationshipGraphData for "graph" schemaType
      // We know this is safe because migrateToLatest was called with "graph" schemaType
      if (!isRelationshipGraphData(migrationResult.value)) {
        return err({
          code: "VALIDATION_FAILED",
          message: "Migrated graph data does not match RelationshipGraphData schema",
          details: { pageId, migratedData: migrationResult.value },
        });
      }
      // Combine migrated data with backup
      const migratedGraphData: RelationshipGraphData = {
        ...migrationResult.value,
        lastVersion: backup,
      };
      const saveResult = await this.saveGraphData(pageId, migratedGraphData);
      if (!saveResult.ok) {
        // Migration succeeded but save failed - this is problematic
        this.notifications.error(
          `Graph data migrated but failed to save at page ${pageId}`,
          saveResult.error,
          { channels: ["ConsoleChannel"] }
        );
        return saveResult;
      }

      return ok(migratedGraphData);
    }

    // Validate data (even if no migration needed)
    const validationResult = this.validateGraphData(rawData);
    if (!validationResult.ok) {
      return validationResult;
    }

    return ok(rawData);
  }

  /**
   * Saves graph data to a page.
   *
   * Validates data before saving.
   * Implements MVP Conflict Policy: Last-write-wins + Warning Banner.
   */
  async saveGraphData(
    pageId: string,
    data: RelationshipGraphData
  ): Promise<Result<void, ServiceError>> {
    // Validate data before saving
    const validationResult = this.validateGraphData(data);
    if (!validationResult.ok) {
      return validationResult;
    }

    // MVP Conflict Policy: Last-write-wins
    // Load current data to check for version mismatch (optional, for warning)
    const currentDataResult = await this.repository.getGraphPageContent(pageId);
    if (currentDataResult.ok && currentDataResult.value.lastVersion) {
      // Version mismatch detected (lastVersion exists means data was migrated/updated)
      // Show warning banner (MVP: just log, can be enhanced in future)
      this.notifications.warn(
        `Graph data at page ${pageId} has been modified since last load. Using last-write-wins strategy.`,
        { pageId },
        { channels: ["ConsoleChannel"] }
      );
    }

    // Save via repository (last-write-wins: simply overwrite)
    const saveResult = await this.repository.updateGraphPageContent(pageId, data);
    if (!saveResult.ok) {
      return this.mapRepositoryError(saveResult.error);
    }

    return ok(undefined);
  }

  /**
   * Maps repository errors to service errors.
   */
  private mapRepositoryError(error: EntityRepositoryError): Result<never, ServiceError> {
    return err({
      code: "REPOSITORY_ERROR",
      message: error.message,
      details: error,
    });
  }
}

/**
 * DI-enabled wrapper for GraphDataService.
 */
export class DIGraphDataService extends GraphDataService {
  static dependencies = [
    platformRelationshipPageRepositoryPortToken,
    migrationServiceToken,
    notificationPublisherPortToken,
  ] as const;

  constructor(
    repository: PlatformRelationshipPageRepositoryPort,
    migrationService: IMigrationService,
    notifications: NotificationPublisherPort
  ) {
    super(repository, migrationService, notifications);
  }
}
