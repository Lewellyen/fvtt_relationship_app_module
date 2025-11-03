/**
 * Registry for managing available port implementations across different Foundry versions.
 * Centralizes port registration and discovery.
 */

import type { Result } from "@/types/result";
import { ok, err } from "@/utils/result";

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
  register(version: number, factory: PortFactory<T>): Result<void, string> {
    if (this.factories.has(version)) {
      return err(`PortRegistry: version ${version} already registered`);
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
   * Creates all registered ports. Used for port selection.
   * @returns Map of version numbers to port instances
   */
  createAll(): Map<number, T> {
    const ports = new Map<number, T>();
    for (const [version, factory] of this.factories.entries()) {
      ports.set(version, factory());
    }
    return ports;
  }

  /**
   * Gets available port instances for version selection.
   * Alias for createAll() with clearer semantics for PortSelector usage.
   * @returns Map of version numbers to port instances
   */
  getAvailablePorts(): Map<number, T> {
    return this.createAll();
  }

  /**
   * Creates only the port for the specified version or the highest compatible version.
   * More efficient than createAll() when only one port is needed.
   * @param version - The target Foundry version
   * @returns Result containing the port instance or error
   */
  createForVersion(version: number): Result<T, string> {
    // Find highest compatible version (<= target version)
    const compatibleVersions = Array.from(this.factories.keys())
      .filter((v) => v <= version)
      .sort((a, b) => b - a);

    if (compatibleVersions.length === 0) {
      const availableVersions = this.getAvailableVersions().join(", ");
      return err(
        `No compatible port for Foundry v${version}. Available ports: ${availableVersions || "none"}`
      );
    }

    const selectedVersion = compatibleVersions[0];
    if (selectedVersion === undefined) {
      return err("No compatible version found");
    }
    const factory = this.factories.get(selectedVersion);
    if (!factory) {
      return err(`Factory not found for version ${selectedVersion}`);
    }
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
    return versions.length > 0 ? versions[versions.length - 1]! : undefined;
  }
}
