import { MODULE_CONSTANTS } from "@/constants";

/**
 * Context information for error logging.
 * Provides structured metadata about where and when an error occurred.
 */
export interface ErrorContext {
  /** Phase of module lifecycle when error occurred */
  phase: "bootstrap" | "initialization" | "runtime";
  /** Component or service where error originated */
  component?: string;
  /** Additional contextual metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Centralized error handler for bootstrap and initialization errors.
 *
 * Provides structured, grouped error logging in the browser console.
 * Uses console.group() for clear, collapsible output that's easy to
 * screenshot and share for debugging.
 *
 * @remarks
 * Foundry v13 does not write module console logs to error.log files,
 * so this handler optimizes for browser console readability.
 *
 * @example
 * ```typescript
 * BootstrapErrorHandler.logError(error, {
 *   phase: 'bootstrap',
 *   component: 'CompositionRoot',
 *   metadata: { foundryVersion: 13 }
 * });
 * ```
 */
export class BootstrapErrorHandler {
  /**
   * Logs an error with structured context in the browser console.
   *
   * Creates a collapsible group with timestamp, phase, component,
   * error details, and metadata for easy debugging and screenshotting.
   *
   * @param error - The error that occurred (Error object, string, or unknown)
   * @param context - Context information about the error
   */
  static logError(error: unknown, context: ErrorContext): void {
    const timestamp = new Date().toISOString();

    console.group(`[${timestamp}] ${MODULE_CONSTANTS.LOG_PREFIX} Error in ${context.phase}`);

    if (context.component) {
      console.error("Component:", context.component);
    }

    console.error("Error:", error);

    if (context.metadata && Object.keys(context.metadata).length > 0) {
      console.error("Metadata:", context.metadata);
    }

    console.groupEnd();
  }
}
