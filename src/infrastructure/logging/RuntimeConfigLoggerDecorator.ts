import type { Logger } from "./logger.interface";
import type { LogLevel } from "@/domain/types/log-level";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";

/**
 * Decorator that syncs log level with RuntimeConfig.
 * Single Responsibility: Only handles RuntimeConfig subscription.
 */
export class RuntimeConfigLoggerDecorator implements Logger {
  private unsubscribe: (() => void) | null = null;

  constructor(
    private readonly baseLogger: Logger,
    private readonly runtimeConfig: PlatformRuntimeConfigPort
  ) {
    this.syncLogLevel();
  }

  private syncLogLevel(): void {
    this.baseLogger.setMinLevel?.(this.runtimeConfig.get("logLevel"));
    this.unsubscribe?.();
    this.unsubscribe = this.runtimeConfig.onChange("logLevel", (level) => {
      this.baseLogger.setMinLevel?.(level);
    });
  }

  setMinLevel(level: LogLevel): void {
    this.baseLogger.setMinLevel?.(level);
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.log(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.error(message, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.warn(message, ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.info(message, ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.debug(message, ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    return this.baseLogger.withTraceId?.(traceId) ?? this.baseLogger;
  }

  dispose(): void {
    this.unsubscribe?.();
  }
}
