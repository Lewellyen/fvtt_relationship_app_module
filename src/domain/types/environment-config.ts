import type { LogLevel } from "./log-level";

/**
 * Environment configuration for the application.
 * Provides environment-specific settings that can be configured via build-time variables.
 *
 * This is a domain type representing the business concept of environment configuration.
 * It is used across all layers of the application and should not depend on framework-specific implementations.
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

  /** Enable persistence of metrics between sessions */
  enableMetricsPersistence: boolean;

  /** Storage key for persisted metrics */
  metricsPersistenceKey: string;

  /**
   * Performance sampling rate for production environments (0.0 to 1.0).
   * 0.01 = 1% sampling, 1.0 = 100% sampling.
   * Reduces performance overhead in production by only tracking a percentage of operations.
   * @default 0.01 (1% sampling in production)
   */
  performanceSamplingRate: number;

  /** Enable module-level caching */
  enableCacheService: boolean;

  /** Default TTL for CacheService entries */
  cacheDefaultTtlMs: number;

  /** Optional maximum number of cached entries */
  cacheMaxEntries?: number | undefined;
}
