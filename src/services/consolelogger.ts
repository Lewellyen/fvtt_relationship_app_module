import type { Logger } from "@/interfaces/logger";

/**
 * Console-based implementation of the Logger interface.
 * Writes log messages to the browser console.
 * 
 * @implements {Logger}
 */
export class ConsoleLoggerService implements Logger {
  /**
   * Log a message to console
   * @param message - Message to log
   */
  log(message: string): void {
    console.log(message);
  }
  
  /**
   * Log an error message
   * @param message - Error message to log
   */
  error(message: string): void {
    console.error(message);
  }
  
  /**
   * Log a warning message
   * @param message - Warning message to log
   */
  warn(message: string): void {
    console.warn(message);
  }
  
  /**
   * Log an info message
   * @param message - Info message to log
   */
  info(message: string): void {
    console.info(message);
  }
  
  /**
   * Log a debug message
   * @param message - Debug message to log
   */
  debug(message: string): void {
    console.debug(message);
  }
}