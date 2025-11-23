import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryTranslationHandler } from "@/infrastructure/i18n/FoundryTranslationHandler";
import type { FoundryI18nPort } from "@/infrastructure/adapters/foundry/services/FoundryI18nPort";
import { ok, err } from "@/infrastructure/shared/utils/result";

describe("FoundryTranslationHandler", () => {
  let handler: FoundryTranslationHandler;
  let mockFoundryI18n: FoundryI18nPort;

  beforeEach(() => {
    mockFoundryI18n = {
      localize: vi.fn(),
      format: vi.fn(),
      has: vi.fn(),
    } as unknown as FoundryI18nPort;

    handler = new FoundryTranslationHandler(mockFoundryI18n);
  });

  describe("doHandle - translate (no data)", () => {
    it("should return translation when Foundry has it", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(ok("Foundry Translation"));

      const result = handler.handle("TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Foundry Translation");
      }
      expect(mockFoundryI18n.localize).toHaveBeenCalledWith("TEST.KEY");
    });

    it("should return error when Foundry returns the key itself (not translated)", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(ok("TEST.KEY"));

      const result = handler.handle("TEST.KEY");

      expect(result.ok).toBe(false); // Can't handle, delegate to next
      // When no nextHandler, AbstractTranslationHandler returns generic error
      if (!result.ok) {
        expect(result.error).toContain("Translation key not found");
      }
    });

    it("should return error when Foundry returns error", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(
        err({ code: "OPERATION_FAILED" as const, message: "Not found" })
      );

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
      vi.mocked(mockFoundryI18n.format).mockReturnValue(ok("Welcome, Alice!"));

      const result = handler.handle("TEST.WELCOME", { name: "Alice" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Welcome, Alice!");
      }
      expect(mockFoundryI18n.format).toHaveBeenCalledWith("TEST.WELCOME", { name: "Alice" });
      expect(mockFoundryI18n.localize).not.toHaveBeenCalled();
    });

    it("should return error when format returns key (not formatted)", () => {
      vi.mocked(mockFoundryI18n.format).mockReturnValue(ok("TEST.WELCOME"));

      const result = handler.handle("TEST.WELCOME", { name: "Alice" });

      expect(result.ok).toBe(false);
      // When no nextHandler, AbstractTranslationHandler returns generic error
      if (!result.ok) {
        expect(result.error).toContain("Translation key not found");
      }
    });

    it("should return error when format returns error", () => {
      vi.mocked(mockFoundryI18n.format).mockReturnValue(
        err({ code: "OPERATION_FAILED" as const, message: "Format failed" })
      );

      const result = handler.handle("TEST.WELCOME", { name: "Alice" });

      expect(result.ok).toBe(false);
      // When no nextHandler, AbstractTranslationHandler returns generic error
      if (!result.ok) {
        expect(result.error).toContain("Translation key not found");
      }
    });
  });

  describe("doHas", () => {
    it("should return true when Foundry has the key", () => {
      vi.mocked(mockFoundryI18n.has).mockReturnValue(ok(true));

      const result = handler.has("TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(mockFoundryI18n.has).toHaveBeenCalledWith("TEST.KEY");
    });

    it("should return false when Foundry doesn't have the key", () => {
      vi.mocked(mockFoundryI18n.has).mockReturnValue(ok(false));

      const result = handler.has("TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it("should return error when Foundry returns error", () => {
      vi.mocked(mockFoundryI18n.has).mockReturnValue(
        err({ code: "OPERATION_FAILED" as const, message: "Error" })
      );

      const result = handler.has("TEST.KEY");

      // AbstractTranslationHandler propagates errors from doHas()
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Failed to check Foundry i18n for key");
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
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(ok("TEST.KEY")); // Not translated

      const result = handler.handle("TEST.KEY");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("Next Handler Result");
      }
      expect(nextHandler.handle).toHaveBeenCalledWith("TEST.KEY", undefined, undefined);
    });
  });
});
