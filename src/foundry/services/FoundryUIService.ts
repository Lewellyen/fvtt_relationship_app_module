import type { Result } from "@/types/result";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
import { err } from "@/utils/result";
import { portSelectorToken, foundryUIPortRegistryToken } from "@/foundry/foundrytokens";

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
   * @throws Error if no compatible port can be selected
   */
  private getPort(): FoundryUI {
    if (this.port === null) {
      const ports = this.portRegistry.createAll();
      const result = this.portSelector.selectPort(ports);
      if (!result.ok) {
        throw new Error(`Failed to select FoundryUI port: ${result.error}`);
      }
      this.port = result.value;
    }
    return this.port;
  }

  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, string> {
    try {
      return this.getPort().removeJournalElement(journalId, journalName, html);
    } catch (error) {
      return err(
        error instanceof Error
          ? error.message
          : `Failed to remove journal element ${journalId}: ${String(error)}`
      );
    }
  }

  findElement(container: HTMLElement, selector: string): Result<HTMLElement | null, string> {
    try {
      return this.getPort().findElement(container, selector);
    } catch (error) {
      return err(
        error instanceof Error
          ? error.message
          : `Failed to find element with selector ${selector}: ${String(error)}`
      );
    }
  }
}
