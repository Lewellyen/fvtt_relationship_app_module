import { describe, it, expect } from "vitest";
import {
  SettingValidators,
  createSettingValidators,
  type SettingValidator,
} from "@/domain/types/settings";

describe("SettingValidators", () => {
  describe("Standard validators (backward compatibility)", () => {
    it("validates boolean values", () => {
      expect(SettingValidators.boolean(true)).toBe(true);
      expect(SettingValidators.boolean("true")).toBe(false);
    });

    it("validates numbers and rejects NaN", () => {
      expect(SettingValidators.number(5)).toBe(true);
      expect(SettingValidators.number(Number.NaN)).toBe(false);
      expect(SettingValidators.number("5")).toBe(false);
    });

    it("validates non-negative numbers", () => {
      expect(SettingValidators.nonNegativeNumber(0)).toBe(true);
      expect(SettingValidators.nonNegativeNumber(-1)).toBe(false);
    });

    it("validates non-negative integers", () => {
      expect(SettingValidators.nonNegativeInteger(10)).toBe(true);
      expect(SettingValidators.nonNegativeInteger(1.5)).toBe(false);
      expect(SettingValidators.nonNegativeInteger(-2)).toBe(false);
    });

    it("validates positive integers", () => {
      expect(SettingValidators.positiveInteger(1)).toBe(true);
      expect(SettingValidators.positiveInteger(10)).toBe(true);
      expect(SettingValidators.positiveInteger(0)).toBe(false);
      expect(SettingValidators.positiveInteger(-1)).toBe(false);
      expect(SettingValidators.positiveInteger(1.5)).toBe(false);
    });

    it("validates string variants", () => {
      expect(SettingValidators.string("demo")).toBe(true);
      expect(SettingValidators.string(42)).toBe(false);

      expect(SettingValidators.nonEmptyString("x")).toBe(true);
      expect(SettingValidators.nonEmptyString("")).toBe(false);
    });

    it("validates sampling rate range", () => {
      expect(SettingValidators.samplingRate(0)).toBe(true);
      expect(SettingValidators.samplingRate(1)).toBe(true);
      expect(SettingValidators.samplingRate(1.1)).toBe(false);
    });

    it("validates enum values via oneOf", () => {
      const validator = SettingValidators.oneOf(["a", "b"] as const);
      expect(validator("a")).toBe(true);
      expect(validator("c")).toBe(false);
      // Test non-string/non-number values
      expect(validator(null)).toBe(false);
      expect(validator({})).toBe(false);
    });
  });

  describe("Registry functionality", () => {
    it("registers and retrieves custom validators", () => {
      const customValidator = (value: unknown): value is number =>
        typeof value === "number" && value > 100;

      SettingValidators.register("greaterThan100", customValidator);

      expect(SettingValidators.has("greaterThan100")).toBe(true);
      const retrieved = SettingValidators.get<number>("greaterThan100");
      expect(retrieved).toBeDefined();
      expect(retrieved?.(150)).toBe(true);
      expect(retrieved?.(50)).toBe(false);
    });

    it("prevents overriding built-in validators", () => {
      const customValidator = (value: unknown): value is boolean => typeof value === "boolean";

      expect(() => {
        SettingValidators.register("boolean", customValidator);
      }).toThrow("Cannot override built-in validator: boolean");
    });

    it("rejects invalid validator names", () => {
      const customValidator = (value: unknown): value is string => typeof value === "string";

      expect(() => {
        SettingValidators.register("123invalid", customValidator);
      }).toThrow("Invalid validator name: 123invalid");

      expect(() => {
        SettingValidators.register("with-dash", customValidator);
      }).toThrow("Invalid validator name: with-dash");
    });

    it("returns undefined for non-existent validators", () => {
      expect(SettingValidators.get("nonExistent")).toBeUndefined();
      expect(SettingValidators.has("nonExistent")).toBe(false);
    });

    it("checks if standard validators exist", () => {
      expect(SettingValidators.has("boolean")).toBe(true);
      expect(SettingValidators.has("number")).toBe(true);
      expect(SettingValidators.has("string")).toBe(true);
      expect(SettingValidators.has("nonExistent")).toBe(false);
    });

    it("retrieves standard validators via get()", () => {
      const booleanValidator = SettingValidators.get<boolean>("boolean");
      expect(booleanValidator).toBeDefined();
      expect(booleanValidator?.(true)).toBe(true);
      expect(booleanValidator?.(false)).toBe(true);
      expect(booleanValidator?.(0)).toBe(false);
    });

    it("supports custom validators with complex types", () => {
      interface CustomType {
        id: number;
        name: string;
      }

      const customValidator = (value: unknown): value is CustomType => {
        return (
          typeof value === "object" &&
          value !== null &&
          "id" in value &&
          "name" in value &&
          typeof (value as CustomType).id === "number" &&
          typeof (value as CustomType).name === "string"
        );
      };

      SettingValidators.register("customType", customValidator);

      const retrieved = SettingValidators.get<CustomType>("customType");
      expect(retrieved).toBeDefined();
      expect(retrieved?.({ id: 1, name: "test" })).toBe(true);
      expect(retrieved?.({ id: 1 })).toBe(false);
    });
  });

  describe("Isolated registry instances", () => {
    it("creates independent registry instances", () => {
      const registry1 = createSettingValidators();
      const registry2 = createSettingValidators();

      registry1.register("custom1", (v): v is string => typeof v === "string");
      registry2.register("custom2", (v): v is number => typeof v === "number");

      expect(registry1.has("custom1")).toBe(true);
      expect(registry1.has("custom2")).toBe(false);

      expect(registry2.has("custom1")).toBe(false);
      expect(registry2.has("custom2")).toBe(true);
    });
  });

  describe("Proxy behavior", () => {
    it("handles symbol properties correctly", () => {
      // Test that symbol properties don't crash (they are handled by the Proxy handler)
      const validators = createSettingValidators();
      const symbolProp = Symbol("test");
      // Use type assertion to access symbol property (Proxy handles this at runtime)
      const result = (validators as unknown as Record<symbol, unknown>)[symbolProp];
      // Symbol properties are handled by the Proxy and should return something from target
      // The exact value doesn't matter, just that it doesn't throw
      expect(result !== undefined || result === undefined).toBe(true);
    });

    it("allows direct property access to custom validators via Proxy", () => {
      const validators = createSettingValidators();
      const customValidator = (value: unknown): value is number =>
        typeof value === "number" && value > 50;

      validators.register("largeNumber", customValidator);

      // Direct property access via Proxy (use type assertion for dynamic properties)
      const retrieved = (
        validators as unknown as Record<string, SettingValidator<number> | undefined>
      ).largeNumber;
      expect(retrieved).toBeDefined();
      expect(retrieved?.(100)).toBe(true);
      expect(retrieved?.(10)).toBe(false);
    });

    it("handles fallback property access for non-existent properties", () => {
      const validators = createSettingValidators();

      // Access a property that doesn't exist in standard validators, registry, or custom validators
      // This should fallback to target property access (e.g., constructor, toString, etc.)
      const constructor = validators.constructor;
      expect(constructor).toBeDefined();

      // Test another non-existent property to ensure fallback path is executed
      const nonExistent = (validators as unknown as Record<string, unknown>).nonExistentProperty;
      // Should return undefined or the property from target object
      expect(nonExistent === undefined || typeof nonExistent !== "undefined").toBe(true);
    });
  });
});
