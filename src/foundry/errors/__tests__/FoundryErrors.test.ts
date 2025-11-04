import { describe, it, expect } from "vitest";
import { createFoundryError, isFoundryError } from "../FoundryErrors";
import type { FoundryError } from "../FoundryErrors";

describe("FoundryErrors", () => {
  describe("createFoundryError", () => {
    it("should create error with code and message", () => {
      const error = createFoundryError("API_NOT_AVAILABLE", "Test message");

      expect(error.code).toBe("API_NOT_AVAILABLE");
      expect(error.message).toBe("Test message");
      expect(error.details).toBeUndefined();
      expect(error.cause).toBeUndefined();
    });

    it("should create error with details", () => {
      const error = createFoundryError("NOT_FOUND", "Entity not found", { id: "123" });

      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Entity not found");
      expect(error.details).toEqual({ id: "123" });
    });

    it("should create error with cause", () => {
      const cause = new Error("Original error");
      const error = createFoundryError("OPERATION_FAILED", "Operation failed", undefined, cause);

      expect(error.code).toBe("OPERATION_FAILED");
      expect(error.cause).toBe(cause);
    });

    it("should create error with both details and cause", () => {
      const cause = new Error("Original");
      const details = { id: "abc", name: "test" };
      const error = createFoundryError("VALIDATION_FAILED", "Validation failed", details, cause);

      expect(error.code).toBe("VALIDATION_FAILED");
      expect(error.message).toBe("Validation failed");
      expect(error.details).toEqual(details);
      expect(error.cause).toBe(cause);
    });

    it("should support all error codes", () => {
      const codes = [
        "API_NOT_AVAILABLE",
        "VALIDATION_FAILED",
        "NOT_FOUND",
        "ACCESS_DENIED",
        "PORT_SELECTION_FAILED",
        "OPERATION_FAILED",
      ] as const;

      codes.forEach((code) => {
        const error = createFoundryError(code, "Test");
        expect(error.code).toBe(code);
      });
    });
  });

  describe("isFoundryError", () => {
    it("should return true for valid FoundryError", () => {
      const error = createFoundryError("API_NOT_AVAILABLE", "Test");
      expect(isFoundryError(error)).toBe(true);
    });

    it("should return true for FoundryError with details and cause", () => {
      const error = createFoundryError(
        "OPERATION_FAILED",
        "Test",
        { id: "123" },
        new Error("cause")
      );
      expect(isFoundryError(error)).toBe(true);
      expect(error.details).toEqual({ id: "123" });
      expect(error.cause).toBeInstanceOf(Error);
    });

    it("should return false for plain Error object", () => {
      expect(isFoundryError(new Error("test"))).toBe(false);
    });

    it("should return false for object without code", () => {
      expect(isFoundryError({ message: "test" })).toBe(false);
    });

    it("should return false for object without message", () => {
      expect(isFoundryError({ code: "TEST" })).toBe(false);
    });

    it("should return false for object with non-string code", () => {
      expect(isFoundryError({ code: 123, message: "test" })).toBe(false);
    });

    it("should return false for object with non-string message", () => {
      expect(isFoundryError({ code: "TEST", message: 123 })).toBe(false);
    });

    it("should return false for null", () => {
      expect(isFoundryError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isFoundryError(undefined)).toBe(false);
    });

    it("should return false for primitives", () => {
      expect(isFoundryError("string")).toBe(false);
      expect(isFoundryError(123)).toBe(false);
      expect(isFoundryError(true)).toBe(false);
    });

    it("should return false for array", () => {
      expect(isFoundryError([])).toBe(false);
    });

    it("should return false for object with only code and message as numbers", () => {
      expect(isFoundryError({ code: 1, message: 2 })).toBe(false);
    });

    it("should return true for manually constructed FoundryError", () => {
      const error: FoundryError = {
        code: "ACCESS_DENIED",
        message: "Permission denied",
        details: { resource: "journal" },
      };
      expect(isFoundryError(error)).toBe(true);
    });
  });
});
