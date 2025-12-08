import type { DomainSettingsError } from "@/domain/types/settings";
import type { PlatformNotificationPort } from "@/domain/ports/platform-notification-port.interface";
import { platformNotificationPortToken } from "@/application/tokens/domain-ports.tokens";

/**
 * Maps DomainSettingsError to notification format.
 * Single Responsibility: Only handles error format conversion and notification.
 */
export class SettingRegistrationErrorMapper {
  constructor(private readonly notifications: PlatformNotificationPort) {}

  mapAndNotify(error: DomainSettingsError, settingKey: string): void {
    const notificationError: { code: string; message: string; [key: string]: unknown } = {
      code: error.code,
      message: error.message,
      ...(error.details !== undefined && { details: error.details }),
    };

    this.notifications.error(`Failed to register ${settingKey} setting`, notificationError, {
      channels: ["ConsoleChannel"],
    });
  }
}

/**
 * DI wrapper for SettingRegistrationErrorMapper.
 * Injects dependencies via constructor.
 */
export class DISettingRegistrationErrorMapper extends SettingRegistrationErrorMapper {
  static dependencies = [platformNotificationPortToken] as const;

  constructor(notifications: PlatformNotificationPort) {
    super(notifications);
  }
}
