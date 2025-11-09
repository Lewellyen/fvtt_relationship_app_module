import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { err, ok } from "@/utils/functional/result";
import { getFoundryVersionResult } from "./versiondetector";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";
import { MODULE_CONSTANTS } from "@/constants";
import { PortSelectionEventEmitter } from "@/foundry/versioning/port-selection-events";
import type { PortSelectionEventCallback } from "@/foundry/versioning/port-selection-events";

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
 *
 * **Observability:**
 * - Emits events for success/failure instead of direct logging/metrics
 * - Zero dependencies for improved testability and separation of concerns
 * - Observers can subscribe to events for logging, metrics, etc.
 */
export class PortSelector {
  static dependencies = [] as const;

  private readonly eventEmitter = new PortSelectionEventEmitter();

  constructor() {}

  /**
   * Subscribe to port selection events.
   *
   * Allows observers to be notified of port selection success/failure for
   * logging, metrics, and other observability concerns.
   *
   * @param callback - Function to call when port selection events occur
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const selector = new PortSelector();
   * const unsubscribe = selector.onEvent((event) => {
   *   if (event.type === 'success') {
   *     console.log(`Port v${event.selectedVersion} selected`);
   *   }
   * });
   * ```
   */
  onEvent(callback: PortSelectionEventCallback): () => void {
    return this.eventEmitter.subscribe(callback);
  }

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
    foundryVersion?: number,
    adapterName?: string
  ): Result<T, FoundryError> {
    // Inline performance tracking (no dependency on PerformanceTrackingService)
    const startTime = performance.now();

    // Use central version detection
    let version: number;
    if (foundryVersion !== undefined) {
      version = foundryVersion;
    } else {
      const versionResult = getFoundryVersionResult();
      if (!versionResult.ok) {
        return err(
          createFoundryError(
            "PORT_SELECTION_FAILED",
            "Could not determine Foundry version",
            undefined,
            versionResult.error
          )
        );
      }
      version = versionResult.value;
    }

    /**
     * Version Matching Algorithm: Find highest compatible port
     *
     * Strategy: Greedy selection of the newest compatible port version
     *
     * Rules:
     * 1. Never select a port with version > current Foundry version
     *    (prevents using APIs that don't exist yet)
     * 2. Select the highest port version that is <= Foundry version
     *    (use the newest compatible implementation)
     *
     * Example Scenarios:
     * - Foundry v13 + Ports [v12, v13, v14] → Select v13 (exact match)
     * - Foundry v14 + Ports [v12, v13] → Select v13 (fallback to highest compatible)
     * - Foundry v13 + Ports [v14, v15] → ERROR (no compatible port, all too new)
     * - Foundry v20 + Ports [v13, v14] → Select v14 (future-proof fallback)
     *
     * Time Complexity: O(n) where n = number of registered ports
     * Space Complexity: O(1)
     *
     * Note: This algorithm assumes ports are forward-compatible within reason.
     * A v13 port should work on v14+ unless breaking API changes occur.
     */
    let selectedFactory: PortFactory<T> | undefined;
    let selectedVersion: number = MODULE_CONSTANTS.DEFAULTS.NO_VERSION_SELECTED;

    // Linear search for highest compatible version
    // Could be optimized with sorted array + binary search, but n is typically small (2-5 ports)
    for (const [portVersion, factory] of factories.entries()) {
      // Rule 1: Skip ports newer than current Foundry version
      // These ports may use APIs that don't exist yet → runtime crashes
      if (portVersion > version) {
        continue; // Incompatible (too new)
      }

      // Rule 2: Greedy selection - always prefer higher version numbers
      // Track the highest compatible version seen so far
      if (portVersion > selectedVersion) {
        selectedVersion = portVersion;
        selectedFactory = factory;
      }
    }

    if (selectedFactory === undefined) {
      const availableVersions = Array.from(factories.keys())
        .sort((a, b) => a - b)
        .join(", ");

      const error = createFoundryError(
        "PORT_SELECTION_FAILED",
        `No compatible port found for Foundry version ${version}`,
        { version, availableVersions: availableVersions || "none" }
      );

      // Emit failure event for observability
      this.eventEmitter.emit({
        type: "failure",
        foundryVersion: version,
        availableVersions,
        adapterName,
        error,
      });

      return err(error);
    }

    // CRITICAL: Only now instantiate the selected port
    try {
      const port = selectedFactory();
      const durationMs = performance.now() - startTime;

      // Emit success event for observability
      this.eventEmitter.emit({
        type: "success",
        selectedVersion,
        foundryVersion: version,
        adapterName,
        durationMs,
      });

      return ok(port);
    } catch (error) {
      const foundryError = createFoundryError(
        "PORT_SELECTION_FAILED",
        `Failed to instantiate port v${selectedVersion}`,
        { selectedVersion },
        error
      );

      // Emit failure event for observability
      this.eventEmitter.emit({
        type: "failure",
        foundryVersion: version,
        availableVersions: Array.from(factories.keys())
          .sort((a, b) => a - b)
          .join(", "),
        adapterName,
        error: foundryError,
      });

      return err(foundryError);
    }
  }
}
