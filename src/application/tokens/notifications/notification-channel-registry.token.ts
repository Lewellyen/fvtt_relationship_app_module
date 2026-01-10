/**
 * Injection token for NotificationChannelRegistry.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/application/utils/token-factory";
import type { NotificationChannelRegistry } from "@/application/services/notification-center.interface";

/**
 * Injection token for NotificationChannelRegistry.
 *
 * Provides channel management capabilities (addChannel, removeChannel, getChannelNames) only.
 * Use this token when you only need to manage channels, not send notifications.
 *
 * @example
 * ```typescript
 * const registry = container.resolve(notificationChannelRegistryToken);
 * registry.addChannel(channel);
 * const names = registry.getChannelNames();
 * ```
 */
export const notificationChannelRegistryToken = createInjectionToken<NotificationChannelRegistry>(
  "NotificationChannelRegistry"
);
