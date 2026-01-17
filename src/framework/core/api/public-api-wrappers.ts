import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { PlatformI18nPort } from "@/domain/ports/platform-i18n-port.interface";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import { createReadOnlyWrapper } from "./readonly-wrapper";

/**
 * Creates a read-only wrapper for Logger service.
 *
 * Only allows logging methods, blocks configuration methods like setMinLevel().
 * This prevents external modules from changing the global logger configuration.
 *
 * @param logger - Logger service instance
 * @returns Read-only logger proxy
 *
 * @example
 * ```typescript
 * const publicLogger = createPublicLogger(logger);
 * publicLogger.info("Hello");  // ✅ OK
 * publicLogger.setMinLevel(0); // ❌ Error
 * ```
 */
export function createPublicLogger(logger: PlatformLoggingPort): PlatformLoggingPort {
  return createReadOnlyWrapper(logger, [
    "log",
    "debug",
    "info",
    "warn",
    "error",
    "withTraceId", // Decorator pattern for trace context
  ]);
}

/**
 * Creates a read-only wrapper for I18nFacadeService.
 *
 * Only allows read operations (translate, format, has).
 * Prevents modification of internal translation state.
 *
 * @param i18n - I18nFacadeService instance
 * @returns Read-only i18n proxy
 *
 * @example
 * ```typescript
 * const publicI18n = createPublicI18n(i18n);
 * publicI18n.translate("key"); // ✅ OK
 * publicI18n.internalState = {}; // ❌ Error
 * ```
 */
export function createPublicI18n(i18n: PlatformI18nPort): PlatformI18nPort {
  return createReadOnlyWrapper(i18n, ["translate", "format", "has"]);
}

/**
 * Creates a read-only wrapper for NotificationCenter.
 *
 * Allows routing notifications while preventing external modules from
 * mutating registered channels.
 *
 * @param notificationCenter - NotificationCenter instance
 * @returns Read-only notification proxy
 */
export function createPublicNotificationCenter(
  notificationPort: PlatformNotificationPort
): PlatformNotificationPort {
  return createReadOnlyWrapper(notificationPort, [
    "debug",
    "info",
    "warn",
    "error",
    "getChannelNames",
  ]);
}

/**
 * Creates a read-only wrapper for FoundrySettings service.
 *
 * Allows validated reads of settings while blocking registration and mutation
 * operations that could impact module configuration.
 *
 * @param foundrySettings - FoundrySettings service instance
 * @returns Read-only settings proxy
 */
export function createPublicSettingsRegistrationPort(
  settings: PlatformSettingsRegistrationPort
): PlatformSettingsRegistrationPort {
  return createReadOnlyWrapper(settings, ["getSettingValue"]);
}
