import type { ServiceContainer } from "@/infrastructure/di/container";
import type { ServiceType } from "@/infrastructure/shared/tokens";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import type { ContainerError } from "@/infrastructure/di/interfaces";

/**
 * Helper function to resolve multiple dependencies in a factory function.
 *
 * This function respects the Result Pattern by propagating errors from
 * `resolveWithError()` calls. Since `FactoryFunction<T> = () => T` must
 * return `T` directly (not `Result<T, E>`), errors are propagated via
 * exceptions that the container catches and converts to `ContainerError`.
 *
 * This approach centralizes error handling and makes factory functions
 * cleaner while maintaining compatibility with the DI container's exception
 * handling mechanism.
 *
 * @template T - The type of service to resolve
 * @param container - The service container
 * @param token - The injection token to resolve
 * @param errorMessage - Custom error message if resolution fails
 * @returns The resolved service instance
 * @throws {Error} If resolution fails, with a message containing the ContainerError details
 *
 * @example
 * ```typescript
 * const handler = resolveOrThrow(container, handlerToken, "Failed to resolve handler");
 * ```
 */
export function resolveOrThrow<T extends ServiceType>(
  container: ServiceContainer,
  token: InjectionToken<T>,
  errorMessage: string
): T {
  const result = container.resolveWithError(token);
  if (!result.ok) {
    throw new Error(`${errorMessage}: ${result.error.message}`);
  }
  return result.value;
}

/**
 * Helper function to resolve multiple dependencies in a factory function.
 *
 * This function resolves multiple tokens and returns their values as an array.
 * If any resolution fails, it throws an error with details about which token failed.
 *
 * @template T - The type of services to resolve
 * @param container - The service container
 * @param tokens - Array of injection tokens to resolve
 * @param errorMessagePrefix - Prefix for error messages (e.g., "Failed to resolve handlers")
 * @returns Array of resolved service instances
 * @throws {Error} If any resolution fails
 *
 * @example
 * ```typescript
 * const [handler1, handler2, handler3] = resolveMultipleOrThrow(
 *   container,
 *   [token1, token2, token3],
 *   "Failed to resolve handlers"
 * );
 * ```
 */
export function resolveMultipleOrThrow<T extends ServiceType>(
  container: ServiceContainer,
  tokens: Array<InjectionToken<T>>,
  errorMessagePrefix: string
): T[] {
  const results: T[] = [];
  for (const token of tokens) {
    const result = container.resolveWithError(token);
    if (!result.ok) {
      throw new Error(
        `${errorMessagePrefix}: Failed to resolve ${String(token)}: ${result.error.message}`
      );
    }
    results.push(result.value);
  }
  return results;
}
