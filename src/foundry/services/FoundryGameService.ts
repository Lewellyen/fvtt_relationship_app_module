import type { Result } from "@/types/result";
import type { FoundryGame } from "@/foundry/interfaces/FoundryGame";
import type { FoundryJournalEntry } from "@/foundry/types";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import type { RetryService } from "@/services/RetryService";
import { portSelectorToken, foundryGamePortRegistryToken } from "@/foundry/foundrytokens";
import { retryServiceToken } from "@/tokens/tokenindex";
import { FoundryServiceBase } from "./FoundryServiceBase";

/**
 * Service wrapper for FoundryGame that automatically selects the appropriate port
 * based on the current Foundry version.
 *
 * Extends FoundryServiceBase for consistent port selection and retry logic.
 */
export class FoundryGameService extends FoundryServiceBase<FoundryGame> implements FoundryGame {
  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryGame>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryGame");
      if (!portResult.ok) return portResult;
      return portResult.value.getJournalEntries();
    }, "FoundryGame.getJournalEntries");
  }

  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryGame");
      if (!portResult.ok) return portResult;
      return portResult.value.getJournalEntryById(id);
    }, "FoundryGame.getJournalEntryById");
  }
}

export class DIFoundryGameService extends FoundryGameService {
  static dependencies = [
    portSelectorToken,
    foundryGamePortRegistryToken,
    retryServiceToken,
  ] as const;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryGame>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }
}
