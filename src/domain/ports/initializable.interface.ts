import type { Result } from "@/domain/types/result";

/**
 * Interface for objects that require explicit initialization.
 *
 * This interface follows the Liskov Substitution Principle (LSP) by allowing
 * any object that implements this interface to be treated uniformly, regardless
 * of its concrete type.
 *
 * @example
 * ```typescript
 * class MyService implements Initializable {
 *   initialize(): Result<void, string> {
 *     // Initialization logic
 *     return ok(undefined);
 *   }
 * }
 * ```
 */
export interface Initializable {
  /**
   * Initializes the object.
   * Must be called explicitly after construction.
   *
   * @returns Result indicating success or error
   */
  initialize(): Result<void, string>;
}
