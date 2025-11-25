import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { JournalCollectionPort } from "@/domain/ports/collections/journal-collection-port.interface";

/**
 * Injection token for JournalCollectionPort.
 *
 * Provides read-only access to journal entry collections.
 * Platform-agnostic interface for querying journal entries.
 *
 * @example
 * ```typescript
 * const collection = container.resolve(journalCollectionPortToken);
 * const journals = collection.getAll();
 * if (journals.ok) {
 *   console.log(`Found ${journals.value.length} journals`);
 * }
 * ```
 */
export const journalCollectionPortToken: InjectionToken<JournalCollectionPort> =
  createInjectionToken<JournalCollectionPort>("JournalCollectionPort");
