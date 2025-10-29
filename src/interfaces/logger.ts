/**
 * Logging interface for dependency injection.
 * Provides structured logging methods for different severity levels.
 *
 * @interface Logger
 *
 * @example
 * ```typescript
 * const logger: Logger = container.resolve(loggerToken);
 * logger.info("Application started");
 * logger.error("An error occurred");
 * ```
 */
export interface Logger {
  /**
   * Log a general message to the console
   * @param message - The message to log
   */
  log(message: string): void;

  /**
   * Log an error message to the console
   * @param message - The error message to log
   */
  error(message: string): void;

  /**
   * Log a warning message to the console
   * @param message - The warning message to log
   */
  warn(message: string): void;

  /**
   * Log an informational message to the console
   * @param message - The info message to log
   */
  info(message: string): void;

  /**
   * Log a debug message to the console
   * @param message - The debug message to log
   */
  debug(message: string): void;
}
