import type { Result } from "@/types/result";
import type { FoundryError } from "@/foundry/errors/FoundryErrors";
import type * as v from "valibot";
import type { Disposable } from "@/di_infrastructure/interfaces/disposable";

/**
 * Interface for Foundry document operations.
 * Abstracts flag access and document manipulation.
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 */
export interface FoundryDocument extends Disposable {
  /**
   * Gets a flag value from a document with runtime validation.
   *
   * SECURITY: Flags are external input and must be validated!
   * Schema validation prevents injection attacks and type mismatches.
   *
   * @param document - The Foundry document (e.g., JournalEntry)
   * @param scope - The scope/namespace for the flag (usually the module ID)
   * @param key - The flag key
   * @param schema - Valibot schema for runtime validation
   * @returns Result containing validated flag value or null, or a FoundryError
   *
   * @example
   * ```typescript
   * import * as v from "valibot";
   *
   * const result = document.getFlag(entry, "my-module", "hidden", v.boolean());
   * if (result.ok && result.value === true) {
   *   console.log("Entry is hidden");
   * }
   * ```
   */
  getFlag<T>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string,
    schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
  ): Result<T | null, FoundryError>;

  /**
   * Sets a flag value on a document.
   * @param document - The Foundry document
   * @param scope - The scope/namespace for the flag (usually the module ID)
   * @param key - The flag key
   * @param value - The value to set
   * @returns Result indicating success or a FoundryError
   */
  setFlag<T = unknown>(
    document: { setFlag: (scope: string, key: string, value: T) => Promise<unknown> },
    scope: string,
    key: string,
    value: T
  ): Promise<Result<void, FoundryError>>;
}
