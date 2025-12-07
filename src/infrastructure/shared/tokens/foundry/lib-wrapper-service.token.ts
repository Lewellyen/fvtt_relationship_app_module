/**
 * Injection token for LibWrapperService.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { LibWrapperService } from "@/infrastructure/adapters/foundry/interfaces/lib-wrapper-service.interface";

/**
 * Injection token for LibWrapperService.
 *
 * Provides a facade over libWrapper for registering and unregistering method wrappers.
 * Handles tracking of registrations and cleanup.
 *
 * @example
 * ```typescript
 * const libWrapper = container.resolve(libWrapperServiceToken);
 * const result = libWrapper.register(
 *   "foundry.applications.ux.ContextMenu.implementation.prototype.render",
 *   (wrapped, ...args) => {
 *     // Custom logic
 *     return wrapped(...args);
 *   },
 *   "WRAPPER"
 * );
 * ```
 */
export const libWrapperServiceToken = createInjectionToken<LibWrapperService>("LibWrapperService");
