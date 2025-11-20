import { describe, it, expect } from "vitest";
import { AbstractTranslationHandler } from "@/infrastructure/i18n/AbstractTranslationHandler";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/infrastructure/shared/utils/result";

/**
 * Concrete test implementation of AbstractTranslationHandler.
 * Returns a translation if key starts with "TEST.", otherwise returns error.
 */
class TestHandler extends AbstractTranslationHandler {
  protected doHandle(
    key: string,
    data?: Record<string, unknown>,
    _fallback?: string
  ): Result<string, string> {
    if (key.startsWith("TEST.")) {
      if (data) {
        return ok(`TestHandler formatted: ${key}`);
      }
      return ok(`TestHandler: ${key}`);
    }
    return err(`TestHandler cannot handle key: ${key}`); // Can't handle
  }

  protected doHas(key: string): Result<boolean, string> {
    return ok(key.startsWith("TEST."));
  }
}

describe("AbstractTranslationHandler", () => {
  describe("Chain of Responsibility", () => {
    it("should delegate to next handler when doHandle returns error", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();

      handler1.setNext(handler2);

      // Handler1 can't handle "OTHER.KEY", should delegate to handler2
      // Handler2 also can't handle, returns error
      // Since no fallback provided, should return error
      const result = handler1.handle("OTHER.KEY");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Translation key not found");
      }
    });

    it("should return result when current handler can handle", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();

      handler1.setNext(handler2);

      // Handler1 can handle "TEST.KEY"
      const result = handler1.handle("TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("TestHandler: TEST.KEY");
      }
    });

    it("should allow fluent chaining with setNext", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();
      const handler3 = new TestHandler();

      // Fluent chaining: a.setNext(b).setNext(c)
      handler1.setNext(handler2).setNext(handler3);

      // Verify chain is built correctly
      const result = handler1.handle("OTHER.KEY");
      expect(result.ok).toBe(false); // None can handle, no fallback
    });

    it("should pass data parameter through the chain", () => {
      const handler = new TestHandler();

      const result = handler.handle("TEST.KEY", { name: "Alice" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("TestHandler formatted: TEST.KEY");
      }
    });

    it("should pass fallback parameter through the chain", () => {
      const handler = new TestHandler();

      // Fallback is passed but TestHandler doesn't use it in this implementation
      const result = handler.handle("TEST.KEY", undefined, "Fallback");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("TestHandler: TEST.KEY");
      }
    });

    it("should use fallback when no handler can provide translation", () => {
      const handler = new TestHandler();

      // Handler can't handle "OTHER.KEY", no nextHandler, but fallback is provided
      const result = handler.handle("OTHER.KEY", undefined, "Fallback Text");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Fallback Text");
      }
    });
  });

  describe("has()", () => {
    it("should return true when current handler has the key", () => {
      const handler = new TestHandler();

      const result = handler.has("TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should return false when current handler doesn't have the key", () => {
      const handler = new TestHandler();

      const result = handler.has("OTHER.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it("should delegate to next handler when current handler doesn't have key", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();

      handler1.setNext(handler2);

      // Handler1 doesn't have "OTHER.KEY", should delegate to handler2
      const result = handler1.has("OTHER.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false); // Handler2 also doesn't have it
      }
    });

    it("should check chain: first handler has key", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();

      handler1.setNext(handler2);

      const result = handler1.has("TEST.FIRST");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true); // Handler1 has it
      }
    });
  });

  describe("Multiple Handlers in Chain", () => {
    it("should traverse entire chain when no handler can provide translation", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();
      const handler3 = new TestHandler();

      handler1.setNext(handler2).setNext(handler3);

      const result = handler1.handle("UNKNOWN.KEY");

      expect(result.ok).toBe(false); // None can handle, no fallback
    });

    it("should stop at first handler that can provide translation", () => {
      const handler1 = new TestHandler(); // Can handle TEST.*
      const handler2 = new TestHandler(); // Can also handle TEST.*

      handler1.setNext(handler2);

      const result = handler1.handle("TEST.KEY");

      // Handler1 should handle it, handler2 should not be called
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("TestHandler: TEST.KEY");
      }
    });
  });
});
