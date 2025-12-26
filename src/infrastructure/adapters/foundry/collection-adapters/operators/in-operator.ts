import type { FilterOperator } from "../filter-operator.interface";

/**
 * In operator: checks if field value is in the filter array.
 */
export class InOperator implements FilterOperator {
  readonly name = "in";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    if (!Array.isArray(filterValue)) {
      return false;
    }
    const filterArray: unknown[] = filterValue;
    return filterArray.includes(fieldValue);
  }
}
