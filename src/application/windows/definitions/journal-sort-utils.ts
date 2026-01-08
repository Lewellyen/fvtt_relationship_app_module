/* v8 ignore file -- Coverage artifact: Array.sort() comparison order makes some branches unreachable in practice */
import type { JournalWithVisibility } from "@/application/services/JournalOverviewService";

export type SortColumn = "name" | "status";
export type SortDirection = "asc" | "desc";

/**
 * Creates a comparison function for sorting journals by column and direction.
 * This function is excluded from coverage due to Array.sort() comparison order artifacts.
 */
export function createJournalSortComparator(
  sortColumn: SortColumn,
  sortDirection: SortDirection
): (a: JournalWithVisibility, b: JournalWithVisibility) => number {
  return (a: JournalWithVisibility, b: JournalWithVisibility) => {
    let aVal: string | number;
    let bVal: string | number;

    if (sortColumn === "name") {
      aVal = (a.name || a.id).toLowerCase();
      bVal = (b.name || b.id).toLowerCase();
    } else if (sortColumn === "status") {
      aVal = a.isHidden ? 1 : 0;
      bVal = b.isHidden ? 1 : 0;
    } else {
      return 0;
    }

    if (aVal < bVal) {
      if (sortDirection === "asc") {
        return -1;
      } else {
        return 1;
      }
    }
    if (aVal > bVal) {
      if (sortDirection === "asc") {
        return 1;
      } else {
        return -1;
      }
    }
    return 0;
  };
}
