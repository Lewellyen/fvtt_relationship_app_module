import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { err, ok } from "@/utils/result";
import { getFoundryVersionResult } from "./versiondetector";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";
import { ENV } from "@/config/environment";
import { PERFORMANCE_MARKS } from "@/core/performance-constants";
import { MODULE_CONSTANTS } from "@/constants";
import { MetricsCollector } from "@/observability/metrics-collector";

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
    // Performance tracking (only in debug/performance mode)
    if (ENV.enableDebugMode || ENV.enablePerformanceTracking) {
      performance.mark(PERFORMANCE_MARKS.MODULE.PORT_SELECTION.START);
    }

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

    // Find highest compatible factory (<= Foundry version)
    let selectedFactory: PortFactory<T> | undefined;
    let selectedVersion: number = MODULE_CONSTANTS.DEFAULTS.NO_VERSION_SELECTED;

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

      // Track port selection failure
      /* c8 ignore next 3 -- Performance tracking is optional feature flag tested in integration tests */
      if (ENV.enablePerformanceTracking) {
        MetricsCollector.getInstance().recordPortSelectionFailure(version);
      }

      return err(
        createFoundryError(
          "PORT_SELECTION_FAILED",
          `No compatible port found for Foundry version ${version}`,
          { version, availableVersions: availableVersions || "none" }
        )
      );
    }

    // CRITICAL: Only now instantiate the selected port
    let result: Result<T, FoundryError>;
    try {
      result = ok(selectedFactory());
    } catch (error) {
      // Track instantiation failure
      if (ENV.enablePerformanceTracking) {
        MetricsCollector.getInstance().recordPortSelectionFailure(version);
      }

      result = err(
        createFoundryError(
          "PORT_SELECTION_FAILED",
          `Failed to instantiate port v${selectedVersion}`,
          { selectedVersion },
          error
        )
      );
    }

    // Performance tracking end
    if (ENV.enableDebugMode || ENV.enablePerformanceTracking) {
      performance.mark(PERFORMANCE_MARKS.MODULE.PORT_SELECTION.END);
      performance.measure(
        PERFORMANCE_MARKS.MODULE.PORT_SELECTION.DURATION,
        PERFORMANCE_MARKS.MODULE.PORT_SELECTION.START,
        PERFORMANCE_MARKS.MODULE.PORT_SELECTION.END
      );

      // Get the latest measurement entry (not the first one which could be stale)
      const entries = performance.getEntriesByName(
        PERFORMANCE_MARKS.MODULE.PORT_SELECTION.DURATION
      );
      const measure = entries.at(-1);

      if (measure && ENV.enableDebugMode) {
        console.debug(
          `${MODULE_CONSTANTS.LOG_PREFIX} Port selection completed in ${measure.duration.toFixed(2)}ms (selected: v${selectedVersion})`
        );
      }

      // Clean up performance marks/measures to prevent memory leaks
      performance.clearMarks(PERFORMANCE_MARKS.MODULE.PORT_SELECTION.START);
      performance.clearMarks(PERFORMANCE_MARKS.MODULE.PORT_SELECTION.END);
      performance.clearMeasures(PERFORMANCE_MARKS.MODULE.PORT_SELECTION.DURATION);

      // Record port selection metrics
      if (result.ok) {
        MetricsCollector.getInstance().recordPortSelection(selectedVersion);
      }
    }

    return result;
  }
}
