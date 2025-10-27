import type { Logger } from "@/interfaces/logger";
import { tryCatch } from "@/utils/result";

/**
 * Console-based implementation of the Logger interface.
 * Writes log messages to the browser console with error handling.
 *
 * @implements {Logger}
 */
export class ConsoleLoggerService implements Logger {
  /**
   * Log a message to console
   * @param message - Message to log
   * @returns Result indicating success or logging error
   */
  log(message: string) {
    return tryCatch(
      () => {
        console.log(message);
      },
      (error) => `Failed to log message: ${error}`
    );
  }

  /**
   * Log an error message
   * @param message - Error message to log
   * @returns Result indicating success or logging error
   */
  error(message: string) {
    return tryCatch(
      () => {
        console.error(message);
      },
      (error) => `Failed to log error: ${error}`
    );
  }

  /**
   * Log a warning message
   * @param message - Warning message to log
   * @returns Result indicating success or logging error
   */
  warn(message: string) {
    return tryCatch(
      () => {
        console.warn(message);
      },
      (error) => `Failed to log warning: ${error}`
    );
  }

  /**
   * Log an info message
   * @param message - Info message to log
   * @returns Result indicating success or logging error
   */
  info(message: string) {
    return tryCatch(
      () => {
        console.info(message);
      },
      (error) => `Failed to log info: ${error}`
    );
  }

  /**
   * Log a debug message
   * @param message - Debug message to log
   * @returns Result indicating success or logging error
   */
  debug(message: string) {
    return tryCatch(
      () => {
        console.debug(message);
      },
      (error) => `Failed to log debug: ${error}`
    );
  }
}
