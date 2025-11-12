import { describe, it, expect, beforeEach } from "vitest";
import { FallbackTranslationHandler } from "../FallbackTranslationHandler";

describe("FallbackTranslationHandler", () => {
  let handler: FallbackTranslationHandler;

  beforeEach(() => {
    handler = new FallbackTranslationHandler();
  });

  describe("doHandle", () => {
    it("should return fallback when provided", () => {
      const result = handler.handle("ANY.KEY", undefined, "Fallback Text");

      expect(result).toBe("Fallback Text");
    });

    it("should return key when no fallback provided", () => {
      const result = handler.handle("ANY.KEY");

      expect(result).toBe("ANY.KEY");
    });

    it("should ignore data parameter", () => {
      const result = handler.handle("ANY.KEY", { name: "Alice" }, "Fallback");

      // Fallback handler doesn't use data, just returns fallback
      expect(result).toBe("Fallback");
    });

    it("should never return null (always handles)", () => {
      const result = handler.handle("ANY.KEY");

      expect(result).not.toBeNull();
    });

    it("should handle empty string as fallback", () => {
      const result = handler.handle("ANY.KEY", undefined, "");

      expect(result).toBe("");
    });
  });

  describe("doHas", () => {
    it("should always return false (fallback doesn't 'have' keys)", () => {
      expect(handler.has("ANY.KEY")).toBe(false);
      expect(handler.has("ANOTHER.KEY")).toBe(false);
      expect(handler.has("")).toBe(false);
    });
  });

  describe("As Last Handler in Chain", () => {
    it("should always provide a result when reached", () => {
      // Simulate being last in chain: no next handler
      const result = handler.handle("UNKNOWN.KEY", undefined, "Final Fallback");

      expect(result).toBe("Final Fallback");
    });

    it("should return key as ultimate fallback", () => {
      // No fallback parameter = return key
      const result = handler.handle("UNKNOWN.KEY");

      expect(result).toBe("UNKNOWN.KEY");
    });
  });
});
