import type { Result } from "@/types/result";
import type { FoundryUI } from "@/foundry/interfaces/FoundryUI";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { PortSelector } from "@/foundry/versioning/portselector";
import { PortRegistry } from "@/foundry/versioning/portregistry";
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
   * Uses PortSelector with factory-based selection to prevent eager instantiation.
   *
   * CRITICAL: This prevents crashes when newer port constructors access
   * APIs not available in the current Foundry version.
   *
   * @returns Result containing the port or a FoundryError if no compatible port can be selected
   */
  private getPort(): Result<FoundryUI, FoundryError> {
    if (this.port === null) {
      // Get factories (not instances) to avoid eager instantiation
      const factories = this.portRegistry.getFactories();

      // Use PortSelector with factory-based selection
      const portResult = this.portSelector.selectPortFromFactories(factories);
      if (!portResult.ok) {
        return portResult;
      }

      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }

  removeJournalElement(
    journalId: string,
    journalName: string,
    html: HTMLElement
  ): Result<void, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.removeJournalElement(journalId, journalName, html);
  }

  findElement(container: HTMLElement, selector: string): Result<HTMLElement | null, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.findElement(container, selector);
  }

  notify(message: string, type: "info" | "warning" | "error"): Result<void, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.notify(message, type);
  }
}
