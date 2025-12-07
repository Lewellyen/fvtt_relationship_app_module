/**
 * Injection token for ConsoleChannel.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { NotificationChannel } from "@/infrastructure/notifications/notification-channel.interface";

/**
 * Injection token for ConsoleChannel.
 */
export const consoleChannelToken = createInjectionToken<NotificationChannel>("ConsoleChannel");
