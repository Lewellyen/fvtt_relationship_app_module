/**
 * Platform-agnostic error type for utility ports.
 *
 * Similar in shape to other domain errors (e.g. ContainerError), but scoped to utils.
 * This avoids leaking platform-specific error types (e.g. FoundryError) into Domain consumers.
 */
export interface PlatformUtilsError {
  code: string;
  message: string;
  details?: unknown;
  cause?: unknown;
}
