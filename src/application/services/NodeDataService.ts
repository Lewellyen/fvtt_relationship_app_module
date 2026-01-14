/**
 * Service for managing relationship node data.
 *
 * Handles loading, saving, and validation of node data with schema validation
 * and migration support.
 */

import type { Result } from "@/domain/types/result";
import type {
  RelationshipNodeData,
  NodeDataLastVersion,
} from "@/domain/types/relationship-node-data.interface";
import type { ServiceError, ValidationError } from "@/application/types/use-case-error.types";
import type { PlatformRelationshipPageRepositoryPort } from "@/domain/ports/repositories/platform-relationship-page-repository-port.interface";
import type { EntityRepositoryError } from "@/domain/ports/repositories/platform-entity-repository.types";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { IMigrationService } from "./MigrationService";
import { ok, err } from "@/domain/utils/result";
import { safeParseRelationshipNodeData } from "@/domain/schemas/node-data.schema";
import { platformRelationshipPageRepositoryPortToken } from "@/application/tokens/domain-ports.tokens";
import { notificationPublisherPortToken } from "@/application/tokens/domain-ports.tokens";
import { migrationServiceToken } from "@/application/tokens/application.tokens";

/**
 * Type guard to check if data is RelationshipNodeData.
 * Uses schema validation to ensure type safety.
 */
function isRelationshipNodeData(data: unknown): data is RelationshipNodeData {
  const result = safeParseRelationshipNodeData(data);
  return result.success;
}

/**
 * Interface for Node Data Service.
 */
export interface INodeDataService {
  /**
   * Loads node data from a page.
   *
   * @param pageId - The page ID
   * @returns Node data or error
   */
  loadNodeData(pageId: string): Promise<Result<RelationshipNodeData, ServiceError>>;

  /**
   * Saves node data to a page.
   *
   * @param pageId - The page ID
   * @param data - The node data to save
   * @returns Success or error
   */
  saveNodeData(pageId: string, data: RelationshipNodeData): Promise<Result<void, ServiceError>>;

  /**
   * Validates node data.
   *
   * @param data - The node data to validate
   * @returns Success or validation error
   */
  validateNodeData(data: RelationshipNodeData): Result<void, ValidationError>;
}

/**
 * Node Data Service implementation.
 *
 * **Features:**
 * - Schema validation using Valibot
 * - Migration integration (automatic migration on load)
 * - Repository access via RelationshipPageRepositoryAdapter
 * - Error handling with Result pattern
 */
export class NodeDataService implements INodeDataService {
  constructor(
    private readonly repository: PlatformRelationshipPageRepositoryPort,
    private readonly migrationService: IMigrationService,
    private readonly notifications: NotificationPublisherPort
  ) {}

  /**
   * Validates node data against the schema.
   */
  validateNodeData(data: RelationshipNodeData): Result<void, ValidationError> {
    const validationResult = safeParseRelationshipNodeData(data);

    if (!validationResult.success) {
      return err({
        code: "VALIDATION_FAILED",
        message: `Node data validation failed: ${validationResult.issues.map((i) => i.message).join(", ")}`,
        details: validationResult.issues,
      });
    }

    return ok(undefined);
  }

  /**
   * Loads node data from a page.
   *
   * Performs migration if needed before returning data.
   */
  async loadNodeData(pageId: string): Promise<Result<RelationshipNodeData, ServiceError>> {
    // Load raw data from repository
    const loadResult = await this.repository.getNodePageContent(pageId);
    if (!loadResult.ok) {
      return this.mapRepositoryError(loadResult.error);
    }

    const rawData = loadResult.value;

    // Check if migration is needed
    if (this.migrationService.needsMigration(rawData, "node")) {
      this.notifications.debug(
        `Node data at page ${pageId} needs migration`,
        { pageId, currentVersion: this.migrationService.getCurrentSchemaVersion(rawData) },
        { channels: ["ConsoleChannel"] }
      );

      // Backup: Store current data in lastVersion before migration
      // Note: rawData already contains schemaVersion, which will be used in backup
      const backup: NodeDataLastVersion = {
        ...rawData,
      } as NodeDataLastVersion;

      // Perform migration
      const migrationResult = await this.migrationService.migrateToLatest(rawData, "node");
      if (!migrationResult.ok) {
        this.notifications.error(
          `Failed to migrate node data at page ${pageId}`,
          migrationResult.error,
          { channels: ["ConsoleChannel"] }
        );
        return migrationResult;
      }

      // Save migrated data back (with backup)
      // Type guard: migrationResult.value is RelationshipNodeData for "node" schemaType
      // We know this is safe because migrateToLatest was called with "node" schemaType
      if (!isRelationshipNodeData(migrationResult.value)) {
        return err({
          code: "VALIDATION_FAILED",
          message: "Migrated node data does not match RelationshipNodeData schema",
          details: { pageId, migratedData: migrationResult.value },
        });
      }
      // Combine migrated data with backup
      const migratedNodeData: RelationshipNodeData = {
        ...migrationResult.value,
        lastVersion: backup,
      };
      const saveResult = await this.saveNodeData(pageId, migratedNodeData);
      if (!saveResult.ok) {
        // Migration succeeded but save failed - this is problematic
        this.notifications.error(
          `Node data migrated but failed to save at page ${pageId}`,
          saveResult.error,
          { channels: ["ConsoleChannel"] }
        );
        return saveResult;
      }

      return ok(migratedNodeData);
    }

    // Validate data (even if no migration needed)
    const validationResult = this.validateNodeData(rawData);
    if (!validationResult.ok) {
      return validationResult;
    }

    return ok(rawData);
  }

  /**
   * Saves node data to a page.
   *
   * Validates data before saving.
   */
  async saveNodeData(
    pageId: string,
    data: RelationshipNodeData
  ): Promise<Result<void, ServiceError>> {
    // Validate data before saving
    const validationResult = this.validateNodeData(data);
    if (!validationResult.ok) {
      return validationResult;
    }

    // Save via repository
    const saveResult = await this.repository.updateNodePageContent(pageId, data);
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
 * DI-enabled wrapper for NodeDataService.
 */
export class DINodeDataService extends NodeDataService {
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
