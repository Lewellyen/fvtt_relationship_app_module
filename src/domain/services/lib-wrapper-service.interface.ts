import type { Result } from "@/domain/types/result";

/**
 * Platform-agnostic service for wrapping Foundry methods using libWrapper.
 *
 * This service provides a clean facade over libWrapper, allowing registration
 * and unregistration of method wrappers without direct access to globalThis.libWrapper.
 *
 * @example
 * ```typescript
 * const service = container.resolve(libWrapperServiceToken);
 *
 * // Register a wrapper
 * const result = service.register(
 *   "foundry.applications.ux.ContextMenu.implementation.prototype.render",
 *   (wrapped, ...args) => {
 *     // Custom logic
 *     return wrapped(...args);
 *   },
 *   "WRAPPER"
 * );
 *
 * // Later: Unregister
 * service.unregister("foundry.applications.ux.ContextMenu.implementation.prototype.render");
 * ```
 */
export interface LibWrapperService {
  /**
   * Register a wrapper function for a target method.
   *
   * @param target - The target method path (e.g., "foundry.applications.ux.ContextMenu.implementation.prototype.render")
   * @param wrapperFn - The wrapper function that will intercept the method call
   * @param type - The wrapper type: "WRAPPER", "MIXED", or "OVERRIDE"
   * @returns Registration ID for tracking, or error if registration failed
   */
  register(
    target: string,
    wrapperFn: LibWrapperFunction,
    type: LibWrapperType
  ): Result<LibWrapperRegistrationId, LibWrapperError>;

  /**
   * Unregister a previously registered wrapper.
   *
   * @param target - The target method path that was registered
   * @returns Success or error if unregistration failed
   */
  unregister(target: string): Result<void, LibWrapperError>;

  /**
   * Cleanup all registered wrappers.
   * Should be called during module shutdown.
   */
  dispose(): void;
}

/**
 * Wrapper function signature for libWrapper.
 *
 * The first parameter is the original wrapped function.
 * Additional parameters are the arguments passed to the original function.
 */
export type LibWrapperFunction = (
  wrapped: (...args: unknown[]) => unknown,
  ...args: unknown[]
) => unknown;

/**
 * Wrapper type for libWrapper.
 *
 * - WRAPPER: Wraps the original function, can call it before/after
 * - MIXED: Can call wrapped or not, more flexible
 * - OVERRIDE: Completely replaces the original function
 */
export type LibWrapperType = "WRAPPER" | "MIXED" | "OVERRIDE";

/**
 * Unique identifier for libWrapper registrations.
 * Used for tracking and cleanup.
 */
export type LibWrapperRegistrationId = string | number;

/**
 * Platform-agnostic libWrapper error.
 */
export interface LibWrapperError {
  code:
    | "LIBWRAPPER_NOT_AVAILABLE"
    | "REGISTRATION_FAILED"
    | "UNREGISTRATION_FAILED"
    | "TARGET_NOT_REGISTERED"
    | "OPERATION_FAILED";
  message: string;
  details?: unknown;
}
