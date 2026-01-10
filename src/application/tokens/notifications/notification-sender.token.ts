/**
 * Injection token for NotificationSender.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/application/utils/token-factory";
import type { NotificationSender } from "@/application/services/notification-center.interface";

/**
 * Injection token for NotificationSender.
 *
 * Provides notification sending capabilities (debug, info, warn, error) only.
 * Use this token when you only need to send notifications, not manage channels.
 *
 * @example
 * ```typescript
 * const notifications = container.resolve(notificationSenderToken);
 * notifications.debug("Processing data");
 * notifications.error("Operation failed", error);
 * ```
 */
export const notificationSenderToken =
  createInjectionToken<NotificationSender>("NotificationSender");
