/**
 * Type definitions for Foundry VTT entities used in the abstraction layer.
 * These types serve as wrappers around Foundry's native types.
 * Using any here to avoid dependency on specific Foundry type definitions
 * which may change across versions - the abstraction layer provides type safety.
 */

/**
 * Foundry Journal Entry document from the database.
 * 
 * Uses official fvtt-types for full type safety while maintaining
 * version independence through Foundry's type system.
 * 
 * JournalEntry.Stored represents a journal entry that has been persisted
 * to the database and retrieved, providing access to all document properties
 * including id, name, pages, flags, and methods like getFlag().
 * 
 * @see {@link https://github.com/League-of-Foundry-Developers/foundry-vtt-types}
 */
export type FoundryJournalEntry = JournalEntry.Stored;

/**
 * Hook callback type for Foundry hooks.
 */
export type FoundryHookCallback = (...args: unknown[]) => void | Promise<void>;
