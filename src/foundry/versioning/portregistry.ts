/**
 * Registry for managing available port implementations across different Foundry versions.
 * Centralizes port registration and discovery.
 */

import type { Result } from "@/types/result";
import { ok, err } from "@/utils/functional/result";
import { createFoundryError, type FoundryError } from "@/foundry/errors/FoundryErrors";
import { assertNonEmptyArray } from "@/foundry/runtime-casts";

export type PortFactory<T> = () => T;

/**
 * Registry that holds exactly one port factory per version.
 * @template T - The port interface type
 */
export class PortRegistry<T> {
  // Exactly one factory per version
  private readonly factories = new Map<number, PortFactory<T>>();

  /**
   * Registers a port factory for a specific Foundry version.
   * @param version - The Foundry version this port supports
   * @param factory - Factory function that creates the port instance
   * @returns Result indicating success or duplicate registration error
   */
  register(version: number, factory: PortFactory<T>): Result<void, FoundryError> {
    if (this.factories.has(version)) {
      return err(
        createFoundryError(
          "PORT_REGISTRY_ERROR",
          `Port for version ${version} already registered`,
          { version }
        )
      );
    }
    this.factories.set(version, factory);
    return ok(undefined);
  }

  /**
   * Gets all registered port versions.
   * @returns Array of registered version numbers, sorted ascending
   */
  getAvailableVersions(): number[] {
    return Array.from(this.factories.keys()).sort((a, b) => a - b);
  }

  /**
   * Gets the factory map without instantiating ports.
   * Use with PortSelector.selectPortFromFactories() for safe lazy instantiation.
   *
   * @returns Map of version numbers to factory functions (NOT instances)
   *
   * @example
   * ```typescript
   * const registry = new PortRegistry<FoundryGame>();
   * registry.register(13, () => new FoundryGamePortV13());
   * registry.register(14, () => new FoundryGamePortV14());
   *
   * const factories = registry.getFactories();
   * const selector = new PortSelector();
   * const result = selector.selectPortFromFactories(factories);
   * // Only compatible port is instantiated
   * ```
   */
  getFactories(): Map<number, PortFactory<T>> {
    return new Map(this.factories);
  }

  /**
   * Creates only the port for the specified version or the highest compatible version.
   * More efficient than createAll() when only one port is needed.
   * @param version - The target Foundry version
   * @returns Result containing the port instance or error
   */
  createForVersion(version: number): Result<T, FoundryError> {
    // Find highest compatible version (<= target version)
    const compatibleVersions = Array.from(this.factories.keys())
      .filter((v) => v <= version)
      .sort((a, b) => b - a);

    if (compatibleVersions.length === 0) {
      const availableVersions = this.getAvailableVersions().join(", ") || "none";
      return err(
        createFoundryError(
          "PORT_NOT_FOUND",
          `No compatible port for Foundry v${version}. Available ports: ${availableVersions}`,
          { version, availableVersions }
        )
      );
    }

    // Type-guard ensures array is non-empty
    assertNonEmptyArray(compatibleVersions);
    const selectedVersion = compatibleVersions[0];
    const factory = this.factories.get(selectedVersion);
    /* c8 ignore start -- Defensive check: theoretically impossible because compatibleVersions comes from this.factories.keys() and factory lookup uses the same Map instance. However, TypeScript's type system doesn't guarantee this, so the check exists for type safety. Testing would require mocking internal state, which is overkill for a defensive check. */
    if (!factory) {
      return err(
        createFoundryError(
          "PORT_NOT_FOUND",
          `Factory for version ${selectedVersion} not found in registry`,
          { version: selectedVersion }
        )
      );
    }
    /* c8 ignore stop */
    return ok(factory());
  }

  /**
   * Checks if a port is registered for a specific version.
   * @param version - The version to check
   * @returns True if a port is registered for this version
   */
  hasVersion(version: number): boolean {
    return this.factories.has(version);
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
