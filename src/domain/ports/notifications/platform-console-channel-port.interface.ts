import type { PlatformChannelPort } from "./platform-channel-port.interface";

// Re-export types for convenience
export type { PlatformNotification, PlatformChannelError } from "./platform-channel-port.interface";

/**
 * Specialized port for console logging channels.
 *
 * Extends PlatformChannelPort with console-specific operations.
 *
 * Implementations:
 * - Foundry: ConsoleChannel (wraps PlatformLoggingPort)
 * - Roll20: Roll20ConsoleChannel
 * - Headless: ConsoleChannel
 */
export interface PlatformConsoleChannelPort extends PlatformChannelPort {
  /**
   * Log to console.
   *
   * Platform mappings:
   * - Foundry: console.log/error/warn/info/debug()
   * - Roll20: log()
   * - Headless: console.log/error/warn/info/debug()
   */
  log(level: "debug" | "info" | "warn" | "error", message: string, data?: unknown): void;
}
