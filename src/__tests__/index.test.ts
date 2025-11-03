import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("index.ts", () => {
  beforeEach(() => {
    // Mock Foundry globals before module import
    vi.stubGlobal("game", { version: "13.291" });
    vi.stubGlobal("Hooks", {
      on: vi.fn(),
      off: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("should import without errors", async () => {
    // index.ts führt init-solid aus, das global bootstrappt
    await expect(import("../index")).resolves.toBeDefined();
  });
});
