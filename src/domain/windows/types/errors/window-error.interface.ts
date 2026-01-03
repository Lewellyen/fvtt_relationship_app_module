/**
 * Error type for window-related operations.
 */
export interface WindowError {
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
}
