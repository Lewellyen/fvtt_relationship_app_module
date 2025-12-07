import type { LogLevel } from "@/domain/types/log-level";

export type RuntimeConfigValues = {
  isDevelopment: boolean;
  isProduction: boolean;
  logLevel: LogLevel;
  enablePerformanceTracking: boolean;
  performanceSamplingRate: number;
  enableMetricsPersistence: boolean;
  metricsPersistenceKey: string;
  enableCacheService: boolean;
  cacheDefaultTtlMs: number;
  cacheMaxEntries: number | undefined;
};

export type RuntimeConfigKey = keyof RuntimeConfigValues;
