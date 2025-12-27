import type { DomainSettingsError } from "@/domain/types/settings";
import type { NotificationPublisherPort } from "@/domain/ports/notifications/notification-publisher-port.interface";
import { notificationPublisherPortToken } from "@/application/tokens/domain-ports.tokens";

/**
 * Maps DomainSettingsError to notification format.
 * Single Responsibility: Only handles error format conversion and notification.
 */
export class SettingRegistrationErrorMapper {
  constructor(private readonly notifications: NotificationPublisherPort) {}

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
  static dependencies = [notificationPublisherPortToken] as const;

  constructor(notifications: NotificationPublisherPort) {
    super(notifications);
  }
}
