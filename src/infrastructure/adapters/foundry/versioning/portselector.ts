import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { err, ok } from "@/domain/utils/result";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
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
import type { PortMatchStrategy } from "./port-match-strategy.interface";
import { GreedyPortMatchStrategy } from "./greedy-port-match-strategy";

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
 * - Conforms to SRP: Only responsible for port selection orchestration
 *
 * **Strategy Pattern:**
 * - Delegates matching logic to injected PortMatchStrategy
 * - Default strategy: GreedyPortMatchStrategy (highest compatible version)
 * - Enables OCP: New matching strategies can be added without modifying PortSelector
 *
 * **Dependency Injection:**
 * - Resolves ports from the DI container using injection tokens
 * - Ensures DIP (Dependency Inversion Principle) compliance
 */
export class PortSelector {
  private readonly resolutionStrategy: PortResolutionStrategy;
  private readonly matchStrategy: PortMatchStrategy<unknown>;

  constructor(
    private readonly versionDetector: FoundryVersionDetector,
    private readonly eventEmitter: PortSelectionEventEmitter,
    private readonly observability: IPortSelectionObservability,
    private readonly performanceTracker: IPortSelectionPerformanceTracker,
    private readonly observer: PortSelectionObserver,
    container: ServiceContainer,
    matchStrategy?: PortMatchStrategy<unknown>
  ) {
    // Delegate observability registration
    this.observability.registerWithObservabilityRegistry(this);
    // Setup observability wiring
    this.observability.setupObservability(this, this.observer);
    // Create resolution strategy for container resolution
    this.resolutionStrategy = new PortResolutionStrategy(container);
    // Use provided strategy or default to greedy strategy
    this.matchStrategy = matchStrategy ?? new GreedyPortMatchStrategy<unknown>();
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

    // Delegate matching to strategy
    // Note: Strategy is typed as PortMatchStrategy<unknown> but we use it with generic T
    // This is safe because the token type is preserved through the matching process
    // We need to cast tokens to match the strategy's type signature, but the actual
    // token types are preserved and will be correctly typed when we extract the result
    const tokensForStrategy: Map<number, InjectionToken<unknown>> = tokens;
    const matchResult = this.matchStrategy.select(tokensForStrategy, version);
    if (!matchResult.ok) {
      this.performanceTracker.endTracking(); // Track duration even on failure

      // Extract available versions from error details for event emission
      // MatchError.details is typed as unknown, so we need to check the structure
      const errorDetails = matchResult.error.details;
      let availableVersions: string;
      if (
        typeof errorDetails === "object" &&
        errorDetails !== null &&
        "availableVersions" in errorDetails &&
        typeof errorDetails.availableVersions === "string"
      ) {
        availableVersions = errorDetails.availableVersions;
      } else {
        availableVersions = Array.from(tokens.keys())
          .sort((a, b) => a - b)
          .join(", ");
      }

      // Emit failure event via observer
      this.observer.handleEvent({
        type: "failure",
        foundryVersion: version,
        availableVersions,
        ...(adapterName !== undefined ? { adapterName } : {}),
        error: matchResult.error,
      });

      return err(matchResult.error);
    }

    const { token: selectedToken, version: selectedVersion } = matchResult.value;

    // CRITICAL: Only now resolve the selected port from the DI container
    // Type assertion is necessary here because:
    // 1. The strategy is typed as PortMatchStrategy<unknown> for flexibility (allows any port type)
    // 2. selectedToken comes from the tokens Map<number, InjectionToken<T>> passed to select()
    // 3. TypeScript cannot infer that selectedToken is InjectionToken<T> because of the strategy's unknown type
    // 4. The assertion is safe because the token was originally from the tokens map with type T
    // This is a known limitation when using generic strategies with type-erased implementations
    /* type-coverage:ignore-next-line -- Type narrowing: selectedToken comes from tokens Map<number, InjectionToken<T>>, but strategy is typed as PortMatchStrategy<unknown> for flexibility. The cast is safe because the token was originally from the tokens map with type T. */
    const typedToken = selectedToken as InjectionToken<T>;
    const portResult = this.resolutionStrategy.resolve(typedToken);
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
    // Use default GreedyPortMatchStrategy (injected via constructor default parameter)
    super(versionDetector, eventEmitter, observability, performanceTracker, observer, container);
  }
}
