import type { Result } from "@/domain/types/result";
import type { FoundryDocument } from "../interfaces/FoundryDocument";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import {
  portSelectorToken,
  foundryDocumentPortRegistryToken,
} from "@/infrastructure/shared/tokens/foundry.tokens";
import { retryServiceToken } from "@/infrastructure/shared/tokens";
import { FoundryServiceBase } from "./FoundryServiceBase";
import type * as v from "valibot";

/**
 * Service wrapper for FoundryDocument that automatically selects the appropriate port
 * based on the current Foundry version.
 *
 * Extends FoundryServiceBase for consistent port selection and retry logic.
 */
export class FoundryDocumentService
  extends FoundryServiceBase<FoundryDocument>
  implements FoundryDocument
{
  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryDocument>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }

  getFlag<T>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T | null, FoundryError> {
    return this.withRetry(() => {
      const portResult = this.getPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return portResult.value.getFlag<T>(document, scope, key, schema);
    }, "FoundryDocument.getFlag");
  }

  async setFlag<T = unknown>(
    document: { setFlag: (scope: string, key: string, value: T) => Promise<unknown> },
    scope: string,
    key: string,
    value: T
  ): Promise<Result<void, FoundryError>> {
    return this.withRetryAsync(async () => {
      const portResult = this.getPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.setFlag(document, scope, key, value);
    }, "FoundryDocument.setFlag");
  }
}

export class DIFoundryDocumentService extends FoundryDocumentService {
  static dependencies = [
    portSelectorToken,
    foundryDocumentPortRegistryToken,
    retryServiceToken,
  ] as const;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryDocument>,
    retryService: RetryService
  ) {
    super(portSelector, portRegistry, retryService);
  }
}
