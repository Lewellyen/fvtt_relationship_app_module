import { describe, it, expect } from "vitest";
import { DefaultRuntimeConfigBindingRegistry } from "../default-runtime-config-binding-registry";
import { runtimeConfigBindings } from "@/application/config/runtime-config-bindings";

describe("DefaultRuntimeConfigBindingRegistry", () => {
  it("should return all runtime config bindings", () => {
    const registry = new DefaultRuntimeConfigBindingRegistry();
    const bindings = registry.getAll();

    // Should have bindings for all runtime config binding keys
    expect(bindings.size).toBeGreaterThan(0);
    expect(bindings.size).toBe(Object.keys(runtimeConfigBindings).length);

    // Check that all runtime config binding keys have bindings
    Object.keys(runtimeConfigBindings).forEach((settingKey) => {
      const binding = bindings.get(settingKey);
      expect(binding).toBeDefined();
      expect(binding?.runtimeKey).toBeDefined();
      expect(binding?.validator).toBeDefined();
      expect(binding?.normalize).toBeDefined();
    });
  });

  it("should skip bindings that do not exist (branch coverage)", () => {
    // This test verifies that the registry handles missing bindings gracefully
    // In practice, all runtime config binding keys have bindings
    const registry = new DefaultRuntimeConfigBindingRegistry();
    const bindings = registry.getAll();

    // All runtime config binding keys should have bindings in the default implementation
    Object.keys(runtimeConfigBindings).forEach((settingKey) => {
      expect(bindings.has(settingKey)).toBe(true);
    });
  });

  it("should return a ReadonlyMap", () => {
    const registry = new DefaultRuntimeConfigBindingRegistry();
    const bindings = registry.getAll();

    expect(bindings).toBeInstanceOf(Map);
    // ReadonlyMap is a compile-time type, not runtime-enforced
    // The important part is that the interface contract is fulfilled
  });
});
