import type { FilterOperator } from "../filter-operator.interface";

/**
 * Contains operator: case-insensitive substring match.
 */
export class ContainsOperator implements FilterOperator {
  readonly name = "contains";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    return String(fieldValue).toLowerCase().includes(String(filterValue).toLowerCase());
  }
}
