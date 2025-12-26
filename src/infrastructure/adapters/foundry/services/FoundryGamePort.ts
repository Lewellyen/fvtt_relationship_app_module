import type { Result } from "@/domain/types/result";
import type { FoundryGame } from "../interfaces/FoundryGame";
import type { FoundryJournalEntry } from "../types";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { Disposable } from "@/infrastructure/di/interfaces";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundryGamePortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-game-port-registry.token";
import { retryServiceToken } from "@/infrastructure/shared/tokens/infrastructure/retry-service.token";
import { PortLoader } from "./PortLoader";
import { RetryableOperation } from "./RetryableOperation";
import { castDisposablePort } from "../runtime-casts";

/**
 * Port wrapper for FoundryGame that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Uses composition instead of inheritance (PortLoader + RetryableOperation) to follow SRP.
 * This refactoring extracts concerns from FoundryServiceBase for better separation of responsibilities.
 */
export class FoundryGamePort implements FoundryGame, Disposable {
  private readonly portLoader: PortLoader<FoundryGame>;
  private readonly retryable: RetryableOperation;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryGame>,
    retryService: RetryService
  ) {
    this.portLoader = new PortLoader(portSelector, portRegistry);
    this.retryable = new RetryableOperation(retryService);
  }

  getJournalEntries(): Result<FoundryJournalEntry[], FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryGame");
      if (!portResult.ok) return portResult;
      return portResult.value.getJournalEntries();
    }, "FoundryGame.getJournalEntries");
  }

  getJournalEntryById(id: string): Result<FoundryJournalEntry | null, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryGame");
      if (!portResult.ok) return portResult;
      return portResult.value.getJournalEntryById(id);
    }, "FoundryGame.getJournalEntryById");
  }

  invalidateCache(): void {
    const portResult = this.portLoader.loadPort("FoundryGame");
    if (portResult.ok) {
      portResult.value.invalidateCache();
    }
  }

  /**
   * Cleans up resources.
   * Disposes the port if it implements Disposable, then clears the cache.
   */
  dispose(): void {
    const port = this.portLoader.getLoadedPort();
    const disposable = castDisposablePort(port);
    if (disposable) {
      disposable.dispose();
    }
    this.portLoader.clearCache();
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
