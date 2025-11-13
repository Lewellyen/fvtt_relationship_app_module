import type { EnvironmentConfig } from "@/config/environment";
import { LogLevel } from "@/config/environment";
import { MODULE_CONSTANTS } from "@/constants";
import type { Logger } from "@/interfaces/logger";
import type { TraceContext } from "@/observability/trace/TraceContext";
import { environmentConfigToken, traceContextToken } from "@/tokens/tokenindex";

/**
 * Logger implementation that writes to the browser console with module prefix
 * and optional trace context correlation.
 */
export class ConsoleLoggerService implements Logger {
  private minLevel: LogLevel;
  private readonly traceContext: TraceContext | null;

  constructor(env: EnvironmentConfig, traceContext?: TraceContext) {
    this.minLevel = env.logLevel;
    this.traceContext = traceContext ?? null;
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  log(message: string, ...optionalParams: unknown[]): void {
    const formattedMessage = this.formatWithContextTrace(message);
    console.log(`${MODULE_CONSTANTS.LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.ERROR < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message);
    console.error(`${MODULE_CONSTANTS.LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.WARN < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message);
    console.warn(`${MODULE_CONSTANTS.LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.INFO < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message);
    console.info(`${MODULE_CONSTANTS.LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.DEBUG < this.minLevel) return;
    const formattedMessage = this.formatWithContextTrace(message);
    console.debug(`${MODULE_CONSTANTS.LOG_PREFIX} ${formattedMessage}`, ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    return new TracedLogger(this, traceId);
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
  static dependencies = [environmentConfigToken, traceContextToken] as const;

  constructor(env: EnvironmentConfig, traceContext?: TraceContext) {
    super(env, traceContext);
  }
}
