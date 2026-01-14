/**
 * Error types for Application Layer UseCases and Services.
 *
 * These error types follow the Result Pattern and provide structured error information
 * for relationship app operations.
 */

/**
 * Validation error for data validation failures.
 */
export interface ValidationError {
  code: "VALIDATION_FAILED";
  message: string;
  details?: unknown;
}

/**
 * Migration error for schema migration failures.
 */
export interface MigrationError {
  code: "MIGRATION_FAILED" | "MIGRATION_VERSION_UNSUPPORTED" | "MIGRATION_ROLLBACK_FAILED";
  message: string;
  details?: unknown;
  originalError?: unknown;
}

/**
 * Service error union type for all service-level errors.
 */
export type ServiceError =
  | ValidationError
  | MigrationError
  | {
      code: "REPOSITORY_ERROR" | "SERVICE_ERROR" | "OPERATION_FAILED";
      message: string;
      details?: unknown;
    };

/**
 * Use case error union type for all use case-level errors.
 */
export type UseCaseError =
  | ServiceError
  | {
      code:
        | "JOURNAL_NOT_FOUND"
        | "PAGE_NOT_FOUND"
        | "PAGE_TYPE_MISMATCH"
        | "NODE_NOT_FOUND"
        | "GRAPH_NOT_FOUND"
        | "EDGE_NOT_FOUND"
        | "INVALID_INPUT"
        | "OPERATION_FAILED";
      message: string;
      details?: unknown;
    };
