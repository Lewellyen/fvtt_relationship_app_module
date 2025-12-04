import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { err, ok } from "@/domain/utils/result";
import { getFoundryVersionResult } from "./versiondetector";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { APP_DEFAULTS } from "@/application/constants/app-constants";
import type { PortSelectionEventEmitter } from "./port-selection-events";
import type { PortSelectionEventCallback } from "./port-selection-events";
import type { ObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import type { ServiceType } from "@/infrastructure/di/types/service-type-registry";
import {
  portSelectionEventEmitterToken,
  observabilityRegistryToken,
} from "@/infrastructure/shared/tokens/observability.tokens";
import { serviceContainerToken } from "@/infrastructure/shared/tokens/core.tokens";
import { castResolvedService } from "@/infrastructure/di/types/utilities/runtime-safe-cast";

/**
 * Selects the appropriate port implementation based on Foundry version.
 * Implements the logic:
 * - Foundry v13 → uses v13 ports
 * - Foundry v14 → uses v14 ports (if available), otherwise falls back to v13
 * - Never uses ports with version number higher than current Foundry version
 *
 * **Observability:**
 * - Emits events for success/failure via injected EventEmitter
 * - Self-registers with ObservabilityRegistry for automatic logging/metrics
 * - Conforms to DI architecture: EventEmitter as TRANSIENT service
 *
 * **Dependency Injection:**
 * - Resolves ports from the DI container using injection tokens
 * - Ensures DIP (Dependency Inversion Principle) compliance
 */
export class PortSelector {
  constructor(
    private readonly eventEmitter: PortSelectionEventEmitter,
    observability: ObservabilityRegistry,
    private readonly container: ServiceContainer
  ) {
    // Self-register for observability
    observability.registerPortSelector(this);
  }

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
   * Selects and resolves the appropriate port from injection tokens.
   *
   * CRITICAL: Works with token map to avoid eager instantiation.
   * Only the selected token is resolved from the DI container, preventing crashes from
   * incompatible constructors accessing unavailable APIs.
   *
   * @template T - The port type
   * @param tokens - Map of version numbers to injection tokens
   * @param foundryVersion - Optional version override (uses getFoundryVersion() if not provided)
   * @param adapterName - Optional adapter name for observability
   * @returns Result with resolved port or error
   *
   * @example
   * ```typescript
   * const tokens = new Map([
   *   [13, foundryV13GamePortToken],
   *   [14, foundryV14GamePortToken]
   * ]);
   * const selector = new PortSelector(eventEmitter, observability, container);
   * const result = selector.selectPortFromTokens(tokens);
   * // On Foundry v13: resolves only v13 port from container (v14 token never resolved)
   * // On Foundry v14: resolves v14 port from container
   * ```
   */
  selectPortFromTokens<T extends ServiceType>(
    tokens: Map<number, InjectionToken<T>>,
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
    let selectedToken: InjectionToken<T> | undefined;
    let selectedVersion: number = APP_DEFAULTS.NO_VERSION_SELECTED;

    // Linear search for highest compatible version
    // Could be optimized with sorted array + binary search, but n is typically small (2-5 ports)
    for (const [portVersion, token] of tokens.entries()) {
      // Rule 1: Skip ports newer than current Foundry version
      // These ports may use APIs that don't exist yet → runtime crashes
      if (portVersion > version) {
        continue; // Incompatible (too new)
      }

      // Rule 2: Greedy selection - always prefer higher version numbers
      // Track the highest compatible version seen so far
      if (portVersion > selectedVersion) {
        selectedVersion = portVersion;
        selectedToken = token;
      }
    }

    if (selectedToken === undefined) {
      const availableVersions = Array.from(tokens.keys())
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
        ...(adapterName !== undefined ? { adapterName } : {}),
        error,
      });

      return err(error);
    }

    // CRITICAL: Only now resolve the selected port from the DI container
    try {
      const resolveResult = this.container.resolveWithError(selectedToken);
      if (!resolveResult.ok) {
        const foundryError = createFoundryError(
          "PORT_SELECTION_FAILED",
          `Failed to resolve port v${selectedVersion} from container`,
          { selectedVersion },
          resolveResult.error
        );

        // Emit failure event for observability
        this.eventEmitter.emit({
          type: "failure",
          foundryVersion: version,
          availableVersions: Array.from(tokens.keys())
            .sort((a, b) => a - b)
            .join(", "),
          ...(adapterName !== undefined ? { adapterName } : {}),
          error: foundryError,
        });

        return err(foundryError);
      }

      const port = castResolvedService<T>(resolveResult.value);
      const durationMs = performance.now() - startTime;

      // Emit success event for observability
      this.eventEmitter.emit({
        type: "success",
        selectedVersion,
        foundryVersion: version,
        ...(adapterName !== undefined ? { adapterName } : {}),
        durationMs,
      });

      return ok(port);
    } catch (error) {
      const foundryError = createFoundryError(
        "PORT_SELECTION_FAILED",
        `Failed to resolve port v${selectedVersion} from container`,
        { selectedVersion },
        error
      );

      // Emit failure event for observability
      this.eventEmitter.emit({
        type: "failure",
        foundryVersion: version,
        availableVersions: Array.from(tokens.keys())
          .sort((a, b) => a - b)
          .join(", "),
        ...(adapterName !== undefined ? { adapterName } : {}),
        error: foundryError,
      });

      return err(foundryError);
    }
  }
}

export class DIPortSelector extends PortSelector {
  static dependencies = [
    portSelectionEventEmitterToken,
    observabilityRegistryToken,
    serviceContainerToken,
  ] as const;

  constructor(
    eventEmitter: PortSelectionEventEmitter,
    observability: ObservabilityRegistry,
    container: ServiceContainer
  ) {
    super(eventEmitter, observability, container);
  }
}
