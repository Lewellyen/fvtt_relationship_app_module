/**
 * Search query for entity collections.
 *
 * Supports filtering, sorting, and pagination.
 *
 * @template TEntity - The entity type being queried
 */
export interface EntitySearchQuery<TEntity> {
  /**
   * Filter conditions.
   * Filters can be combined with AND or OR logic using filter groups.
   *
   * @example
   * ```typescript
   * // Simple AND filters
   * filters: [
   *   { field: "name", operator: "contains", value: "Quest" },
   *   { field: "type", operator: "equals", value: "journal" }
   * ]
   *
   * // OR groups
   * filterGroups: [
   *   { logic: "AND", filters: [...] },  // AND-Gruppe
   *   { logic: "OR", filters: [...] }    // OR-Gruppe
   * ]
   * ```
   */
  filters?: Array<EntityFilter<TEntity>>;

  /**
   * Filter groups for complex AND/OR logic.
   * Groups are combined with AND logic by default.
   *
   * @example
   * ```typescript
   * // (name contains "Quest" OR name contains "Item") AND type equals "journal"
   * filterGroups: [
   *   {
   *     logic: "OR",
   *     filters: [
   *       { field: "name", operator: "contains", value: "Quest" },
   *       { field: "name", operator: "contains", value: "Item" }
   *     ]
   *   },
   *   {
   *     logic: "AND",
   *     filters: [
   *       { field: "type", operator: "equals", value: "journal" }
   *     ]
   *   }
   * ]
   * ```
   */
  filterGroups?: Array<EntityFilterGroup<TEntity>>;

  /**
   * Maximum number of results to return.
   * If not specified, returns all matching results.
   */
  limit?: number;

  /**
   * Number of results to skip (for pagination).
   * Used together with limit for pagination.
   */
  offset?: number;

  /**
   * Field to sort by.
   * Must be a key of TEntity.
   */
  sortBy?: keyof TEntity;

  /**
   * Sort order.
   */
  sortOrder?: "asc" | "desc";
}

/**
 * Filter condition for entity search.
 */
export interface EntityFilter<TEntity> {
  /**
   * Field to filter on.
   * Must be a key of TEntity.
   */
  field: keyof TEntity;

  /**
   * Comparison operator.
   */
  operator:
    | "equals" // Exact match
    | "notEquals" // Not equal
    | "contains" // String contains (case-insensitive)
    | "startsWith" // String starts with
    | "endsWith" // String ends with
    | "in" // Value in array
    | "notIn" // Value not in array
    | "greaterThan" // Numeric/Date greater than
    | "lessThan" // Numeric/Date less than
    | "greaterThanOrEqual"
    | "lessThanOrEqual";

  /**
   * Value to compare against.
   * Type depends on field type and operator.
   */
  value: unknown;
}

/**
 * Filter group for complex AND/OR logic.
 */
export interface EntityFilterGroup<TEntity> {
  /**
   * Logic operator for combining filters in this group.
   */
  logic: "AND" | "OR";

  /**
   * Filters in this group.
   */
  filters: Array<EntityFilter<TEntity>>;
}
