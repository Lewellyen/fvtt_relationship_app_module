/**
 * Injection token for NotificationQueue.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { NotificationQueue } from "@/infrastructure/notifications/NotificationQueue";

/**
 * Injection token for NotificationQueue.
 */
export const notificationQueueToken = createInjectionToken<NotificationQueue>("NotificationQueue");
