import type { Result } from "@/domain/types/result";
import type { PlatformNotificationError } from "@/domain/ports/notifications/platform-notification-types.interface";

/**
 * Platform-agnostic port for managing notification channels.
 *
 * This interface provides only the channel management methods (addChannel, removeChannel, getChannelNames).
 * It follows the Interface Segregation Principle (ISP) by separating channel management
 * from notification publishing.
 *
 * Use this interface when you only need to manage channels and don't need to send notifications.
 *
 * For notification publishing (debug, info, warn, error), use NotificationPublisherPort.
 * For both capabilities, use PlatformNotificationPort (which composes both interfaces).
 *
 * Implementations:
 * - Foundry: NotificationPortAdapter (implements both NotificationPublisherPort and NotificationChannelRegistryPort)
 * - Roll20: Roll20NotificationAdapter
 * - Headless: ConsoleOnlyNotificationAdapter
 */
export interface NotificationChannelRegistryPort {
  /**
   * Add a notification channel dynamically.
   * @param channelName - Name of the channel to add
   * @returns Result indicating success or error
   */
  addChannel(channelName: string): Result<void, PlatformNotificationError>;

  /**
   * Remove a notification channel.
   * @param channelName - Name of the channel to remove
   * @returns Result with boolean (true if removed, false if not found) or error
   */
  removeChannel(channelName: string): Result<boolean, PlatformNotificationError>;

  /**
   * Get list of registered channel names.
   * @returns Result with array of channel names or error
   */
  getChannelNames(): Result<string[], PlatformNotificationError>;
}
