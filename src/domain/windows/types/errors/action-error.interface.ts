/**
 * Error type for action operations.
 */
export interface ActionError {
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
}
