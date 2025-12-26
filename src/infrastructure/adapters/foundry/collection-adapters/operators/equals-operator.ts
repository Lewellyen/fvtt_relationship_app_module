import type { FilterOperator } from "../filter-operator.interface";

/**
 * Equals operator: exact match comparison.
 */
export class EqualsOperator implements FilterOperator {
  readonly name = "equals";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    return fieldValue === filterValue;
  }
}
