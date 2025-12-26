import type { FilterOperator } from "../filter-operator.interface";

/**
 * Starts with operator: case-insensitive prefix match.
 */
export class StartsWithOperator implements FilterOperator {
  readonly name = "startsWith";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    return String(fieldValue).toLowerCase().startsWith(String(filterValue).toLowerCase());
  }
}
