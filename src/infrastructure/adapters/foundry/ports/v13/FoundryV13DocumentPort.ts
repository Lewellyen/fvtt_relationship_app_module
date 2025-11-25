import type { Result } from "@/domain/types/result";
import type { FoundryDocument } from "../../interfaces/FoundryDocument";
import type { FoundryError } from "../../errors/FoundryErrors";
import { fromPromise, tryCatch, err } from "@/infrastructure/shared/utils/result";
import { createFoundryError } from "../../errors/FoundryErrors";
import { castFoundryError, castFoundryDocumentWithUpdate } from "../../runtime-casts";
import * as v from "valibot";

/**
 * v13 implementation of FoundryDocument interface.
 * Encapsulates Foundry v13-specific document operations.
 */
export class FoundryV13DocumentPort implements FoundryDocument {
  #disposed = false;

  async create<TDocument extends { id: string }>(
    documentClass: { create: (data: unknown) => Promise<TDocument> },
    data: unknown
  ): Promise<Result<TDocument, FoundryError>> {
    if (this.#disposed) {
      return err(createFoundryError("DISPOSED", "Cannot create document on disposed port"));
    }

    return fromPromise<TDocument, FoundryError>(documentClass.create(data), (error) =>
      createFoundryError("OPERATION_FAILED", "Failed to create document", { data }, error)
    );
  }

  async update<TDocument extends { id: string }>(
    document: { update: (changes: unknown) => Promise<TDocument> },
    changes: unknown
  ): Promise<Result<TDocument, FoundryError>> {
    if (this.#disposed) {
      return err(createFoundryError("DISPOSED", "Cannot update document on disposed port"));
    }

    return fromPromise<TDocument, FoundryError>(document.update(changes), (error) =>
      createFoundryError("OPERATION_FAILED", "Failed to update document", { changes }, error)
    );
  }

  async delete(document: { delete: () => Promise<unknown> }): Promise<Result<void, FoundryError>> {
    if (this.#disposed) {
      return err(createFoundryError("DISPOSED", "Cannot delete document on disposed port"));
    }

    return fromPromise<void, FoundryError>(
      document.delete().then(() => undefined),
      (error) =>
        createFoundryError("OPERATION_FAILED", "Failed to delete document", undefined, error)
    );
  }

  getFlag<T>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T | null, FoundryError> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot get flag on disposed port", { scope, key }),
      };
    }
    return tryCatch(
      () => {
        if (!document?.getFlag) {
          throw new Error("Document does not have getFlag method");
        }

        const rawValue = document.getFlag(scope, key);

        // Handle null/undefined as valid "not set" state
        if (rawValue === null || rawValue === undefined) {
          return null;
        }

        // Runtime validation with Valibot
        const parseResult = v.safeParse(schema, rawValue);

        if (!parseResult.success) {
          const error = createFoundryError(
            "VALIDATION_FAILED",
            `Flag ${scope}.${key} failed validation: ${parseResult.issues.map((i) => i.message).join(", ")}`,
            { scope, key, rawValue, issues: parseResult.issues }
          );
          throw error;
        }

        return parseResult.output;
      },
      (error) => {
        // Check if it's already a FoundryError (from validation)
        if (error && typeof error === "object" && "code" in error && "message" in error) {
          return castFoundryError(error);
        }
        // Otherwise wrap as OPERATION_FAILED
        return createFoundryError(
          "OPERATION_FAILED",
          `Failed to get flag ${scope}.${key}`,
          { scope, key },
          error
        );
      }
    );
  }

  async setFlag<T = unknown>(
    document: { setFlag: (scope: string, key: string, value: T) => Promise<unknown> },
    scope: string,
    key: string,
    value: T
  ): Promise<Result<void, FoundryError>> {
    if (this.#disposed) {
      return {
        ok: false,
        error: createFoundryError("DISPOSED", "Cannot set flag on disposed port", { scope, key }),
      };
    }
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

  async unsetFlag(
    document: {
      unsetFlag?: (scope: string, key: string) => Promise<unknown>;
      setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
    },
    scope: string,
    key: string
  ): Promise<Result<void, FoundryError>> {
    if (this.#disposed) {
      return err(
        createFoundryError("DISPOSED", "Cannot unset flag on disposed port", { scope, key })
      );
    }

    return fromPromise<void, FoundryError>(
      (async () => {
        // Use unsetFlag if available (recommended)
        if (document.unsetFlag) {
          await document.unsetFlag(scope, key);
        } else {
          // Fallback: Use update with "-=" syntax
          // Document must have update method for fallback
          const docWithUpdateResult = castFoundryDocumentWithUpdate(document);
          if (!docWithUpdateResult.ok) {
            throw new Error(
              `Document does not support unsetFlag or update: ${docWithUpdateResult.error.message}`
            );
          }
          await docWithUpdateResult.value.update({
            [`flags.${scope}.-=${key}`]: null,
          });
        }
      })(),
      (error) =>
        createFoundryError(
          "OPERATION_FAILED",
          `Failed to unset flag ${scope}.${key}`,
          { scope, key },
          error
        )
    );
  }

  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.#disposed = true;
    // No resources to clean up
  }
}
