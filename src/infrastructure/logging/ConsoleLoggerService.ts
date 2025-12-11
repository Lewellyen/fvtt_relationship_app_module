import type { Logger } from "./logger.interface";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import { traceContextToken } from "@/infrastructure/shared/tokens/observability/trace-context.token";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { LogLevel } from "@/domain/types/log-level";
import {
  LoggerCompositionFactory,
  type ILoggerCompositionFactory,
} from "./factory/logger-composition-factory";

/**
 * Console logger with RuntimeConfig and TraceContext support.
 * Single Responsibility: Only provides Logger interface, delegates to composed logger.
 *
 * Logger composition is handled by LoggerCompositionFactory.
 */
export class ConsoleLoggerService implements Logger {
  private readonly logger: Logger;

  constructor(
    config: RuntimeConfigService,
    traceContext?: TraceContext,
    factory?: ILoggerCompositionFactory
  ) {
    const compositionFactory = factory ?? new LoggerCompositionFactory();
    this.logger = compositionFactory.createLogger(config, traceContext);
  }

  // Delegate all methods to composed logger
  setMinLevel(level: LogLevel): void {
    this.logger.setMinLevel?.(level);
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.logger.log(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.logger.error(message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.logger.warn(message, ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    this.logger.info(message, ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.logger.debug(message, ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    return this.logger.withTraceId?.(traceId) ?? this.logger;
  }
}

export class DIConsoleLoggerService extends ConsoleLoggerService {
  static dependencies = [runtimeConfigToken, traceContextToken] as const;

  constructor(config: RuntimeConfigService, traceContext?: TraceContext) {
    super(config, traceContext);
  }
}
