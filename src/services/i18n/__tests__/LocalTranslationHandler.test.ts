import { describe, it, expect, vi, beforeEach } from "vitest";
import { LocalTranslationHandler } from "../LocalTranslationHandler";
import type { LocalI18nService } from "@/services/LocalI18nService";
import { ok, err } from "@/utils/functional/result";

describe("LocalTranslationHandler", () => {
  let handler: LocalTranslationHandler;
  let mockLocalI18n: LocalI18nService;

  beforeEach(() => {
    mockLocalI18n = {
      translate: vi.fn(),
      format: vi.fn(),
      has: vi.fn(),
      loadTranslations: vi.fn(),
      getCurrentLocale: vi.fn(),
      setLocale: vi.fn(),
    } as unknown as LocalI18nService;

    handler = new LocalTranslationHandler(mockLocalI18n);
  });

  describe("doHandle - translate (no data)", () => {
    it("should return translation when local has it", () => {
      vi.mocked(mockLocalI18n.translate).mockReturnValue(ok("Local Translation"));

      const result = handler.handle("TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Local Translation");
      }
      expect(mockLocalI18n.translate).toHaveBeenCalledWith("TEST.KEY");
    });

    it("should return error when local returns the key itself (not translated)", () => {
      vi.mocked(mockLocalI18n.translate).mockReturnValue(ok("TEST.KEY"));

      const result = handler.handle("TEST.KEY");

      expect(result.ok).toBe(false); // Can't handle, delegate to next
      // When no nextHandler, AbstractTranslationHandler returns generic error
      if (!result.ok) {
        expect(result.error).toContain("Translation key not found");
      }
    });

    it("should return error when local returns error", () => {
      vi.mocked(mockLocalI18n.translate).mockReturnValue(err("Translation error"));

      const result = handler.handle("TEST.KEY");

      expect(result.ok).toBe(false);
      // When no nextHandler, AbstractTranslationHandler returns generic error
      if (!result.ok) {
        expect(result.error).toContain("Translation key not found");
      }
    });
  });

  describe("doHandle - format (with data)", () => {
    it("should use format when data is provided", () => {
      vi.mocked(mockLocalI18n.format).mockReturnValue(ok("Hello, Bob!"));

      const result = handler.handle("TEST.GREETING", { name: "Bob" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Hello, Bob!");
      }
      expect(mockLocalI18n.format).toHaveBeenCalledWith("TEST.GREETING", { name: "Bob" });
      expect(mockLocalI18n.translate).not.toHaveBeenCalled();
    });

    it("should return error when format returns key (not formatted)", () => {
      vi.mocked(mockLocalI18n.format).mockReturnValue(ok("TEST.GREETING"));

      const result = handler.handle("TEST.GREETING", { name: "Bob" });

      expect(result.ok).toBe(false);
      // When no nextHandler, AbstractTranslationHandler returns generic error
      if (!result.ok) {
        expect(result.error).toContain("Translation key not found");
      }
    });

    it("should return error when format returns error", () => {
      vi.mocked(mockLocalI18n.format).mockReturnValue(err("Format failed"));

      const result = handler.handle("TEST.GREETING", { name: "Bob" });

      expect(result.ok).toBe(false);
      // When no nextHandler, AbstractTranslationHandler returns generic error
      if (!result.ok) {
        expect(result.error).toContain("Translation key not found");
      }
    });
  });

  describe("doHas", () => {
    it("should return true when local has the key", () => {
      vi.mocked(mockLocalI18n.has).mockReturnValue(ok(true));

      const result = handler.has("TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(mockLocalI18n.has).toHaveBeenCalledWith("TEST.KEY");
    });

    it("should return false when local doesn't have the key", () => {
      vi.mocked(mockLocalI18n.has).mockReturnValue(ok(false));

      const result = handler.has("TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it("should return error when local returns error", () => {
      vi.mocked(mockLocalI18n.has).mockReturnValue(err("Error"));

      const result = handler.has("TEST.KEY");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Failed to check local i18n for key");
      }
    });
  });

  describe("Chaining", () => {
    it("should delegate to next handler when can't handle", () => {
      const nextHandler = {
        setNext: vi.fn().mockReturnThis(),
        handle: vi.fn().mockReturnValue(ok("Next Handler Result")),
        has: vi.fn().mockReturnValue(ok(false)),
      };

      handler.setNext(nextHandler);
      vi.mocked(mockLocalI18n.translate).mockReturnValue(ok("TEST.KEY")); // Not translated

      const result = handler.handle("TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Next Handler Result");
      }
      expect(nextHandler.handle).toHaveBeenCalledWith("TEST.KEY", undefined, undefined);
    });
  });
});
