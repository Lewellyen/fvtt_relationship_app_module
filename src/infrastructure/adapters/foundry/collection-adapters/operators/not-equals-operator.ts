import type { FilterOperator } from "../filter-operator.interface";

/**
 * Not equals operator: negated exact match comparison.
 */
export class NotEqualsOperator implements FilterOperator {
  readonly name = "notEquals";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    return fieldValue !== filterValue;
  }
}
