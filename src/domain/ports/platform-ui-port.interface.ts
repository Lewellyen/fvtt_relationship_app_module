/**
 * Platform-agnostic error for UI operations.
 */
export interface PlatformUIError {
  code: string;
  message: string;
  operation?: string;
  details?: unknown;
}

import type { JournalDirectoryUiPort } from "./journal-directory-ui-port.interface";
import type { NotificationPort } from "./notification-port.interface";

/**
 * Platform-agnostic port for UI operations.
 *
 * Convenience interface that combines JournalDirectoryUiPort and NotificationPort.
 * Services that need both capabilities can depend on this interface.
 * Services that only need one capability should depend on the specific port.
 *
 * This follows Interface Segregation Principle by providing a composition interface
 * while allowing consumers to depend on minimal interfaces.
 *
 * Implementations:
 * - Foundry: FoundryUIAdapter (implements both JournalDirectoryUiPort and NotificationPort)
 * - Roll20: Roll20UIAdapter
 * - CSV/Headless: NoOpUIAdapter
 */
export interface PlatformUIPort extends JournalDirectoryUiPort, NotificationPort {}
