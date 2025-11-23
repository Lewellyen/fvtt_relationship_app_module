import type { Result } from "@/domain/types/result";
import type { FoundryDocument } from "../../interfaces/FoundryDocument";
import type { FoundryError } from "../../errors/FoundryErrors";
import { fromPromise, tryCatch } from "@/infrastructure/shared/utils/result";
import { createFoundryError } from "../../errors/FoundryErrors";
import { castFoundryError } from "../../runtime-casts";
import * as v from "valibot";

/**
 * v13 implementation of FoundryDocument interface.
 * Encapsulates Foundry v13-specific document operations.
 */
export class FoundryV13DocumentPort implements FoundryDocument {
  #disposed = false;

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

  dispose(): void {
    if (this.#disposed) return; // Idempotent
    this.#disposed = true;
    // No resources to clean up
  }
}
