/**
 * Notification tokens for message routing and channels.
 */
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { NotificationChannel } from "@/infrastructure/notifications/notification-channel.interface";
import type { NotificationService } from "@/infrastructure/notifications/notification-center.interface";

/**
 * Injection token for the NotificationCenter.
 *
 * Central message bus for all application notifications (debug, info, warn, error).
 * Routes notifications to registered channels (Console, UI, Sentry, etc.).
 *
 * @example
 * ```typescript
 * const notifications = container.resolve(notificationCenterToken);
 * notifications.debug("Processing data");
 * notifications.error("Operation failed", error);
 * ```
 */
export const notificationCenterToken =
  createInjectionToken<NotificationService>("NotificationCenter");

/**
 * Injection token for ConsoleChannel.
 */
export const consoleChannelToken = createInjectionToken<NotificationChannel>("ConsoleChannel");

/**
 * Injection token for UIChannel.
 */
export const uiChannelToken = createInjectionToken<NotificationChannel>("UIChannel");
