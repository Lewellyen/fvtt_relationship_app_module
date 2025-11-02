import type { Result } from "@/types/result";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { err, tryCatch } from "@/utils/result";
import { portSelectorToken, foundryUIPortRegistryToken } from "@/foundry/foundrytokens";
import { getFoundryVersion } from "@/foundry/versioning/versiondetector";

/**
 * Service wrapper for FoundryUI that automatically selects the appropriate port
 * based on the current Foundry version.
 */
export class FoundryUIService implements FoundryUI {
  static dependencies = [portSelectorToken, foundryUIPortRegistryToken] as const;

  private port: FoundryUI | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundryUI>;

  constructor(portSelector: PortSelector, portRegistry: PortRegistry<FoundryUI>) {
    this.portSelector = portSelector;
    this.portRegistry = portRegistry;
  }

  /**
   * Lazy-loads the appropriate port based on Foundry version.
   * @returns Result containing the port or an error if no compatible port can be selected
   */
  private getPort(): Result<FoundryUI, string> {
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
        return err(`Failed to select FoundryUI port: ${portResult.error}`);
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }

  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, string> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.removeJournalElement(journalId, journalName, html);
  }

  findElement(container: HTMLElement, selector: string): Result<HTMLElement | null, string> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.findElement(container, selector);
  }
}
