/**
 * Logging interface for dependency injection.
 * Provides structured logging methods for different severity levels.
 */
export interface Logger {
  /** Log a general message */
  log(message: string): void;
  
  /** Log an error message */
  error(message: string): void;
  
  /** Log a warning message */
  warn(message: string): void;
  
  /** Log an informational message */
  info(message: string): void;
  
  /** Log a debug message */
  debug(message: string): void;
}