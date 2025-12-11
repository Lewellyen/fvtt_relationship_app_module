import type { Logger } from "../logger.interface";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import { BaseConsoleLogger } from "../BaseConsoleLogger";
import { RuntimeConfigLoggerDecorator } from "../RuntimeConfigLoggerDecorator";
import { StackTraceLoggerDecorator } from "../StackTraceLoggerDecorator";
import { TraceContextLoggerDecorator } from "../TraceContextLoggerDecorator";

/**
 * Interface for logger composition factory.
 * Single Responsibility: Defines contract for logger composition.
 */
export interface ILoggerCompositionFactory {
  /**
   * Creates a composed logger with all necessary decorators.
   *
   * @param config - Runtime configuration service
   * @param traceContext - Optional trace context for trace ID injection
   * @returns Composed logger instance
   */
  createLogger(config: RuntimeConfigService, traceContext?: TraceContext): Logger;
}

/**
 * Factory for composing logger instances with decorators.
 * Single Responsibility: Only handles logger composition logic.
 *
 * Composes logger in the following order:
 * 1. BaseConsoleLogger (base logging)
 * 2. RuntimeConfigLoggerDecorator (runtime config integration)
 * 3. StackTraceLoggerDecorator (stack trace integration)
 * 4. TraceContextLoggerDecorator (trace context integration, if provided)
 */
export class LoggerCompositionFactory implements ILoggerCompositionFactory {
  /**
   * Creates a composed logger with all necessary decorators.
   *
   * @param config - Runtime configuration service
   * @param traceContext - Optional trace context for trace ID injection
   * @returns Composed logger instance
   */
  createLogger(config: RuntimeConfigService, traceContext?: TraceContext): Logger {
    const baseLogger = new BaseConsoleLogger(config.get("logLevel"));
    const withConfig = new RuntimeConfigLoggerDecorator(baseLogger, config);
    const withStackTrace = new StackTraceLoggerDecorator(withConfig, config);
    return traceContext
      ? new TraceContextLoggerDecorator(withStackTrace, traceContext)
      : withStackTrace;
  }
}
