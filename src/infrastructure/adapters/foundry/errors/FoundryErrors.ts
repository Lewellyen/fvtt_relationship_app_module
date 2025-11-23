/**
 * Error codes for Foundry API operations.
 * Provides type-safe classification of Foundry-related errors.
 */
export type FoundryErrorCode =
  | "API_NOT_AVAILABLE" // Foundry API (game, Hooks, etc.) not available
  | "VALIDATION_FAILED" // Runtime validation failed
  | "NOT_FOUND" // Entity not found by ID
  | "ACCESS_DENIED" // Permission denied
  | "PORT_SELECTION_FAILED" // Port selection/instantiation failed
  | "PORT_REGISTRY_ERROR" // Port registry duplicate registration
  | "PORT_NOT_FOUND" // No compatible port found for version
  | "DISPOSED" // Port or service has been disposed
  | "OPERATION_FAILED"; // General operation failure

/**
 * Structured error for Foundry operations.
 * Provides detailed context for debugging and error handling.
 *
 * @example
 * ```typescript
 * const error: FoundryError = {
 *   code: "API_NOT_AVAILABLE",
 *   message: "Foundry game API not available",
 *   details: { api: "game.journal" }
 * };
 * ```
 */
export interface FoundryError {
  /** Error code classifying the type of error */
  code: FoundryErrorCode;

  /** Human-readable error message */
  message: string;

  /** Optional additional context (IDs, names, etc.) */
  details?: unknown;

  /** Optional underlying error or exception that caused this error */
  cause?: unknown;
}

/**
 * Factory for creating FoundryError instances.
 *
 * @param code - Error code
 * @param message - Error message
 * @param details - Optional additional context
 * @param cause - Optional underlying error
 * @returns FoundryError instance
 *
 * @example
 * ```typescript
 * const error = createFoundryError(
 *   "NOT_FOUND",
 *   "Journal entry not found",
 *   { journalId: "abc123" }
 * );
 * ```
 */
export function createFoundryError(
  code: FoundryErrorCode,
  message: string,
  details?: unknown,
  cause?: unknown
): FoundryError {
  return { code, message, details, cause };
}

/**
 * Type guard helper for error-like objects.
 */
interface ErrorLike {
  code?: unknown;
  message?: unknown;
}

/**
 * Checks if an object has error-like properties.
 */
function isErrorLike(obj: unknown): obj is ErrorLike {
  return typeof obj === "object" && obj !== null;
}

/**
 * Type guard to check if an error is a FoundryError.
 *
 * @param error - Error to check
 * @returns True if error is a FoundryError
 *
 * @example
 * ```typescript
 * if (isFoundryError(error)) {
 *   console.log(error.code); // Type-safe access
 * }
 * ```
 */
export function isFoundryError(error: unknown): error is FoundryError {
  if (!isErrorLike(error)) return false;

  return (
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  );
}
