import type { Result } from "@/types/result";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryJournalEntry } from "@/foundry/types";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import { err, tryCatch } from "@/utils/result";
import { portSelectorToken, foundryGamePortRegistryToken } from "@/foundry/foundrytokens";
import { getFoundryVersion } from "@/foundry/versioning/versiondetector";

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
   * @returns Result containing the port or an error if no compatible port can be selected
   */
  private getPort(): Result<FoundryGame, string> {
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
        return err(`Failed to select FoundryGame port: ${portResult.error}`);
      }
      this.port = portResult.value;
    }
    return { ok: true, value: this.port };
  }

  getJournalEntries(): Result<FoundryJournalEntry[], string> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getJournalEntries();
  }

  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, string> {
    const portResult = this.getPort();
    if (!portResult.ok) return portResult;
    return portResult.value.getJournalEntryById(id);
  }
}
