import type { Logger } from "./logger.interface";
import type { LogLevel } from "@/domain/types/log-level";

/**
 * Decorator that adds a specific trace ID to all log messages.
 * Used by withTraceId() to create a logger with a fixed trace ID.
 */
export class TracedLogger implements Logger {
  constructor(
    private readonly baseLogger: Logger,
    private readonly traceId: string
  ) {}

  setMinLevel?(level: LogLevel): void {
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

  withTraceId?(newTraceId: string): Logger {
    return new TracedLogger(this.baseLogger, `${this.traceId}/${newTraceId}`);
  }

  private formatMessage(message: string): string {
    return `[${this.traceId}] ${message}`;
  }
}
