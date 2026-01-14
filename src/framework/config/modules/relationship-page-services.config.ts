/**
 * Service registration for relationship page adapters.
 *
 * Registers:
 * - RelationshipPageRepositoryAdapter (singleton)
 * - RelationshipPageCollectionAdapter (singleton)
 */

import type { ServiceContainer } from "@/infrastructure/di/container";
import type { Result } from "@/domain/types/result";
import { ok, err, isErr } from "@/domain/utils/result";
import { ServiceLifecycle } from "@/infrastructure/di/types/core/servicelifecycle";
import {
  platformRelationshipPageRepositoryPortToken,
  platformPageCreationPortToken,
} from "@/application/tokens/domain-ports.tokens";
import { relationshipPageCollectionAdapterToken } from "@/infrastructure/shared/tokens/foundry/relationship-page-collection-adapter.token";
import { DIRelationshipPageRepositoryAdapter } from "@/infrastructure/adapters/foundry/repository-adapters/foundry-relationship-page-repository-adapter";
import { DIRelationshipPageCollectionAdapter } from "@/infrastructure/adapters/foundry/collection-adapters/foundry-relationship-page-collection-adapter";
import { DIFoundryPageCreationAdapter } from "@/infrastructure/adapters/foundry/repository-adapters/foundry-page-creation-adapter";

/**
 * Registers relationship page adapter services.
 *
 * Services registered:
 * - RelationshipPageRepositoryAdapter (singleton) - Load/save page content and manage flags
 * - RelationshipPageCollectionAdapter (singleton) - Query operations for finding pages
 *
 * All services use port-based adapter pattern for Foundry version compatibility.
 *
 * @param container - The service container to register services in
 * @returns Result indicating success or error with details
 */
export function registerRelationshipPageServices(
  container: ServiceContainer
): Result<void, string> {
  // Register RelationshipPageRepositoryAdapter
  const repositoryResult = container.registerClass(
    platformRelationshipPageRepositoryPortToken,
    DIRelationshipPageRepositoryAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(repositoryResult)) {
    return err(
      `Failed to register RelationshipPageRepositoryAdapter: ${repositoryResult.error.message}`
    );
  }

  // Register RelationshipPageCollectionAdapter
  const collectionResult = container.registerClass(
    relationshipPageCollectionAdapterToken,
    DIRelationshipPageCollectionAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(collectionResult)) {
    return err(
      `Failed to register RelationshipPageCollectionAdapter: ${collectionResult.error.message}`
    );
  }

  // Register FoundryPageCreationAdapter
  const pageCreationResult = container.registerClass(
    platformPageCreationPortToken,
    DIFoundryPageCreationAdapter,
    ServiceLifecycle.SINGLETON
  );
  if (isErr(pageCreationResult)) {
    return err(
      `Failed to register FoundryPageCreationAdapter: ${pageCreationResult.error.message}`
    );
  }

  return ok(undefined);
}

// Self-register this module's dependency registration step
import { registerDependencyStep } from "@/framework/config/dependency-registry";
registerDependencyStep({
  name: "RelationshipPageServices",
  priority: 85, // After FoundryServices (80) since we depend on FoundryGame/FoundryDocument
  execute: registerRelationshipPageServices,
});
