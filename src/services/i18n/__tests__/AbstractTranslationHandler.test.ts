import { describe, it, expect } from "vitest";
import { AbstractTranslationHandler } from "../AbstractTranslationHandler";

/**
 * Concrete test implementation of AbstractTranslationHandler.
 * Returns a translation if key starts with "TEST.", otherwise returns null.
 */
class TestHandler extends AbstractTranslationHandler {
  protected doHandle(
    key: string,
    data?: Record<string, unknown>,

    _fallback?: string
  ): string | null {
    if (key.startsWith("TEST.")) {
      if (data) {
        return `TestHandler formatted: ${key}`;
      }
      return `TestHandler: ${key}`;
    }
    return null; // Can't handle
  }

  protected doHas(key: string): boolean {
    return key.startsWith("TEST.");
  }
}

describe("AbstractTranslationHandler", () => {
  describe("Chain of Responsibility", () => {
    it("should delegate to next handler when doHandle returns null", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();

      handler1.setNext(handler2);

      // Handler1 can't handle "OTHER.KEY", should delegate to handler2
      // Handler2 also can't handle, returns null
      const result = handler1.handle("OTHER.KEY");

      expect(result).toBeNull();
    });

    it("should return result when current handler can handle", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();

      handler1.setNext(handler2);

      // Handler1 can handle "TEST.KEY"
      const result = handler1.handle("TEST.KEY");

      expect(result).toBe("TestHandler: TEST.KEY");
    });

    it("should allow fluent chaining with setNext", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();
      const handler3 = new TestHandler();

      // Fluent chaining: a.setNext(b).setNext(c)
      handler1.setNext(handler2).setNext(handler3);

      // Verify chain is built correctly
      const result = handler1.handle("OTHER.KEY");
      expect(result).toBeNull(); // None can handle
    });

    it("should pass data parameter through the chain", () => {
      const handler = new TestHandler();

      const result = handler.handle("TEST.KEY", { name: "Alice" });

      expect(result).toBe("TestHandler formatted: TEST.KEY");
    });

    it("should pass fallback parameter through the chain", () => {
      const handler = new TestHandler();

      // Fallback is passed but TestHandler doesn't use it in this implementation
      const result = handler.handle("TEST.KEY", undefined, "Fallback");

      expect(result).toBe("TestHandler: TEST.KEY");
    });
  });

  describe("has()", () => {
    it("should return true when current handler has the key", () => {
      const handler = new TestHandler();

      const result = handler.has("TEST.KEY");

      expect(result).toBe(true);
    });

    it("should return false when current handler doesn't have the key", () => {
      const handler = new TestHandler();

      const result = handler.has("OTHER.KEY");

      expect(result).toBe(false);
    });

    it("should delegate to next handler when current handler doesn't have key", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();

      handler1.setNext(handler2);

      // Handler1 doesn't have "OTHER.KEY", should delegate to handler2
      const result = handler1.has("OTHER.KEY");

      expect(result).toBe(false); // Handler2 also doesn't have it
    });

    it("should check chain: first handler has key", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();

      handler1.setNext(handler2);

      const result = handler1.has("TEST.FIRST");

      expect(result).toBe(true); // Handler1 has it
    });
  });

  describe("Multiple Handlers in Chain", () => {
    it("should traverse entire chain when no handler can provide translation", () => {
      const handler1 = new TestHandler();
      const handler2 = new TestHandler();
      const handler3 = new TestHandler();

      handler1.setNext(handler2).setNext(handler3);

      const result = handler1.handle("UNKNOWN.KEY");

      expect(result).toBeNull(); // None can handle
    });

    it("should stop at first handler that can provide translation", () => {
      const handler1 = new TestHandler(); // Can handle TEST.*
      const handler2 = new TestHandler(); // Can also handle TEST.*

      handler1.setNext(handler2);

      const result = handler1.handle("TEST.KEY");

      // Handler1 should handle it, handler2 should not be called
      expect(result).toBe("TestHandler: TEST.KEY");
    });
  });
});
