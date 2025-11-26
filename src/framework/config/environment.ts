import * as v from "valibot";
import { MODULE_CONSTANTS } from "@/infrastructure/shared/constants";

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
 * Schema for LogLevel setting values.
 * Validates that value is one of the defined LogLevel enum values.
 */
export const LOG_LEVEL_SCHEMA = v.picklist([
  LogLevel.DEBUG,
  LogLevel.INFO,
  LogLevel.WARN,
  LogLevel.ERROR,
]);

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

/**
 * Safely parses a sampling rate from an environment variable.
 * Ensures the value is a valid number between 0 and 1.
 *
 * @param envValue - Environment variable value to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Valid sampling rate between 0.0 and 1.0
 * @internal Exported for testing
 */
export function parseSamplingRate(envValue: string | undefined, fallback: number): number {
  const raw = parseFloat(envValue ?? String(fallback));
  // Check if valid number and clamp to [0, 1] range
  return Number.isFinite(raw) ? Math.min(1, Math.max(0, raw)) : fallback;
}

function parseNonNegativeNumber(envValue: string | undefined, fallback: number): number {
  const parsed = Number(envValue);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed < 0 ? fallback : parsed;
}

function parseOptionalPositiveInteger(envValue: string | undefined): number | undefined {
  if (!envValue) {
    return undefined;
  }
  const parsed = Number(envValue);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return Math.floor(parsed);
}

/**
 * Type-safe wrapper for accessing Vite environment variables.
 *
 * Vite's import.meta.env is available at build-time, but TypeScript
 * cannot infer the types for dynamic property access. This wrapper
 * provides type-safe access with explicit parsing.
 *
 * @param key - The environment variable key (e.g., 'VITE_CACHE_MAX_ENTRIES')
 * @param parser - Function to parse the string value to the desired type
 * @returns The parsed value of type T
 *
 * @example
 * ```typescript
 * const maxEntries = getEnvVar('VITE_CACHE_MAX_ENTRIES', parseOptionalPositiveInteger);
 * ```
 */
function getEnvVar<T>(key: string, parser: (val: string | undefined) => T): T {
  // Access import.meta.env dynamically - type is string | undefined at runtime
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return parser(value);
}

/**
 * Current environment configuration.
 * Reads from Vite environment variables (import.meta.env).
 */
const parsedCacheMaxEntries = getEnvVar("VITE_CACHE_MAX_ENTRIES", parseOptionalPositiveInteger);

export const ENV: EnvironmentConfig = {
  isDevelopment: import.meta.env.MODE === "development",
  isProduction: import.meta.env.MODE === "production",
  logLevel: import.meta.env.MODE === "development" ? LogLevel.DEBUG : LogLevel.INFO,
  enablePerformanceTracking: import.meta.env.VITE_ENABLE_PERF_TRACKING === "true",
  enableMetricsPersistence: getEnvVar("VITE_ENABLE_METRICS_PERSISTENCE", (val) => val === "true"),
  metricsPersistenceKey: getEnvVar(
    "VITE_METRICS_PERSISTENCE_KEY",
    (val) => val ?? "fvtt_relationship_app_module.metrics"
  ),
  // 1% sampling in production, 100% in development
  performanceSamplingRate:
    import.meta.env.MODE === "production"
      ? parseSamplingRate(import.meta.env.VITE_PERF_SAMPLING_RATE, 0.01)
      : 1.0,
  enableCacheService: getEnvVar("VITE_CACHE_ENABLED", (val) =>
    val === undefined ? true : val === "true"
  ),
  cacheDefaultTtlMs: getEnvVar("VITE_CACHE_TTL_MS", (val) =>
    parseNonNegativeNumber(val, MODULE_CONSTANTS.DEFAULTS.CACHE_TTL_MS)
  ),
  ...(parsedCacheMaxEntries !== undefined ? { cacheMaxEntries: parsedCacheMaxEntries } : {}),
};
