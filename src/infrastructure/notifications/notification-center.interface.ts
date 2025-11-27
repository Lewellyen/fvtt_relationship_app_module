import type { Result } from "@/domain/types/result";
import type { FoundryNotificationOptions } from "@/infrastructure/adapters/foundry/interfaces/FoundryUI";
import type { Notification, NotificationChannel } from "./notification-channel.interface";

export type NotificationCenterOptions = {
  channels?: string[];
  traceId?: string;
  uiOptions?: FoundryNotificationOptions;
};

export interface NotificationService {
  debug(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  info(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  warn(context: string, data?: unknown, options?: NotificationCenterOptions): Result<void, string>;
  error(
    context: string,
    error?: Notification["error"],
    options?: NotificationCenterOptions
  ): Result<void, string>;
  addChannel(channel: NotificationChannel): void;
  removeChannel(name: string): boolean;
  getChannelNames(): string[];
}
