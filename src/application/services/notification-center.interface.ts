import type { Result } from "@/domain/types/result";
import type {
  PlatformChannelPort,
  PlatformNotification,
} from "@/domain/ports/notifications/platform-channel-port.interface";
import type { FoundryNotificationOptions } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";

/**
 * Platform-agnostic options for NotificationCenter.
 *
 * Platform-specific options (like FoundryNotificationOptions) are passed through
 * via uiOptions and handled by the channels themselves.
 */
export type NotificationCenterOptions = {
  channels?: string[];
  traceId?: string;
  /**
   * UI-specific options passed through to channels.
   * These are platform-specific (e.g., FoundryNotificationOptions) and are
   * handled by the channels themselves.
   */
  uiOptions?: FoundryNotificationOptions;
};

/**
 * Service interface for NotificationCenter.
 *
 * Platform-agnostic interface for sending notifications through channels.
 */
export interface NotificationService {
  debug(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  info(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  warn(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  error(
    context: string,
    error?: PlatformNotification["error"],
    options?: NotificationCenterOptions
  ): Result<void, string>;
  addChannel(channel: PlatformChannelPort): void;
  removeChannel(name: string): boolean;
  getChannelNames(): string[];
}
