import type { Result } from "@/domain/types/result";
import type {
  PlatformNotificationPort,
  PlatformNotificationError,
  PlatformNotificationOptions,
} from "@/domain/ports/platform-notification-port.interface";
import type {
  NotificationService,
  NotificationCenterOptions,
} from "@/infrastructure/notifications/notification-center.interface";
import type { FoundryNotificationOptions } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import { ok, err } from "@/domain/utils/result";
import { notificationCenterToken } from "@/infrastructure/shared/tokens/notifications/notification-center.token";

/**
 * Adapter that implements PlatformNotificationPort by wrapping NotificationCenter.
 *
 * Translates platform-agnostic options to NotificationCenter options.
 * Handles Foundry-specific options via type guards internally.
 */
export class NotificationPortAdapter implements PlatformNotificationPort {
  constructor(private readonly notificationCenter: NotificationService) {}

  debug(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError> {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.debug(context, data, centerOptions);
    return this.mapResult(result);
  }

  info(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError> {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.info(context, data, centerOptions);
    return this.mapResult(result);
  }

  warn(
    context: string,
    data?: unknown,
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError> {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.warn(context, data, centerOptions);
    return this.mapResult(result);
  }

  error(
    context: string,
    error?: { code?: string; message: string; details?: unknown },
    options?: PlatformNotificationOptions
  ): Result<void, PlatformNotificationError> {
    const centerOptions = this.mapToCenterOptions(options);
    const result = this.notificationCenter.error(context, error, centerOptions);
    return this.mapResult(result);
  }

  addChannel(_channelName: string): Result<void, PlatformNotificationError> {
    // NotificationCenter uses channel objects, not names
    // This would need to be implemented via a channel registry or similar
    return err({
      code: "OPERATION_NOT_SUPPORTED",
      message:
        "Dynamic channel addition via name not supported. Use NotificationCenter.addChannel() directly.",
      operation: "addChannel",
    });
  }

  removeChannel(channelName: string): Result<boolean, PlatformNotificationError> {
    const removed = this.notificationCenter.removeChannel(channelName);
    return ok(removed);
  }

  getChannelNames(): Result<string[], PlatformNotificationError> {
    const names = this.notificationCenter.getChannelNames();
    return ok(names);
  }

  // ===== Private Helpers =====

  /**
   * Maps platform-agnostic options to NotificationCenter options.
   * Handles Foundry-specific options via type guard if present.
   */
  private mapToCenterOptions(
    options?: PlatformNotificationOptions
  ): NotificationCenterOptions | undefined {
    if (!options) return undefined;

    const centerOptions: NotificationCenterOptions = {
      ...(options.channels !== undefined && { channels: options.channels }),
      ...(options.traceId !== undefined && { traceId: options.traceId }),
    };

    // Type guard: Check if options contain Foundry-specific properties
    // This allows adapters to pass Foundry options without exposing them in the domain
    if (this.isFoundryNotificationOptions(options)) {
      // Extract Foundry-specific options safely
      const foundryOptions: FoundryNotificationOptions = {
        ...(options.permanent !== undefined && { permanent: options.permanent }),
        ...(options.console !== undefined && { console: options.console }),
        ...(options.localize !== undefined && { localize: options.localize }),
        ...(options.progress !== undefined && { progress: options.progress }),
      };
      centerOptions.uiOptions = foundryOptions;
    }

    return centerOptions;
  }

  /**
   * Type guard to detect Foundry-specific notification options.
   * This allows adapters to pass Foundry options without exposing them in the domain interface.
   */
  private isFoundryNotificationOptions(
    options: unknown
  ): options is PlatformNotificationOptions & Partial<FoundryNotificationOptions> {
    return (
      typeof options === "object" &&
      options !== null &&
      ("permanent" in options ||
        "console" in options ||
        "localize" in options ||
        "progress" in options)
    );
  }

  /**
   * Maps NotificationCenter Result to PlatformNotificationPort Result.
   */
  private mapResult(result: Result<void, string>): Result<void, PlatformNotificationError> {
    if (result.ok) {
      return ok(undefined);
    }
    return err({
      code: "NOTIFICATION_FAILED",
      message: result.error,
      operation: "notify",
    });
  }
}

/**
 * DI-enabled wrapper for NotificationPortAdapter.
 */
export class DINotificationPortAdapter extends NotificationPortAdapter {
  static dependencies = [notificationCenterToken] as const;

  constructor(notificationCenter: NotificationService) {
    super(notificationCenter);
  }
}
