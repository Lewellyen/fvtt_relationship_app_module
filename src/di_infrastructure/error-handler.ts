/**
 * Centralized error handling for the DI container.
 *
 * **Design Rationale:**
 * - Single place for error sanitization logic
 * - Automatic sanitization in production mode
 * - Reduces manual sanitizeErrorForProduction() calls throughout codebase
 * - Easier to extend with logging, notifications, etc.
 *
 * @see sanitizeErrorForProduction for sanitization rules
 */

import type { EnvironmentConfig } from "@/config/environment";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";
import { sanitizeErrorForProduction } from "@/utils/security/error-sanitizer";

/**
 * Handles container errors with automatic sanitization.
 *
 * Provides centralized error handling that automatically sanitizes
 * errors in production mode to prevent information leakage.
 *
 * @example
 * ```typescript
 * const handler = new ContainerErrorHandler(env);
 * const result = container.resolveWithError(token);
 * if (!result.ok) {
 *   const safeError = handler.sanitize(result.error);
 *   ui.notifications.error(safeError.message);
 * }
 * ```
 */
export class ContainerErrorHandler {
  constructor(private readonly env: EnvironmentConfig) {}

  /**
   * Sanitizes a container error for safe logging/display.
   *
   * In production: Removes sensitive details (token descriptions, causes, metadata)
   * In development: Returns error unchanged for debugging
   *
   * @param error - The container error to sanitize
   * @returns Sanitized error safe for production
   */
  sanitize(error: ContainerError): ContainerError {
    return sanitizeErrorForProduction(this.env, error);
  }

  /**
   * Handles a container error with logging and sanitization.
   *
   * This is the central error handling pipeline that can be extended
   * to add notifications, metrics recording, etc.
   *
   * @param error - The container error to handle
   * @returns Sanitized error
   */
  handle(error: ContainerError): ContainerError {
    const sanitized = this.sanitize(error);

    // In future, could add:
    // - UI notifications for critical errors
    // - Metrics recording for error rates
    // - External error tracking (Sentry, etc.)

    return sanitized;
  }
}
