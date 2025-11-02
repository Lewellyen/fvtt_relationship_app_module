import type { Result } from "@/types/result";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { err, tryCatch } from "@/utils/result";
import { portSelectorToken, foundryDocumentPortRegistryToken } from "@/foundry/foundrytokens";
import { getFoundryVersion } from "@/foundry/versioning/versiondetector";

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
   * @returns Result containing the port or an error if no compatible port can be selected
   */
  private getPort(): Result<FoundryDocument, string> {
    if (this.port === null) {
      const versionResult = tryCatch(
        () => getFoundryVersion(),
        (e) => `Cannot detect Foundry version: ${e instanceof Error ? e.message : String(e)}`
      );
      if (!versionResult.ok) {
        return err(`Failed to detect Foundry version: ${versionResult.error}`);
      }

      const portResult = this.portRegistry.createForVersion(versionResult.value);
      if (!portResult.ok) {
        return err(`Failed to select FoundryDocument port: ${portResult.error}`);
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }

  getFlag<T = unknown>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string
  ): Result<T | null, string> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getFlag<T>(document, scope, key);
  }

  async setFlag<T = unknown>(
    document: { setFlag: (scope: string, key: string, value: T) => Promise<unknown> },
    scope: string,
    key: string,
    value: T
  ): Promise<Result<void, string>> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return await portResult.value.setFlag(document, scope, key, value);
  }
}
