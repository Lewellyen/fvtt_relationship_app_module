import { describe, it, expect, vi, beforeEach } from "vitest";
import { I18nFacadeService, DII18nFacadeService } from "../I18nFacadeService";
import type { LocalI18nService } from "../LocalI18nService";
import type { TranslationHandler } from "../i18n/TranslationHandler.interface";

describe("I18nFacadeService", () => {
  let facade: I18nFacadeService;
  let mockHandlerChain: TranslationHandler;
  let mockLocalI18n: LocalI18nService;

  beforeEach(() => {
    mockHandlerChain = {
      handle: vi.fn(),
      has: vi.fn(),
      setNext: vi.fn(),
    } as unknown as TranslationHandler;

    mockLocalI18n = {
      translate: vi.fn(),
      format: vi.fn(),
      has: vi.fn(),
      loadTranslations: vi.fn(),
    } as unknown as LocalI18nService;

    facade = new I18nFacadeService(mockHandlerChain, mockLocalI18n);
  });

  describe("translate", () => {
    it("should delegate to handler chain", () => {
      vi.mocked(mockHandlerChain.handle).mockReturnValue("Translated Text");

      const result = facade.translate("MODULE.TEST.KEY");

      expect(result).toBe("Translated Text");
      expect(mockHandlerChain.handle).toHaveBeenCalledWith("MODULE.TEST.KEY", undefined, undefined);
    });

    it("should pass fallback parameter to chain", () => {
      vi.mocked(mockHandlerChain.handle).mockReturnValue("Fallback Text");

      const result = facade.translate("MODULE.TEST.KEY", "Fallback Text");

      expect(result).toBe("Fallback Text");
      expect(mockHandlerChain.handle).toHaveBeenCalledWith(
        "MODULE.TEST.KEY",
        undefined,
        "Fallback Text"
      );
    });

    it("should return key when chain returns null", () => {
      vi.mocked(mockHandlerChain.handle).mockReturnValue(null);

      const result = facade.translate("MODULE.TEST.KEY");

      expect(result).toBe("MODULE.TEST.KEY");
    });
  });

  describe("format", () => {
    it("should delegate to handler chain with data", () => {
      vi.mocked(mockHandlerChain.handle).mockReturnValue("Welcome, Alice!");

      const result = facade.format("MODULE.WELCOME", { name: "Alice" });

      expect(result).toBe("Welcome, Alice!");
      expect(mockHandlerChain.handle).toHaveBeenCalledWith(
        "MODULE.WELCOME",
        { name: "Alice" },
        undefined
      );
    });

    it("should pass fallback to chain", () => {
      vi.mocked(mockHandlerChain.handle).mockReturnValue("Hi!");

      const result = facade.format("MODULE.WELCOME", { name: "Bob" }, "Hi!");

      expect(result).toBe("Hi!");
      expect(mockHandlerChain.handle).toHaveBeenCalledWith(
        "MODULE.WELCOME",
        { name: "Bob" },
        "Hi!"
      );
    });

    it("should return key when chain returns null", () => {
      vi.mocked(mockHandlerChain.handle).mockReturnValue(null);

      const result = facade.format("MODULE.WELCOME", {});

      expect(result).toBe("MODULE.WELCOME");
    });
  });

  describe("has", () => {
    it("should delegate to handler chain", () => {
      vi.mocked(mockHandlerChain.has).mockReturnValue(true);

      const result = facade.has("MODULE.TEST.KEY");

      expect(result).toBe(true);
      expect(mockHandlerChain.has).toHaveBeenCalledWith("MODULE.TEST.KEY");
    });

    it("should return false when chain returns false", () => {
      vi.mocked(mockHandlerChain.has).mockReturnValue(false);

      const result = facade.has("MODULE.UNKNOWN.KEY");

      expect(result).toBe(false);
    });
  });

  describe("loadLocalTranslations", () => {
    it("should delegate to LocalI18nService", () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const translations = { "MODULE.KEY": "Value" };

      facade.loadLocalTranslations(translations);

      expect(mockLocalI18n.loadTranslations).toHaveBeenCalledWith(translations);
    });

    it("should allow loading multiple translation sets", () => {
      /* eslint-disable @typescript-eslint/naming-convention */
      const translations1 = { "MODULE.KEY1": "Value1" };
      const translations2 = { "MODULE.KEY2": "Value2" };
      /* eslint-enable @typescript-eslint/naming-convention */

      facade.loadLocalTranslations(translations1);
      facade.loadLocalTranslations(translations2);

      expect(mockLocalI18n.loadTranslations).toHaveBeenCalledTimes(2);
      expect(mockLocalI18n.loadTranslations).toHaveBeenNthCalledWith(1, translations1);
      expect(mockLocalI18n.loadTranslations).toHaveBeenNthCalledWith(2, translations2);
    });
  });

  describe("Dependencies", () => {
    it("should have correct static dependencies", () => {
      expect(DII18nFacadeService.dependencies).toHaveLength(2);
      expect(DII18nFacadeService.dependencies[0]).toBeDefined();
      expect(DII18nFacadeService.dependencies[1]).toBeDefined();
    });
  });
});
