/**
 * Error type for persistence operations.
 */
export interface PersistError {
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
}
