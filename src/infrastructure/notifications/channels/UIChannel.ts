/**
 * UI Channel - Routes notifications to platform UI.
 *
 * **Platform-Agnostic:**
 * - Uses PlatformUINotificationPort (Domain-Port)
 * - Works with Foundry, Roll20, Headless
 *
 * **Responsibilities:**
 * - Filter out debug messages (not relevant for end-users)
 * - Sanitize messages in production mode
 * - Map notification levels to UI notification types
 */

import type {
  PlatformUINotificationChannelPort,
  PlatformNotification,
  PlatformChannelError,
} from "@/domain/ports/notifications/platform-ui-notification-channel-port.interface";
import type { PlatformUINotificationPort } from "@/domain/ports/platform-ui-notification-port.interface";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import { platformUINotificationPortToken } from "@/application/tokens/domain-ports.tokens";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";

export class UIChannel implements PlatformUINotificationChannelPort {
  readonly name = "UIChannel";

  constructor(
    private readonly platformUI: PlatformUINotificationPort,
    private readonly config: RuntimeConfigService
  ) {}

  canHandle(notification: PlatformNotification): boolean {
    // Debug messages are too technical for UI
    return notification.level !== "debug";
  }

  send(notification: PlatformNotification): Result<void, PlatformChannelError> {
    const sanitizedMessage = this.sanitizeForUI(notification);
    const uiTypeResult = this.mapLevelToUIType(notification.level);
    if (!uiTypeResult.ok) {
      return err({
        code: "MAPPING_FAILED",
        message: uiTypeResult.error,
        channelName: this.name,
      });
    }

    const result = this.platformUI.notify(sanitizedMessage, uiTypeResult.value);
    if (!result.ok) {
      return err({
        code: "UI_NOTIFICATION_FAILED",
        message: result.error.message,
        channelName: this.name,
        details: result.error,
      });
    }

    return ok(undefined);
  }

  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformChannelError> {
    const result = this.platformUI.notify(message, type);
    if (!result.ok) {
      return err({
        code: "UI_NOTIFICATION_FAILED",
        message: result.error.message,
        channelName: this.name,
        details: result.error,
      });
    }
    return ok(undefined);
  }

  /**
   * Sanitizes notification message for UI display.
   *
   * Development: Shows detailed messages
   * Production: Shows generic messages to prevent information leakage
   */
  private sanitizeForUI(notification: PlatformNotification): string {
    const { level, context, data, error } = notification;

    if (this.config.get("isDevelopment")) {
      // Development: Show meaningful details
      if (level === "error" && error) {
        return `${context}: ${error.message}`;
      }
      if (data && typeof data === "object" && "message" in data) {
        return `${context}: ${String(data.message)}`;
      }
      return context;
    }

    // Production: Generic messages
    if (level === "error" && error) {
      // Show error code (not sensitive) for support debugging
      return `${context}. Please try again or contact support. (Error: ${error.code})`;
    }

    // Info/Warn: Show context only (assume context is already user-friendly)
    return context;
  }

  /**
   * Maps notification level to UI notification type.
   * Protected to allow testing of exhaustive type check.
   */
  protected mapLevelToUIType(
    level: PlatformNotification["level"]
  ): Result<"info" | "warning" | "error", string> {
    switch (level) {
      case "info":
        return ok("info");
      case "warn":
        return ok("warning");
      case "error":
        return ok("error");
      case "debug": {
        // TypeScript-Compiler sollte hier warnen, wenn debug nicht mehr im Union ist
        // This should never be called because canHandle() filters out debug level
        // Return error to satisfy exhaustive check without type assertion
        return err(`Debug level should be filtered by canHandle(). Received: ${level}`);
      }
    }
  }
}

export class DIUIChannel extends UIChannel {
  static dependencies = [platformUINotificationPortToken, runtimeConfigToken] as const;

  constructor(platformUI: PlatformUINotificationPort, config: RuntimeConfigService) {
    super(platformUI, config);
  }
}
