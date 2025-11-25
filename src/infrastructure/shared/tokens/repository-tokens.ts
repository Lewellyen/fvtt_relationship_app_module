import type { InjectionToken } from "@/infrastructure/di/types/core/injectiontoken";
import { createInjectionToken } from "@/infrastructure/di/tokenutilities";
import type { JournalRepository } from "@/domain/ports/repositories/journal-repository.interface";

/**
 * Injection token for JournalRepository.
 *
 * Provides full CRUD access to journal entries with batch operations and flag management.
 * Platform-agnostic interface for managing journal entries.
 *
 * @example
 * ```typescript
 * const repository = container.resolve(journalRepositoryToken);
 * const result = await repository.create({ name: "New Journal" });
 * if (result.ok) {
 *   console.log(`Created journal: ${result.value.id}`);
 * }
 * ```
 */
export const journalRepositoryToken: InjectionToken<JournalRepository> =
  createInjectionToken<JournalRepository>("JournalRepository");
