import type { ContainerErrorCode } from "@/di_infrastructure/types/containererrorcode";

/**
 * Structured error information for container operations.
 * Provides detailed error context for debugging and error handling.
 *
 * @interface ContainerError
 *
 * @example
 * ```typescript
 * const error: ContainerError = {
 *   code: "TokenNotRegistered",
 *   message: "Service LoggerToken was not registered",
 *   tokenDescription: "LoggerToken",
 * };
 * ```
 */
export interface ContainerError {
  /** Error code classifying the type of error */
  code: ContainerErrorCode;

  /** Human-readable error message */
  message: string;

  /** Optional underlying error or exception that caused this error */
  cause?: unknown;

  /** Optional description of the token associated with this error */
  tokenDescription?: string;

  /** Optional additional error context (e.g., failed children in PartialDisposal) */
  details?: unknown;
}
