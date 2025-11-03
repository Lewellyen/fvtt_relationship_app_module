import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { err, ok } from "@/utils/result";
import { getFoundryVersion } from "./versiondetector";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * Factory function type for creating port instances.
 * Enables lazy instantiation to prevent crashes from incompatible constructors.
 */
export type PortFactory<T> = () => T;

/**
 * Selects the appropriate port implementation based on Foundry version.
 * Implements the logic:
 * - Foundry v13 → uses v13 ports
 * - Foundry v14 → uses v14 ports (if available), otherwise falls back to v13
 * - Never uses ports with version number higher than current Foundry version
 */
export class PortSelector {
  /**
   * Selects and instantiates the appropriate port from factories.
   *
   * CRITICAL: Works with factory map to avoid eager instantiation.
   * Only the selected factory is executed, preventing crashes from
   * incompatible constructors accessing unavailable APIs.
   *
   * @template T - The port type
   * @param factories - Map of version numbers to port factories
   * @param foundryVersion - Optional version override (uses getFoundryVersion() if not provided)
   * @returns Result with instantiated port or error
   *
   * @example
   * ```typescript
   * const factories = new Map([
   *   [13, () => new FoundryGamePortV13()],
   *   [14, () => new FoundryGamePortV14()]
   * ]);
   * const selector = new PortSelector();
   * const result = selector.selectPortFromFactories(factories);
   * // On Foundry v13: creates only v13 port (v14 factory never called)
   * // On Foundry v14: creates v14 port
   * ```
   */
  selectPortFromFactories<T>(
    factories: Map<number, PortFactory<T>>,
    foundryVersion?: number
  ): Result<T, FoundryError> {
    // Use central version detection
    let version: number;
    try {
      version = foundryVersion ?? getFoundryVersion();
    } catch (error) {
      return err(
        createFoundryError(
          "PORT_SELECTION_FAILED",
          "Could not determine Foundry version",
          undefined,
          error
        )
      );
    }

    // Find highest compatible factory (<= Foundry version)
    let selectedFactory: PortFactory<T> | undefined;
    let selectedVersion = -1;

    for (const [portVersion, factory] of factories.entries()) {
      if (portVersion > version) {
        continue; // Ignore incompatible versions
      }
      if (portVersion > selectedVersion) {
        selectedVersion = portVersion;
        selectedFactory = factory;
      }
    }

    if (selectedFactory === undefined) {
      const availableVersions = Array.from(factories.keys())
        .sort((a, b) => a - b)
        .join(", ");
      return err(
        createFoundryError(
          "PORT_SELECTION_FAILED",
          `No compatible port found for Foundry version ${version}`,
          { version, availableVersions: availableVersions || "none" }
        )
      );
    }

    // CRITICAL: Only now instantiate the selected port
    try {
      return ok(selectedFactory());
    } catch (error) {
      return err(
        createFoundryError(
          "PORT_SELECTION_FAILED",
          `Failed to instantiate port v${selectedVersion}`,
          { selectedVersion },
          error
        )
      );
    }
  }

  /**
   * Selects the appropriate port from available ports based on Foundry version.
   * Returns the highest available port version that is <= the Foundry version.
   *
   * @deprecated Use selectPortFromFactories() with PortRegistry.getFactories()
   * This method accepts pre-instantiated ports which can cause crashes.
   *
   * @template T - The port type
   * @param availablePorts - Map of version numbers to port implementations
   * @param foundryVersion - Optional Foundry version (will be detected if not provided)
   * @returns Result containing the selected port or an error message
   *
   * @example
   * ```typescript
   * const ports = new Map([
   *   [13, new FoundryGamePortV13()],
   *   [14, new FoundryGamePortV14()]
   * ]);
   * const selector = new PortSelector();
   * const result = selector.selectPort(ports);
   * // On Foundry v14: selects v14 port
   * // On Foundry v13: selects v13 port
   * ```
   */
  selectPort<T>(availablePorts: Map<number, T>, foundryVersion?: number): Result<T, string> {
    // Detect Foundry version if not provided
    let version: number;
    try {
      version = foundryVersion ?? getFoundryVersion();
    } catch (error) {
      return err(
        `Could not determine Foundry version: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    // Find the highest available port that is <= Foundry version
    let selectedPort: T | undefined;
    let selectedVersion = -1;

    for (const [portVersion, port] of availablePorts.entries()) {
      // Ignore ports with version higher than Foundry version
      if (portVersion > version) {
        continue;
      }

      // Select the highest compatible port
      if (portVersion > selectedVersion) {
        selectedVersion = portVersion;
        selectedPort = port;
      }
    }

    if (selectedPort === undefined) {
      const availableVersions = Array.from(availablePorts.keys())
        .sort((a, b) => a - b)
        .join(", ");
      return err(
        `No compatible port found for Foundry version ${version}. Available ports: ${availableVersions || "none"}`
      );
    }

    return ok(selectedPort);
  }
}
