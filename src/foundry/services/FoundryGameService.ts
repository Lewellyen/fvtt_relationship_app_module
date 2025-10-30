import type { Result } from "@/types/result";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryJournalEntry } from "@/foundry/types";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import { err } from "@/utils/result";
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
   * @throws Error if no compatible port can be selected
   */
  private getPort(): FoundryGame {
    if (this.port === null) {
      const ports = this.portRegistry.createAll();
      const result = this.portSelector.selectPort(ports);
      if (!result.ok) {
        throw new Error(`Failed to select FoundryGame port: ${result.error}`);
      }
      this.port = result.value;
    }
    return this.port;
  }

  getJournalEntries(): Result<FoundryJournalEntry[], string> {
    try {
      return this.getPort().getJournalEntries();
    } catch (error) {
      return err(
        error instanceof Error ? error.message : `Failed to get journal entries: ${String(error)}`
      );
    }
  }

  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, string> {
    try {
      return this.getPort().getJournalEntryById(id);
    } catch (error) {
      return err(
        error instanceof Error
          ? error.message
          : `Failed to get journal entry by ID ${id}: ${String(error)}`
      );
    }
  }
}
