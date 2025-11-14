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

import type { NotificationChannel, Notification } from "../notification-channel.interface";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { EnvironmentConfig } from "@/config/environment";
import type { Result } from "@/types/result";
import { ok, err } from "@/utils/functional/result";
import { foundryUIToken } from "@/foundry/foundrytokens";
import { environmentConfigToken } from "@/tokens/tokenindex";

export class UIChannel implements NotificationChannel {
  readonly name = "UIChannel";

  constructor(
    private readonly foundryUI: FoundryUI,
    private readonly env: EnvironmentConfig
  ) {}

  canHandle(notification: Notification): boolean {
    // Debug messages are too technical for UI
    // Only info, warn, and error are user-facing
    return notification.level !== "debug";
  }

  send(notification: Notification): Result<void, string> {
    const sanitizedMessage = this.sanitizeForUI(notification);
    const uiType = this.mapLevelToUIType(notification.level);
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

    if (this.env.isDevelopment) {
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
   */
  private mapLevelToUIType(level: Notification["level"]): "info" | "warning" | "error" {
    switch (level) {
      case "info":
        return "info";
      case "warn":
        return "warning";
      case "error":
        return "error";
      case "debug":
        /* c8 ignore next -- debug level ist durch canHandle bereits ausgeschlossen */
        return "info"; // Fallback (should not be called due to canHandle)
    }
  }
}

export class DIUIChannel extends UIChannel {
  static dependencies = [foundryUIToken, environmentConfigToken] as const;

  constructor(foundryUI: FoundryUI, env: EnvironmentConfig) {
    super(foundryUI, env);
  }
}
