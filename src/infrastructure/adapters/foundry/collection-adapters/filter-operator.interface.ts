/**
 * Interface for filter operators used in entity collection queries.
 *
 * Follows Strategy Pattern to enable extensibility (OCP-compliant).
 * New operators can be added by implementing this interface and registering with FilterOperatorRegistry.
 */
export interface FilterOperator {
  /**
   * Unique name of the operator (e.g., "equals", "contains", "greaterThan").
   */
  readonly name: string;

  /**
   * Checks if the field value matches the filter value according to this operator's logic.
   *
   * @param fieldValue - The value from the entity field to be compared
   * @param filterValue - The value from the filter to compare against
   * @returns true if the field value matches the filter according to this operator, false otherwise
   */
  matches(fieldValue: unknown, filterValue: unknown): boolean;
}
