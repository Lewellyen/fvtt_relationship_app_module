import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { ValibotValidationSchema, toValidationSchema } from "../valibot-schema-adapter";

describe("ValibotValidationSchema", () => {
  describe("validate", () => {
    it("should return true for valid values", () => {
      const schema = v.number();
      const validationSchema = new ValibotValidationSchema(schema);

      expect(validationSchema.validate(42)).toBe(true);
      expect(validationSchema.validate(0)).toBe(true);
      expect(validationSchema.validate(-1)).toBe(true);
    });

    it("should return false for invalid values", () => {
      const schema = v.number();
      const validationSchema = new ValibotValidationSchema(schema);

      expect(validationSchema.validate("42")).toBe(false);
      expect(validationSchema.validate(null)).toBe(false);
      expect(validationSchema.validate(undefined)).toBe(false);
      expect(validationSchema.validate({})).toBe(false);
    });

    it("should work with string schemas", () => {
      const schema = v.string();
      const validationSchema = new ValibotValidationSchema(schema);

      expect(validationSchema.validate("hello")).toBe(true);
      expect(validationSchema.validate("")).toBe(true);
      expect(validationSchema.validate(42)).toBe(false);
    });

    it("should work with boolean schemas", () => {
      const schema = v.boolean();
      const validationSchema = new ValibotValidationSchema(schema);

      expect(validationSchema.validate(true)).toBe(true);
      expect(validationSchema.validate(false)).toBe(true);
      expect(validationSchema.validate(1)).toBe(false);
      expect(validationSchema.validate(0)).toBe(false);
    });

    it("should work with picklist schemas", () => {
      const schema = v.picklist([1, 2, 3]);
      const validationSchema = new ValibotValidationSchema(schema);

      expect(validationSchema.validate(1)).toBe(true);
      expect(validationSchema.validate(2)).toBe(true);
      expect(validationSchema.validate(3)).toBe(true);
      expect(validationSchema.validate(4)).toBe(false);
      expect(validationSchema.validate("1")).toBe(false);
    });
  });

  describe("getValibotSchema", () => {
    it("should return the original valibot schema", () => {
      const originalSchema = v.number();
      const validationSchema = new ValibotValidationSchema(originalSchema);

      const retrievedSchema = validationSchema.getValibotSchema();

      expect(retrievedSchema).toBe(originalSchema);
    });

    it("should return the same schema instance", () => {
      const originalSchema = v.string();
      const validationSchema = new ValibotValidationSchema(originalSchema);

      const retrievedSchema1 = validationSchema.getValibotSchema();
      const retrievedSchema2 = validationSchema.getValibotSchema();

      expect(retrievedSchema1).toBe(originalSchema);
      expect(retrievedSchema2).toBe(originalSchema);
      expect(retrievedSchema1).toBe(retrievedSchema2);
    });
  });
});

describe("toValidationSchema", () => {
  it("should convert valibot schema to ValidationSchema", () => {
    const valibotSchema = v.number();
    const validationSchema = toValidationSchema(valibotSchema);

    expect(validationSchema).toBeInstanceOf(ValibotValidationSchema);
    expect(validationSchema.validate(42)).toBe(true);
    expect(validationSchema.validate("42")).toBe(false);
  });

  it("should preserve validation behavior", () => {
    const valibotSchema = v.string();
    const validationSchema = toValidationSchema(valibotSchema);

    expect(validationSchema.validate("hello")).toBe(true);
    expect(validationSchema.validate(123)).toBe(false);
  });

  it("should work with complex schemas", () => {
    const valibotSchema = v.picklist(["a", "b", "c"]);
    const validationSchema = toValidationSchema(valibotSchema);

    expect(validationSchema.validate("a")).toBe(true);
    expect(validationSchema.validate("b")).toBe(true);
    expect(validationSchema.validate("c")).toBe(true);
    expect(validationSchema.validate("d")).toBe(false);
    expect(validationSchema.validate(1)).toBe(false);
  });

  it("should return ValibotValidationSchema that exposes original schema", () => {
    const valibotSchema = v.boolean();
    const validationSchema = toValidationSchema(valibotSchema);

    expect(validationSchema).toBeInstanceOf(ValibotValidationSchema);
    if (validationSchema instanceof ValibotValidationSchema) {
      const retrievedSchema = validationSchema.getValibotSchema();
      expect(retrievedSchema).toBe(valibotSchema);
    }
  });
});
