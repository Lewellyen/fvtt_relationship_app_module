import type { ServiceContainer } from "@/di_infrastructure/container";
import type { Result } from "@/types/result";
import { ok, err, isErr } from "@/utils/functional/result";
import { ServiceLifecycle } from "@/di_infrastructure/types/servicelifecycle";
import { portSelectionEventEmitterToken, observabilityRegistryToken } from "@/tokens/tokenindex";
import { PortSelectionEventEmitter } from "@/foundry/versioning/port-selection-events";
import { ObservabilityRegistry } from "@/observability/observability-registry";

/**
 * Registers observability infrastructure.
 *
 * Services registered:
 * - PortSelectionEventEmitter (TRANSIENT - new instance per service)
 * - ObservabilityRegistry (SINGLETON - central registry)
 *
 * DESIGN PATTERN: Self-Registration
 * Services register themselves with ObservabilityRegistry in their constructor.
 * Example:
 * ```typescript
 * class PortSelector {
 *   constructor(emitter: PortSelectionEventEmitter, observability: ObservabilityRegistry) {
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
  const emitterResult = container.registerFactory(
    portSelectionEventEmitterToken,
    () => new PortSelectionEventEmitter(),
    ServiceLifecycle.TRANSIENT,
    [] // No dependencies
  );

  if (isErr(emitterResult)) {
    return err(`Failed to register PortSelectionEventEmitter: ${emitterResult.error.message}`);
  }

  // Register ObservabilityRegistry as SINGLETON
  // Central registry for all observable services
  const registryResult = container.registerClass(
    observabilityRegistryToken,
    ObservabilityRegistry,
    ServiceLifecycle.SINGLETON
  );

  if (isErr(registryResult)) {
    return err(`Failed to register ObservabilityRegistry: ${registryResult.error.message}`);
  }

  return ok(undefined);
}
