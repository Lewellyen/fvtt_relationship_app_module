import type { Result } from "@/domain/types/result";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import type * as v from "valibot";
import type { Disposable } from "@/infrastructure/di/interfaces";

/**
 * Interface for Foundry document operations.
 * Abstracts all single-entity operations: CRUD + Flags.
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 *
 * @see https://foundryvtt.wiki/en/development/api/helpers for Foundry Helper utilities
 */
export interface FoundryDocument extends Disposable {
  // ===== CRUD Operations =====

  /**
   * Creates a new document entity.
   *
   * Uses Foundry's static create() method on document classes.
   *
   * @param documentClass - The Foundry document class (e.g., JournalEntry)
   * @param data - The data to create the document with
   * @returns Result containing the created document or a FoundryError
   *
   * @example
   * ```typescript
   * const result = await document.create(JournalEntry, { name: "New Journal" });
   * ```
   */
  create<TDocument extends { id: string }>(
    documentClass: { create: (data: unknown) => Promise<TDocument> },
    data: unknown
  ): Promise<Result<TDocument, FoundryError>>;

  /**
   * Updates a document's properties.
   *
   * Uses Foundry's update() method. For deleting properties, use the `-=` notation.
   *
   * @param document - The Foundry document instance
   * @param changes - The changes to apply (use `'property.-=': null` to delete properties)
   * @returns Result containing the updated document or a FoundryError
   *
   * @example
   * ```typescript
   * const result = await document.update(entry, { name: "Updated Name" });
   * // Delete property: { 'description.-=': null }
   * ```
   */
  update<TDocument extends { id: string }>(
    document: { update: (changes: unknown) => Promise<TDocument> },
    changes: unknown
  ): Promise<Result<TDocument, FoundryError>>;

  /**
   * Deletes a document.
   *
   * @param document - The Foundry document instance
   * @returns Result indicating success or a FoundryError
   *
   * @example
   * ```typescript
   * const result = await document.delete(entry);
   * ```
   */
  delete(document: { delete: () => Promise<unknown> }): Promise<Result<void, FoundryError>>;

  // ===== Flag Operations =====

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
   *
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

  /**
   * Unsets (removes) a flag value from a document.
   *
   * Uses Foundry's unsetFlag() method (recommended) or the equivalent
   * update({'flags.scope.-=key': null}) syntax.
   *
   * @param document - The Foundry document
   * @param scope - The scope/namespace for the flag (usually the module ID)
   * @param key - The flag key to remove
   * @returns Result indicating success or a FoundryError
   *
   * @example
   * ```typescript
   * const result = await document.unsetFlag(entry, "my-module", "hidden");
   * ```
   */
  unsetFlag(
    document: {
      unsetFlag?: (scope: string, key: string) => Promise<unknown>;
      setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
    },
    scope: string,
    key: string
  ): Promise<Result<void, FoundryError>>;
}
