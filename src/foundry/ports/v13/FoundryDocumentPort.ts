import type { Result } from "@/types/result";
import type { FoundryDocument } from "@/foundry/interfaces/FoundryDocument";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import { fromPromise, tryCatch } from "@/utils/functional/result";
import { createFoundryError } from "@/foundry/errors/FoundryErrors";
import * as v from "valibot";

/**
 * v13 implementation of FoundryDocument interface.
 * Encapsulates Foundry v13-specific document operations.
 */
export class FoundryDocumentPortV13 implements FoundryDocument {
  getFlag<T>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T | null, FoundryError> {
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
          /* type-coverage:ignore-next-line -- Runtime type check ensures FoundryError structure before cast */
          return error as FoundryError;
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

  /* c8 ignore start -- Lifecycle: No resources to clean up, no-op method */
  dispose(): void {
    // No resources to clean up
  }
  /* c8 ignore stop */
}
