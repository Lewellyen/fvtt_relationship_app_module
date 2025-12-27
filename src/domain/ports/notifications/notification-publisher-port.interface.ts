import type { Result } from "@/domain/types/result";
import type {
  PlatformNotificationError,
  PlatformNotificationOptions,
} from "@/domain/ports/notifications/platform-notification-types.interface";

/**
 * Platform-agnostic port for publishing notifications.
 *
 * This interface provides only the notification publishing methods (debug, info, warn, error).
 * It follows the Interface Segregation Principle (ISP) by separating notification publishing
 * from channel management.
 *
 * Use this interface when you only need to send notifications and don't need to manage channels.
 *
 * For channel management (add/remove/list channels), use NotificationChannelRegistryPort.
 * For both capabilities, use PlatformNotificationPort (which composes both interfaces).
 *
 * Implementations:
 * - Foundry: NotificationPortAdapter (implements both NotificationPublisherPort and NotificationChannelRegistryPort)
 * - Roll20: Roll20NotificationAdapter
 * - Headless: ConsoleOnlyNotificationAdapter
 */
export interface NotificationPublisherPort {
  /**
   * Send a debug notification.
   * @param context - The notification context/message
   * @param data - Optional additional data
   * @param options - Optional notification options
   * @returns Result indicating success or error
   */
  debug(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError>;

  /**
   * Send an info notification.
   * @param context - The notification context/message
   * @param data - Optional additional data
   * @param options - Optional notification options
   * @returns Result indicating success or error
   */
  info(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError>;

  /**
   * Send a warning notification.
   * @param context - The notification context/message
   * @param data - Optional additional data
   * @param options - Optional notification options
   * @returns Result indicating success or error
   */
  warn(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError>;

  /**
   * Send an error notification.
   * @param context - The notification context/message
   * @param error - Optional error object
   * @param options - Optional notification options
   * @returns Result indicating success or error
   */
  error(
    context: string,
    error?: { code?: string; message: string; details?: unknown },
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError>;
}
