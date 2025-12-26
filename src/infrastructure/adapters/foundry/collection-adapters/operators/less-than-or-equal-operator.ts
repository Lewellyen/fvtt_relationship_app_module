import type { FilterOperator } from "../filter-operator.interface";

/**
 * Less than or equal operator: numeric comparison.
 */
export class LessThanOrEqualOperator implements FilterOperator {
  readonly name = "lessThanOrEqual";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    return Number(fieldValue) <= Number(filterValue);
  }
}
