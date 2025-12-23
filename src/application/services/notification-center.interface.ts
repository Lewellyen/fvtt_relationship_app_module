import type { Result } from "@/domain/types/result";
import type {
  PlatformChannelPort,
  PlatformNotification,
} from "@/domain/ports/notifications/platform-channel-port.interface";

/**
 * Platform-agnostic options for NotificationCenter.
 *
 * Platform-specific options are passed through via uiOptions and handled by the channels themselves.
 * The Application Layer does not know about platform-specific types (Clean Architecture).
 */
export type NotificationCenterOptions = {
  channels?: string[];
  traceId?: string;
  /**
   * UI-specific options passed through to channels.
   * These are platform-specific and are handled by the channels themselves.
   * Type is `unknown` to maintain Clean Architecture (Application Layer should not know about Foundry-specific types).
   */
  uiOptions?: unknown;
};

/**
 * Interface for sending notifications.
 *
 * Provides methods for sending notifications at different log levels.
 * Platform-agnostic interface for routing notifications through channels.
 */
export interface NotificationSender {
  debug(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  info(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  warn(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  error(
    context: string,
    error?: PlatformNotification["error"],
    options?: NotificationCenterOptions
  ): Result<void, string>;
}

/**
 * Interface for managing notification channels.
 *
 * Provides methods for adding, removing, and querying notification channels.
 */
export interface ChannelManager {
  addChannel(channel: PlatformChannelPort): void;
  removeChannel(name: string): boolean;
  getChannelNames(): string[];
}

/**
 * Service interface for NotificationCenter.
 *
 * Platform-agnostic interface for sending notifications through channels.
 * Combines notification sending and channel management capabilities.
 */
export interface NotificationService extends NotificationSender, ChannelManager {}
