import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic error for notification operations.
 */
export interface PlatformNotificationError {
  code: string;
  message: string;
  operation?: string;
  details?: unknown;
}

/**
 * Platform-agnostic options for notifications.
 *
 * NOTE: Platform-specific options (e.g., FoundryNotificationOptions) are handled
 * internally by adapters via type guards. This keeps the domain layer clean.
 */
export interface PlatformNotificationOptions {
  channels?: string[];
  traceId?: string;
  // Platform-specific options are handled by adapters, not exposed here
}

/**
 * Platform-agnostic port for notifications.
 *
 * Abstraction that allows domain/application layers to send notifications
 * without knowing about the underlying platform (Foundry UI, Console, etc.).
 *
 * Implementations:
 * - Foundry: NotificationPortAdapter (wraps NotificationCenter with Foundry UI + Console)
 * - Roll20: Roll20NotificationAdapter
 * - Headless: ConsoleOnlyNotificationAdapter
 */
export interface PlatformNotificationPort {
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
