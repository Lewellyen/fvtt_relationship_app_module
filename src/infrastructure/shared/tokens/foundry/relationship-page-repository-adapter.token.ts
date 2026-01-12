/**
 * Injection token for RelationshipPageRepositoryAdapter.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { RelationshipPageRepositoryAdapter } from "@/infrastructure/adapters/foundry/repository-adapters/relationship-page-repository-adapter.interface";

/**
 * Injection token for RelationshipPageRepositoryAdapter.
 *
 * Repository adapter that provides operations for loading and saving relationship
 * node and graph page content, as well as managing marker flags.
 *
 * @example
 * ```typescript
 * const repository = container.resolve(relationshipPageRepositoryAdapterToken);
 * const nodeData = await repository.getNodePageContent(pageId);
 * if (nodeData.ok) {
 *   // Use nodeData.value
 * }
 * ```
 */
export const relationshipPageRepositoryAdapterToken =
  createInjectionToken<RelationshipPageRepositoryAdapter>("RelationshipPageRepositoryAdapter");
