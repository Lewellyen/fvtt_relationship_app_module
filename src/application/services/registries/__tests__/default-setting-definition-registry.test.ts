import { describe, it, expect } from "vitest";
import { DefaultSettingDefinitionRegistry } from "../default-setting-definition-registry";
import { SETTING_KEYS } from "@/application/constants/app-constants";

describe("DefaultSettingDefinitionRegistry", () => {
  it("should return all setting definitions", () => {
    const registry = new DefaultSettingDefinitionRegistry();
    const definitions = registry.getAll();

    // Should have definitions for all setting keys
    expect(definitions.length).toBeGreaterThan(0);

    // Check that all setting keys have definitions
    const definitionKeys = definitions.map((def) => def.key);
    Object.values(SETTING_KEYS).forEach((settingKey) => {
      expect(definitionKeys).toContain(settingKey);
    });
  });

  it("should return readonly array", () => {
    const registry = new DefaultSettingDefinitionRegistry();
    const definitions = registry.getAll();

    expect(Array.isArray(definitions)).toBe(true);
    // readonly is a compile-time type, not runtime-enforced
    // The important part is that the interface contract is fulfilled
  });

  it("should return definitions with all required properties", () => {
    const registry = new DefaultSettingDefinitionRegistry();
    const definitions = registry.getAll();

    definitions.forEach((definition) => {
      expect(definition).toBeDefined();
      expect(definition.key).toBeDefined();
      expect(typeof definition.key).toBe("string");
      expect(definition.createConfig).toBeDefined();
      expect(typeof definition.createConfig).toBe("function");
    });
  });
});
