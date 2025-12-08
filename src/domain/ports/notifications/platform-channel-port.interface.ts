import type { Result } from "@/domain/types/result";
import type { FoundryNotificationOptions } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";

/**
 * Platform-agnostic error for channel operations.
 */
export interface PlatformChannelError {
  code: string;
  message: string;
  channelName?: string;
  details?: unknown;
}

/**
 * Platform-agnostic notification message.
 *
 * All notifications flowing through the NotificationCenter will conform to this structure.
 * This interface is defined in the Domain layer to ensure platform independence.
 */
export interface PlatformNotification {
  level: "debug" | "info" | "warn" | "error";
  context: string;
  data?: unknown;
  error?: { code?: string; message: string; details?: unknown };
  timestamp: Date;
  traceId?: string;
  /**
   * Optional UI-specific options. These are passed through to the UI channel
   * and are platform-specific. They are part of the domain notification
   * to allow the application layer to specify UI behavior without knowing
   * the concrete UI implementation.
   */
  uiOptions?: FoundryNotificationOptions;
}

/**
 * Generic port for notification channels.
 *
 * Platform-agnostic abstraction for all channel types.
 * Similar to PlatformEventPort<TEvent> in the event system.
 *
 * Implementations:
 * - Foundry: UIChannel, ConsoleChannel
 * - Roll20: Roll20UIChannel, Roll20ConsoleChannel
 * - Headless: NoOpChannel, ConsoleChannel
 */
export interface PlatformChannelPort {
  /**
   * Unique channel name for identification.
   * Used for logging and channel management.
   */
  readonly name: string;

  /**
   * Determines if this channel should handle the given notification.
   *
   * Channels can filter by:
   * - Notification level (e.g., only errors)
   * - Context patterns (e.g., only "bootstrap*" messages)
   * - Custom logic (e.g., sampling rate for metrics)
   */
  canHandle(notification: PlatformNotification): boolean;

  /**
   * Sends the notification to this channel's output.
   *
   * Should not throw - return error Result instead.
   */
  send(notification: PlatformNotification): Result<void, PlatformChannelError>;
}
