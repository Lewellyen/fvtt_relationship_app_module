import { describe, it, expect, beforeEach } from "vitest";
import { RuneStateFactory } from "../rune-state-factory";
import { RuneState } from "../rune-state";

describe("RuneStateFactory", () => {
  let factory: RuneStateFactory;

  beforeEach(() => {
    factory = new RuneStateFactory();
  });

  describe("create", () => {
    it("should create a RuneState instance", () => {
      const initialState = { count: 0, name: "test" };
      const state = factory.create("instance-1", initialState);

      expect(state).toBeInstanceOf(RuneState);
      expect(state.get()).toEqual(initialState);
    });

    it("should create independent state instances for different instanceIds", () => {
      const initialState1 = { count: 0 };
      const initialState2 = { count: 10 };

      const state1 = factory.create("instance-1", initialState1);
      const state2 = factory.create("instance-2", initialState2);

      expect(state1.get()).toEqual(initialState1);
      expect(state2.get()).toEqual(initialState2);
      expect(state1.get()).not.toBe(state2.get());
    });

    it("should create state with empty object", () => {
      const state = factory.create("instance-1", {});

      expect(state.get()).toEqual({});
    });

    it("should create state with nested objects", () => {
      const initialState = {
        user: {
          name: "John",
          age: 30,
        },
        settings: {
          theme: "dark",
        },
      };

      const state = factory.create("instance-1", initialState);

      expect(state.get()).toEqual(initialState);
    });
  });
});
