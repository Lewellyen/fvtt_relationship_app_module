import { describe, it, expect, vi, beforeEach } from "vitest";
import { I18nPortAdapter, DII18nPortAdapter } from "../platform-i18n-port-adapter";
import type { I18nFacadeService } from "@/infrastructure/i18n/I18nFacadeService";
import { ok } from "@/infrastructure/shared/utils/result";
import { i18nFacadeToken } from "@/infrastructure/shared/tokens";

describe("I18nPortAdapter", () => {
  let adapter: I18nPortAdapter;
  let mockI18nFacade: I18nFacadeService;

  beforeEach(() => {
    mockI18nFacade = {
      translate: vi.fn(),
      format: vi.fn(),
      has: vi.fn(),
      loadLocalTranslations: vi.fn(),
    } as unknown as I18nFacadeService;

    adapter = new I18nPortAdapter(mockI18nFacade);
  });

  describe("translate", () => {
    it("should delegate to i18nFacade.translate", () => {
      vi.mocked(mockI18nFacade.translate).mockReturnValue(ok("Translated Text"));

      const result = adapter.translate("MODULE.TEST.KEY", "Fallback");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Translated Text");
      }
      expect(mockI18nFacade.translate).toHaveBeenCalledWith("MODULE.TEST.KEY", "Fallback");
    });

    it("should pass undefined fallback when not provided", () => {
      vi.mocked(mockI18nFacade.translate).mockReturnValue(ok("Translated"));

      adapter.translate("MODULE.TEST.KEY");

      expect(mockI18nFacade.translate).toHaveBeenCalledWith("MODULE.TEST.KEY", undefined);
    });
  });

  describe("format", () => {
    it("should delegate to i18nFacade.format", () => {
      const data = { name: "Alice" };
      vi.mocked(mockI18nFacade.format).mockReturnValue(ok("Hello, Alice!"));

      const result = adapter.format("MODULE.WELCOME", data, "Hello!");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Hello, Alice!");
      }
      expect(mockI18nFacade.format).toHaveBeenCalledWith("MODULE.WELCOME", data, "Hello!");
    });

    it("should pass undefined fallback when not provided", () => {
      const data = { name: "Bob" };
      vi.mocked(mockI18nFacade.format).mockReturnValue(ok("Hello, Bob!"));

      adapter.format("MODULE.WELCOME", data);

      expect(mockI18nFacade.format).toHaveBeenCalledWith("MODULE.WELCOME", data, undefined);
    });
  });

  describe("has", () => {
    it("should delegate to i18nFacade.has", () => {
      vi.mocked(mockI18nFacade.has).mockReturnValue(ok(true));

      const result = adapter.has("MODULE.TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(mockI18nFacade.has).toHaveBeenCalledWith("MODULE.TEST.KEY");
    });

    it("should return false when key does not exist", () => {
      vi.mocked(mockI18nFacade.has).mockReturnValue(ok(false));

      const result = adapter.has("MODULE.UNKNOWN.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe("loadLocalTranslations", () => {
    it("should delegate to i18nFacade.loadLocalTranslations", () => {
      const translations: Record<string, string> = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "MODULE.TEST.KEY": "Test Value",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "MODULE.OTHER.KEY": "Other Value",
      };

      adapter.loadLocalTranslations(translations);

      expect(mockI18nFacade.loadLocalTranslations).toHaveBeenCalledWith(translations);
    });
  });
});

describe("DII18nPortAdapter", () => {
  it("should have correct dependencies", () => {
    expect(DII18nPortAdapter.dependencies).toEqual([i18nFacadeToken]);
  });

  it("should extend I18nPortAdapter", () => {
    const mockI18nFacade = {
      translate: vi.fn().mockReturnValue(ok("Test")),
      format: vi.fn().mockReturnValue(ok("Test")),
      has: vi.fn().mockReturnValue(ok(false)),
      loadLocalTranslations: vi.fn(),
    } as unknown as I18nFacadeService;

    const adapter = new DII18nPortAdapter(mockI18nFacade);

    expect(adapter).toBeInstanceOf(I18nPortAdapter);
    const result = adapter.translate("KEY");
    expect(result.ok).toBe(true);
  });
});
