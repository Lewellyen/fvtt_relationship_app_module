import type { Result } from "@/domain/types/result";
import type { FoundryDocument } from "../interfaces/FoundryDocument";
import type { FoundryError } from "../errors/FoundryErrors";
import type { PortSelector } from "../versioning/portselector";
import type { PortRegistry } from "../versioning/portregistry";
import type { RetryService } from "@/infrastructure/retry/RetryService";
import type { Disposable } from "@/infrastructure/di/interfaces";
import { portSelectorToken } from "@/infrastructure/shared/tokens/foundry/port-selector.token";
import { foundryDocumentPortRegistryToken } from "@/infrastructure/shared/tokens/foundry/foundry-document-port-registry.token";
import { retryServiceToken } from "@/infrastructure/shared/tokens/infrastructure/retry-service.token";
import { PortLoader } from "./PortLoader";
import { RetryableOperation } from "./RetryableOperation";
import { castDisposablePort } from "../runtime-casts";
import type * as v from "valibot";

/**
 * Port wrapper for FoundryDocument that automatically selects the appropriate version
 * based on the current Foundry version.
 *
 * Uses composition instead of inheritance (PortLoader + RetryableOperation) to follow SRP.
 * This refactoring extracts concerns from FoundryServiceBase for better separation of responsibilities.
 */
export class FoundryDocumentPort implements FoundryDocument, Disposable {
  private readonly portLoader: PortLoader<FoundryDocument>;
  private readonly retryable: RetryableOperation;

  constructor(
    portSelector: PortSelector,
    portRegistry: PortRegistry<FoundryDocument>,
    retryService: RetryService
  ) {
    this.portLoader = new PortLoader(portSelector, portRegistry);
    this.retryable = new RetryableOperation(retryService);
  }

  async create<TDocument extends { id: string }>(
    documentClass: { create: (data: unknown) => Promise<TDocument> },
    data: unknown
  ): Promise<Result<TDocument, FoundryError>> {
    return this.retryable.executeAsync(async () => {
      const portResult = this.portLoader.loadPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.create(documentClass, data);
    }, "FoundryDocument.create");
  }

  async update<TDocument extends { id: string }>(
    document: { update: (changes: unknown, options?: { render?: boolean }) => Promise<TDocument> },
    changes: unknown,
    options?: { render?: boolean }
  ): Promise<Result<TDocument, FoundryError>> {
    return this.retryable.executeAsync(async () => {
      const portResult = this.portLoader.loadPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.update(document, changes, options);
    }, "FoundryDocument.update");
  }

  async delete(document: { delete: () => Promise<unknown> }): Promise<Result<void, FoundryError>> {
    return this.retryable.executeAsync(async () => {
      const portResult = this.portLoader.loadPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.delete(document);
    }, "FoundryDocument.delete");
  }

  getFlag<T>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T | null, FoundryError> {
    return this.retryable.execute(() => {
      const portResult = this.portLoader.loadPort("FoundryDocument");
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
    return this.retryable.executeAsync(async () => {
      const portResult = this.portLoader.loadPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.setFlag(document, scope, key, value);
    }, "FoundryDocument.setFlag");
  }

  async unsetFlag(
    document: {
      unsetFlag?: (scope: string, key: string) => Promise<unknown>;
      setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
    },
    scope: string,
    key: string
  ): Promise<Result<void, FoundryError>> {
    return this.retryable.executeAsync(async () => {
      const portResult = this.portLoader.loadPort("FoundryDocument");
      if (!portResult.ok) return portResult;
      return await portResult.value.unsetFlag(document, scope, key);
    }, "FoundryDocument.unsetFlag");
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

export class DIFoundryDocumentPort extends FoundryDocumentPort {
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
