import { LogLevel } from "@/domain/types/log-level";
import { LOG_PREFIX } from "@/application/constants/app-constants";
import type { Logger } from "./logger.interface";
import type { TraceContext } from "@/infrastructure/observability/trace/TraceContext";
import { traceContextToken } from "@/infrastructure/shared/tokens/observability.tokens";
import { runtimeConfigToken } from "@/infrastructure/shared/tokens/core.tokens";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";

/**
 * Logger implementation that writes to the browser console with module prefix
 * and optional trace context correlation.
 */
export class ConsoleLoggerService implements Logger {
  private minLevel: LogLevel;
  private readonly traceContext: TraceContext | null;
  private runtimeConfigUnsubscribe: (() => void) | null = null;

  constructor(config: RuntimeConfigService, traceContext?: TraceContext) {
    this.traceContext = traceContext ?? null;
    this.minLevel = config.get("logLevel");
    this.bindRuntimeConfig(config);
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  log(message: string, ...optionalParams: unknown[]): void {
    const formattedMessage = this.formatWithContextTrace(message);
    console.log(`${LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.ERROR < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message);
    console.error(`${LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.WARN < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message);
    console.warn(`${LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.INFO < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message);
    console.info(`${LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.DEBUG < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message);
    console.debug(`${LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    return new TracedLogger(this, traceId);
  }

  private bindRuntimeConfig(runtimeConfig: RuntimeConfigService): void {
    this.minLevel = runtimeConfig.get("logLevel");
    this.runtimeConfigUnsubscribe?.();
    this.runtimeConfigUnsubscribe = runtimeConfig.onChange("logLevel", (level) => {
      this.setMinLevel(level);
    });
  }

  private getContextTraceId(): string | null {
    return this.traceContext?.getCurrentTraceId() ?? null;
  }

  private formatWithContextTrace(message: string): string {
    const contextTraceId = this.getContextTraceId();
    if (contextTraceId) {
      return `[${contextTraceId}] ${message}`;
    }
    return message;
  }
}

class TracedLogger implements Logger {
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

export class DIConsoleLoggerService extends ConsoleLoggerService {
  static dependencies = [runtimeConfigToken, traceContextToken] as const;

  constructor(config: RuntimeConfigService, traceContext?: TraceContext) {
    super(config, traceContext);
  }
}
