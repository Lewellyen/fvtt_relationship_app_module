import { describe, it, expect, vi, beforeEach } from "vitest";
import { I18nFacadeService } from "../I18nFacadeService";
import type { FoundryI18nService } from "@/foundry/services/FoundryI18nService";
import type { LocalI18nService } from "../LocalI18nService";
import { ok, err } from "@/utils/result";

describe("I18nFacadeService", () => {
  let facade: I18nFacadeService;
  let mockFoundryI18n: FoundryI18nService;
  let mockLocalI18n: LocalI18nService;

  beforeEach(() => {
    mockFoundryI18n = {
      localize: vi.fn(),
      format: vi.fn(),
      has: vi.fn(),
    } as unknown as FoundryI18nService;

    mockLocalI18n = {
      translate: vi.fn(),
      format: vi.fn(),
      has: vi.fn(),
      loadTranslations: vi.fn(),
    } as unknown as LocalI18nService;

    facade = new I18nFacadeService(mockFoundryI18n, mockLocalI18n);
  });

  describe("translate", () => {
    it("should use Foundry i18n when available", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(ok("Foundry Translation"));

      const result = facade.translate("MODULE.TEST.KEY");

      expect(result).toBe("Foundry Translation");
      expect(mockFoundryI18n.localize).toHaveBeenCalledWith("MODULE.TEST.KEY");
      expect(mockLocalI18n.translate).not.toHaveBeenCalled();
    });

    it("should fallback to local i18n when Foundry returns error", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(
        err({ code: "OPERATION_FAILED" as const, message: "Not found" })
      );
      vi.mocked(mockLocalI18n.translate).mockReturnValue(ok("Local Translation"));

      const result = facade.translate("MODULE.TEST.KEY");

      expect(result).toBe("Local Translation");
      expect(mockFoundryI18n.localize).toHaveBeenCalled();
      expect(mockLocalI18n.translate).toHaveBeenCalledWith("MODULE.TEST.KEY");
    });

    it("should fallback to local i18n when Foundry returns key itself", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(ok("MODULE.TEST.KEY")); // Not translated
      vi.mocked(mockLocalI18n.translate).mockReturnValue(ok("Local Translation"));

      const result = facade.translate("MODULE.TEST.KEY");

      expect(result).toBe("Local Translation");
      expect(mockLocalI18n.translate).toHaveBeenCalled();
    });

    it("should use provided fallback when both sources fail", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(ok("MODULE.TEST.KEY")); // Not translated
      vi.mocked(mockLocalI18n.translate).mockReturnValue(ok("MODULE.TEST.KEY")); // Not translated

      const result = facade.translate("MODULE.TEST.KEY", "Default Text");

      expect(result).toBe("Default Text");
    });

    it("should return key when no fallback provided and both sources fail", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(ok("MODULE.TEST.KEY"));
      vi.mocked(mockLocalI18n.translate).mockReturnValue(ok("MODULE.TEST.KEY"));

      const result = facade.translate("MODULE.TEST.KEY");

      expect(result).toBe("MODULE.TEST.KEY");
    });

    it("should prefer Foundry over local when both have translations", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(ok("Foundry Translation"));
      vi.mocked(mockLocalI18n.translate).mockReturnValue(ok("Local Translation"));

      const result = facade.translate("MODULE.TEST.KEY");

      expect(result).toBe("Foundry Translation");
      expect(mockLocalI18n.translate).not.toHaveBeenCalled(); // Short-circuit
    });
  });

  describe("format", () => {
    it("should use Foundry i18n when available", () => {
      vi.mocked(mockFoundryI18n.format).mockReturnValue(ok("Welcome, Alice!"));

      const result = facade.format("MODULE.WELCOME", { name: "Alice" });

      expect(result).toBe("Welcome, Alice!");
      expect(mockFoundryI18n.format).toHaveBeenCalledWith("MODULE.WELCOME", { name: "Alice" });
      expect(mockLocalI18n.format).not.toHaveBeenCalled();
    });

    it("should fallback to local i18n when Foundry fails", () => {
      vi.mocked(mockFoundryI18n.format).mockReturnValue(
        err({ code: "OPERATION_FAILED" as const, message: "Not found" })
      );
      vi.mocked(mockLocalI18n.format).mockReturnValue(ok("Hello, Bob!"));

      const result = facade.format("MODULE.WELCOME", { name: "Bob" });

      expect(result).toBe("Hello, Bob!");
      expect(mockLocalI18n.format).toHaveBeenCalledWith("MODULE.WELCOME", { name: "Bob" });
    });

    it("should use fallback when both sources fail", () => {
      vi.mocked(mockFoundryI18n.format).mockReturnValue(ok("MODULE.WELCOME")); // Not translated
      vi.mocked(mockLocalI18n.format).mockReturnValue(ok("MODULE.WELCOME")); // Not translated

      const result = facade.format("MODULE.WELCOME", { name: "Charlie" }, "Hi!");

      expect(result).toBe("Hi!");
    });

    it("should return key when no fallback provided and both sources fail", () => {
      vi.mocked(mockFoundryI18n.format).mockReturnValue(ok("MODULE.WELCOME"));
      vi.mocked(mockLocalI18n.format).mockReturnValue(ok("MODULE.WELCOME"));

      const result = facade.format("MODULE.WELCOME", {});

      expect(result).toBe("MODULE.WELCOME");
    });

    it("should fallback to local when Foundry returns unformatted key", () => {
      vi.mocked(mockFoundryI18n.format).mockReturnValue(ok("MODULE.WELCOME")); // Not formatted (returns key)
      vi.mocked(mockLocalI18n.format).mockReturnValue(ok("Welcome, Alice!"));

      const result = facade.format("MODULE.WELCOME", { name: "Alice" });

      expect(result).toBe("Welcome, Alice!");
      expect(mockLocalI18n.format).toHaveBeenCalled();
    });
  });

  describe("has", () => {
    it("should return true when Foundry has the key", () => {
      vi.mocked(mockFoundryI18n.has).mockReturnValue(ok(true));

      const result = facade.has("MODULE.TEST.KEY");

      expect(result).toBe(true);
      expect(mockFoundryI18n.has).toHaveBeenCalledWith("MODULE.TEST.KEY");
      expect(mockLocalI18n.has).not.toHaveBeenCalled();
    });

    it("should check local i18n when Foundry returns false", () => {
      vi.mocked(mockFoundryI18n.has).mockReturnValue(ok(false));
      vi.mocked(mockLocalI18n.has).mockReturnValue(ok(true));

      const result = facade.has("MODULE.TEST.KEY");

      expect(result).toBe(true);
      expect(mockLocalI18n.has).toHaveBeenCalledWith("MODULE.TEST.KEY");
    });

    it("should return false when both sources return false", () => {
      vi.mocked(mockFoundryI18n.has).mockReturnValue(ok(false));
      vi.mocked(mockLocalI18n.has).mockReturnValue(ok(false));

      const result = facade.has("MODULE.UNKNOWN.KEY");

      expect(result).toBe(false);
    });

    it("should handle Foundry errors by checking local", () => {
      vi.mocked(mockFoundryI18n.has).mockReturnValue(
        err({ code: "OPERATION_FAILED" as const, message: "Error" })
      );
      vi.mocked(mockLocalI18n.has).mockReturnValue(ok(true));

      const result = facade.has("MODULE.TEST.KEY");

      expect(result).toBe(true);
    });

    it("should handle local errors gracefully", () => {
      vi.mocked(mockFoundryI18n.has).mockReturnValue(ok(false));
      vi.mocked(mockLocalI18n.has).mockReturnValue(err("Local error"));

      const result = facade.has("MODULE.TEST.KEY");

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
      expect(I18nFacadeService.dependencies).toHaveLength(2);
      expect(I18nFacadeService.dependencies[0]).toBeDefined();
      expect(I18nFacadeService.dependencies[1]).toBeDefined();
    });
  });

  describe("Fallback Strategy", () => {
    it("should try Foundry first, then local, then fallback (full chain)", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(
        err({ code: "OPERATION_FAILED" as const, message: "Foundry failed" })
      );
      vi.mocked(mockLocalI18n.translate).mockReturnValue(err("Local failed"));

      const result = facade.translate("MODULE.KEY", "Ultimate Fallback");

      expect(result).toBe("Ultimate Fallback");
      expect(mockFoundryI18n.localize).toHaveBeenCalled();
      expect(mockLocalI18n.translate).toHaveBeenCalled();
    });

    it("should short-circuit when Foundry succeeds", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(ok("Foundry Success"));
      vi.mocked(mockLocalI18n.translate).mockReturnValue(ok("Should not be called"));

      const result = facade.translate("MODULE.KEY");

      expect(result).toBe("Foundry Success");
      expect(mockLocalI18n.translate).not.toHaveBeenCalled();
    });

    it("should short-circuit when local succeeds after Foundry fails", () => {
      vi.mocked(mockFoundryI18n.localize).mockReturnValue(ok("MODULE.KEY")); // Not translated
      vi.mocked(mockLocalI18n.translate).mockReturnValue(ok("Local Success"));

      const result = facade.translate("MODULE.KEY", "Should not use this");

      expect(result).toBe("Local Success");
      // Fallback parameter should not be used
    });
  });
});
