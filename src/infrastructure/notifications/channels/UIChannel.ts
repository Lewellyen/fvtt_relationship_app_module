/**
 * UI Channel - Routes notifications to Foundry UI notifications.
 *
 * **Responsibilities:**
 * - Send user-facing notifications to Foundry UI
 * - Filter out debug messages (not relevant for end-users)
 * - Sanitize messages in production mode
 * - Map notification levels to UI notification types
 *
 * **Design:**
 * UI is for end-users - sanitization required in production.
 * Debug messages are never shown in UI (too technical).
 */

import type {
  NotificationChannel,
  Notification,
} from "@/infrastructure/notifications/notification-channel.interface";
import type { FoundryUI } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import type { RuntimeConfigService } from "@/application/services/RuntimeConfigService";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import { foundryUIToken } from "@/infrastructure/shared/tokens/foundry/foundry-ui.token";
import { runtimeConfigToken } from "@/application/tokens/runtime-config.token";

export class UIChannel implements NotificationChannel {
  readonly name = "UIChannel";

  constructor(
    private readonly foundryUI: FoundryUI,
    private readonly config: RuntimeConfigService
  ) {}

  canHandle(notification: Notification): boolean {
    // Debug messages are too technical for UI
    // Only info, warn, and error are user-facing
    return notification.level !== "debug";
  }

  send(notification: Notification): Result<void, string> {
    const sanitizedMessage = this.sanitizeForUI(notification);
    const uiTypeResult = this.mapLevelToUIType(notification.level);
    if (!uiTypeResult.ok) {
      return uiTypeResult;
    }
    const uiType = uiTypeResult.value;
    const uiOptions = notification.uiOptions;

    const notifyResult = this.foundryUI.notify(sanitizedMessage, uiType, uiOptions);

    if (!notifyResult.ok) {
      return err(`UI notification failed: ${notifyResult.error.message}`);
    }

    return ok(undefined);
  }

  /**
   * Sanitizes notification message for UI display.
   *
   * Development: Shows detailed messages
   * Production: Shows generic messages to prevent information leakage
   */
  private sanitizeForUI(notification: Notification): string {
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
   * Maps notification level to Foundry UI notification type.
   * Protected to allow testing of exhaustive type check.
   */
  protected mapLevelToUIType(
    level: Notification["level"]
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
  static dependencies = [foundryUIToken, runtimeConfigToken] as const;

  constructor(foundryUI: FoundryUI, config: RuntimeConfigService) {
    super(foundryUI, config);
  }
}
