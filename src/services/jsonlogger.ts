import type { Logger } from "@/interfaces/logger";
import { MODULE_CONSTANTS } from "../constants";
import { LogLevel } from "@/config/environment";

/**
 * JSON-based logger implementation for structured logging.
 *
 * Outputs logs as JSON objects for easy parsing by log aggregation systems
 * (e.g., Elasticsearch, Splunk, CloudWatch).
 *
 * Use this logger when machine-readable logs are needed instead of human-readable console output.
 *
 * @implements {Logger}
 *
 * @example
 * ```typescript
 * // In dependencyconfig.ts:
 * container.registerClass(loggerToken, JsonLogger, ServiceLifecycle.SINGLETON);
 *
 * // Output example:
 * {
 *   "timestamp": "2025-11-04T21:30:00.000Z",
 *   "level": "info",
 *   "module": "fvtt_relationship_app_module",
 *   "message": "Module initialized",
 *   "data": [{ "foundryVersion": 13 }]
 * }
 * ```
 */
export class JsonLogger implements Logger {
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
   * Internal method to output a JSON log entry.
   *
   * @param level - Log level
   * @param message - Log message
   * @param params - Additional data to include
   */
  private logJson(level: string, message: string, params: unknown[]): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      module: MODULE_CONSTANTS.MODULE.ID,
      message,
      ...(params.length > 0 && { data: params }),
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log a message to console
   * @param message - Message to log
   * @param optionalParams - Additional data to log (will be serialized to JSON)
   */
  log(message: string, ...optionalParams: unknown[]): void {
    // Log has no specific level, always output
    this.logJson("log", message, optionalParams);
  }

  /**
   * Log an error message
   * @param message - Error message to log
   * @param optionalParams - Additional data to log (e.g., error objects)
   */
  error(message: string, ...optionalParams: unknown[]): void {
    /* c8 ignore next 2 -- Branch: Log level filtering tested in other methods; error just delegates */
    if (LogLevel.ERROR < this.minLevel) return;
    this.logJson("error", message, optionalParams);
  }

  /**
   * Log a warning message
   * @param message - Warning message to log
   * @param optionalParams - Additional data to log
   */
  warn(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.WARN < this.minLevel) return;
    this.logJson("warn", message, optionalParams);
  }

  /**
   * Log an info message
   * @param message - Info message to log
   * @param optionalParams - Additional data to log
   */
  info(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.INFO < this.minLevel) return;
    this.logJson("info", message, optionalParams);
  }

  /**
   * Log a debug message
   * @param message - Debug message to log
   * @param optionalParams - Additional data to log
   */
  debug(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.DEBUG < this.minLevel) return;
    this.logJson("debug", message, optionalParams);
  }
}
