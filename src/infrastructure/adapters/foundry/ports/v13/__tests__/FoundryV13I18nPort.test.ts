import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  FoundryV13I18nPort,
  createFoundryV13I18nPort,
} from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13I18nPort";
import type { IFoundryI18nAPI } from "@/infrastructure/adapters/foundry/api/foundry-api.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryV13I18nPort", () => {
  let port: FoundryV13I18nPort;
  let mockAPI: IFoundryI18nAPI;

  beforeEach(() => {
    mockAPI = {
      localize: vi.fn((key: string) => key),
      format: vi.fn((key: string) => key),
      has: vi.fn(() => true),
    };
    port = new FoundryV13I18nPort(mockAPI);
  });

  describe("localize", () => {
    it("should return translated string from game.i18n", () => {
      mockAPI.localize = vi.fn().mockReturnValue("Translated Text");

      const result = port.localize("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("Translated Text");
      expect(mockAPI.localize).toHaveBeenCalledWith("MODULE.TEST.KEY");
    });

    it("should return key itself when game.i18n is undefined", () => {
      const portWithoutAPI = new FoundryV13I18nPort(null);

      const result = portWithoutAPI.localize("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("MODULE.TEST.KEY");
    });

    it("should return key when game.i18n is null", () => {
      const portWithNullAPI = new FoundryV13I18nPort(null);

      const result = portWithNullAPI.localize("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("MODULE.TEST.KEY");
    });

    it("should handle localize errors gracefully", () => {
      mockAPI.localize = vi.fn().mockImplementation(() => {
        throw new Error("Localize error");
      });

      const result = port.localize("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("MODULE.TEST.KEY"); // Fallback to key
    });
  });

  describe("format", () => {
    it("should return formatted string from game.i18n", () => {
      mockAPI.format = vi.fn().mockReturnValue("Welcome, Alice!");

      const result = port.format("MODULE.WELCOME", { name: "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("Welcome, Alice!");
      expect(mockAPI.format).toHaveBeenCalledWith("MODULE.WELCOME", { name: "Alice" });
    });

    it("should return key itself when game.i18n is undefined", () => {
      const portWithoutAPI = new FoundryV13I18nPort(null);

      const result = portWithoutAPI.format("MODULE.WELCOME", { name: "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("MODULE.WELCOME");
    });

    it("should handle format errors gracefully", () => {
      mockAPI.format = vi.fn().mockImplementation(() => {
        throw new Error("Format error");
      });

      const result = port.format("MODULE.WELCOME", { name: "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("MODULE.WELCOME"); // Fallback to key
    });
  });

  describe("has", () => {
    it("should return true when key exists in game.i18n", () => {
      mockAPI.has = vi.fn().mockReturnValue(true);

      const result = port.has("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe(true);
      expect(mockAPI.has).toHaveBeenCalledWith("MODULE.TEST.KEY");
    });

    it("should return false when key does not exist", () => {
      mockAPI.has = vi.fn().mockReturnValue(false);

      const result = port.has("MODULE.UNKNOWN.KEY");

      expectResultOk(result);
      expect(result.value).toBe(false);
    });

    it("should return false when game.i18n is undefined", () => {
      const portWithoutAPI = new FoundryV13I18nPort(null);

      const result = portWithoutAPI.has("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe(false);
    });

    it("should handle has errors gracefully", () => {
      mockAPI.has = vi.fn().mockImplementation(() => {
        throw new Error("Has error");
      });

      const result = port.has("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe(false); // Fallback to false
    });
  });

  describe("Dependencies", () => {
    it("should have no dependencies", () => {
      expect(FoundryV13I18nPort.dependencies).toEqual([]);
    });
  });

  describe("disposed state guards", () => {
    it("should prevent localize after disposal", () => {
      port.dispose();

      const result = port.localize("TEST.KEY");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent format after disposal", () => {
      port.dispose();

      const result = port.format("TEST.KEY", { name: "Test" });

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent has after disposal", () => {
      port.dispose();

      const result = port.has("TEST.KEY");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should be idempotent", () => {
      port.dispose();
      port.dispose();
      port.dispose();

      const result = port.localize("TEST");
      expectResultErr(result);
    });
  });

  describe("createFoundryV13I18nPort factory", () => {
    beforeEach(() => {
      vi.unstubAllGlobals();
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("should return port with null API when game is undefined", () => {
      // @ts-expect-error - intentionally undefined for test
      global.game = undefined;

      const port = createFoundryV13I18nPort();
      expect(port).toBeInstanceOf(FoundryV13I18nPort);

      // Should gracefully degrade (return key)
      const result = port.localize("TEST.KEY");
      expectResultOk(result);
      expect(result.value).toBe("TEST.KEY");
    });

    it("should return port with null API when game.i18n is missing", () => {
      // @ts-expect-error - intentionally missing i18n for test
      global.game = {};

      const port = createFoundryV13I18nPort();
      const result = port.localize("TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("TEST.KEY");
    });

    it("should create port successfully when game.i18n is available", () => {
      const mockLocalize = vi.fn((key: string) => `translated:${key}`);
      const mockFormat = vi.fn((key: string) => `formatted:${key}`);
      const mockHas = vi.fn(() => true);

      // @ts-expect-error - intentionally typed for test
      global.game = {
        i18n: {
          localize: mockLocalize,
          format: mockFormat,
          has: mockHas,
        },
      };

      const port = createFoundryV13I18nPort();
      expect(port).toBeInstanceOf(FoundryV13I18nPort);

      // Test that the port uses the real game.i18n API
      const result = port.localize("TEST.KEY");
      expectResultOk(result);
      expect(result.value).toBe("translated:TEST.KEY");
      expect(mockLocalize).toHaveBeenCalledWith("TEST.KEY");
    });

    it("should use game.i18n.format through factory-created port", () => {
      const mockFormat = vi.fn(
        (key: string, data: Record<string, string>) => `formatted:${key}:${data.name}`
      );
      // @ts-expect-error - intentionally typed for test
      global.game = {
        i18n: {
          localize: vi.fn((key: string) => key),
          format: mockFormat,
          has: vi.fn(() => true),
        },
      };

      const port = createFoundryV13I18nPort();
      const result = port.format("WELCOME", { name: "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("formatted:WELCOME:Alice");
      expect(mockFormat).toHaveBeenCalledWith("WELCOME", { name: "Alice" });
    });

    it("should use game.i18n.has through factory-created port", () => {
      const mockHas = vi.fn((key: string) => key === "EXISTS");
      // @ts-expect-error - intentionally typed for test
      global.game = {
        i18n: {
          localize: vi.fn((key: string) => key),
          format: vi.fn((key: string) => key),
          has: mockHas,
        },
      };

      const port = createFoundryV13I18nPort();
      const result1 = port.has("EXISTS");
      const result2 = port.has("MISSING");

      expectResultOk(result1);
      expect(result1.value).toBe(true);
      expectResultOk(result2);
      expect(result2.value).toBe(false);
      expect(mockHas).toHaveBeenCalledWith("EXISTS");
      expect(mockHas).toHaveBeenCalledWith("MISSING");
    });
  });
});
