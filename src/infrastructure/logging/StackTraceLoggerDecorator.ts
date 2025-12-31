import type { Logger } from "./logger.interface";
import type { LogLevel } from "@/domain/types/log-level";
import type { PlatformRuntimeConfigPort } from "@/domain/ports/platform-runtime-config-port.interface";
import { LogLevel as LogLevelEnum } from "@/domain/types/log-level";

/**
 * Decorator that adds stack trace information to log messages when debug mode is enabled.
 * Single Responsibility: Only handles caller information extraction and formatting.
 *
 * Compatible with other logger decorators (RuntimeConfigLoggerDecorator, TraceContextLoggerDecorator).
 * The caller info is appended to the message, allowing other decorators to prepend their information.
 *
 * @example
 * When LogLevel is DEBUG:
 * - Input: "Warning: Something went wrong"
 * - Output: "Warning: Something went wrong [foundry-ports.ts:42]"
 *
 * When LogLevel is not DEBUG:
 * - Input: "Warning: Something went wrong"
 * - Output: "Warning: Something went wrong" (no caller info)
 */
export class StackTraceLoggerDecorator implements Logger {
  constructor(
    private readonly baseLogger: Logger,
    private readonly runtimeConfig: PlatformRuntimeConfigPort
  ) {}

  setMinLevel(level: LogLevel): void {
    this.baseLogger.setMinLevel?.(level);
  }

  /**
   * Extracts the caller information from stack trace when debug mode is enabled.
   * Filters out logger-related frames to show the actual source of the log call.
   *
   * @returns Caller info in format "filename:line" or undefined if not in debug mode or extraction fails
   */
  private getCallerInfo(): string | undefined {
    const currentLogLevel = this.runtimeConfig.get("logLevel");
    if (currentLogLevel !== LogLevelEnum.DEBUG) {
      return undefined;
    }

    try {
      const stack = new Error().stack;
      if (!stack) return undefined;

      const lines = stack.split("\n");
      // Skip: Error constructor (line 0), this method (line 1-2), and logger methods
      // Look for first frame that's not from logging infrastructure
      const loggerPatterns = [
        /StackTraceLoggerDecorator/,
        /BaseConsoleLogger/,
        /ConsoleLoggerService/,
        /RuntimeConfigLoggerDecorator/,
        /TraceContextLoggerDecorator/,
        /TracedLogger/,
        /at Object\./,
      ];

      for (let i = 3; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const isLoggerFrame = loggerPatterns.some((pattern) => pattern.test(line));
        if (!isLoggerFrame && line.trim()) {
          // Extract file and line info, clean up the format
          // Match: "at functionName (file.ts:42:10)" or "at file.ts:42:10"
          const match =
            line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
            line.match(/at\s+(.+?):(\d+):(\d+)/);
          if (match) {
            // Return simplified caller info: filename:line
            const filePath = match[2] || match[1];
            const lineNum = match[3] || match[2];
            if (filePath && lineNum) {
              // Extract just the filename if it's a full path
              const fileName = filePath.split(/[/\\]/).pop() || filePath;
              return `${fileName}:${lineNum}`;
            }
          }
          // Fallback: return the cleaned line
          return line.trim().replace(/^at\s+/, "");
        }
      }
    } catch {
      // Silently fail if stack trace is not available
    }

    return undefined;
  }

  private formatWithCallerInfo(message: string): string {
    const callerInfo = this.getCallerInfo();
    return callerInfo ? `${message} [${callerInfo}]` : message;
  }

  log(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.log(this.formatWithCallerInfo(message), ...optionalParams);
  }

  error(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.error(this.formatWithCallerInfo(message), ...optionalParams);
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.warn(this.formatWithCallerInfo(message), ...optionalParams);
  }

  info(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.info(this.formatWithCallerInfo(message), ...optionalParams);
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    this.baseLogger.debug(this.formatWithCallerInfo(message), ...optionalParams);
  }

  withTraceId(traceId: string): Logger {
    return this.baseLogger.withTraceId?.(traceId) ?? this.baseLogger;
  }
}
