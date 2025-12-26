import { describe, it, expect } from "vitest";
import * as v from "valibot";
import { ValibotValidationSchema, toValidationSchema } from "../valibot-schema-adapter";

describe("ValibotValidationSchema", () => {
  describe("validate", () => {
    it("should return ok result for valid values", () => {
      const schema = v.number();
      const validationSchema = new ValibotValidationSchema(schema);

      const result1 = validationSchema.validate(42);
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value).toBe(42);
      }

      const result2 = validationSchema.validate(0);
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value).toBe(0);
      }

      const result3 = validationSchema.validate(-1);
      expect(result3.ok).toBe(true);
      if (result3.ok) {
        expect(result3.value).toBe(-1);
      }
    });

    it("should return error result for invalid values", () => {
      const schema = v.number();
      const validationSchema = new ValibotValidationSchema(schema);

      const result1 = validationSchema.validate("42");
      expect(result1.ok).toBe(false);
      if (!result1.ok) {
        expect(result1.error.code).toBe("SETTING_VALIDATION_FAILED");
      }

      const result2 = validationSchema.validate(null);
      expect(result2.ok).toBe(false);

      const result3 = validationSchema.validate(undefined);
      expect(result3.ok).toBe(false);

      const result4 = validationSchema.validate({});
      expect(result4.ok).toBe(false);
    });

    it("should work with string schemas", () => {
      const schema = v.string();
      const validationSchema = new ValibotValidationSchema(schema);

      const result1 = validationSchema.validate("hello");
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value).toBe("hello");
      }

      const result2 = validationSchema.validate("");
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value).toBe("");
      }

      const result3 = validationSchema.validate(42);
      expect(result3.ok).toBe(false);
    });

    it("should work with boolean schemas", () => {
      const schema = v.boolean();
      const validationSchema = new ValibotValidationSchema(schema);

      const result1 = validationSchema.validate(true);
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value).toBe(true);
      }

      const result2 = validationSchema.validate(false);
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value).toBe(false);
      }

      const result3 = validationSchema.validate(1);
      expect(result3.ok).toBe(false);

      const result4 = validationSchema.validate(0);
      expect(result4.ok).toBe(false);
    });

    it("should work with picklist schemas", () => {
      const schema = v.picklist([1, 2, 3]);
      const validationSchema = new ValibotValidationSchema(schema);

      const result1 = validationSchema.validate(1);
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value).toBe(1);
      }

      const result2 = validationSchema.validate(2);
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value).toBe(2);
      }

      const result3 = validationSchema.validate(3);
      expect(result3.ok).toBe(true);
      if (result3.ok) {
        expect(result3.value).toBe(3);
      }

      const result4 = validationSchema.validate(4);
      expect(result4.ok).toBe(false);

      const result5 = validationSchema.validate("1");
      expect(result5.ok).toBe(false);
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

    const result1 = validationSchema.validate(42);
    expect(result1.ok).toBe(true);
    if (result1.ok) {
      expect(result1.value).toBe(42);
    }

    const result2 = validationSchema.validate("42");
    expect(result2.ok).toBe(false);
  });

  it("should preserve validation behavior", () => {
    const valibotSchema = v.string();
    const validationSchema = toValidationSchema(valibotSchema);

    const result1 = validationSchema.validate("hello");
    expect(result1.ok).toBe(true);
    if (result1.ok) {
      expect(result1.value).toBe("hello");
    }

    const result2 = validationSchema.validate(123);
    expect(result2.ok).toBe(false);
  });

  it("should work with complex schemas", () => {
    const valibotSchema = v.picklist(["a", "b", "c"]);
    const validationSchema = toValidationSchema(valibotSchema);

    const result1 = validationSchema.validate("a");
    expect(result1.ok).toBe(true);
    if (result1.ok) {
      expect(result1.value).toBe("a");
    }

    const result2 = validationSchema.validate("b");
    expect(result2.ok).toBe(true);
    if (result2.ok) {
      expect(result2.value).toBe("b");
    }

    const result3 = validationSchema.validate("c");
    expect(result3.ok).toBe(true);
    if (result3.ok) {
      expect(result3.value).toBe("c");
    }

    const result4 = validationSchema.validate("d");
    expect(result4.ok).toBe(false);

    const result5 = validationSchema.validate(1);
    expect(result5.ok).toBe(false);
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
