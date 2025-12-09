/**
 * Foundry-specific implementation of PlatformUIAvailabilityPort.
 *
 * Checks if Foundry UI (ui.notifications) is available.
 * In Foundry, UI becomes available during the 'init' hook.
 */

import type { PlatformUIAvailabilityPort } from "@/domain/ports/platform-ui-availability-port.interface";

/**
 * Foundry-specific implementation of PlatformUIAvailabilityPort.
 */
export class FoundryUIAvailabilityPort implements PlatformUIAvailabilityPort {
  /**
   * Checks if Foundry UI is available.
   * UI is available when `ui` is defined and `ui.notifications` exists.
   */
  isAvailable(): boolean {
    return typeof ui !== "undefined" && ui?.notifications !== undefined;
  }

  /**
   * Optional callback registration for when UI becomes available.
   * Not implemented for now - can be extended with event-based approach later.
   */
  onAvailable?(_callback: () => void): void {
    // Not implemented - polling via isAvailable() is sufficient for now
  }
}

/**
 * DI wrapper for FoundryUIAvailabilityPort.
 */
export class DIFoundryUIAvailabilityPort extends FoundryUIAvailabilityPort {
  static dependencies = [] as const;

  constructor() {
    super();
  }
}
