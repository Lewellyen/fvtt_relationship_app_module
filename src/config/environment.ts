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

  /**
   * Performance sampling rate for production environments (0.0 to 1.0).
   * 0.01 = 1% sampling, 1.0 = 100% sampling.
   * Reduces performance overhead in production by only tracking a percentage of operations.
   * @default 0.01 (1% sampling in production)
   */
  performanceSamplingRate: number;
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
  // 1% sampling in production, 100% in development
  performanceSamplingRate:
    import.meta.env.MODE === "production"
      ? parseFloat(import.meta.env.VITE_PERF_SAMPLING_RATE ?? "0.01")
      : 1.0,
};
