/**
 * Registry for managing available port implementations across different Foundry versions.
 * Centralizes port registration and discovery.
 */

export type PortFactory<T> = () => T;

/**
 * Registry that holds port factories organized by version.
 * @template T - The port interface type
 */
export class PortRegistry<T> {
  private readonly factories = new Map<number, PortFactory<T>>();

  /**
   * Registers a port factory for a specific Foundry version.
   * @param version - The Foundry version this port supports
   * @param factory - Factory function that creates the port instance
   */
  register(version: number, factory: PortFactory<T>): void {
    this.factories.set(version, factory);
  }

  /**
   * Gets all registered port versions.
   * @returns Array of registered version numbers, sorted ascending
   */
  getAvailableVersions(): number[] {
    return Array.from(this.factories.keys()).sort((a, b) => a - b);
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
    return versions.length > 0 ? versions[versions.length - 1] : undefined;
  }
}

