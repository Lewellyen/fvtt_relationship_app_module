import type { Result } from "@/types/result";

/**
 * Logging interface for dependency injection.
 * Provides structured logging methods for different severity levels with error handling support.
 *
 * @interface Logger
 *
 * @example
 * ```typescript
 * const logger: Logger = container.resolve(loggerToken);
 * const result = logger.info("Application started");
 * if (isErr(result)) {
 *   console.error("Failed to log:", result.error);
 * }
 * ```
 */
export interface Logger {
  /**
   * Log a general message to the console
   * @param message - The message to log
   * @returns Result indicating success or logging error
   */
  log(message: string): Result<void, string>;

  /**
   * Log an error message to the console
   * @param message - The error message to log
   * @returns Result indicating success or logging error
   */
  error(message: string): Result<void, string>;

  /**
   * Log a warning message to the console
   * @param message - The warning message to log
   * @returns Result indicating success or logging error
   */
  warn(message: string): Result<void, string>;

  /**
   * Log an informational message to the console
   * @param message - The info message to log
   * @returns Result indicating success or logging error
   */
  info(message: string): Result<void, string>;

  /**
   * Log a debug message to the console
   * @param message - The debug message to log
   * @returns Result indicating success or logging error
   */
  debug(message: string): Result<void, string>;
}
