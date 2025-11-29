import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import { journalCollectionPortToken, journalRepositoryToken } from "@/infrastructure/shared/tokens";
import { DIFoundryJournalCollectionAdapter } from "@/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter";
import { DIFoundryJournalRepositoryAdapter } from "@/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter";

/**
 * Registers entity collection and repository ports.
 *
 * Services registered:
 * - JournalCollectionPort (singleton) - Read-only access to journal collections
 * - JournalRepository (singleton) - Full CRUD access to journal entries
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerEntityPorts(container: ServiceContainer): Result<void, string> {
  // Register JournalCollectionPort
  const collectionResult = container.registerClass(
    journalCollectionPortToken,
    DIFoundryJournalCollectionAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(collectionResult)) {
    return err(`Failed to register JournalCollectionPort: ${collectionResult.error.message}`);
  }

  // Register JournalRepository
  const repositoryResult = container.registerClass(
    journalRepositoryToken,
    DIFoundryJournalRepositoryAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(repositoryResult)) {
    return err(`Failed to register JournalRepository: ${repositoryResult.error.message}`);
  }

  return ok(undefined);
}
