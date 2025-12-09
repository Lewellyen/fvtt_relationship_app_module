import { SETTING_KEYS } from "@/application/constants/app-constants";
import type { SettingDefinition } from "./setting-definition.interface";
import type { PlatformValidationPort } from "@/domain/ports/platform-validation-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import { unwrapOr } from "@/domain/utils/result";

/**
 * Notification queue size constants.
 * These values are configured at build-time via VITE_* environment variables.
 *
 * MIN/MAX are fixed after build (security boundaries).
 * DEFAULT can be overridden at runtime via Foundry settings.
 *
 * Note: These values are hardcoded here to avoid importing from framework layer.
 * They match the values defined in VITE_NOTIFICATION_QUEUE_* environment variables.
 */
const NOTIFICATION_QUEUE_CONSTANTS = {
  minSize: 10,
  maxSize: 1000,
  defaultSize: 50,
} as const;

/**
 * Gets notification queue size constants.
 * These values are configured at build-time via VITE_* environment variables.
 *
 * MIN/MAX are fixed after build (security boundaries).
 * DEFAULT can be overridden at runtime via Foundry settings.
 */
export function getNotificationQueueConstants(): {
  minSize: number;
  maxSize: number;
  defaultSize: number;
} {
  return NOTIFICATION_QUEUE_CONSTANTS;
}

/**
 * Foundry setting for configuring the notification queue max size.
 *
 * This setting controls the maximum number of notifications that can be queued
 * before the UI becomes available. When the queue reaches this limit, oldest
 * notifications are removed to make room for new ones.
 *
 * **Build-Time Configuration:**
 * - MIN/MAX values are configured via VITE_NOTIFICATION_QUEUE_MIN_SIZE and
 *   VITE_NOTIFICATION_QUEUE_MAX_SIZE environment variables
 * - These values are compiled into the build and cannot be changed at runtime
 *
 * **Runtime Configuration:**
 * - DEFAULT value can be overridden via this setting
 * - Values are clamped to MIN/MAX boundaries
 */
export const notificationQueueMaxSizeSetting: SettingDefinition<number> = {
  key: SETTING_KEYS.NOTIFICATION_QUEUE_MAX_SIZE,

  createConfig(
    i18n: PlatformI18nPort,
    logger: PlatformLoggingPort,
    _validator: PlatformValidationPort
  ) {
    const constants = getNotificationQueueConstants();

    return {
      name: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.notificationQueueMaxSize.name",
          "Notification Queue Max Size"
        ),
        "Notification Queue Max Size"
      ),
      hint: unwrapOr(
        i18n.translate(
          "MODULE.SETTINGS.notificationQueueMaxSize.hint",
          `Maximum number of notifications queued before UI is available. Range: ${constants.minSize}-${constants.maxSize}.`
        ),
        `Maximum number of notifications queued before UI is available. Range: ${constants.minSize}-${constants.maxSize}.`
      ),
      scope: "world",
      config: true,
      type: Number,
      default: constants.defaultSize,
      onChange: (value: number) => {
        const numericValue = Number(value);
        const clamped = Math.max(
          constants.minSize,
          Math.min(constants.maxSize, Math.floor(numericValue))
        );
        if (clamped !== numericValue) {
          logger.info(
            `Notification queue max size clamped from ${numericValue} to ${clamped} (range: ${constants.minSize}-${constants.maxSize})`
          );
        } else {
          logger.info(`Notification queue max size updated via settings: ${clamped}`);
        }
      },
    };
  },
};
