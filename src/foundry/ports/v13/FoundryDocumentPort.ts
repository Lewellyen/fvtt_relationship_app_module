import type { Result } from "@/types/result";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import { fromPromise, tryCatch } from "@/utils/result";

/**
 * v13 implementation of FoundryDocument interface.
 * Encapsulates Foundry v13-specific document operations.
 */
export class FoundryDocumentPortV13 implements FoundryDocument {
  getFlag<T = unknown>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string
  ): Result<T | null, string> {
    return tryCatch(
      () => {
        if (!document?.getFlag) {
          throw new Error("Document does not have getFlag method");
        }
        const value = document.getFlag(scope, key) as T | null | undefined;
        return value ?? null;
      },
      (error) =>
        `Failed to get flag ${scope}.${key}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  async setFlag<T = unknown>(
    document: { setFlag: (scope: string, key: string, value: T) => Promise<unknown> },
    scope: string,
    key: string,
    value: T
  ): Promise<Result<void, string>> {
    return fromPromise<void, string>(
      (async () => {
        if (!document?.setFlag) {
          throw new Error("Document does not have setFlag method");
        }
        await document.setFlag(scope, key, value);
      })(),
      (error) =>
        `Failed to set flag ${scope}.${key}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
