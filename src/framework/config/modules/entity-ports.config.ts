import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  platformJournalCollectionPortToken,
  platformJournalRepositoryToken,
} from "@/application/tokens/domain-ports.tokens";
import { DIFoundryJournalCollectionAdapter } from "@/infrastructure/adapters/foundry/collection-adapters/foundry-journal-collection-adapter";
import { DIFoundryJournalRepositoryAdapter } from "@/infrastructure/adapters/foundry/repository-adapters/foundry-journal-repository-adapter";

/**
 * Registers entity collection and repository ports.
 *
 * Services registered:
 * - PlatformJournalCollectionPort (singleton) - Read-only access to journal collections
 * - PlatformJournalRepository (singleton) - Full CRUD access to journal entries
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerEntityPorts(container: ServiceContainer): Result<void, string> {
  // Register PlatformJournalCollectionPort
  const collectionResult = container.registerClass(
    platformJournalCollectionPortToken,
    DIFoundryJournalCollectionAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(collectionResult)) {
    return err(
      `Failed to register PlatformJournalCollectionPort: ${collectionResult.error.message}`
    );
  }

  // Register PlatformJournalRepository
  const repositoryResult = container.registerClass(
    platformJournalRepositoryToken,
    DIFoundryJournalRepositoryAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(repositoryResult)) {
    return err(`Failed to register PlatformJournalRepository: ${repositoryResult.error.message}`);
  }

  return ok(undefined);
}

// Self-register this module's dependency registration step
import { registerDependencyStep } from "@/framework/config/dependency-registry";
registerDependencyStep({
  name: "EntityPorts",
  priority: 100,
  execute: registerEntityPorts,
});
