import { describe, it, expect, beforeEach } from "vitest";
import {
  FallbackTranslationHandler,
  DIFallbackTranslationHandler,
} from "../FallbackTranslationHandler";

describe("FallbackTranslationHandler", () => {
  let handler: FallbackTranslationHandler;

  beforeEach(() => {
    handler = new FallbackTranslationHandler();
  });

  describe("doHandle", () => {
    it("should return fallback when provided", () => {
      const result = handler.handle("ANY.KEY", undefined, "Fallback Text");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Fallback Text");
      }
    });

    it("should return key when no fallback provided", () => {
      const result = handler.handle("ANY.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("ANY.KEY");
      }
    });

    it("should ignore data parameter", () => {
      const result = handler.handle("ANY.KEY", { name: "Alice" }, "Fallback");

      // Fallback handler doesn't use data, just returns fallback
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Fallback");
      }
    });

    it("should always return ok result (always handles)", () => {
      const result = handler.handle("ANY.KEY");

      expect(result.ok).toBe(true);
    });

    it("should handle empty string as fallback", () => {
      const result = handler.handle("ANY.KEY", undefined, "");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("");
      }
    });
  });

  describe("doHas", () => {
    it("should always return false (fallback doesn't 'have' keys)", () => {
      const result1 = handler.has("ANY.KEY");
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.value).toBe(false);
      }

      const result2 = handler.has("ANOTHER.KEY");
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.value).toBe(false);
      }

      const result3 = handler.has("");
      expect(result3.ok).toBe(true);
      if (result3.ok) {
        expect(result3.value).toBe(false);
      }
    });
  });

  describe("As Last Handler in Chain", () => {
    it("should always provide a result when reached", () => {
      // Simulate being last in chain: no next handler
      const result = handler.handle("UNKNOWN.KEY", undefined, "Final Fallback");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Final Fallback");
      }
    });

    it("should return key as ultimate fallback", () => {
      // No fallback parameter = return key
      const result = handler.handle("UNKNOWN.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("UNKNOWN.KEY");
      }
    });
  });

  describe("Dependencies", () => {
    it("should expose empty dependency arrays", () => {
      expect(FallbackTranslationHandler.dependencies).toEqual([]);
      expect(DIFallbackTranslationHandler.dependencies).toEqual([]);
    });
  });
});
