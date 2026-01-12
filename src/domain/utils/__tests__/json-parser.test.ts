/**
 * Tests for JSON parser/serializer utilities.
 */

import { describe, it, expect, vi } from "vitest";
import { parseJSON, serializeJSON, validateSchema, parseAndValidate } from "../json-parser";
import * as v from "valibot";

describe("domain/utils/json-parser", () => {
  describe("parseJSON", () => {
    it("should parse valid JSON string", () => {
      const result = parseJSON('{"key": "value"}');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ key: "value" });
      }
    });

    it("should parse JSON array", () => {
      const result = parseJSON("[1, 2, 3]");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([1, 2, 3]);
      }
    });

    it("should parse JSON number", () => {
      const result = parseJSON("42");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it("should return error for invalid JSON", () => {
      const result = parseJSON("{ invalid json }");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PARSE_ERROR");
        expect(result.error.message).toContain("Failed to parse JSON");
      }
    });

    it("should return error for empty string", () => {
      const result = parseJSON("");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PARSE_ERROR");
      }
    });

    it("should handle non-Error exceptions in parseJSON error handler", () => {
      // Test the error handler branch where error is not an Error instance
      const parseSpy = vi.spyOn(JSON, "parse").mockImplementation(() => {
        throw "string error";
      });

      const result = parseJSON("test");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PARSE_ERROR");
        expect(result.error.message).toBe("Failed to parse JSON: string error");
      }

      parseSpy.mockRestore();
    });
  });

  describe("serializeJSON", () => {
    it("should serialize object to JSON", () => {
      const result = serializeJSON({ key: "value" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('{"key":"value"}');
      }
    });

    it("should serialize array to JSON", () => {
      const result = serializeJSON([1, 2, 3]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("[1,2,3]");
      }
    });

    it("should serialize with pretty printing", () => {
      const result = serializeJSON({ key: "value" }, 2);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toContain("\n");
        expect(result.value).toContain('"key"');
      }
    });

    it("should serialize null", () => {
      const result = serializeJSON(null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("null");
      }
    });

    it("should return error for circular references", () => {
      const circular: { self?: unknown } = {};
      circular.self = circular;

      const result = serializeJSON(circular);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SERIALIZE_ERROR");
        expect(result.error.message).toContain("Failed to serialize");
      }
    });

    it("should handle non-Error exceptions in serializeJSON error handler", () => {
      // Test the error handler branch where error is not an Error instance
      const stringifySpy = vi.spyOn(JSON, "stringify").mockImplementation(() => {
        throw 123;
      });

      const result = serializeJSON("test");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SERIALIZE_ERROR");
        expect(result.error.message).toBe("Failed to serialize to JSON: 123");
      }

      stringifySpy.mockRestore();
    });
  });

  describe("validateSchema", () => {
    const stringSchema = v.string();

    it("should validate data against schema", () => {
      const result = validateSchema("test", stringSchema);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("test");
      }
    });

    it("should return error for invalid data", () => {
      const result = validateSchema(123, stringSchema);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
        expect(result.error.message).toContain("validation failed");
      }
    });

    it("should validate object schema", () => {
      const objectSchema = v.object({
        name: v.string(),
        age: v.number(),
      });

      const result = validateSchema({ name: "Test", age: 25 }, objectSchema);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe("Test");
        expect(result.value.age).toBe(25);
      }
    });
  });

  describe("parseAndValidate", () => {
    const stringSchema = v.string();

    it("should parse and validate valid JSON", () => {
      const result = parseAndValidate('"test"', stringSchema);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("test");
      }
    });

    it("should return parse error for invalid JSON", () => {
      const result = parseAndValidate("{ invalid json }", stringSchema);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PARSE_ERROR");
      }
    });

    it("should return validation error for valid JSON but invalid schema", () => {
      const result = parseAndValidate("123", stringSchema);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should parse and validate object", () => {
      const objectSchema = v.object({
        name: v.string(),
        count: v.number(),
      });

      const result = parseAndValidate('{"name": "Test", "count": 5}', objectSchema);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe("Test");
        expect(result.value.count).toBe(5);
      }
    });
  });
});
