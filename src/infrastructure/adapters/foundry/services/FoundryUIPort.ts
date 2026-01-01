import type { Result } from "@/domain/types/result";
import type { FoundryNotificationOptions, FoundryUI } from "../interfaces/FoundryUI";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { Disposable } from "@/infrastructure/di/interfaces";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundryUIPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-ui-port-registry.token";
import { retryServiceToken } from "@/infrastructure/shared/tokens/infrastructure/retry-service.token";
import { PortLoader } from "./PortLoader";
import { RetryableOperation } from "./RetryableOperation";
import { castDisposablePort } from "../runtime-casts";

/**
 * Port wrapper for FoundryUI that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Uses composition instead of inheritance (PortLoader + RetryableOperation) to follow SRP.
 * This refactoring extracts concerns from FoundryServiceBase for better separation of responsibilities.
 */
export class FoundryUIPort implements FoundryUI, Disposable {
  private readonly portLoader: PortLoader<FoundryUI>;
  private readonly retryable: RetryableOperation;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryUI>,
    retryService: RetryService
  ) {
    this.portLoader = new PortLoader(portSelector, portRegistry);
    this.retryable = new RetryableOperation(retryService);
  }

  removeJournalDirectoryEntry(
    directoryId: string,
    journalId: string,
    journalName: string
  ): Result<void, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.removeJournalDirectoryEntry(directoryId, journalId, journalName);
    }, "FoundryUI.removeJournalDirectoryEntry");
  }

  findElement(container: HTMLElement, selector: string): Result<HTMLElement | null, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.findElement(container, selector);
    }, "FoundryUI.findElement");
  }

  notify(
    message: string,
    type: "info" | "warning" | "error",
    options?: FoundryNotificationOptions
  ): Result<void, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.notify(message, type, options);
    }, "FoundryUI.notify");
  }

  getDirectoryElement(directoryId: string): Result<HTMLElement | null, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.getDirectoryElement(directoryId);
    }, "FoundryUI.getDirectoryElement");
  }

  rerenderJournalDirectory(): Result<boolean, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryUI");
      if (!portResult.ok) return portResult;
      return portResult.value.rerenderJournalDirectory();
    }, "FoundryUI.rerenderJournalDirectory");
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

export class DIFoundryUIPort extends FoundryUIPort {
  static dependencies = [portSelectorToken, foundryUIPortRegistryToken, retryServiceToken] as const;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryUI>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }
}
