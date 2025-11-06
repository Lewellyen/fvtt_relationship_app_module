import type { Result } from "@/types/result";
import type { FoundryI18n } from "@/foundry/interfaces/FoundryI18n";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { portSelectorToken, foundryI18nPortRegistryToken } from "@/foundry/foundrytokens";

/**
 * Service wrapper for FoundryI18n that automatically selects the appropriate port
 * based on the current Foundry version.
 *
 * Uses lazy port loading to prevent crashes from incompatible API access.
 */
export class FoundryI18nService implements FoundryI18n {
  static dependencies = [portSelectorToken, foundryI18nPortRegistryToken] as const;

  private port: FoundryI18n | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundryI18n>;

  constructor(portSelector: PortSelector, portRegistry: PortRegistry<FoundryI18n>) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }

  /**
   * Lazy-loads the appropriate port based on Foundry version.
   *
   * @returns Result containing the port or error if no compatible port can be selected
   */
  private getPort(): Result<FoundryI18n, FoundryError> {
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

  localize(key: string): Result<string, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.localize(key);
  }

  format(key: string, data: Record<string, unknown>): Result<string, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.format(key, data);
  }

  has(key: string): Result<boolean, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.has(key);
  }
}
