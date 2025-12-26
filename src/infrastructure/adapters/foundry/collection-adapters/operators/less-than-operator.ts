import type { FilterOperator } from "../filter-operator.interface";

/**
 * Less than operator: numeric comparison.
 */
export class LessThanOperator implements FilterOperator {
  readonly name = "lessThan";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    return Number(fieldValue) < Number(filterValue);
  }
}
