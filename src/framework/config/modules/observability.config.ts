import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/infrastructure/shared/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  portSelectionEventEmitterToken,
  observabilityRegistryToken,
} from "@/infrastructure/shared/tokens";
import { DIPortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";
import { DIObservabilityRegistry } from "@/infrastructure/observability/observability-registry";

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

  return ok(undefined);
}
