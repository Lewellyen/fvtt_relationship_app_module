import type { PlatformJournalDirectoryUiPort } from "./platform-journal-directory-ui-port.interface";
import type { PlatformUINotificationPort } from "./platform-ui-notification-port.interface";

/**
 * Platform-agnostic port for UI operations.
 *
 * Convenience interface that combines PlatformJournalDirectoryUiPort and PlatformUINotificationPort.
 * Services that need both capabilities can depend on this interface.
 * Services that only need one capability should depend on the specific port.
 *
 * This follows Interface Segregation Principle by providing a composition interface
 * while allowing consumers to depend on minimal interfaces.
 *
 * Implementations:
 * - Foundry: FoundryUIAdapter (implements both PlatformJournalDirectoryUiPort and PlatformUINotificationPort)
 * - Roll20: Roll20UIAdapter
 * - CSV/Headless: NoOpUIAdapter
 */
export interface PlatformUIPort
  extends PlatformJournalDirectoryUiPort, PlatformUINotificationPort {}
