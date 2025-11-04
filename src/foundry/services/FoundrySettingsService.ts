import type { Result } from "@/types/result";
import type { FoundrySettings, SettingConfig } from "@/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import { portSelectorToken, foundrySettingsPortRegistryToken } from "@/foundry/foundrytokens";

/**
 * Service wrapper for FoundrySettings that automatically selects the appropriate port
 * based on the current Foundry version.
 *
 * Implements Disposable for resource cleanup consistency.
 */
export class FoundrySettingsService implements FoundrySettings, Disposable {
  static dependencies = [portSelectorToken, foundrySettingsPortRegistryToken] as const;

  private port: FoundrySettings | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundrySettings>;

  constructor(portSelector: PortSelector, portRegistry: PortRegistry<FoundrySettings>) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }

  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  private getPort(): Result<FoundrySettings, FoundryError> {
    if (this.port === null) {
      const factories = this.portRegistry.getFactories();
      const portResult = this.portSelector.selectPortFromFactories(factories);
      if (!portResult.ok) {
        return portResult;
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }

  register<T>(
    namespace: string,
    key: string,
    config: SettingConfig<T>
  ): Result<void, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.register(namespace, key, config);
  }

  get<T>(namespace: string, key: string): Result<T, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.get<T>(namespace, key);
  }

  async set<T>(namespace: string, key: string, value: T): Promise<Result<void, FoundryError>> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.set(namespace, key, value);
  }

  /**
   * Cleans up resources.
   * Resets the port reference to allow garbage collection.
   */
  dispose(): void {
    this.port = null;
  }
}
