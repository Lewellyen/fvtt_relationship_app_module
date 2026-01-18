import type { PlatformEntityRepository } from "./platform-entity-repository.interface";
import type { JournalEntry } from "@/domain/entities/journal-entry";

/**
 * Specialized port for journal entry repository.
 *
 * Extends generic repository port with journal-specific operations (if needed).
 * Currently just type-safe wrapper around generic repository.
 */
export type PlatformJournalRepository = PlatformEntityRepository<JournalEntry>;
