/**
 * Port Loading Concern - Single Responsibility: Lazy loading and versioning of Foundry ports.
 *
 * This class extracts the port loading logic from FoundryServiceBase to follow SRP.
 * It handles:
 * - Lazy initialization of ports
 * - Version-based port selection via PortSelector
 * - Port caching after first load
 *
 * @template TPort - The port interface type (e.g., FoundryGame, FoundryHooks)
 */

import type { Result } from "@/domain/types/result";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";

/**
 * Loads and caches Foundry ports based on version selection.
 * Implements lazy loading: ports are only loaded when first requested.
 *
 * @template TPort - The port interface type
 */
export class PortLoader<TPort> {
  private port: TPort | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<TPort>;

  constructor(portSelector: PortSelector, portRegistry: PortRegistry<TPort>) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }

  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector with token-based selection to resolve ports from the DI container.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version. Ports are resolved
   * from the DI container, ensuring DIP (Dependency Inversion Principle) compliance.
   *
   * @param adapterName - Name for logging purposes (e.g., "FoundryGame")
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  loadPort(adapterName: string): Result<TPort, FoundryError> {
    if (this.port === null) {
      const tokens = this.portRegistry.getTokens();
      const portResult = this.portSelector.selectPortFromTokens(tokens, undefined, adapterName);
      if (!portResult.ok) {
        return portResult;
      }
      this.port = portResult.value;
    }
    // At this point, this.port is guaranteed to be non-null
    return { ok: true, value: this.port as TPort };
  }

  /**
   * Gets the currently loaded port without triggering lazy loading.
   * Useful for operations that don't need retry logic but need to check if port is loaded.
   *
   * @returns The loaded port or null if not yet loaded
   */
  getLoadedPort(): TPort | null {
    return this.port;
  }

  /**
   * Clears the cached port.
   * This forces the next loadPort() call to reload the port.
   * Useful for testing or when ports need to be refreshed.
   */
  clearCache(): void {
    this.port = null;
  }
}
