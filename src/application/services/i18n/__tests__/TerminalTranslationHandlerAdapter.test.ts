import { describe, it, expect, beforeEach } from "vitest";
import { TerminalTranslationHandlerAdapter } from "@/infrastructure/i18n/TerminalTranslationHandlerAdapter";
import { FallbackTranslationHandler } from "@/infrastructure/i18n/FallbackTranslationHandler";
import type { TranslationHandler } from "@/infrastructure/i18n/TranslationHandler.interface";
import { ok } from "@/domain/utils/result";

class StubHandler implements TranslationHandler {
  public next: TranslationHandler | null = null;

  setNext(handler: TranslationHandler): TranslationHandler {
    this.next = handler;
    return handler;
  }

  handle(_key: string, _data?: Record<string, unknown>, _fallback?: string) {
    return this.next?.handle(_key, _data, _fallback) ?? ok("stub");
  }

  has(_key: string) {
    return this.next?.has(_key) ?? ok(false);
  }
}

describe("TerminalTranslationHandlerAdapter", () => {
  let adapter: TerminalTranslationHandlerAdapter;
  let terminalHandler: FallbackTranslationHandler;

  beforeEach(() => {
    terminalHandler = new FallbackTranslationHandler();
    adapter = new TerminalTranslationHandlerAdapter(terminalHandler);
  });

  describe("handle", () => {
    it("should delegate to terminal handler", () => {
      const result = adapter.handle("ANY.KEY", undefined, "Fallback");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Fallback");
      }
    });

    it("should return key when no fallback provided", () => {
      const result = adapter.handle("ANY.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("ANY.KEY");
      }
    });
  });

  describe("has", () => {
    it("should delegate to terminal handler", () => {
      const result = adapter.has("ANY.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe("setNext", () => {
    it("should return self (terminal handlers cannot be chained further)", () => {
      const stubHandler = new StubHandler();
      const returned = adapter.setNext(stubHandler);

      // setNext should return self, not the handler passed
      expect(returned).toBe(adapter);
      // The adapter should not store the handler (terminal handlers are always last)
    });
  });

  describe("integration with chain", () => {
    it("should work as last handler in chain", () => {
      const stubHandler = new StubHandler();
      stubHandler.setNext(adapter);

      // Stub handler can't handle, should delegate to adapter
      const result = stubHandler.handle("UNKNOWN.KEY", undefined, "Final Fallback");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Final Fallback");
      }
    });
  });
});
