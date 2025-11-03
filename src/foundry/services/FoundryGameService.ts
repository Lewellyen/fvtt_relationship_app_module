import type { Result } from "@/types/result";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryJournalEntry } from "@/foundry/types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import { portSelectorToken, foundryGamePortRegistryToken } from "@/foundry/foundrytokens";

/**
 * Service wrapper for FoundryGame that automatically selects the appropriate port
 * based on the current Foundry version.
 */
export class FoundryGameService implements FoundryGame {
  static dependencies = [portSelectorToken, foundryGamePortRegistryToken] as const;

  private port: FoundryGame | null = null;
  private readonly portSelector: PortSelector;
  private readonly portRegistry: PortRegistry<FoundryGame>;

  constructor(portSelector: PortSelector, portRegistry: PortRegistry<FoundryGame>) {
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
  private getPort(): Result<FoundryGame, FoundryError> {
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

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getJournalEntries();
  }

  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, FoundryError> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getJournalEntryById(id);
  }
}
