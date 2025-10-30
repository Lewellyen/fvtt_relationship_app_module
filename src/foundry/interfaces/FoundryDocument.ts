import type { Result } from "@/types/result";

/**
 * Interface for Foundry document operations.
 * Abstracts flag access and document manipulation.
 */
export interface FoundryDocument {
  /**
   * Gets a flag value from a document.
   * @param document - The Foundry document (e.g., JournalEntry)
   * @param scope - The scope/namespace for the flag (usually the module ID)
   * @param key - The flag key
   * @returns Result containing the flag value or null, or an error message
   */
  getFlag<T = unknown>(
    document: { getFlag: (scope: string, key: string) => unknown },
    scope: string,
    key: string
  ): Result<T | null, string>;

  /**
   * Sets a flag value on a document.
   * @param document - The Foundry document
   * @param scope - The scope/namespace for the flag (usually the module ID)
   * @param key - The flag key
   * @param value - The value to set
   * @returns Result indicating success or failure
   */
  setFlag<T = unknown>(
    document: { setFlag: (scope: string, key: string, value: T) => Promise<unknown> },
    scope: string,
    key: string,
    value: T
  ): Promise<Result<void, string>>;
}

