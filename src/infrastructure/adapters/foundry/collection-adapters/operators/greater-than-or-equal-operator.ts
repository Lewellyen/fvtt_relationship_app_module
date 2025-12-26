import type { FilterOperator } from "../filter-operator.interface";

/**
 * Greater than or equal operator: numeric comparison.
 */
export class GreaterThanOrEqualOperator implements FilterOperator {
  readonly name = "greaterThanOrEqual";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    return Number(fieldValue) >= Number(filterValue);
  }
}
