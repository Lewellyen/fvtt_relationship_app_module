/**
 * NotificationCenter - Central Message Bus for all application notifications.
 *
 * **Responsibilities:**
 * - Route notifications to registered channels
 * - Support dynamic channel registration/removal
 * - Provide convenience methods for each log level
 * - Provide a single point to route notifications across channels
 *
 * **Architecture:**
 * - Strategy Pattern: Channels are pluggable strategies
 * - Observer Pattern: Channels observe notifications
 * - Open/Closed Principle: Extensible without modification
 *
 * **Channel Flow:**
 * ```
 * Service → NotificationCenter → [ConsoleChannel, UIChannel, SentryChannel, ...]
 * ```
 *
 * @example
 * ```typescript
 * class MyService {
 *   static dependencies = [notificationCenterToken];
 *   constructor(private notifications: NotificationCenter) {}
 *
 *   doSomething() {
 *     this.notifications.debug("Processing data");
 *     this.notifications.info("Completed", { count: 10 });
 *     this.notifications.warn("Deprecated API used");
 *     this.notifications.error("Operation failed", error);
 *   }
 * }
 * ```
 */

import { consoleChannelToken } from "@/infrastructure/shared/tokens";
import { err, ok } from "@/infrastructure/shared/utils/result";
import type { Result } from "@/domain/types/result";
import type { FoundryNotificationOptions } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import type {
  Notification,
  NotificationChannel,
  NotificationLevel,
} from "./notification-channel.interface";

export type NotificationCenterOptions = {
  /**
   * Optional list of channel names that should receive this notification.
   * If omitted, all registered channels are considered.
   */
  channels?: string[];
  /**
   * Optional trace identifier that gets attached to the notification.
   */
  traceId?: string;
  /**
   * Optional Foundry UI notification options to pass through `ui.notifications`.
   */
  uiOptions?: FoundryNotificationOptions;
};

/**
 * Central hub for module notifications. Routes notifications to registered channels
 * (console, UI, remote logging, ...), performs channel filtering, and aggregates
 * errors when deliveries fail.
 */
export class NotificationCenter {
  private readonly channels: NotificationChannel[];

  constructor(initialChannels: NotificationChannel[]) {
    this.channels = [...initialChannels];
  }

  debug(
    context: string,
    data?: unknown,
    options?: NotificationCenterOptions
  ): Result<void, string> {
    const payload = data === undefined ? {} : { data };
    return this.notify("debug", context, payload, options);
  }

  info(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string> {
    const payload = data === undefined ? {} : { data };
    return this.notify("info", context, payload, options);
  }

  warn(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string> {
    const payload = data === undefined ? {} : { data };
    return this.notify("warn", context, payload, options);
  }

  error(
    context: string,
    error?: Notification["error"],
    options?: NotificationCenterOptions
  ): Result<void, string> {
    const payload = error === undefined ? {} : { error };
    return this.notify("error", context, payload, options);
  }

  addChannel(channel: NotificationChannel): void {
    const alreadyRegistered = this.channels.some((existing) => existing.name === channel.name);
    if (!alreadyRegistered) {
      this.channels.push(channel);
    }
  }

  removeChannel(name: string): boolean {
    const index = this.channels.findIndex((channel) => channel.name === name);
    if (index === -1) {
      return false;
    }

    this.channels.splice(index, 1);
    return true;
  }

  getChannelNames(): string[] {
    return this.channels.map((channel) => channel.name);
  }

  private notify(
    level: NotificationLevel,
    context: string,
    payload: Partial<Pick<Notification, "data" | "error">>,
    options?: NotificationCenterOptions
  ): Result<void, string> {
    const notification: Notification = {
      level,
      context,
      timestamp: new Date(),
      ...(payload.data !== undefined ? { data: payload.data } : {}),
      ...(payload.error !== undefined ? { error: payload.error } : {}),
      ...(options?.traceId !== undefined ? { traceId: options.traceId } : {}),
      ...(options?.uiOptions !== undefined ? { uiOptions: options.uiOptions } : {}),
    };

    const targetChannels = this.selectChannels(options?.channels);
    let attempted = false;
    let succeeded = false;
    const failures: string[] = [];

    for (const channel of targetChannels) {
      if (!channel.canHandle(notification)) {
        continue;
      }

      attempted = true;
      const result = channel.send(notification);
      if (result.ok) {
        succeeded = true;
      } else {
        failures.push(`${channel.name}: ${result.error}`);
      }
    }

    if (!attempted) {
      // No channel attempted to handle this notification.
      // If explicit channel names were provided, treat this as configuration error.
      if (options?.channels && options.channels.length > 0) {
        return err(
          `No channels attempted to handle notification (requested: ${options.channels.join(", ")})`
        );
      }

      // Otherwise treat as no-op: nothing was able to handle the notification.
      return ok(undefined);
    }

    if (succeeded) {
      return ok(undefined);
    }

    return err(`All channels failed: ${failures.join("; ")}`);
  }

  private selectChannels(channelNames?: string[]): NotificationChannel[] {
    if (!channelNames || channelNames.length === 0) {
      return this.channels;
    }

    return this.channels.filter((channel) => channelNames.includes(channel.name));
  }
}

export class DINotificationCenter extends NotificationCenter {
  static dependencies = [consoleChannelToken] as const;

  constructor(consoleChannel: NotificationChannel) {
    super([consoleChannel]);
  }
}
