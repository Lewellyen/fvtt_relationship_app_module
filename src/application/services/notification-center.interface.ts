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
