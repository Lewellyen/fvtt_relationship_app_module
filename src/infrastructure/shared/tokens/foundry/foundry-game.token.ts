/**
 * Injection token for FoundryGame port.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryGamePort } from "@/infrastructure/adapters/foundry/services/FoundryGamePort";

/**
 * Injection token for FoundryGame port.
 *
 * Provides access to Foundry's game API, specifically journal entries.
 * Automatically selects version-appropriate port implementation.
 *
 * @example
 * ```typescript
 * const game = container.resolve(foundryGameToken);
 * const entries = game.getJournalEntries();
 * if (entries.ok) {
 *   console.log(`Found ${entries.value.length} journal entries`);
 * }
 * ```
 */
export const foundryGameToken = createInjectionToken<FoundryGamePort>("FoundryGame");
