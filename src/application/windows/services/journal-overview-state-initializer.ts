import type { IWindowStateInitializer } from "../ports/window-state-initializer-port.interface";

/**
 * JournalOverviewStateInitializer - Spezialisierte State-Initialisierung für journal-overview
 *
 * Verantwortlichkeit: Liefert initialen State mit Filter/Sort-Properties für journal-overview.
 */
export class JournalOverviewStateInitializer implements IWindowStateInitializer {
  buildInitialState(definitionId: string): Record<string, unknown> {
    if (definitionId !== "journal-overview") {
      throw new Error(
        `JournalOverviewStateInitializer can only handle "journal-overview" definition, got: ${definitionId}`
      );
    }

    return {
      journals: [],
      isLoading: false,
      error: null,
      sortColumn: null,
      sortDirection: "asc",
      columnFilters: {},
      globalSearch: "",
      filteredJournals: [],
    };
  }
}
