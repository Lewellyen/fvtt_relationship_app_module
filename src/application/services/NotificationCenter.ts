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
 * - Uses only Domain-Ports (PlatformChannelPort)
 * - Application-Layer (Business-Logic: Routing-Entscheidungen)
 * - Platform-agnostic
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

import { err, ok } from "@/domain/utils/result";
import type { Result } from "@/domain/types/result";
import type {
  PlatformChannelPort,
  PlatformNotification,
} from "@/domain/ports/notifications/platform-channel-port.interface";
import type {
  NotificationService,
  NotificationCenterOptions,
} from "./notification-center.interface";
import { consoleChannelToken } from "@/application/tokens/notifications/console-channel.token";
import { uiChannelToken } from "@/application/tokens/notifications/ui-channel.token";

/**
 * Central hub for module notifications. Routes notifications to registered channels
 * (console, UI, remote logging, ...), performs channel filtering, and aggregates
 * errors when deliveries fail.
 */
export class NotificationCenter implements NotificationService {
  private readonly channels: PlatformChannelPort[];

  constructor(initialChannels: PlatformChannelPort[]) {
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
    error?: PlatformNotification["error"],
    options?: NotificationCenterOptions
  ): Result<void, string> {
    const payload = error === undefined ? {} : { error };
    return this.notify("error", context, payload, options);
  }

  addChannel(channel: PlatformChannelPort): void {
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
    level: PlatformNotification["level"],
    context: string,
    payload: Partial<Pick<PlatformNotification, "data" | "error">>,
    options?: NotificationCenterOptions
  ): Result<void, string> {
    const notification: PlatformNotification = {
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
        failures.push(`${channel.name}: ${result.error.message}`);
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

  private selectChannels(channelNames?: string[]): PlatformChannelPort[] {
    if (!channelNames || channelNames.length === 0) {
      return this.channels;
    }

    return this.channels.filter((channel) => channelNames.includes(channel.name));
  }
}

/**
 * DI wrapper for NotificationCenter.
 * Injects channels via constructor.
 */
export class DINotificationCenter extends NotificationCenter {
  static dependencies = [consoleChannelToken, uiChannelToken] as const;

  constructor(consoleChannel: PlatformChannelPort, uiChannel: PlatformChannelPort) {
    super([consoleChannel, uiChannel]);
  }
}
