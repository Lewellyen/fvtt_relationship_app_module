/**
 * Injection token for the NotificationCenter.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { NotificationService } from "@/application/services/notification-center.interface";

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
