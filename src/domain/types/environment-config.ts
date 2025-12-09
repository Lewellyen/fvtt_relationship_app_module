import { LogLevel } from "./log-level";

/**
 * Environment configuration for the application.
 * Provides environment-specific settings that can be configured via build-time variables.
 *
 * This interface is defined in the domain layer to allow application services
 * to depend on it without violating the dependency rule (Application → Domain is allowed).
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

  /** Minimum notification queue size (Build-Time, fixed after build) */
  notificationQueueMinSize: number;

  /** Maximum notification queue size (Build-Time, fixed after build) */
  notificationQueueMaxSize: number;

  /** Default notification queue size (Build-Time, Runtime überschreibbar via Setting) */
  notificationQueueDefaultSize: number;
}
