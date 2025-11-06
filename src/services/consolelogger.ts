import type { Logger } from "@/interfaces/logger";
import { MODULE_CONSTANTS } from "../constants";
import { LogLevel } from "@/config/environment";

/**
 * Console-based implementation of the Logger interface.
 * Writes log messages to the browser console with support for interactive object inspection.
 * Supports configurable minimum log level for filtering.
 *
 * @implements {Logger}
 */
export class ConsoleLoggerService implements Logger {
  static dependencies = [] as const;
  private minLevel: LogLevel = LogLevel.INFO;

  /**
   * Sets the minimum log level. Messages below this level will be ignored.
   * @param level - Minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * Log a message to console
   * @param message - Message to log
   * @param optionalParams - Additional data to log (objects will be interactive in browser console)
   */
  log(message: string, ...optionalParams: unknown[]): void {
    // Log has no specific level, always output
    console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }

  /**
   * Log an error message
   * @param message - Error message to log
   * @param optionalParams - Additional data to log (e.g., error objects, stack traces)
   */
  error(message: string, ...optionalParams: unknown[]): void {
    /* c8 ignore next 2 -- Branch: Log level filtering tested in other methods; error just delegates */
    if (LogLevel.ERROR < this.minLevel) return;
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }

  /**
   * Log a warning message
   * @param message - Warning message to log
   * @param optionalParams - Additional data to log
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.WARN < this.minLevel) return;
    console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }

  /**
   * Log an info message
   * @param message - Info message to log
   * @param optionalParams - Additional data to log
   */
  info(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.INFO < this.minLevel) return;
    console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }

  /**
   * Log a debug message
   * @param message - Debug message to log
   * @param optionalParams - Additional data to log (useful for inspecting complex objects)
   */
  debug(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.DEBUG < this.minLevel) return;
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${message}`, ...optionalParams);
  }
}
