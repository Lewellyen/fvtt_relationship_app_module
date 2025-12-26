import type { FilterOperator } from "../filter-operator.interface";

/**
 * Greater than operator: numeric comparison.
 */
export class GreaterThanOperator implements FilterOperator {
  readonly name = "greaterThan";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    return Number(fieldValue) > Number(filterValue);
  }
}
