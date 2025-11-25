import type { Result } from "@/domain/types/result";
import type { EntityCollectionError } from "./platform-entity-collection-port.interface";

/**
 * Fluent query builder for entity collections.
 *
 * Provides a chainable API for building complex queries.
 *
 * @template TEntity - The entity type being queried
 */
export interface EntityQueryBuilder<TEntity> {
  /**
   * Add a filter condition.
   *
   * Multiple where() calls are combined with AND logic.
   *
   * @param field - Field to filter on
   * @param operator - Comparison operator
   * @param value - Value to compare against
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * query()
   *   .where("name", "contains", "Quest")
   *   .where("type", "equals", "journal")
   *   // Equivalent to: name contains "Quest" AND type equals "journal"
   * ```
   */
  where(field: keyof TEntity, operator: string, value: unknown): EntityQueryBuilder<TEntity>;

  /**
   * Add an OR filter condition.
   *
   * Multiple orWhere() calls are combined with OR logic.
   * All orWhere() conditions are grouped together and combined with AND
   * to the previous where() conditions.
   *
   * @param field - Field to filter on
   * @param operator - Comparison operator
   * @param value - Value to compare against
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * query()
   *   .where("type", "equals", "journal")
   *   .orWhere("name", "contains", "Quest")
   *   .orWhere("name", "contains", "Item")
   *   // Equivalent to: type equals "journal" AND (name contains "Quest" OR name contains "Item")
   * ```
   */
  orWhere(field: keyof TEntity, operator: string, value: unknown): EntityQueryBuilder<TEntity>;

  /**
   * Group multiple conditions with OR logic.
   *
   * All conditions added inside the callback are combined with OR.
   * The entire group is combined with AND to previous conditions.
   *
   * @param callback - Function that adds conditions to the OR group
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * query()
   *   .where("type", "equals", "journal")
   *   .or((qb) => {
   *     qb.where("name", "contains", "Quest")
   *       .where("name", "contains", "Item")
   *   })
   *   // Equivalent to: type equals "journal" AND (name contains "Quest" OR name contains "Item")
   * ```
   */
  or(callback: (qb: EntityQueryBuilder<TEntity>) => void): EntityQueryBuilder<TEntity>;

  /**
   * Group multiple conditions with AND logic.
   *
   * Useful for explicit grouping or when mixing with OR groups.
   *
   * @param callback - Function that adds conditions to the AND group
   * @returns Query builder for chaining
   *
   * @example
   * ```typescript
   * query()
   *   .and((qb) => {
   *     qb.where("name", "contains", "Quest")
   *       .where("type", "equals", "journal")
   *   })
   *   .or((qb) => {
   *     qb.where("name", "contains", "Item")
   *   })
   *   // Equivalent to: (name contains "Quest" AND type equals "journal") OR (name contains "Item")
   * ```
   */
  and(callback: (qb: EntityQueryBuilder<TEntity>) => void): EntityQueryBuilder<TEntity>;

  /**
   * Limit the number of results.
   *
   * @param count - Maximum number of results
   * @returns Query builder for chaining
   */
  limit(count: number): EntityQueryBuilder<TEntity>;

  /**
   * Skip a number of results (for pagination).
   *
   * @param count - Number of results to skip
   * @returns Query builder for chaining
   */
  offset(count: number): EntityQueryBuilder<TEntity>;

  /**
   * Sort results by a field.
   *
   * @param field - Field to sort by
   * @param order - Sort order
   * @returns Query builder for chaining
   */
  sortBy(field: keyof TEntity, order: "asc" | "desc"): EntityQueryBuilder<TEntity>;

  /**
   * Execute the query.
   *
   * @returns Matching entities or error
   */
  execute(): Result<TEntity[], EntityCollectionError>;
}
