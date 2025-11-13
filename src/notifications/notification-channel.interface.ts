import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * Log level for notifications.
 */
export type NotificationLevel = "debug" | "info" | "warn" | "error";

/**
 * Unified notification message.
 *
 * All notifications flow through the NotificationCenter with this structure.
 */
export interface Notification {
  /**
   * Severity level of the notification.
   */
  level: NotificationLevel;

  /**
   * Human-readable context message.
   * @example "Failed to load journals"
   */
  context: string;

  /**
   * Optional data payload (for debug/info/warn).
   * Can be any serializable data.
   */
  data?: unknown;

  /**
   * Optional error object (for error level).
   * Should be a structured FoundryError or ContainerError.
   */
  error?: FoundryError | { code: string; message: string; [key: string]: unknown };

  /**
   * Timestamp when notification was created.
   */
  timestamp: Date;

  /**
   * Optional trace ID for correlation.
   */
  traceId?: string;
}

/**
 * NotificationChannel Interface.
 *
 * Channels are output handlers that receive notifications from NotificationCenter.
 * Each channel decides which notifications it handles and how.
 *
 * **Examples:**
 * - ConsoleChannel: Sends all notifications to console via Logger
 * - UIChannel: Sends warn/error notifications to Foundry UI
 * - SentryChannel: Sends errors to remote error tracking service
 * - MetricsChannel: Records notification counts as metrics
 *
 * **Design Pattern:**
 * Strategy Pattern / Observer Pattern
 *
 * @example
 * ```typescript
 * class MyChannel implements NotificationChannel {
 *   readonly name = "MyChannel";
 *
 *   canHandle(notification: Notification): boolean {
 *     return notification.level === "error";
 *   }
 *
 *   send(notification: Notification): Result<void, string> {
 *     // Send to external service
 *     return ok(undefined);
 *   }
 * }
 * ```
 */
export interface NotificationChannel {
  /**
   * Unique channel name for identification.
   * Used for logging and channel management.
   */
  readonly name: string;

  /**
   * Determines if this channel should handle the given notification.
   *
   * Channels can filter by:
   * - Notification level (e.g., only errors)
   * - Context patterns (e.g., only "bootstrap*" messages)
   * - Custom logic (e.g., sampling rate for metrics)
   *
   * @param notification - The notification to check
   * @returns true if this channel should handle the notification
   *
   * @example
   * ```typescript
   * canHandle(n: Notification): boolean {
   *   // Only handle errors and warnings
   *   return n.level === "error" || n.level === "warn";
   * }
   * ```
   */
  canHandle(notification: Notification): boolean;

  /**
   * Sends the notification to this channel's output.
   *
   * Should not throw - return error Result instead.
   *
   * @param notification - The notification to send
   * @returns Result indicating success or failure
   *
   * @example
   * ```typescript
   * send(notification: Notification): Result<void, string> {
   *   try {
   *     externalService.log(notification);
   *     return ok(undefined);
   *   } catch (error) {
   *     return err(`Failed to send: ${error}`);
   *   }
   * }
   * ```
   */
  send(notification: Notification): Result<void, string>;
}
