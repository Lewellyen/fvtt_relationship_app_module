import type { Result } from "@/types/result";
import type { FoundrySettings, SettingConfig } from "@/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import type { RetryService } from "@/services/RetryService";
import { portSelectorToken, foundrySettingsPortRegistryToken } from "@/foundry/foundrytokens";
import { retryServiceToken } from "@/tokens/tokenindex";
import type * as v from "valibot";
import { FoundryServiceBase } from "./FoundryServiceBase";

/**
 * Service wrapper for FoundrySettings that automatically selects the appropriate port
 * based on the current Foundry version.
 *
 * Extends FoundryServiceBase for consistent port selection and retry logic.
 */
export class FoundrySettingsService
  extends FoundryServiceBase<FoundrySettings>
  implements FoundrySettings
{
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

  register<T>(
    namespace: string,
    key: string,
    config: SettingConfig<T>
  ): Result<void, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundrySettings");
      /* c8 ignore next -- Branch: Port error path tested in port selection tests */
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
      /* c8 ignore next -- Branch: Port error path tested in port selection tests */
      if (!portResult.ok) return portResult;
      return portResult.value.set(namespace, key, value);
    }, "FoundrySettings.set");
  }
}
