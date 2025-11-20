/**
 * Console Channel - Routes notifications to console via Logger.
 *
 * **Responsibilities:**
 * - Send all notification levels to console
 * - Delegate to Logger service (debug, info, warn, error methods)
 * - No filtering - handles all notifications
 *
 * **Design:**
 * Console is for developers - no sanitization needed.
 * Full details are always logged.
 */

import type {
  NotificationChannel,
  Notification,
} from "@/infrastructure/notifications/notification-channel.interface";
import type { Logger } from "@/infrastructure/logging/logger.interface";
import type { Result } from "@/domain/types/result";
import { ok } from "@/infrastructure/shared/utils/result";
import { loggerToken } from "@/infrastructure/shared/tokens";

export class ConsoleChannel implements NotificationChannel {
  readonly name = "ConsoleChannel";

  constructor(private readonly logger: Logger) {}

  canHandle(): boolean {
    // Console accepts all notification levels
    return true;
  }

  send(notification: Notification): Result<void, string> {
    const { level, context, data, error } = notification;

    // Route to appropriate logger method
    switch (level) {
      case "debug":
        this.logger.debug(context, data);
        break;
      case "info":
        this.logger.info(context, data);
        break;
      case "warn":
        this.logger.warn(context, data ?? error);
        break;
      case "error":
        this.logger.error(context, error ?? data);
        break;
    }

    return ok(undefined);
  }
}

export class DIConsoleChannel extends ConsoleChannel {
  static dependencies = [loggerToken] as const;

  constructor(logger: Logger) {
    super(logger);
  }
}
