import type { Result } from "@/domain/types/result";
import type { FoundryError } from "../errors/FoundryErrors";
import type { Disposable } from "@/infrastructure/di/interfaces";
import type { UuidComponents } from "../api/foundry-api.interface";

/**
 * Interface for Foundry's UUID and document resolution utilities.
 *
 * Wraps Foundry VTT's `foundry.utils.*` UUID functions to enable:
 * - Port-based abstraction for testability
 * - Result-pattern instead of exceptions
 * - Type-safe error handling
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 *
 * @see https://foundryvtt.com/api/modules/foundry.utils.html
 */
export interface FoundryUtilsUuidPort extends Disposable {
  /**
   * Generate a random ID string.
   *
   * Uses Foundry's randomID() function which generates a unique identifier.
   * This function never fails, so it returns a string directly (no Result).
   *
   * @returns Random ID string
   *
   * @example
   * ```typescript
   * const id = utils.randomID();
   * console.log(id); // "abc123xyz"
   * ```
   */
  randomID(): string;

  /**
   * Resolve a Foundry UUID to a document asynchronously.
   *
   * @param uuid - Foundry UUID string (e.g., "JournalEntry.abc123")
   * @returns Result with resolved document or null if not found, or error
   *
   * @example
   * ```typescript
   * const result = await utils.fromUuid("JournalEntry.abc123");
   * if (result.ok && result.value) {
   *   console.log("Found document:", result.value);
   * }
   * ```
   */
  fromUuid(uuid: string): Promise<Result<unknown | null, FoundryError>>;

  /**
   * Resolve a Foundry UUID to a document synchronously.
   *
   * @param uuid - Foundry UUID string
   * @returns Result with resolved document or null if not found, or error
   *
   * @example
   * ```typescript
   * const result = utils.fromUuidSync("JournalEntry.abc123");
   * if (result.ok && result.value) {
   *   console.log("Found document:", result.value);
   * }
   * ```
   */
  fromUuidSync(uuid: string): Result<unknown | null, FoundryError>;

  /**
   * Parse a Foundry UUID into its components.
   *
   * @param uuid - Foundry UUID string
   * @returns Result with parsed UUID components or error
   *
   * @example
   * ```typescript
   * const result = utils.parseUuid("JournalEntry.abc123");
   * if (result.ok) {
   *   console.log(result.value.type); // "JournalEntry"
   *   console.log(result.value.documentId); // "abc123"
   * }
   * ```
   */
  parseUuid(uuid: string): Result<UuidComponents, FoundryError>;

  /**
   * Build a Foundry UUID from components.
   *
   * @param type - Document type (e.g., "JournalEntry")
   * @param documentName - Document name/collection
   * @param documentId - Document ID
   * @param pack - Optional pack name
   * @returns Result with built UUID string or error
   *
   * @example
   * ```typescript
   * const result = utils.buildUuid("JournalEntry", "JournalEntry", "abc123");
   * if (result.ok) {
   *   console.log(result.value); // "JournalEntry.abc123"
   * }
   * ```
   */
  buildUuid(
    type: string,
    documentName: string,
    documentId: string,
    pack?: string
  ): Result<string, FoundryError>;
}
