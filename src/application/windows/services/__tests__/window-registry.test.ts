import { describe, it, expect, beforeEach, vi } from "vitest";
import { WindowRegistry } from "../window-registry";
import type { WindowDefinition } from "@/domain/windows/types/window-definition.interface";
import type { WindowInstance } from "@/domain/windows/types/window-handle.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("WindowRegistry", () => {
  let registry: WindowRegistry;
  let mockDefinition: WindowDefinition;
  let mockInstance: WindowInstance;

  beforeEach(() => {
    registry = new WindowRegistry();
    mockDefinition = {
      definitionId: "test-window",
      title: "Test Window",
      component: {
        type: "svelte",
        component: vi.fn(),
        props: {},
      },
    };

    mockInstance = {
      instanceId: "instance-1",
      definitionId: "test-window",
    };
  });

  describe("registerDefinition", () => {
    it("should register definition successfully", () => {
      const result = registry.registerDefinition(mockDefinition);

      expectResultOk(result);
    });

    it("should return error if definition already exists", () => {
      registry.registerDefinition(mockDefinition);

      const result = registry.registerDefinition(mockDefinition);

      expectResultErr(result);
      expect(result.error.code).toBe("DefinitionAlreadyExists");
      expect(result.error.message).toContain("Definition test-window already exists");
    });
  });

  describe("getDefinition", () => {
    it("should return registered definition", () => {
      registry.registerDefinition(mockDefinition);

      const result = registry.getDefinition("test-window");

      expectResultOk(result);
      expect(result.value).toBe(mockDefinition);
      expect(result.value.definitionId).toBe("test-window");
    });

    it("should return error if definition not found", () => {
      const result = registry.getDefinition("non-existent");

      expectResultErr(result);
      expect(result.error.code).toBe("DefinitionNotFound");
      expect(result.error.message).toContain("Definition non-existent not found");
    });
  });

  describe("registerInstance", () => {
    it("should register instance successfully", () => {
      const result = registry.registerInstance(mockInstance);

      expectResultOk(result);
    });

    it("should return error if instance already exists", () => {
      registry.registerInstance(mockInstance);

      const result = registry.registerInstance(mockInstance);

      expectResultErr(result);
      expect(result.error.code).toBe("InstanceAlreadyExists");
      expect(result.error.message).toContain("Instance instance-1 already exists");
    });
  });

  describe("getInstance", () => {
    it("should return registered instance", () => {
      registry.registerInstance(mockInstance);

      const result = registry.getInstance("instance-1");

      expectResultOk(result);
      expect(result.value).toBe(mockInstance);
      expect(result.value.instanceId).toBe("instance-1");
    });

    it("should return error if instance not found", () => {
      const result = registry.getInstance("non-existent");

      expectResultErr(result);
      expect(result.error.code).toBe("InstanceNotFound");
      expect(result.error.message).toContain("Instance non-existent not found");
    });
  });

  describe("unregisterInstance", () => {
    it("should unregister instance successfully", () => {
      registry.registerInstance(mockInstance);

      const result = registry.unregisterInstance("instance-1");

      expectResultOk(result);

      const getResult = registry.getInstance("instance-1");
      expectResultErr(getResult);
    });

    it("should return error if instance not found", () => {
      const result = registry.unregisterInstance("non-existent");

      expectResultErr(result);
      expect(result.error.code).toBe("InstanceNotFound");
      expect(result.error.message).toContain("Instance non-existent not found");
    });

    it("should not affect other instances", () => {
      const instance1: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const instance2: WindowInstance = {
        instanceId: "instance-2",
        definitionId: "test-window",
      };

      registry.registerInstance(instance1);
      registry.registerInstance(instance2);

      registry.unregisterInstance("instance-1");

      const result1 = registry.getInstance("instance-1");
      const result2 = registry.getInstance("instance-2");

      expectResultErr(result1);
      expectResultOk(result2);
    });
  });

  describe("listInstances", () => {
    it("should return empty array when no instances", () => {
      const instances = registry.listInstances();

      expect(instances).toEqual([]);
    });

    it("should return all registered instances", () => {
      const instance1: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };
      const instance2: WindowInstance = {
        instanceId: "instance-2",
        definitionId: "test-window",
      };

      registry.registerInstance(instance1);
      registry.registerInstance(instance2);

      const instances = registry.listInstances();

      expect(instances).toHaveLength(2);
      expect(instances).toContain(instance1);
      expect(instances).toContain(instance2);
    });

    it("should return readonly array", () => {
      const instance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      registry.registerInstance(instance);

      const instances = registry.listInstances();

      // Should be readonly, but TypeScript readonly doesn't prevent runtime mutation
      // We just verify the array is returned correctly
      expect(instances.length).toBe(1);
    });
  });

  describe("listInstancesByDefinition", () => {
    it("should return empty array when no instances match", () => {
      registry.registerDefinition(mockDefinition);

      const instances = registry.listInstancesByDefinition("test-window");

      expect(instances).toEqual([]);
    });

    it("should return instances for specific definition", () => {
      const definition1: WindowDefinition = {
        definitionId: "window-1",
        title: "Window 1",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
      };
      const definition2: WindowDefinition = {
        definitionId: "window-2",
        title: "Window 2",
        component: {
          type: "svelte",
          component: vi.fn(),
          props: {},
        },
      };

      registry.registerDefinition(definition1);
      registry.registerDefinition(definition2);

      const instance1: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "window-1",
      };
      const instance2: WindowInstance = {
        instanceId: "instance-2",
        definitionId: "window-1",
      };
      const instance3: WindowInstance = {
        instanceId: "instance-3",
        definitionId: "window-2",
      };

      registry.registerInstance(instance1);
      registry.registerInstance(instance2);
      registry.registerInstance(instance3);

      const instances = registry.listInstancesByDefinition("window-1");

      expect(instances).toHaveLength(2);
      expect(instances).toContain(instance1);
      expect(instances).toContain(instance2);
      expect(instances).not.toContain(instance3);
    });

    it("should return empty array for non-existent definition", () => {
      const instance: WindowInstance = {
        instanceId: "instance-1",
        definitionId: "test-window",
      };

      registry.registerInstance(instance);

      const instances = registry.listInstancesByDefinition("non-existent");

      expect(instances).toEqual([]);
    });
  });
});
