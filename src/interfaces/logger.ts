/**
 * Logging interface for dependency injection.
 * Provides structured logging methods for different severity levels.
 *
 * All methods accept optional additional parameters which will be passed
 * to the console for rich object inspection in the browser's developer tools.
 *
 * @interface Logger
 *
 * @example
 * ```typescript
 * const logger: Logger = container.resolve(loggerToken);
 * logger.info("Application started");
 * logger.error("An error occurred", error);
 * logger.debug("User data:", user, { additional: "context" });
 * ```
 */
export interface Logger {
  /**
   * Log a general message to the console
   * @param message - The message to log
   * @param optionalParams - Additional data to log (objects will be interactive in browser console)
   */
  log(message: string, ...optionalParams: any[]): void;

  /**
   * Log an error message to the console
   * @param message - The error message to log
   * @param optionalParams - Additional data to log (e.g., error objects, context)
   */
  error(message: string, ...optionalParams: any[]): void;

  /**
   * Log a warning message to the console
   * @param message - The warning message to log
   * @param optionalParams - Additional data to log
   */
  warn(message: string, ...optionalParams: any[]): void;

  /**
   * Log an informational message to the console
   * @param message - The info message to log
   * @param optionalParams - Additional data to log
   */
  info(message: string, ...optionalParams: any[]): void;

  /**
   * Log a debug message to the console
   * @param message - The debug message to log
   * @param optionalParams - Additional data to log (useful for inspecting objects)
   */
  debug(message: string, ...optionalParams: any[]): void;
}
