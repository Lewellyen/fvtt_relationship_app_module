/**
 * Log level enumeration for controlling logging verbosity.
 * Lower numeric values = more verbose.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Environment configuration for the application.
 * Provides environment-specific settings that can be configured via build-time variables.
 */
export interface EnvironmentConfig {
  /** True if running in development mode */
  isDevelopment: boolean;

  /** True if running in production mode */
  isProduction: boolean;

  /** Minimum log level to output */
  logLevel: LogLevel;

  /** Enable performance tracking and metrics */
  enablePerformanceTracking: boolean;

  /** Enable debug mode features (verbose logging, performance marks, etc.) */
  enableDebugMode: boolean;
}

/**
 * Current environment configuration.
 * Reads from Vite environment variables (import.meta.env).
 */
export const ENV: EnvironmentConfig = {
  isDevelopment: import.meta.env.MODE === "development",
  isProduction: import.meta.env.MODE === "production",
  logLevel: import.meta.env.MODE === "development" ? LogLevel.DEBUG : LogLevel.INFO,
  enablePerformanceTracking: import.meta.env.VITE_ENABLE_PERF_TRACKING === "true",
  enableDebugMode: import.meta.env.MODE === "development",
};
