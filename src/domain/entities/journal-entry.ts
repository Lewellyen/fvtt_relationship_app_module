/**
 * Domain model for journal entry.
 * Platform-agnostic representation of a journal entry.
 */
export interface JournalEntry {
  readonly id: string;
  readonly name: string | null;
}

/**
 * Domain error for journal visibility operations.
 */
export type JournalVisibilityError =
  | { code: "ENTRY_NOT_FOUND"; entryId: string; message: string }
  | { code: "FLAG_READ_FAILED"; entryId: string; message: string }
  | { code: "DOM_MANIPULATION_FAILED"; entryId: string; message: string }
  | { code: "INVALID_ENTRY_DATA"; message: string };
