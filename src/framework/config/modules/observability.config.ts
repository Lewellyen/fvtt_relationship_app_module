import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { portSelectionEventEmitterToken } from "@/infrastructure/shared/tokens/observability/port-selection-event-emitter.token";
import { observabilityRegistryToken } from "@/infrastructure/shared/tokens/observability/observability-registry.token";
import { portSelectionObservabilityToken } from "@/infrastructure/shared/tokens/observability/port-selection-observability.token";
import { portSelectionPerformanceTrackerToken } from "@/infrastructure/shared/tokens/observability/port-selection-performance-tracker.token";
import { portSelectionObserverToken } from "@/infrastructure/shared/tokens/observability/port-selection-observer.token";
import { DIPortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import { DIObservabilityRegistry } from "@/infrastructure/observability/observability-registry";
import { DIPortSelectionObservability } from "@/infrastructure/adapters/foundry/versioning/port-selection-observability";
import { DIPortSelectionPerformanceTracker } from "@/infrastructure/adapters/foundry/versioning/port-selection-performance-tracker";
import { DIPortSelectionObserver } from "@/infrastructure/adapters/foundry/versioning/port-selection-observer";

/**
 * Registers observability infrastructure.
 *
 * Services registered:
 * - PortSelectionEventEmitter (TRANSIENT - new instance per service)
 * - ObservabilityRegistry (SINGLETON - central registry)
 * - PortSelectionObservability (SINGLETON - handles observability setup)
 * - PortSelectionPerformanceTracker (SINGLETON - handles performance tracking)
 * - PortSelectionObserver (SINGLETON - handles event observation)
 *
 * DESIGN PATTERN: Self-Registration
 * Services register themselves with ObservabilityRegistry in their constructor.
 * Example:
 * ```typescript
 * class PortSelector {
 *   constructor(observability: IPortSelectionObservability, ...) {
 *     observability.registerPortSelector(this);
 *   }
 * }
 * ```
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerObservability(container: ServiceContainer): Result<void, string> {
  // Register PortSelectionEventEmitter as TRANSIENT
  // Each service that needs event emission gets its own instance
  const emitterResult = container.registerClass(
    portSelectionEventEmitterToken,
    DIPortSelectionEventEmitter,
    ServiceLifecycle.TRANSIENT
  );

  if (isErr(emitterResult)) {
    return err(`Failed to register PortSelectionEventEmitter: ${emitterResult.error.message}`);
  }

  // Register ObservabilityRegistry as SINGLETON
  // Central registry for all observable services
  const registryResult = container.registerClass(
    observabilityRegistryToken,
    DIObservabilityRegistry,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(registryResult)) {
    return err(`Failed to register ObservabilityRegistry: ${registryResult.error.message}`);
  }

  // Register PortSelectionObservability as SINGLETON
  // Handles observability setup for PortSelector
  const observabilityResult = container.registerClass(
    portSelectionObservabilityToken,
    DIPortSelectionObservability,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(observabilityResult)) {
    return err(
      `Failed to register PortSelectionObservability: ${observabilityResult.error.message}`
    );
  }

  // Register PortSelectionPerformanceTracker as SINGLETON
  // Handles performance tracking for PortSelector
  const performanceTrackerResult = container.registerClass(
    portSelectionPerformanceTrackerToken,
    DIPortSelectionPerformanceTracker,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(performanceTrackerResult)) {
    return err(
      `Failed to register PortSelectionPerformanceTracker: ${performanceTrackerResult.error.message}`
    );
  }

  // Register PortSelectionObserver as SINGLETON
  // Handles event observation for PortSelector
  const observerResult = container.registerClass(
    portSelectionObserverToken,
    DIPortSelectionObserver,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(observerResult)) {
    return err(`Failed to register PortSelectionObserver: ${observerResult.error.message}`);
  }

  return ok(undefined);
}
