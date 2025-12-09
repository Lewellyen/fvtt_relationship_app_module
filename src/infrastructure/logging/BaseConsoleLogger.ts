import { LOG_PREFIX } from "@/application/constants/app-constants";
import type { Logger } from "./logger.interface";
import { LogLevel } from "@/domain/types/log-level";
import { TracedLogger } from "./TracedLogger";

/**
 * Base console logger without configuration or trace concerns.
 * Single Responsibility: Only writes to console.
 */
export class BaseConsoleLogger implements Logger {
  constructor(private minLevel: LogLevel) {}

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  log(message: string, ...optionalParams: unknown[]): void {
    console.log(`${LOG_PREFIX} ${message}`, ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.ERROR < this.minLevel) return;
    console.error(`${LOG_PREFIX} ${message}`, ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.WARN < this.minLevel) return;
    console.warn(`${LOG_PREFIX} ${message}`, ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.INFO < this.minLevel) return;
    console.info(`${LOG_PREFIX} ${message}`, ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    if (LogLevel.DEBUG < this.minLevel) return;
    console.debug(`${LOG_PREFIX} ${message}`, ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    return new TracedLogger(this, traceId);
  }
}
