/**
 * Error sanitization utilities for production environments.
 * Prevents leaking sensitive information in error messages.
 */

import { ENV } from "@/config/environment";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";

/**
 * Sanitizes container errors for production use.
 *
 * In production mode, removes potentially sensitive information like:
 * - Token descriptions (might reveal internal architecture)
 * - Error causes (might contain stack traces or system details)
 * - Detailed metadata
 *
 * In development mode, returns error unchanged for debugging.
 *
 * @param error - The container error to sanitize
 * @returns Sanitized error safe for production logging
 *
 * @example
 * ```typescript
 * const result = container.resolve(token);
 * if (!result.ok) {
 *   const safeError = sanitizeErrorForProduction(result.error);
 *   ui.notifications.error(safeError.message);
 * }
 * ```
 */
export function sanitizeErrorForProduction(error: ContainerError): ContainerError {
  // In development, return full error details for debugging
  if (!ENV.isProduction) {
    return error;
  }

  // In production, return minimal error information
  return {
    code: error.code,
    message: "An internal error occurred. Please contact support if this persists.",
    // Do not include tokenDescription, cause, or other potentially sensitive fields
  };
}

/**
 * Sanitizes a generic error message for production.
 *
 * Removes stack traces and detailed error messages in production.
 *
 * @param message - The error message to sanitize
 * @returns Sanitized message
 */
export function sanitizeMessageForProduction(message: string): string {
  if (!ENV.isProduction) {
    return message;
  }

  // In production, return generic message
  return "An error occurred";
}
