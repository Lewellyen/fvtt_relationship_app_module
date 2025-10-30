import type { Result } from "@/types/result";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { err } from "@/utils/result";
import { portSelectorToken, foundryDocumentPortRegistryToken } from "@/foundry/foundrytokens";

/**
 * Service wrapper for FoundryDocument that automatically selects the appropriate port
 * based on the current Foundry version.
 */
export class FoundryDocumentService implements FoundryDocument {
  static dependencies = [portSelectorToken, foundryDocumentPortRegistryToken] as const;

  private port: FoundryDocument | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundryDocument>;

  constructor(portSelector: PortSelector, portRegistry: PortRegistry<FoundryDocument>) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }

  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * @throws Error if no compatible port can be selected
   */
  private getPort(): FoundryDocument {
    if (this.port === null) {
      const ports = this.portRegistry.createAll();
      const result = this.portSelector.selectPort(ports);
      if (!result.ok) {
        throw new Error(`Failed to select FoundryDocument port: ${result.error}`);
      }
      this.port = result.value;
    }
    return this.port;
  }

  getFlag<T = unknown>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string
  ): Result<T | null, string> {
    try {
      return this.getPort().getFlag<T>(document, scope, key);
    } catch (error) {
      return err(
        error instanceof Error
          ? error.message
          : `Failed to get flag ${scope}.${key}: ${String(error)}`
      );
    }
  }

  async setFlag<T = unknown>(
    document: { setFlag: (scope: string, key: string, value: T) => Promise<unknown> },
    scope: string,
    key: string,
    value: T
  ): Promise<Result<void, string>> {
    try {
      return await this.getPort().setFlag(document, scope, key, value);
    } catch (error) {
      return err(
        error instanceof Error
          ? error.message
          : `Failed to set flag ${scope}.${key}: ${String(error)}`
      );
    }
  }
}
