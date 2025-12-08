/**
 * Strategy for resolving ports from the DI container.
 *
 * Encapsulates container resolution logic to follow Single Responsibility Principle.
 * This separates port resolution concerns from port selection logic.
 */

import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { ServiceContainer } from "@/infrastructure/di/container";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { err, ok } from "@/domain/utils/result";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { castResolvedService } from "@/infrastructure/di/types/utilities/runtime-safe-cast";

/**
 * Strategy for resolving ports from the DI container.
 *
 * Provides a clean abstraction for container resolution, making it easier
 * to test and maintain port selection logic.
 */
export class PortResolutionStrategy {
  constructor(private readonly container: ServiceContainer) {}

  /**
   * Resolves a port from the DI container using the provided injection token.
   *
   * @template T - The port type
   * @param token - The injection token for the port
   * @returns Result with resolved port or FoundryError
   *
   * @example
   * ```typescript
   * const strategy = new PortResolutionStrategy(container);
   * const portResult = strategy.resolve(foundryV13GamePortToken);
   * if (portResult.ok) {
   *   const port = portResult.value;
   * }
   * ```
   */
  resolve<T>(token: InjectionToken<T>): Result<T, FoundryError> {
    try {
      const resolveResult = this.container.resolveWithError(token);
      if (!resolveResult.ok) {
        return err(
          createFoundryError(
            "PORT_RESOLUTION_FAILED",
            `Failed to resolve port from container`,
            { token: String(token) },
            resolveResult.error
          )
        );
      }
      return ok(castResolvedService<T>(resolveResult.value));
    } catch (error) {
      return err(
        createFoundryError(
          "PORT_RESOLUTION_FAILED",
          `Failed to resolve port from container`,
          { token: String(token) },
          error instanceof Error ? error : new Error(String(error))
        )
      );
    }
  }
}
