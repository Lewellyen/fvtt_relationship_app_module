/**
 * Registry for managing available port implementations across different Foundry versions.
 * Centralizes port registration and discovery.
 *
 * Ports are registered via DI container tokens, ensuring DIP (Dependency Inversion Principle)
 * compliance. PortSelector resolves ports from the container using these tokens.
 */

import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";
import {
  createFoundryError,
  type FoundryError,
} from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import type { ServiceType } from "@/infrastructure/shared/tokens";

/**
 * Registry that holds exactly one port injection token per version.
 * @template T - The port interface type
 */
export class PortRegistry<T extends ServiceType> {
  // Exactly one token per version
  private readonly tokens = new Map<number, InjectionToken<T>>();

  /**
   * Registers a port injection token for a specific Foundry version.
   * @param version - The Foundry version this port supports
   * @param token - Injection token for resolving the port from the DI container
   * @returns Result indicating success or duplicate registration error
   */
  register(version: number, token: InjectionToken<T>): Result<void, FoundryError> {
    if (this.tokens.has(version)) {
      return err(
        createFoundryError(
          "PORT_REGISTRY_ERROR",
          `Port for version ${version} already registered`,
          { version }
        )
      );
    }
    this.tokens.set(version, token);
    return ok(undefined);
  }

  /**
   * Gets all registered port versions.
   * @returns Array of registered version numbers, sorted ascending
   */
  getAvailableVersions(): number[] {
    return Array.from(this.tokens.keys()).sort((a, b) => a - b);
  }

  /**
   * Gets the token map without resolving ports.
   * Use with PortSelector.selectPortFromTokens() for safe lazy instantiation via DI.
   *
   * @returns Map of version numbers to injection tokens (NOT instances)
   *
   * @example
   * ```typescript
   * const registry = new PortRegistry<FoundryGame>();
   * registry.register(13, foundryV13GamePortToken);
   * registry.register(14, foundryGamePortV14Token);
   *
   * const tokens = registry.getTokens();
   * const selector = new PortSelector(container);
   * const result = selector.selectPortFromTokens(tokens);
   * // Only compatible port is resolved from container
   * ```
   */
  getTokens(): Map<number, InjectionToken<T>> {
    return new Map(this.tokens);
  }

  /**
   * Checks if a port is registered for a specific version.
   * @param version - The version to check
   * @returns True if a port is registered for this version
   */
  hasVersion(version: number): boolean {
    return this.tokens.has(version);
  }

  /**
   * Gets the highest registered port version.
   * @returns The highest version number or undefined if no ports are registered
   */
  getHighestVersion(): number | undefined {
    const versions = this.getAvailableVersions();
    return versions.at(-1);
  }
}
