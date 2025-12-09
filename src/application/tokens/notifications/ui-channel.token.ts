/**
 * Injection token for UIChannel.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/application/utils/token-factory";
import type { PlatformUINotificationChannelPort } from "@/domain/ports/notifications/platform-ui-notification-channel-port.interface";

/**
 * Injection token for UIChannel.
 */
export const uiChannelToken = createInjectionToken<PlatformUINotificationChannelPort>("UIChannel");
