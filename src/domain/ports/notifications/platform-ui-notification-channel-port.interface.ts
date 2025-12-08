import type { PlatformChannelPort, PlatformChannelError } from "./platform-channel-port.interface";
import type { Result } from "@/domain/types/result";

// Re-export types for convenience
export type { PlatformNotification, PlatformChannelError } from "./platform-channel-port.interface";

/**
 * Specialized port for UI notification channels.
 *
 * Extends PlatformChannelPort with UI-specific operations.
 * Similar to PlatformJournalEventPort extending PlatformEventPort.
 *
 * Implementations:
 * - Foundry: UIChannel (wraps PlatformUINotificationPort)
 * - Roll20: Roll20UIChannel
 * - Headless: NoOpUIChannel
 */
export interface PlatformUINotificationChannelPort extends PlatformChannelPort {
  /**
   * Send notification to user interface.
   *
   * Platform mappings:
   * - Foundry: ui.notifications.info/warn/error()
   * - Roll20: sendChat()
   * - Headless: No-op
   */
  notify(message: string, type: "info" | "warning" | "error"): Result<void, PlatformChannelError>;
}
