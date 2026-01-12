/**
 * Injection token for RelationshipPageCollectionAdapter.
 *
 * Uses type-only import to prevent circular dependencies while maintaining type safety.
 * TypeScript removes type imports at compile time, so they don't create runtime dependencies.
 */
import { createInjectionToken } from "@/infrastructure/di/token-factory";
import type { RelationshipPageCollectionAdapter } from "@/infrastructure/adapters/foundry/collection-adapters/relationship-page-collection-adapter.interface";

/**
 * Injection token for RelationshipPageCollectionAdapter.
 *
 * Collection adapter that provides query operations for finding relationship pages
 * by type or journal entry.
 *
 * @example
 * ```typescript
 * const collection = container.resolve(relationshipPageCollectionAdapterToken);
 * const nodePages = await collection.findNodePages();
 * if (nodePages.ok) {
 *   // Use nodePages.value
 * }
 * ```
 */
export const relationshipPageCollectionAdapterToken =
  createInjectionToken<RelationshipPageCollectionAdapter>("RelationshipPageCollectionAdapter");
