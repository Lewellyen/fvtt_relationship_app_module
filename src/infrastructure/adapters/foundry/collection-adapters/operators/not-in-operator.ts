import type { FilterOperator } from "../filter-operator.interface";

/**
 * Not in operator: checks if field value is not in the filter array.
 */
export class NotInOperator implements FilterOperator {
  readonly name = "notIn";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    if (!Array.isArray(filterValue)) {
      return false;
    }
    const filterArray: unknown[] = filterValue;
    return !filterArray.includes(fieldValue);
  }
}
