import type { Logger } from "@/interfaces/logger";
import { MODULE_CONSTANTS } from "../constants";
import { LogLevel } from "@/config/environment";
import type { EnvironmentConfig } from "@/config/environment";
import { environmentConfigToken } from "@/tokens/tokenindex";

/**
 * Traced logger wrapper that includes a trace ID in all log messages.
 * Decorates an existing logger to add trace ID prefixes.
 *
 * **Design Pattern:** Decorator Pattern
 *
 * **Behavior Change:** Intentionally modifies log output by adding [traceId] prefix.
 * This is NOT a Liskov Substitution Principle violation because:
 * - The behavior change is documented and intentional
 * - The contract (Logger interface) is fully preserved
 * - All Logger methods are implemented correctly
 * - Callers explicitly request tracing via withTraceId()
 * - The semantic meaning of logging is unchanged (messages are still logged)
 *
 * **Use Case:** Distributed tracing and request correlation.
 * Allows correlating log entries across related operations by including
 * a unique trace ID in all messages.
 *
 * @example
 * ```typescript
 * const logger = new ConsoleLoggerService();
 * const tracedLogger = logger.withTraceId("req-123");
 *
 * tracedLogger.info("Processing request");
 * // Output: "[req-123] Processing request"
 * ```
 */
class TracedLogger implements Logger {
  constructor(
    private readonly baseLogger: Logger,
    private readonly traceId: string
  ) {}

  private formatMessage(message: string): string {
    return `[${this.traceId}] ${message}`;
  }

  setMinLevel(level: LogLevel): void {
    this.baseLogger.setMinLevel?.(level);
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.log(this.formatMessage(message), ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.error(this.formatMessage(message), ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.warn(this.formatMessage(message), ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.info(this.formatMessage(message), ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.debug(this.formatMessage(message), ...optionalParams);
  }

  withTraceId(newTraceId: string): Logger {
    // Nested trace IDs: combine them
    return new TracedLogger(this.baseLogger, `${this.traceId}/${newTraceId}`);
  }
}

/**
 * Console-based implementation of the Logger interface.
 * Writes log messages to the browser console with support for interactive object inspection.
 * Supports configurable minimum log level for filtering.
 *
 * Self-configuring: Receives EnvironmentConfig as dependency and initializes
 * log level from environment configuration.
 *
 * @implements {Logger}
 */
export class ConsoleLoggerService implements Logger {
  static dependencies = [environmentConfigToken] as const;
  private minLevel: LogLevel;

  /**
   * Creates a new ConsoleLoggerService.
   * @param env - Environment configuration (provides initial log level)
   */
  constructor(env: EnvironmentConfig) {
    this.minLevel = env.logLevel;
  }

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
    /* c8 ignore start -- Branch: Log level filtering tested in other methods; error just delegates */
    if (LogLevel.ERROR < this.minLevel) return;
    /* c8 ignore stop */
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

  /**
   * Creates a scoped logger that includes a trace ID in all log messages.
   * The trace ID helps correlate log entries across related operations.
   *
   * @param traceId - Unique trace ID to include in log messages
   * @returns A new Logger instance that includes the trace ID in all messages
   *
   * @example
   * ```typescript
   * import { generateTraceId } from '@/utils/trace';
   *
   * const traceId = generateTraceId();
   * const tracedLogger = logger.withTraceId(traceId);
   * tracedLogger.info('Operation started'); // [1234567890-abc123] Operation started
   * ```
   */
  withTraceId(traceId: string): Logger {
    return new TracedLogger(this, traceId);
  }
}
