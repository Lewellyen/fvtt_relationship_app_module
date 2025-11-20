import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FoundryI18nPortV13 } from "@/infrastructure/adapters/foundry/ports/v13/FoundryI18nPort";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryI18nPortV13", () => {
  let port: FoundryI18nPortV13;

  beforeEach(() => {
    port = new FoundryI18nPortV13();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("localize", () => {
    it("should return translated string from game.i18n", () => {
      vi.stubGlobal("game", {
        i18n: {
          localize: vi.fn().mockReturnValue("Translated Text"),
        },
      });

      const result = port.localize("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("Translated Text");
      expect(game.i18n?.localize).toHaveBeenCalledWith("MODULE.TEST.KEY");
    });

    it("should return key itself when game.i18n is undefined", () => {
      vi.stubGlobal("game", undefined);

      const result = port.localize("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("MODULE.TEST.KEY");
    });

    it("should return key when game.i18n is null", () => {
      vi.stubGlobal("game", { i18n: null });

      const result = port.localize("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("MODULE.TEST.KEY");
    });

    it("should handle localize errors gracefully", () => {
      vi.stubGlobal("game", {
        i18n: {
          localize: vi.fn().mockImplementation(() => {
            throw new Error("Localize error");
          }),
        },
      });

      const result = port.localize("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("MODULE.TEST.KEY"); // Fallback to key
    });
  });

  describe("format", () => {
    it("should return formatted string from game.i18n", () => {
      vi.stubGlobal("game", {
        i18n: {
          format: vi.fn().mockReturnValue("Welcome, Alice!"),
        },
      });

      const result = port.format("MODULE.WELCOME", { name: "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("Welcome, Alice!");
      expect(game.i18n?.format).toHaveBeenCalledWith("MODULE.WELCOME", { name: "Alice" });
    });

    it("should return key itself when game.i18n is undefined", () => {
      vi.stubGlobal("game", undefined);

      const result = port.format("MODULE.WELCOME", { name: "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("MODULE.WELCOME");
    });

    it("should handle format errors gracefully", () => {
      vi.stubGlobal("game", {
        i18n: {
          format: vi.fn().mockImplementation(() => {
            throw new Error("Format error");
          }),
        },
      });

      const result = port.format("MODULE.WELCOME", { name: "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("MODULE.WELCOME"); // Fallback to key
    });
  });

  describe("has", () => {
    it("should return true when key exists in game.i18n", () => {
      vi.stubGlobal("game", {
        i18n: {
          has: vi.fn().mockReturnValue(true),
        },
      });

      const result = port.has("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe(true);
      expect(game.i18n?.has).toHaveBeenCalledWith("MODULE.TEST.KEY");
    });

    it("should return false when key does not exist", () => {
      vi.stubGlobal("game", {
        i18n: {
          has: vi.fn().mockReturnValue(false),
        },
      });

      const result = port.has("MODULE.UNKNOWN.KEY");

      expectResultOk(result);
      expect(result.value).toBe(false);
    });

    it("should return false when game.i18n is undefined", () => {
      vi.stubGlobal("game", undefined);

      const result = port.has("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe(false);
    });

    it("should handle has errors gracefully", () => {
      vi.stubGlobal("game", {
        i18n: {
          has: vi.fn().mockImplementation(() => {
            throw new Error("Has error");
          }),
        },
      });

      const result = port.has("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe(false); // Fallback to false
    });
  });

  describe("Dependencies", () => {
    it("should have no dependencies", () => {
      expect(FoundryI18nPortV13.dependencies).toEqual([]);
    });
  });

  describe("disposed state guards", () => {
    beforeEach(() => {
      vi.stubGlobal("game", {
        i18n: {
          localize: vi.fn((key: string) => key),
          format: vi.fn((key: string) => key),
          has: vi.fn(() => true),
        },
      });
    });

    it("should prevent localize after disposal", () => {
      const port = new FoundryI18nPortV13();
      port.dispose();

      const result = port.localize("TEST.KEY");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent format after disposal", () => {
      const port = new FoundryI18nPortV13();
      port.dispose();

      const result = port.format("TEST.KEY", { name: "Test" });

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent has after disposal", () => {
      const port = new FoundryI18nPortV13();
      port.dispose();

      const result = port.has("TEST.KEY");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should be idempotent", () => {
      const port = new FoundryI18nPortV13();
      port.dispose();
      port.dispose();
      port.dispose();

      const result = port.localize("TEST");
      expectResultErr(result);
    });
  });
});
