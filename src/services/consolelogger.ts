import type { Logger } from "@/interfaces/logger";
import { MODULE_CONSTANTS } from "../constants";

/**
 * Console-based implementation of the Logger interface.
 * Writes log messages to the browser console with support for interactive object inspection.
 *
 * @implements {Logger}
 */
export class ConsoleLoggerService implements Logger {
  static dependencies = [] as const;

  /**
   * Log a message to console
   * @param message - Message to log
   * @param optionalParams - Additional data to log (objects will be interactive in browser console)
   */
  log(message: string, ...optionalParams: unknown[]): void {
    console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }

  /**
   * Log an error message
   * @param message - Error message to log
   * @param optionalParams - Additional data to log (e.g., error objects, stack traces)
   */
  error(message: string, ...optionalParams: unknown[]): void {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }

  /**
   * Log a warning message
   * @param message - Warning message to log
   * @param optionalParams - Additional data to log
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }

  /**
   * Log an info message
   * @param message - Info message to log
   * @param optionalParams - Additional data to log
   */
  info(message: string, ...optionalParams: unknown[]): void {
    console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }

  /**
   * Log a debug message
   * @param message - Debug message to log
   * @param optionalParams - Additional data to log (useful for inspecting complex objects)
   */
  debug(message: string, ...optionalParams: unknown[]): void {
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
}
