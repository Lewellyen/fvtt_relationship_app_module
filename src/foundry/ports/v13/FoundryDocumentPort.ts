import type { Result } from "@/types/result";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { fromPromise, tryCatch } from "@/utils/result";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";

/**
 * v13 implementation of FoundryDocument interface.
 * Encapsulates Foundry v13-specific document operations.
 */
export class FoundryDocumentPortV13 implements FoundryDocument {
  getFlag<T = unknown>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string
  ): Result<T | null, FoundryError> {
    return tryCatch(
      () => {
        if (!document?.getFlag) {
          throw new Error("Document does not have getFlag method");
        }
        const value = document.getFlag(scope, key) as T | null | undefined;
        return value ?? null;
      },
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to get flag ${scope}.${key}`,
          { scope, key },
          error
        )
    );
  }

  async setFlag<T = unknown>(
    document: { setFlag: (scope: string, key: string, value: T) => Promise<unknown> },
    scope: string,
    key: string,
    value: T
  ): Promise<Result<void, FoundryError>> {
    return fromPromise<void, FoundryError>(
      (async () => {
        if (!document?.setFlag) {
          throw new Error("Document does not have setFlag method");
        }
        await document.setFlag(scope, key, value);
      })(),
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to set flag ${scope}.${key}`,
          { scope, key, value },
          error
        )
    );
  }
}
