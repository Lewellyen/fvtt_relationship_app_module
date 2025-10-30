import type { Result } from "@/types/result";
import { err, ok } from "@/utils/result";
import { getFoundryVersion } from "./versiondetector";

/**
 * Selects the appropriate port implementation based on Foundry version.
 * Implements the logic:
 * - Foundry v13 → uses v13 ports
 * - Foundry v14 → uses v14 ports (if available), otherwise falls back to v13
 * - Never uses ports with version number higher than current Foundry version
 */
export class PortSelector {
  /**
   * Selects the appropriate port from available ports based on Foundry version.
   * Returns the highest available port version that is <= the Foundry version.
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

