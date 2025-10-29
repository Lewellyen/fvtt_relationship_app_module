import type { Logger } from "@/interfaces/logger";
import { MODULE_CONSTANTS } from "../constants";

/**
 * Console-based implementation of the Logger interface.
 * Writes log messages to the browser console.
 *
 * @implements {Logger}
 */
export class ConsoleLoggerService implements Logger {
  static dependencies = [] as const;

  /**
   * Log a message to console
   * @param message - Message to log
   */
  log(message: string): void {
    console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`);
  }

  /**
   * Log an error message
   * @param message - Error message to log
   */
  error(message: string): void {
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`);
  }

  /**
   * Log a warning message
   * @param message - Warning message to log
   */
  warn(message: string): void {
    console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`);
  }

  /**
   * Log an info message
   * @param message - Info message to log
   */
  info(message: string): void {
    console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`);
  }

  /**
   * Log a debug message
   * @param message - Debug message to log
   */
  debug(message: string): void {
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`);
  }
}
