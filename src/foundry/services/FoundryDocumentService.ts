import type { Result } from "@/types/result";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type { PortSelector } from "@/foundry/versioning/portselector";
import type { PortRegistry } from "@/foundry/versioning/portregistry";
import type { RetryService } from "@/services/RetryService";
import { portSelectorToken, foundryDocumentPortRegistryToken } from "@/foundry/foundrytokens";
import { retryServiceToken } from "@/tokens/tokenindex";
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
