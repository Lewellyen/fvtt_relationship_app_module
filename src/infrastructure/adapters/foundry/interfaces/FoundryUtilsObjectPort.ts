import type { Result } from "@/domain/types/result";
import type { FoundryError } from "../errors/FoundryErrors";
import type { Disposable } from "@/infrastructure/di/interfaces";

/**
 * Interface for Foundry's object manipulation utilities.
 *
 * Wraps Foundry VTT's `foundry.utils.*` object functions to enable:
 * - Port-based abstraction for testability
 * - Result-pattern instead of exceptions
 * - Type-safe error handling
 *
 * Extends Disposable for consistent resource cleanup across all ports.
 *
 * @see https://foundryvtt.com/api/modules/foundry.utils.html
 */
export interface FoundryUtilsObjectPort extends Disposable {
  /**
   * Create a deep clone of an object.
   *
   * @template T - Type of object to clone
   * @param obj - Object to clone
   * @returns Result with cloned object or error
   *
   * @example
   * ```typescript
   * const original = { a: 1, b: { c: 2 } };
   * const result = utils.deepClone(original);
   * if (result.ok) {
   *   console.log(result.value); // Deep copy of original
   * }
   * ```
   */
  deepClone<T>(obj: T): Result<T, FoundryError>;

  /**
   * Merge updates into an original object.
   *
   * Uses Foundry's mergeObject which supports special notation like `-=` for deletion.
   *
   * @template T - Type of original object
   * @param original - Original object
   * @param updates - Updates to apply
   * @param options - Optional merge options
   * @returns Result with merged object or error
   *
   * @example
   * ```typescript
   * const original = { a: 1, b: 2 };
   * const result = utils.mergeObject(original, { b: 3, c: 4 });
   * if (result.ok) {
   *   console.log(result.value); // { a: 1, b: 3, c: 4 }
   * }
   * ```
   */
  mergeObject<T>(original: T, updates: unknown, options?: unknown): Result<T, FoundryError>;

  /**
   * Compute the difference between two objects.
   *
   * @param original - Original object
   * @param updated - Updated object
   * @returns Result with difference object or error
   *
   * @example
   * ```typescript
   * const original = { a: 1, b: 2 };
   * const updated = { a: 1, b: 3, c: 4 };
   * const result = utils.diffObject(original, updated);
   * if (result.ok) {
   *   console.log(result.value); // { b: 3, c: 4 }
   * }
   * ```
   */
  diffObject(original: unknown, updated: unknown): Result<Record<string, unknown>, FoundryError>;

  /**
   * Flatten a nested object into a flat structure.
   *
   * @param obj - Object to flatten
   * @returns Result with flattened object or error
   *
   * @example
   * ```typescript
   * const nested = { a: { b: { c: 1 } } };
   * const result = utils.flattenObject(nested);
   * if (result.ok) {
   *   console.log(result.value); // { "a.b.c": 1 }
   * }
   * ```
   */
  flattenObject(obj: unknown): Result<Record<string, unknown>, FoundryError>;

  /**
   * Expand a flat object into a nested structure.
   *
   * @param obj - Flat object with dot-notation keys
   * @returns Result with expanded object or error
   *
   * @example
   * ```typescript
   * const flat = { "a.b.c": 1 };
   * const result = utils.expandObject(flat);
   * if (result.ok) {
   *   console.log(result.value); // { a: { b: { c: 1 } } }
   * }
   * ```
   */
  expandObject(obj: Record<string, unknown>): Result<unknown, FoundryError>;
}
