/**
 * Injection token for FoundryJournalFacade.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { FoundryJournalFacade } from "@/infrastructure/adapters/foundry/facades/foundry-journal-facade.interface";

/**
 * Injection token for FoundryJournalFacade.
 *
 * Facade that combines FoundryGame, FoundryDocument, and FoundryUI
 * for journal-specific operations.
 *
 * **Benefits:**
 * - Reduces dependency count from 3 services to 1 facade
 * - Provides cohesive journal-specific API
 * - Easier to test and mock
 *
 * @example
 * ```typescript
 * const facade = container.resolve(foundryJournalFacadeToken);
 * const entries = facade.getJournalEntries();
 * if (entries.ok) {
 *   // Process entries
 * }
 * ```
 */
export const foundryJournalFacadeToken =
  createInjectionToken<FoundryJournalFacade>("FoundryJournalFacade");
