import type { Result } from "@/domain/types/result";
import type { PlatformUIError } from "./platform-ui-port.interface";

/**
 * Platform-agnostic port for user notifications.
 *
 * Focused interface for displaying notifications to users.
 * Separated from DOM manipulation operations to follow Interface Segregation Principle.
 *
 * Implementations:
 * - Foundry: FoundryNotificationAdapter (wraps FoundryV13UIPort)
 * - Roll20: Roll20NotificationAdapter
 * - CSV/Headless: NoOpNotificationAdapter
 */
export interface NotificationPort {
  /**
   * Shows a notification to the user.
   * @param message - The message to display
   * @param type - Notification severity
   * @returns Result indicating success or error
   */
  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformUIError>;
}
