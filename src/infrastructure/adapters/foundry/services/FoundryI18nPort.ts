import type { Result } from "@/domain/types/result";
import type { FoundryI18n } from "../interfaces/FoundryI18n";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundryI18nPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-i18n-port-registry.token";
import { retryServiceToken } from "@/infrastructure/shared/tokens/infrastructure/retry-service.token";
import { FoundryServiceBase } from "./FoundryServiceBase";

/**
 * Port wrapper for FoundryI18n that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Extends FoundryServiceBase for consistent port selection and retry logic.
 */
export class FoundryI18nPort extends FoundryServiceBase<FoundryI18n> implements FoundryI18n {
  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryI18n>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }

  localize(key: string): Result<string, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.localize(key);
    }, "FoundryI18n.localize");
  }

  format(key: string, data: Record<string, unknown>): Result<string, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.format(key, data);
    }, "FoundryI18n.format");
  }

  has(key: string): Result<boolean, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryI18n");
      if (!portResult.ok) return portResult;
      return portResult.value.has(key);
    }, "FoundryI18n.has");
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
