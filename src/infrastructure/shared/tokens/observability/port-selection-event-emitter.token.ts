/**
 * Injection token for the PortSelectionEventEmitter.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { PortSelectionEventEmitter } from "@/infrastructure/adapters/foundry/versioning/port-selection-events";

/**
 * Injection token for the PortSelectionEventEmitter.
 *
 * Provides event emission infrastructure for PortSelector observability.
 * Registered as TRANSIENT - each service gets its own instance.
 *
 * @example
 * ```typescript
 * class PortSelector {
 *   constructor(emitter: PortSelectionEventEmitter) {
 *     this.emitter = emitter;
 *   }
 * }
 * ```
 */
export const portSelectionEventEmitterToken = createInjectionToken<PortSelectionEventEmitter>(
  "PortSelectionEventEmitter"
);
