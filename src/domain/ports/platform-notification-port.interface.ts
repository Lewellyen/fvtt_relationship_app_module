import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import type { NotificationChannelRegistryPort } from "@/domain/ports/notifications/notification-channel-registry-port.interface";

// Re-export types for backward compatibility
export type {
  PlatformNotificationError,
  PlatformNotificationOptions,
} from "@/domain/ports/notifications/platform-notification-types.interface";

/**
 * Platform-agnostic port for notifications.
 *
 * This interface combines NotificationPublisherPort and NotificationChannelRegistryPort
 * for convenience when both capabilities are needed.
 *
 * **Interface Segregation Principle (ISP):**
 * - For notification publishing only, use NotificationPublisherPort
 * - For channel management only, use NotificationChannelRegistryPort
 * - For both capabilities, use PlatformNotificationPort (this interface)
 *
 * **Backward Compatibility:**
 * This interface is maintained as a composition of the two segregated interfaces
 * to preserve backward compatibility. New code should prefer the specific interfaces
 * (NotificationPublisherPort or NotificationChannelRegistryPort) when only one
 * capability is needed.
 *
 * Implementations:
 * - Foundry: NotificationPortAdapter (implements both NotificationPublisherPort and NotificationChannelRegistryPort)
 * - Roll20: Roll20NotificationAdapter
 * - Headless: ConsoleOnlyNotificationAdapter
 */
export interface PlatformNotificationPort
  extends NotificationPublisherPort, NotificationChannelRegistryPort {}
