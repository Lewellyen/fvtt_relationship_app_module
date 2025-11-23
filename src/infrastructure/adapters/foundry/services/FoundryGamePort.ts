import type { Result } from "@/domain/types/result";
import type { FoundryGame } from "../interfaces/FoundryGame";
import type { FoundryJournalEntry } from "../types";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import {
  portSelectorToken,
  foundryGamePortRegistryToken,
} from "@/infrastructure/shared/tokens/foundry.tokens";
import { retryServiceToken } from "@/infrastructure/shared/tokens";
import { FoundryServiceBase } from "./FoundryServiceBase";

/**
 * Port wrapper for FoundryGame that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Extends FoundryServiceBase for consistent port selection and retry logic.
 */
export class FoundryGamePort extends FoundryServiceBase<FoundryGame> implements FoundryGame {
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

  invalidateCache(): void {
    const portResult = this.getPort("FoundryGame");
    if (portResult.ok) {
      portResult.value.invalidateCache();
    }
  }
}

export class DIFoundryGamePort extends FoundryGamePort {
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
