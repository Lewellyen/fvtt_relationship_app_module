/**
 * Log level enumeration for controlling logging verbosity.
 * Lower numeric values = more verbose.
 *
 * This is a domain type representing the business concept of log levels.
 * It is used across all layers of the application.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
