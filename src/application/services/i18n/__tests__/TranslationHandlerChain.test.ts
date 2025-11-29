import { describe, it, expect } from "vitest";
import {
  TranslationHandlerChain,
  DITranslationHandlerChain,
} from "@/infrastructure/i18n/TranslationHandlerChain";
import type { TranslationHandler } from "@/infrastructure/i18n/TranslationHandler.interface";
import type { Result } from "@/domain/types/result";
import { ok, err } from "@/domain/utils/result";

class StubHandler implements TranslationHandler {
  public next: TranslationHandler | null = null;

  constructor(
    private readonly result: string | null = null,
    private readonly hasKey = false
  ) {}

  setNext(handler: TranslationHandler): TranslationHandler {
    this.next = handler;
    return handler;
  }

  handle(key: string, data?: Record<string, unknown>, fallback?: string): Result<string, string> {
    if (this.result !== null) {
      return ok(this.result);
    }
    return this.next?.handle(key, data, fallback) ?? err(`No handler for key: ${key}`);
  }

  has(key: string): Result<boolean, string> {
    if (this.hasKey) {
      return ok(true);
    }
    return this.next?.has(key) ?? ok(false);
  }
}

describe("TranslationHandlerChain", () => {
  it("should wire handlers in constructor and delegate handle/has calls", () => {
    const foundry = new StubHandler(null, false);
    const local = new StubHandler("local-result", true);
    const fallback = new StubHandler("fallback-result", false);

    const chain = new TranslationHandlerChain([foundry, local, fallback]);

    expect(foundry.next).toBe(local);
    expect(local.next).toBe(fallback);
    expect(fallback.next).toBeNull();

    const handleResult = chain.handle("key");
    expect(handleResult.ok).toBe(true);
    if (handleResult.ok) {
      expect(handleResult.value).toBe("local-result");
    }

    const hasResult = chain.has("key");
    expect(hasResult.ok).toBe(true);
    if (hasResult.ok) {
      expect(hasResult.value).toBe(true);
    }
  });

  it("should forward setNext to head handler", () => {
    const foundry = new StubHandler();
    const local = new StubHandler();
    const fallback = new StubHandler();
    const chain = new TranslationHandlerChain([foundry, local, fallback]);

    const custom = new StubHandler("custom");
    const returned = chain.setNext(custom);

    expect(returned).toBe(custom);
    expect(foundry.next).toBe(custom);
  });

  it("should throw error when handlers array is empty", () => {
    expect(() => {
      new TranslationHandlerChain([]);
    }).toThrow("TranslationHandlerChain requires at least one handler");
  });

  it("DITranslationHandlerChain should behave identically", () => {
    const foundry = new StubHandler(null, false);
    const local = new StubHandler(null, false);
    const fallback = new StubHandler("fallback", true);

    const chain = new DITranslationHandlerChain([foundry, local, fallback]);

    const handleResult = chain.handle("key");
    expect(handleResult.ok).toBe(true);
    if (handleResult.ok) {
      expect(handleResult.value).toBe("fallback");
    }

    const hasResult = chain.has("key");
    expect(hasResult.ok).toBe(true);
    if (hasResult.ok) {
      expect(hasResult.value).toBe(true);
    }
  });
});
