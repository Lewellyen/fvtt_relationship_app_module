import { describe, it, expect } from "vitest";
import { TranslationHandlerChain, DITranslationHandlerChain } from "../TranslationHandlerChain";
import type { TranslationHandler } from "../TranslationHandler.interface";

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

  handle(key: string, data?: Record<string, unknown>, fallback?: string): string | null {
    if (this.result !== null) {
      return this.result;
    }
    return this.next?.handle(key, data, fallback) ?? null;
  }

  has(key: string): boolean {
    if (this.hasKey) {
      return true;
    }
    return this.next?.has(key) ?? false;
  }
}

describe("TranslationHandlerChain", () => {
  it("should wire handlers in constructor and delegate handle/has calls", () => {
    const foundry = new StubHandler(null, false);
    const local = new StubHandler("local-result", true);
    const fallback = new StubHandler("fallback-result", false);

    const chain = new TranslationHandlerChain(foundry, local, fallback);

    expect(foundry.next).toBe(local);
    expect(local.next).toBe(fallback);
    expect(fallback.next).toBeNull();

    expect(chain.handle("key")).toBe("local-result");
    expect(chain.has("key")).toBe(true);
  });

  it("should forward setNext to foundry handler", () => {
    const foundry = new StubHandler();
    const local = new StubHandler();
    const fallback = new StubHandler();
    const chain = new TranslationHandlerChain(foundry, local, fallback);

    const custom = new StubHandler("custom");
    const returned = chain.setNext(custom);

    expect(returned).toBe(custom);
    expect(foundry.next).toBe(custom);
  });

  it("DITranslationHandlerChain should behave identically", () => {
    const foundry = new StubHandler(null, false);
    const local = new StubHandler(null, false);
    const fallback = new StubHandler("fallback", true);

    const chain = new DITranslationHandlerChain(foundry, local, fallback);

    expect(chain.handle("key")).toBe("fallback");
    expect(chain.has("key")).toBe(true);
  });
});
