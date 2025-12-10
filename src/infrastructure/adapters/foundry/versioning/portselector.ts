import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { err, ok } from "@/domain/utils/result";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { APP_DEFAULTS } from "@/application/constants/app-constants";
import type { PortSelectionEventEmitter } from "./port-selection-events";
import type { PortSelectionEventCallback } from "./port-selection-events";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { portSelectionEventEmitterToken } from "@/infrastructure/shared/tokens/observability/port-selection-event-emitter.token";
import { serviceContainerToken } from "@/infrastructure/shared/tokens/core/service-container.token";
import { foundryVersionDetectorToken } from "@/infrastructure/shared/tokens/foundry/foundry-version-detector.token";
import type { FoundryVersionDetector } from "./foundry-version-detector";
import { PortResolutionStrategy } from "./port-resolution-strategy";
import type { PortSelectionObserver } from "./port-selection-observer";
import type { IPortSelectionObservability } from "./port-selection-observability.interface";
import type { IPortSelectionPerformanceTracker } from "./port-selection-performance-tracker.interface";
import { portSelectionObservabilityToken } from "@/infrastructure/shared/tokens/observability/port-selection-observability.token";
import { portSelectionPerformanceTrackerToken } from "@/infrastructure/shared/tokens/observability/port-selection-performance-tracker.token";
import { portSelectionObserverToken } from "@/infrastructure/shared/tokens/observability/port-selection-observer.token";

/**
 * Selects the appropriate port implementation based on Foundry version.
 * Implements the logic:
 * - Foundry v13 → uses v13 ports
 * - Foundry v14 → uses v14 ports (if available), otherwise falls back to v13
 * - Never uses ports with version number higher than current Foundry version
 *
 * **Observability:**
 * - Delegates event emission to PortSelectionObserver
 * - Delegates observability setup to PortSelectionObservability
 * - Delegates performance tracking to PortSelectionPerformanceTracker
 * - Conforms to SRP: Only responsible for port selection logic
 *
 * **Dependency Injection:**
 * - Resolves ports from the DI container using injection tokens
 * - Ensures DIP (Dependency Inversion Principle) compliance
 */
export class PortSelector {
  private readonly resolutionStrategy: PortResolutionStrategy;

  constructor(
    private readonly versionDetector: FoundryVersionDetector,
    private readonly eventEmitter: PortSelectionEventEmitter,
    private readonly observability: IPortSelectionObservability,
    private readonly performanceTracker: IPortSelectionPerformanceTracker,
    private readonly observer: PortSelectionObserver,
    container: ServiceContainer
  ) {
    // Delegate observability registration
    this.observability.registerWithObservabilityRegistry(this);
    // Setup observability wiring
    this.observability.setupObservability(this, this.observer);
    // Create resolution strategy for container resolution
    this.resolutionStrategy = new PortResolutionStrategy(container);
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
  selectPortFromTokens<T>(
    tokens: Map<number, InjectionToken<T>>,
    foundryVersion?: number,
    adapterName?: string
  ): Result<T, FoundryError> {
    // Start performance tracking
    this.performanceTracker.startTracking();

    // Use version detector for version detection
    let version: number;
    if (foundryVersion !== undefined) {
      version = foundryVersion;
    } else {
      const versionResult = this.versionDetector.getVersion();
      if (!versionResult.ok) {
        this.performanceTracker.endTracking(); // Track duration even on failure
        // Emit failure event via observer
        this.observer.handleEvent({
          type: "failure",
          foundryVersion: 0, // Unknown version
          availableVersions: Array.from(tokens.keys())
            .sort((a, b) => a - b)
            .join(", "),
          ...(adapterName !== undefined ? { adapterName } : {}),
          error: createFoundryError(
            "PORT_SELECTION_FAILED",
            "Could not determine Foundry version",
            undefined,
            versionResult.error
          ),
        });
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

      this.performanceTracker.endTracking(); // Track duration even on failure

      // Emit failure event via observer
      this.observer.handleEvent({
        type: "failure",
        foundryVersion: version,
        availableVersions,
        ...(adapterName !== undefined ? { adapterName } : {}),
        error,
      });

      return err(error);
    }

    // CRITICAL: Only now resolve the selected port from the DI container
    const portResult = this.resolutionStrategy.resolve(selectedToken);
    if (!portResult.ok) {
      this.performanceTracker.endTracking(); // Track duration even on failure

      // Emit failure event via observer
      this.observer.handleEvent({
        type: "failure",
        foundryVersion: version,
        availableVersions: Array.from(tokens.keys())
          .sort((a, b) => a - b)
          .join(", "),
        ...(adapterName !== undefined ? { adapterName } : {}),
        error: portResult.error,
      });

      return err(portResult.error);
    }

    const durationMs = this.performanceTracker.endTracking();

    // Emit success event via observer
    // Observer will call eventEmitter.emit() internally and handle logging/metrics
    this.observer.handleEvent({
      type: "success",
      selectedVersion,
      foundryVersion: version,
      ...(adapterName !== undefined ? { adapterName } : {}),
      durationMs,
    });

    return ok(portResult.value);
  }
}

export class DIPortSelector extends PortSelector {
  static dependencies = [
    foundryVersionDetectorToken,
    portSelectionEventEmitterToken,
    portSelectionObservabilityToken,
    portSelectionPerformanceTrackerToken,
    portSelectionObserverToken,
    serviceContainerToken,
  ] as const;

  constructor(
    versionDetector: FoundryVersionDetector,
    eventEmitter: PortSelectionEventEmitter,
    observability: IPortSelectionObservability,
    performanceTracker: IPortSelectionPerformanceTracker,
    observer: PortSelectionObserver,
    container: ServiceContainer
  ) {
    super(versionDetector, eventEmitter, observability, performanceTracker, observer, container);
  }
}
