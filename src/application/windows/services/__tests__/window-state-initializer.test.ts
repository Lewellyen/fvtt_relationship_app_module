import { describe, it, expect, beforeEach } from "vitest";
import { WindowStateInitializer } from "../window-state-initializer";
import { WindowDefaultStateProviderRegistry } from "../window-default-state-provider-registry";
import { JournalOverviewStateInitializer } from "../journal-overview-state-initializer";

describe("WindowStateInitializer", () => {
  let initializer: WindowStateInitializer;
  let registry: WindowDefaultStateProviderRegistry;

  beforeEach(() => {
    registry = new WindowDefaultStateProviderRegistry();
    registry.register("journal-overview", new JournalOverviewStateInitializer());
    initializer = new WindowStateInitializer(registry);
  });

  describe("buildInitialState", () => {
    it("should return journal-overview state for journal-overview definitionId", () => {
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

    it("should return default state for other definitionIds", () => {
      const state = initializer.buildInitialState("test-window");

      expect(state).toEqual({
        journals: [],
        isLoading: false,
        error: null,
      });
    });

    it("should use default initializer for generic windows", () => {
      const state1 = initializer.buildInitialState("window-1");
      const state2 = initializer.buildInitialState("window-2");

      expect(state1).toEqual({
        journals: [],
        isLoading: false,
        error: null,
      });
      expect(state2).toEqual({
        journals: [],
        isLoading: false,
        error: null,
      });
    });

    it("should use journal-overview initializer for journal-overview", () => {
      const state = initializer.buildInitialState("journal-overview");

      expect(state).toHaveProperty("sortColumn");
      expect(state).toHaveProperty("sortDirection");
      expect(state).toHaveProperty("columnFilters");
      expect(state).toHaveProperty("globalSearch");
      expect(state).toHaveProperty("filteredJournals");
    });

    it("should return new object instance on each call", () => {
      const state1 = initializer.buildInitialState("test");
      const state2 = initializer.buildInitialState("test");

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });
});
