import * as v from "valibot";

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

/**
 * Schema for LogLevel setting values.
 * Validates that value is one of the defined LogLevel enum values.
 *
 * This schema is used for runtime validation of log level values.
 * It is defined in the domain layer but uses valibot for validation.
 */
export const LOG_LEVEL_SCHEMA = v.picklist([
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR,
]);

