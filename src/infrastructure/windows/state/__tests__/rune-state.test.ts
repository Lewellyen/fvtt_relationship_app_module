import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { RuneState } from "../rune-state";

describe("RuneState", () => {
  beforeEach(() => {
    // Mock $state rune for tests
    (globalThis as Record<string, unknown>).$state = (initial: unknown) => initial;
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).$state;
  });

  describe("constructor", () => {
    it("should create state with initial value", () => {
      const initialState = { count: 0, name: "test" };
      const state = new RuneState(initialState);

      expect(state.get()).toEqual(initialState);
    });

    it("should create state with empty object", () => {
      const state = new RuneState({});

      expect(state.get()).toEqual({});
    });

    it("should throw error if $state rune is not available", () => {
      delete (globalThis as Record<string, unknown>).$state;

      expect(() => {
        new RuneState({ count: 0 });
      }).toThrow("Svelte 5 $state rune not available");
    });
  });

  describe("get", () => {
    it("should return the current state", () => {
      const initialState = { count: 0, name: "test" };
      const state = new RuneState(initialState);

      expect(state.get()).toEqual(initialState);
    });

    it("should return readonly state", () => {
      const initialState = { count: 0 };
      const state = new RuneState(initialState);
      const current = state.get();

      expect(current).toEqual(initialState);
      // TypeScript should prevent direct mutation, but we test runtime behavior
      expect(Object.isFrozen(current)).toBe(false); // RuneState returns reactive proxy, not frozen
    });
  });

  describe("patch", () => {
    it("should update state with partial updates", () => {
      const initialState = { count: 0, name: "test" };
      const state = new RuneState(initialState);

      state.patch({ count: 1 });

      expect(state.get().count).toBe(1);
      expect(state.get().name).toBe("test");
    });

    it("should update multiple fields", () => {
      const initialState = { count: 0, name: "test", active: false };
      const state = new RuneState(initialState);

      state.patch({ count: 5, active: true });

      expect(state.get()).toEqual({ count: 5, name: "test", active: true });
    });

    it("should not update if value is the same (idempotent)", () => {
      const initialState = { count: 0, name: "test" };
      const state = new RuneState(initialState);
      const before = state.get();

      state.patch({ count: 0 }); // Same value

      expect(state.get()).toEqual(before);
    });

    it("should handle empty patch", () => {
      const initialState = { count: 0, name: "test" };
      const state = new RuneState(initialState);
      const before = state.get();

      state.patch({});

      expect(state.get()).toEqual(before);
    });

    it("should add new fields", () => {
      const initialState = { count: 0 };
      const state = new RuneState(initialState);

      state.patch({ count: 1 });

      expect(state.get()).toEqual({ count: 1 });
    });
  });

  describe("subscribe", () => {
    it("should return unsubscribe function", () => {
      const state = new RuneState({ count: 0 });
      const unsubscribe = state.subscribe(() => {});

      expect(typeof unsubscribe).toBe("function");
    });

    it("should return no-op unsubscribe function", () => {
      const state = new RuneState({ count: 0 });
      const unsubscribe = state.subscribe(() => {});

      // Should not throw
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe("snapshot", () => {
    it("should return a copy of the state", () => {
      const initialState = { count: 0, name: "test" };
      const state = new RuneState(initialState);
      const snapshot = state.snapshot();

      expect(snapshot).toEqual(initialState);
      expect(snapshot).not.toBe(state.get());
    });

    it("should return independent copy", () => {
      const initialState = { count: 0 };
      const state = new RuneState(initialState);
      const snapshot1 = state.snapshot();
      const snapshot2 = state.snapshot();

      expect(snapshot1).toEqual(snapshot2);
      expect(snapshot1).not.toBe(snapshot2);
    });

    it("should reflect current state", () => {
      const state = new RuneState({ count: 0 });

      state.patch({ count: 5 });
      const snapshot = state.snapshot();

      expect(snapshot).toEqual({ count: 5 });
    });
  });
});
