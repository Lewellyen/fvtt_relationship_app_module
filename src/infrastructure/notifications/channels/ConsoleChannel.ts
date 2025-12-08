/**
 * Console Channel - Routes notifications to console.
 *
 * **Platform-Agnostic:**
 * - Uses PlatformLoggingPort (Domain-Port)
 * - Works with Foundry, Roll20, Headless
 *
 * **Responsibilities:**
 * - Send all notification levels to console
 * - Delegate to PlatformLoggingPort (debug, info, warn, error methods)
 * - No filtering - handles all notifications
 */

import type {
  PlatformConsoleChannelPort,
  PlatformNotification,
  PlatformChannelError,
} from "@/domain/ports/notifications/platform-console-channel-port.interface";
import type { PlatformLoggingPort } from "@/domain/ports/platform-logging-port.interface";
import type { Result } from "@/domain/types/result";
import { ok } from "@/domain/utils/result";
import { platformLoggingPortToken } from "@/application/tokens/domain-ports.tokens";

export class ConsoleChannel implements PlatformConsoleChannelPort {
  readonly name = "ConsoleChannel";

  constructor(private readonly logger: PlatformLoggingPort) {}

  canHandle(): boolean {
    // Console accepts all notification levels
    return true;
  }

  send(notification: PlatformNotification): Result<void, PlatformChannelError> {
    const { level, context, data, error } = notification;
    // For error level, prefer error over data; for other levels, prefer data over error
    const payload = level === "error" ? (error ?? data) : (data ?? error);
    this.log(level, context, payload);
    return ok(undefined);
  }

  log(level: "debug" | "info" | "warn" | "error", message: string, data?: unknown): void {
    switch (level) {
      case "debug":
        this.logger.debug(message, data);
        break;
      case "info":
        this.logger.info(message, data);
        break;
      case "warn":
        this.logger.warn(message, data);
        break;
      case "error":
        this.logger.error(message, data);
        break;
    }
  }
}

export class DIConsoleChannel extends ConsoleChannel {
  static dependencies = [platformLoggingPortToken] as const;

  constructor(logger: PlatformLoggingPort) {
    super(logger);
  }
}
