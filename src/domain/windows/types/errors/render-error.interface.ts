/**
 * Error type for rendering operations.
 */
export interface RenderError {
  readonly code: string;
  readonly message: string;
  readonly cause?: unknown;
}
