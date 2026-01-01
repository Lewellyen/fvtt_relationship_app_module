/**
 * Runtime config bindings using domain-neutral validators.
 *
 * DIP-Compliant: Uses SettingValidators from domain layer instead of
 * Valibot schemas from infrastructure layer.
 *
 * Separated from RuntimeConfigSync to follow Single Responsibility Principle.
 * This file contains only the binding configuration, not the synchronization logic.
 */

import { SETTING_KEYS } from "@/application/constants/app-constants";
import type { RuntimeConfigBinding } from "@/application/services/RuntimeConfigSync";
import { SettingValidators } from "@/domain/utils/setting-validators";
import type { LogLevel } from "@/domain/types/log-level";
import { getNotificationQueueConstants } from "@/application/settings/notification-queue-max-size-setting";

/**
 * LogLevel validator that checks if value is a valid LogLevel enum value.
 */
const isLogLevel = (value: unknown): value is LogLevel =>
  typeof value === "number" && value >= 0 && value <= 3;

/**
 * Runtime config bindings using domain-neutral validators.
 *
 * Maps setting keys to their corresponding runtime config bindings,
 * which define how settings are synchronized with RuntimeConfigService.
 */
export const runtimeConfigBindings = {
  [SETTING_KEYS.LOG_LEVEL]: {
    runtimeKey: "logLevel",
    validator: isLogLevel,
    normalize: (value: LogLevel) => value,
  } satisfies RuntimeConfigBinding<LogLevel, "logLevel">,
  [SETTING_KEYS.CACHE_ENABLED]: {
    runtimeKey: "enableCacheService",
    validator: SettingValidators.boolean,
    normalize: (value: boolean) => value,
  } satisfies RuntimeConfigBinding<boolean, "enableCacheService">,
  [SETTING_KEYS.CACHE_TTL_MS]: {
    runtimeKey: "cacheDefaultTtlMs",
    validator: SettingValidators.nonNegativeNumber,
    normalize: (value: number) => value,
  } satisfies RuntimeConfigBinding<number, "cacheDefaultTtlMs">,
  [SETTING_KEYS.CACHE_MAX_ENTRIES]: {
    runtimeKey: "cacheMaxEntries",
    validator: SettingValidators.nonNegativeInteger,
    normalize: (value: number) => (value > 0 ? value : undefined),
  } satisfies RuntimeConfigBinding<number, "cacheMaxEntries">,
  [SETTING_KEYS.PERFORMANCE_TRACKING_ENABLED]: {
    runtimeKey: "enablePerformanceTracking",
    validator: SettingValidators.boolean,
    normalize: (value: boolean) => value,
  } satisfies RuntimeConfigBinding<boolean, "enablePerformanceTracking">,
  [SETTING_KEYS.PERFORMANCE_SAMPLING_RATE]: {
    runtimeKey: "performanceSamplingRate",
    validator: SettingValidators.samplingRate,
    normalize: (value: number) => value,
  } satisfies RuntimeConfigBinding<number, "performanceSamplingRate">,
  [SETTING_KEYS.METRICS_PERSISTENCE_ENABLED]: {
    runtimeKey: "enableMetricsPersistence",
    validator: SettingValidators.boolean,
    normalize: (value: boolean) => value,
  } satisfies RuntimeConfigBinding<boolean, "enableMetricsPersistence">,
  [SETTING_KEYS.METRICS_PERSISTENCE_KEY]: {
    runtimeKey: "metricsPersistenceKey",
    validator: SettingValidators.nonEmptyString,
    normalize: (value: string) => value,
  } satisfies RuntimeConfigBinding<string, "metricsPersistenceKey">,
  [SETTING_KEYS.NOTIFICATION_QUEUE_MAX_SIZE]: {
    runtimeKey: "notificationQueueMaxSize",
    validator: SettingValidators.positiveInteger,
    normalize: (value: number) => {
      const constants = getNotificationQueueConstants();
      return Math.max(constants.minSize, Math.min(constants.maxSize, Math.floor(value)));
    },
  } satisfies RuntimeConfigBinding<number, "notificationQueueMaxSize">,
} as const;
