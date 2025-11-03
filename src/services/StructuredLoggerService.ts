import type { Logger } from "@/interfaces/logger";
import { MODULE_CONSTANTS } from "@/constants";

/**
 * Metadata context for structured logging.
 * Allows adding arbitrary key-value pairs to log entries.
 */
export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  duration?: number;
  [key: string]: unknown;
}

/**
 * Structured log entry for JSON-based logging.
 * Provides machine-readable log format for better observability.
 */
export interface StructuredLogEntry {
  timestamp: number;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "LOG";
  message: string;
  module: string;
  context?: LogContext;
  data?: unknown[];
}

/**
 * Structured logger implementation with JSON-formatted output.
 *
 * Benefits over ConsoleLoggerService:
 * - Machine-readable JSON format
 * - Structured metadata (component, action, userId, etc.)
 * - Timestamp on every log entry
 * - Better integration with log aggregation tools (Sentry, Datadog, etc.)
 *
 * @example
 * ```typescript
 * const logger = new StructuredLoggerService();
 * logger.info('User logged in', { userId: '123', action: 'login' });
 *
 * // Output:
 * // {
 * //   "timestamp": 1699012345678,
 * //   "level": "INFO",
 * //   "message": "User logged in",
 * //   "module": "fvtt_relationship_app_module",
 * //   "context": { "userId": "123", "action": "login" }
 * // }
 * ```
 */
export class StructuredLoggerService implements Logger {
  static dependencies = [] as const;

  /**
   * Creates a structured log entry.
   * @param level - Log level
   * @param message - Log message
   * @param context - Optional structured context
   * @param data - Additional data to log
   * @returns Structured log entry
   */
  private createLogEntry(
    level: StructuredLogEntry["level"],
    message: string,
    context?: LogContext,
    data?: unknown[]
  ): StructuredLogEntry {
    return {
      timestamp: Date.now(),
      level,
      message,
      module: MODULE_CONSTANTS.MODULE.ID,
      ...(context && { context }),
      ...(data && data.length > 0 && { data }),
    };
  }

  /**
   * Formats a log entry as JSON string.
   * Handles circular references and non-serializable data gracefully.
   * @param entry - The log entry to format
   * @returns JSON string representation
   */
  private formatEntry(entry: StructuredLogEntry): string {
    try {
      return JSON.stringify(entry);
    } catch {
      // Fallback if JSON.stringify fails (circular references, etc.)
      // Create a safe version without data that might be circular
      try {
        return JSON.stringify({
          timestamp: entry.timestamp,
          level: entry.level,
          message: entry.message,
          module: entry.module,
          context: entry.context,
          data: "[Circular or non-serializable data]",
        });
      } catch {
        // Ultimate fallback: minimal structure
        return JSON.stringify({
          timestamp: entry.timestamp,
          level: entry.level,
          message: entry.message,
          module: entry.module,
        });
      }
    }
  }

  /**
   * Log a general message with optional structured context.
   * @param message - Message to log
   * @param optionalParams - First param can be LogContext, rest is additional data
   */
  log(message: string, ...optionalParams: unknown[]): void {
    const context = this.extractContext(optionalParams);
    const entry = this.createLogEntry("LOG", message, context, optionalParams);
    console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${this.formatEntry(entry)}`);
  }

  /**
   * Log an error message with optional structured context.
   * @param message - Error message to log
   * @param optionalParams - First param can be LogContext, rest is additional data
   */
  error(message: string, ...optionalParams: unknown[]): void {
    const context = this.extractContext(optionalParams);
    const entry = this.createLogEntry("ERROR", message, context, optionalParams);
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${this.formatEntry(entry)}`);
  }

  /**
   * Log a warning message with optional structured context.
   * @param message - Warning message to log
   * @param optionalParams - First param can be LogContext, rest is additional data
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    const context = this.extractContext(optionalParams);
    const entry = this.createLogEntry("WARN", message, context, optionalParams);
    console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${this.formatEntry(entry)}`);
  }

  /**
   * Log an info message with optional structured context.
   * @param message - Info message to log
   * @param optionalParams - First param can be LogContext, rest is additional data
   */
  info(message: string, ...optionalParams: unknown[]): void {
    const context = this.extractContext(optionalParams);
    const entry = this.createLogEntry("INFO", message, context, optionalParams);
    console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${this.formatEntry(entry)}`);
  }

  /**
   * Log a debug message with optional structured context.
   * @param message - Debug message to log
   * @param optionalParams - First param can be LogContext, rest is additional data
   */
  debug(message: string, ...optionalParams: unknown[]): void {
    const context = this.extractContext(optionalParams);
    const entry = this.createLogEntry("DEBUG", message, context, optionalParams);
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${this.formatEntry(entry)}`);
  }

  /**
   * Extracts LogContext from optional parameters if present.
   * Checks if first parameter is a plain object with context-like properties.
   *
   * @param params - Optional parameters
   * @returns Extracted context or undefined
   */
  private extractContext(params: unknown[]): LogContext | undefined {
    if (params.length === 0) return undefined;

    const first = params[0];

    // Check if first param is a plain object (potential LogContext)
    if (
      first &&
      typeof first === "object" &&
      !Array.isArray(first) &&
      !(first instanceof Error) &&
      !(first instanceof Date)
    ) {
      return first as LogContext;
    }

    return undefined;
  }
}
