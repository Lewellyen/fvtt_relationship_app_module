import { describe, it, expect, beforeEach } from "vitest";
import { DefaultWindowStateInitializer } from "../default-window-state-initializer";

describe("DefaultWindowStateInitializer", () => {
  let initializer: DefaultWindowStateInitializer;

  beforeEach(() => {
    initializer = new DefaultWindowStateInitializer();
  });

  describe("buildInitialState", () => {
    it("should return default state with journals, isLoading, and error", () => {
      const state = initializer.buildInitialState("test-window");

      expect(state).toEqual({
        journals: [],
        isLoading: false,
        error: null,
      });
    });

    it("should return same state structure for any definitionId", () => {
      const state1 = initializer.buildInitialState("window-1");
      const state2 = initializer.buildInitialState("window-2");
      const state3 = initializer.buildInitialState("journal-overview");

      expect(state1).toEqual(state2);
      expect(state1).toEqual(state3);
      expect(state1).toEqual({
        journals: [],
        isLoading: false,
        error: null,
      });
    });

    it("should return new object instance on each call", () => {
      const state1 = initializer.buildInitialState("test");
      const state2 = initializer.buildInitialState("test");

      expect(state1).toEqual(state2);
      expect(state1).not.toBe(state2);
    });
  });
});
