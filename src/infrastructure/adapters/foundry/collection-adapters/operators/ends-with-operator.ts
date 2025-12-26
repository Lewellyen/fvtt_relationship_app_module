import type { FilterOperator } from "../filter-operator.interface";

/**
 * Ends with operator: case-insensitive suffix match.
 */
export class EndsWithOperator implements FilterOperator {
  readonly name = "endsWith";

  matches(fieldValue: unknown, filterValue: unknown): boolean {
    return String(fieldValue).toLowerCase().endsWith(String(filterValue).toLowerCase());
  }
}
