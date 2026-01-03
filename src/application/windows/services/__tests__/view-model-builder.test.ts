import { describe, it, expect, beforeEach, vi } from "vitest";
import { ViewModelBuilder } from "../view-model-builder";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { IWindowState } from "@/domain/windows/types/view-model.interface";

describe("ViewModelBuilder", () => {
  let builder: ViewModelBuilder;
  let mockState: IWindowState<Record<string, unknown>>;
  let mockDefinition: WindowDefinition;

  beforeEach(() => {
    builder = new ViewModelBuilder();
    mockState = {
      get: vi.fn().mockReturnValue({ count: 0 }),
      patch: vi.fn(),
      subscribe: vi.fn(() => () => {}),
    };

    mockDefinition = {
      definitionId: "test-window",
      title: "Test Window",
      component: {
        type: "svelte",
        component: vi.fn(),
        props: {},
      },
    };
  });

  describe("build", () => {
    it("should build view model with state, computed, and actions", () => {
      const actions = {
        increment: vi.fn(),
        decrement: vi.fn(),
      };

      const viewModel = builder.build(mockDefinition, mockState, actions);

      expect(viewModel.state).toBe(mockState);
      expect(viewModel.computed).toEqual({});
      expect(viewModel.actions).toBe(actions);
    });

    it("should return empty computed object", () => {
      const actions = {};

      const viewModel = builder.build(mockDefinition, mockState, actions);

      expect(viewModel.computed).toEqual({});
      expect(typeof viewModel.computed).toBe("object");
    });

    it("should preserve state reference", () => {
      const actions = {};

      const viewModel = builder.build(mockDefinition, mockState, actions);

      expect(viewModel.state).toBe(mockState);
      expect(viewModel.state.get()).toEqual({ count: 0 });
    });

    it("should preserve actions reference", () => {
      const actions = {
        testAction: vi.fn(),
      };

      const viewModel = builder.build(mockDefinition, mockState, actions);

      expect(viewModel.actions).toBe(actions);
      expect(viewModel.actions.testAction).toBe(actions.testAction);
    });

    it("should handle empty actions", () => {
      const actions = {};

      const viewModel = builder.build(mockDefinition, mockState, actions);

      expect(viewModel.actions).toEqual({});
    });
  });
});
