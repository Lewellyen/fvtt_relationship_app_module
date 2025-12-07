import type { Result } from "@/domain/types/result";
import type { FoundrySettings, SettingConfig } from "../interfaces/FoundrySettings";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundrySettingsPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-settings-port-registry.token";
import { retryServiceToken } from "@/infrastructure/shared/tokens/infrastructure/retry-service.token";
import type * as v from "valibot";
import { FoundryServiceBase } from "./FoundryServiceBase";

/**
 * Port wrapper for FoundrySettings that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Extends FoundryServiceBase for consistent port selection and retry logic.
 */
export class FoundrySettingsPort
  extends FoundryServiceBase<FoundrySettings>
  implements FoundrySettings
{
  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundrySettings>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }

  register<T>(
    namespace: string,
    key: string,
    config: SettingConfig<T>
  ): Result<void, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.register(namespace, key, config);
    }, "FoundrySettings.register");
  }

  get<T>(
    namespace: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.get(namespace, key, schema);
    }, "FoundrySettings.get");
  }

  async set<T>(namespace: string, key: string, value: T): Promise<Result<void, FoundryError>> {
    return this.withRetryAsync(async () => {
      const portResult = this.getPort("FoundrySettings");
      if (!portResult.ok) return portResult;
      return portResult.value.set(namespace, key, value);
    }, "FoundrySettings.set");
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
