import type { Logger } from "./logger.interface";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import type { LogLevel } from "@/domain/types/log-level";
import { TracedLogger } from "./TracedLogger";

/**
 * Decorator that adds trace context to log messages.
 * Single Responsibility: Only handles trace ID formatting.
 */
export class TraceContextLoggerDecorator implements Logger {
  constructor(
    private readonly baseLogger: Logger,
    private readonly traceContext: TraceContext | null
  ) {}

  setMinLevel(level: LogLevel): void {
    this.baseLogger.setMinLevel?.(level);
  }

  private formatWithTrace(message: string): string {
    const traceId = this.traceContext?.getCurrentTraceId();
    return traceId ? `[${traceId}] ${message}` : message;
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.log(this.formatWithTrace(message), ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.error(this.formatWithTrace(message), ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.warn(this.formatWithTrace(message), ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.info(this.formatWithTrace(message), ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.debug(this.formatWithTrace(message), ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    // Wrap this decorator (not the base logger) so that context trace is preserved
    return new TracedLogger(this, traceId);
  }
}
