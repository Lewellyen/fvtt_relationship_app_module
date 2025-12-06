import type { PlatformEntityCollectionPort } from "./platform-entity-collection-port.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";

/**
 * Specialized port for journal entry collections.
 *
 * Extends generic collection port with journal-specific operations (if needed).
 * Currently just type-safe wrapper around generic port.
 *
 * @example
 * ```typescript
 * const journals = await journalCollection.getAll();
 * if (journals.ok) {
 *   console.log(`Found ${journals.value.length} journals`);
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface PlatformJournalCollectionPort extends PlatformEntityCollectionPort<JournalEntry> {
  // Aktuell keine journal-spezifischen Erweiterungen nötig
  // Bei Bedarf später hinzufügen, z.B.:
  // getByFolder(folderId: string): Result<JournalEntry[], EntityCollectionError>;
  // getByPermission(permission: Permission): Result<JournalEntry[], EntityCollectionError>;
}
