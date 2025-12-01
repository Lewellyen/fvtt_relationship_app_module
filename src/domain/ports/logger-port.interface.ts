import type { LogLevel } from "@/domain/types/log-level";

/**
 * Logging port interface for dependency injection.
 * Provides structured logging methods for different severity levels.
 *
 * This is a domain port that defines the contract for logging functionality.
 * Implementations are provided by the infrastructure layer.
 *
 * All methods accept optional additional parameters which will be passed
 * to the console for rich object inspection in the browser's developer tools.
 *
 * @interface Logger
 *
 * @example
 * ```typescript
 * const logger: Logger = container.resolve(loggerToken);
 * logger.setMinLevel(LogLevel.INFO);
 * logger.info("Application started");
 * logger.error("An error occurred", error);
 * logger.debug("User data:", user, { additional: "context" });
 * ```
 */
export interface Logger {
  /**
   * Sets the minimum log level. Messages below this level will be ignored.
   * Optional - not all logger implementations support runtime level changes.
   * @param level - Minimum log level
   */
  setMinLevel?(level: LogLevel): void;

  /**
   * Log a general message to the console
   * @param message - The message to log
   * @param optionalParams - Additional data to log (objects will be interactive in browser console)
   */
  log(message: string, ...optionalParams: unknown[]): void;

  /**
   * Log an error message to the console
   * @param message - The error message to log
   * @param optionalParams - Additional data to log (e.g., error objects, context)
   */
  error(message: string, ...optionalParams: unknown[]): void;

  /**
   * Log a warning message to the console
   * @param message - The warning message to log
   * @param optionalParams - Additional data to log
   */
  warn(message: string, ...optionalParams: unknown[]): void;

  /**
   * Log an informational message to the console
   * @param message - The info message to log
   * @param optionalParams - Additional data to log
   */
  info(message: string, ...optionalParams: unknown[]): void;

  /**
   * Log a debug message to the console
   * @param message - The debug message to log
   * @param optionalParams - Additional data to log (useful for inspecting objects)
   */
  debug(message: string, ...optionalParams: unknown[]): void;

  /**
   * Creates a scoped logger that automatically includes a trace ID in all log messages.
   * Useful for correlating log entries across related operations.
   *
   * Optional: Not all logger implementations need to support trace IDs.
   *
   * @param traceId - Unique trace ID to include in log messages
   * @returns A new Logger instance that includes the trace ID in all messages
   *
   * @example
   * ```typescript
   * const traceId = generateTraceId();
   * const tracedLogger = logger.withTraceId?.(traceId);
   *
   * tracedLogger?.info('Starting operation'); // [trace-123-abc] Starting operation
   * tracedLogger?.error('Operation failed'); // [trace-123-abc] Operation failed
   * ```
   */
  withTraceId?(traceId: string): Logger;
}
