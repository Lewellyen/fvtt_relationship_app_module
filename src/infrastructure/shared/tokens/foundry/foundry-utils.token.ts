/**
 * Injection token for FoundryUtils (Composition Interface).
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryUtils } from "@/infrastructure/adapters/foundry/interfaces/FoundryUtils";

/**
 * Injection token for FoundryUtils (Composition Interface).
 *
 * Convenience interface that combines all Foundry Utils ports (UUID, Object, HTML, Async).
 * Services that need multiple capabilities can depend on this interface.
 * Services that only need one capability should depend on the specific port.
 *
 * @example
 * ```typescript
 * const utils = container.resolve(foundryUtilsToken);
 * const id = utils.randomID();
 * const cloned = utils.deepClone({ a: 1 });
 * ```
 */
export const foundryUtilsToken = createInjectionToken<FoundryUtils>("FoundryUtils");
