import { describe, it, expect, beforeEach } from "vitest";
import { JournalOverviewStateInitializer } from "../journal-overview-state-initializer";

describe("JournalOverviewStateInitializer", () => {
  let initializer: JournalOverviewStateInitializer;

  beforeEach(() => {
    initializer = new JournalOverviewStateInitializer();
  });

  describe("buildInitialState", () => {
    it("should return journal-overview state with all required properties", () => {
      const state = initializer.buildInitialState("journal-overview");

      expect(state).toEqual({
        journals: [],
        isLoading: false,
        error: null,
        sortColumn: null,
        sortDirection: "asc",
        columnFilters: {},
        globalSearch: "",
        filteredJournals: [],
      });
    });

    it("should throw error for non-journal-overview definitionId", () => {
      expect(() => {
        initializer.buildInitialState("other-window");
      }).toThrow(
        'JournalOverviewStateInitializer can only handle "journal-overview" definition, got: other-window'
      );
    });

    it("should throw error with correct message for different definitionId", () => {
      expect(() => {
        initializer.buildInitialState("test-window");
      }).toThrow(
        'JournalOverviewStateInitializer can only handle "journal-overview" definition, got: test-window'
      );
    });

    it("should return new object instance on each call", () => {
      const state1 = initializer.buildInitialState("journal-overview");
      const state2 = initializer.buildInitialState("journal-overview");

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });
});
