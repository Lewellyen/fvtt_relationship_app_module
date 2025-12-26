import type { Result } from "@/domain/types/result";
import type { FoundrySettings, SettingConfig } from "../interfaces/FoundrySettings";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { Disposable } from "@/infrastructure/di/interfaces";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundrySettingsPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings-port-registry.token";
import { retryServiceToken } from "@/infrastructure/shared/tokens/infrastructure/retry-service.token";
import { PortLoader } from "./PortLoader";
import { RetryableOperation } from "./RetryableOperation";
import { castDisposablePort } from "../runtime-casts";
import type * as v from "valibot";

/**
 * Port wrapper for FoundrySettings that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Uses composition instead of inheritance (PortLoader + RetryableOperation) to follow SRP.
 * This refactoring extracts concerns from FoundryServiceBase for better separation of responsibilities.
 */
export class FoundrySettingsPort implements FoundrySettings, Disposable {
  private readonly portLoader: PortLoader<FoundrySettings>;
  private readonly retryable: RetryableOperation;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundrySettings>,
    retryService: RetryService
  ) {
    this.portLoader = new PortLoader(portSelector, portRegistry);
    this.retryable = new RetryableOperation(retryService);
  }

  register<T>(
    namespace: string,
    key: string,
    config: SettingConfig<T>
  ): Result<void, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.register(namespace, key, config);
    }, "FoundrySettings.register");
  }

  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.get(namespace, key, schema);
    }, "FoundrySettings.get");
  }

  async set<T>(namespace: string, key: string, value: T): Promise<Result<void, FoundryError>> {
    return this.retryable.executeAsync(async () => {
      const portResult = this.portLoader.loadPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.set(namespace, key, value);
    }, "FoundrySettings.set");
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

export class DIFoundrySettingsPort extends FoundrySettingsPort {
  static dependencies = [
    portSelectorToken,
    foundrySettingsPortRegistryToken,
    retryServiceToken,
  ] as const;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundrySettings>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }
}
