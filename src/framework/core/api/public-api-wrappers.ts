import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import type { NotificationCenter } from "@/infrastructure/notifications/NotificationCenter";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
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
export function createPublicLogger(logger: Logger): Logger {
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
export function createPublicI18n(i18n: I18nFacadeService): I18nFacadeService {
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
  notificationCenter: NotificationCenter
): NotificationCenter {
  return createReadOnlyWrapper(notificationCenter, [
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
export function createPublicFoundrySettings(foundrySettings: FoundrySettings): FoundrySettings {
  return createReadOnlyWrapper(foundrySettings, ["get"]);
}
