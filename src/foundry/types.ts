/**
 * Type definitions for Foundry VTT entities used in the abstraction layer.
 * These types serve as wrappers around Foundry's native types.
 * Using any here to avoid dependency on specific Foundry type definitions
 * which may change across versions - the abstraction layer provides type safety.
 */

/**
 * Wrapper type for Foundry JournalEntry.
 * Provides a stable interface across Foundry versions.
 * Using any to avoid dependency on specific Foundry type definitions.
 */
export type FoundryJournalEntry = any;

/**
 * Hook callback type for Foundry hooks.
 */
export type FoundryHookCallback = (...args: unknown[]) => void | Promise<void>;
