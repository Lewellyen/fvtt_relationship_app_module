/* eslint-disable @typescript-eslint/naming-convention */
// Test file: Object literals use i18n keys with dots (MODULE.SETTINGS.key format)

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LocalI18nService, DILocalI18nService } from "../LocalI18nService";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("LocalI18nService", () => {
  let service: LocalI18nService;

  beforeEach(() => {
    // Mock navigator for locale detection
    vi.stubGlobal("navigator", {
      language: "en-US",
    });

    service = new LocalI18nService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Locale Detection", () => {
    it("should detect locale from navigator.language", () => {
      expect(service.getCurrentLocale()).toBe("en");
    });

    it("should extract base language from locale code", () => {
      vi.stubGlobal("navigator", { language: "de-DE" });
      const deService = new LocalI18nService();

      expect(deService.getCurrentLocale()).toBe("de");
    });

    it("should fallback to en when navigator is undefined", () => {
      vi.stubGlobal("navigator", undefined);
      const fallbackService = new LocalI18nService();

      expect(fallbackService.getCurrentLocale()).toBe("en");
    });

    it("should fallback to en when navigator.language is undefined", () => {
      vi.stubGlobal("navigator", {});
      const fallbackService = new LocalI18nService();

      expect(fallbackService.getCurrentLocale()).toBe("en");
    });

    it("should fallback to en when language split returns undefined", () => {
      // Edge case: language is empty string or invalid format
      vi.stubGlobal("navigator", { language: "" });
      const fallbackService = new LocalI18nService();

      // Empty string split returns [""], and [0] is "", which is falsy
      // This triggers the ?? "en" fallback
      expect(fallbackService.getCurrentLocale()).toBe("en");
    });
  });

  describe("loadTranslations", () => {
    it("should load translations from object", () => {
      service.loadTranslations({
        "MODULE.TEST.KEY": "Test Value",
        "MODULE.WELCOME": "Welcome, {name}!",
      });

      const result1 = service.translate("MODULE.TEST.KEY");
      const result2 = service.translate("MODULE.WELCOME");

      expectResultOk(result1);
      expectResultOk(result2);
      expect(result1.value).toBe("Test Value");
      expect(result2.value).toBe("Welcome, {name}!");
    });

    it("should handle empty translations object", () => {
      service.loadTranslations({});

      const result = service.translate("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("MODULE.TEST.KEY"); // Fallback to key
    });

    it("should overwrite existing translations", () => {
      service.loadTranslations({ "MODULE.KEY": "First" });
      service.loadTranslations({ "MODULE.KEY": "Second" });

      const result = service.translate("MODULE.KEY");

      expectResultOk(result);
      expect(result.value).toBe("Second");
    });

    it("should merge translations from multiple loads", () => {
      service.loadTranslations({ "MODULE.KEY1": "Value1" });
      service.loadTranslations({ "MODULE.KEY2": "Value2" });

      const result1 = service.translate("MODULE.KEY1");
      const result2 = service.translate("MODULE.KEY2");

      expectResultOk(result1);
      expectResultOk(result2);
      expect(result1.value).toBe("Value1");
      expect(result2.value).toBe("Value2");
    });
  });

  describe("translate", () => {
    it("should return translated value for existing key", () => {
      service.loadTranslations({ "MODULE.TEST.KEY": "Translated Value" });

      const result = service.translate("MODULE.TEST.KEY");

      expectResultOk(result);
      expect(result.value).toBe("Translated Value");
    });

    it("should return key itself when translation not found", () => {
      const result = service.translate("MODULE.UNKNOWN.KEY");

      expectResultOk(result);
      expect(result.value).toBe("MODULE.UNKNOWN.KEY");
    });

    it("should always return ok Result", () => {
      const result1 = service.translate("EXISTS");
      const result2 = service.translate("DOES_NOT_EXIST");

      expectResultOk(result1);
      expectResultOk(result2);
    });
  });

  describe("format", () => {
    it("should replace placeholders in template", () => {
      service.loadTranslations({ "MODULE.WELCOME": "Welcome, {name}!" });

      const result = service.format("MODULE.WELCOME", { name: "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("Welcome, Alice!");
    });

    it("should replace multiple placeholders", () => {
      service.loadTranslations({
        "MODULE.MESSAGE": "{greeting}, {name}! You have {count} messages.",
      });

      const result = service.format("MODULE.MESSAGE", {
        greeting: "Hello",
        name: "Bob",
        count: 5,
      });

      expectResultOk(result);
      expect(result.value).toBe("Hello, Bob! You have 5 messages.");
    });

    it("should handle missing placeholders gracefully", () => {
      service.loadTranslations({ "MODULE.WELCOME": "Welcome, {name}!" });

      const result = service.format("MODULE.WELCOME", {});

      expectResultOk(result);
      expect(result.value).toBe("Welcome, {name}!"); // Placeholder not replaced
    });

    it("should return key with placeholders when translation not found", () => {
      const result = service.format("MODULE.UNKNOWN", { name: "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("MODULE.UNKNOWN"); // Key has no placeholders
    });

    it("should convert non-string values to strings", () => {
      service.loadTranslations({ "MODULE.COUNT": "Count: {value}" });

      const result = service.format("MODULE.COUNT", { value: 42 });

      expectResultOk(result);
      expect(result.value).toBe("Count: 42");
    });

    it("should handle object values by converting to string", () => {
      service.loadTranslations({ "MODULE.DATA": "Data: {obj}" });

      const result = service.format("MODULE.DATA", { obj: { key: "value" } });

      expectResultOk(result);
      expect(result.value).toContain("Data: ");
      expect(result.value).toContain("[object Object]");
    });
  });

  describe("has", () => {
    it("should return true for existing translation", () => {
      service.loadTranslations({ "MODULE.KEY": "Value" });

      const result = service.has("MODULE.KEY");

      expectResultOk(result);
      expect(result.value).toBe(true);
    });

    it("should return false for non-existing translation", () => {
      const result = service.has("MODULE.UNKNOWN.KEY");

      expectResultOk(result);
      expect(result.value).toBe(false);
    });

    it("should always return ok Result", () => {
      const result1 = service.has("EXISTS");
      const result2 = service.has("DOES_NOT_EXIST");

      expectResultOk(result1);
      expectResultOk(result2);
    });
  });

  describe("Locale Management", () => {
    it("should allow setting locale", () => {
      service.setLocale("de");

      expect(service.getCurrentLocale()).toBe("de");
    });

    it("should start with detected locale", () => {
      vi.stubGlobal("navigator", { language: "fr-FR" });
      const frService = new LocalI18nService();

      expect(frService.getCurrentLocale()).toBe("fr");
    });

    it("should allow locale changes", () => {
      expect(service.getCurrentLocale()).toBe("en");

      service.setLocale("de");
      expect(service.getCurrentLocale()).toBe("de");

      service.setLocale("fr");
      expect(service.getCurrentLocale()).toBe("fr");
    });
  });

  describe("Dependencies", () => {
    it("should have no dependencies", () => {
      expect(LocalI18nService.dependencies).toEqual([]);
    });

    it("wrapper should mirror empty dependencies", () => {
      expect(DILocalI18nService.dependencies).toEqual([]);
    });
  });
});
