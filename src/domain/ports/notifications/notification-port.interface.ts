import type { Result } from "@/domain/types/result";

export type NotificationLevel = "debug" | "info" | "warn" | "error";

export type NotificationErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export type NotificationUiOptions = Record<string, unknown>;

export type NotificationOptions = {
  channels?: readonly string[];
  traceId?: string;
  uiOptions?: NotificationUiOptions;
};

export interface Notification {
  level: NotificationLevel;
  context: string;
  timestamp: Date;
  data?: unknown;
  error?: NotificationErrorPayload;
  traceId?: string;
  uiOptions?: NotificationUiOptions;
}

export interface NotificationChannel {
  readonly name: string;
  canHandle(notification: Notification): boolean;
  send(notification: Notification): Result<void, string>;
}

export interface NotificationService {
  debug(context: string, data?: unknown, options?: NotificationOptions): Result<void, string>;
  info(context: string, data?: unknown, options?: NotificationOptions): Result<void, string>;
  warn(context: string, data?: unknown, options?: NotificationOptions): Result<void, string>;
  error(
    context: string,
    error?: Notification["error"],
    options?: NotificationOptions
  ): Result<void, string>;
  addChannel(channel: NotificationChannel): void;
  removeChannel(name: string): boolean;
  getChannelNames(): string[];
}
