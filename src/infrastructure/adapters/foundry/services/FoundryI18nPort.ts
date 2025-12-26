import type { Result } from "@/domain/types/result";
import type { FoundryI18n } from "../interfaces/FoundryI18n";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { Disposable } from "@/infrastructure/di/interfaces";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundryI18nPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-i18n-port-registry.token";
import { retryServiceToken } from "@/infrastructure/shared/tokens/infrastructure/retry-service.token";
import { PortLoader } from "./PortLoader";
import { RetryableOperation } from "./RetryableOperation";
import { castDisposablePort } from "../runtime-casts";

/**
 * Port wrapper for FoundryI18n that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Uses composition instead of inheritance (PortLoader + RetryableOperation) to follow SRP.
 * This refactoring extracts concerns from FoundryServiceBase for better separation of responsibilities.
 */
export class FoundryI18nPort implements FoundryI18n, Disposable {
  private readonly portLoader: PortLoader<FoundryI18n>;
  private readonly retryable: RetryableOperation;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryI18n>,
    retryService: RetryService
  ) {
    this.portLoader = new PortLoader(portSelector, portRegistry);
    this.retryable = new RetryableOperation(retryService);
  }

  localize(key: string): Result<string, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.localize(key);
    }, "FoundryI18n.localize");
  }

  format(key: string, data: Record<string, unknown>): Result<string, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.format(key, data);
    }, "FoundryI18n.format");
  }

  has(key: string): Result<boolean, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.has(key);
    }, "FoundryI18n.has");
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

export class DIFoundryI18nPort extends FoundryI18nPort {
  static dependencies = [
    portSelectorToken,
    foundryI18nPortRegistryToken,
    retryServiceToken,
  ] as const;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryI18n>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }
}
