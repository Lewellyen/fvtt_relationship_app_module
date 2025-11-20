/* eslint-disable @typescript-eslint/naming-convention */
// Test file: Object literals use i18n keys with dots (MODULE.SETTINGS.key format)

/**
 * Regression tests for LocalI18nService
 * Tests edge cases with special regex characters in placeholders
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LocalI18nService } from "@/infrastructure/i18n/LocalI18nService";
import { expectResultOk } from "@/test/utils/test-helpers";

describe("LocalI18nService - Regression Tests", () => {
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

  describe("Placeholder Regex Escaping", () => {
    it("should handle placeholder with dot (.) character", () => {
      service.loadTranslations({
        "MODULE.USER_GREETING": "Hello, {user.name}!",
      });

      const result = service.format("MODULE.USER_GREETING", { "user.name": "Alice" });

      expectResultOk(result);
      expect(result.value).toBe("Hello, Alice!");
    });

    it("should handle placeholder with square brackets ([])", () => {
      service.loadTranslations({
        "MODULE.ARRAY_ACCESS": "First item: {items[0]}",
      });

      const result = service.format("MODULE.ARRAY_ACCESS", { "items[0]": "Apple" });

      expectResultOk(result);
      expect(result.value).toBe("First item: Apple");
    });

    it("should handle placeholder with dollar sign ($)", () => {
      service.loadTranslations({
        "MODULE.PRICE": "Total: {price$}",
      });

      const result = service.format("MODULE.PRICE", { price$: "99.99" });

      expectResultOk(result);
      expect(result.value).toBe("Total: 99.99");
    });

    it("should handle placeholder with parentheses ()", () => {
      service.loadTranslations({
        "MODULE.FUNCTION_CALL": "Result: {func()}",
      });

      const result = service.format("MODULE.FUNCTION_CALL", { "func()": "42" });

      expectResultOk(result);
      expect(result.value).toBe("Result: 42");
    });

    it("should handle placeholder with asterisk (*)", () => {
      service.loadTranslations({
        "MODULE.WILDCARD": "Pattern: {file*.txt}",
      });

      const result = service.format("MODULE.WILDCARD", { "file*.txt": "document.txt" });

      expectResultOk(result);
      expect(result.value).toBe("Pattern: document.txt");
    });

    it("should handle placeholder with plus (+)", () => {
      service.loadTranslations({
        "MODULE.ADDITION": "Sum: {a+b}",
      });

      const result = service.format("MODULE.ADDITION", { "a+b": "10" });

      expectResultOk(result);
      expect(result.value).toBe("Sum: 10");
    });

    it("should handle placeholder with question mark (?)", () => {
      service.loadTranslations({
        "MODULE.OPTIONAL": "Optional: {value?}",
      });

      const result = service.format("MODULE.OPTIONAL", { "value?": "present" });

      expectResultOk(result);
      expect(result.value).toBe("Optional: present");
    });

    it("should handle placeholder with caret (^)", () => {
      service.loadTranslations({
        "MODULE.POWER": "Power: {x^2}",
      });

      const result = service.format("MODULE.POWER", { "x^2": "16" });

      expectResultOk(result);
      expect(result.value).toBe("Power: 16");
    });

    it("should handle placeholder with pipe (|)", () => {
      service.loadTranslations({
        "MODULE.OR": "Choice: {a|b}",
      });

      const result = service.format("MODULE.OR", { "a|b": "option_a" });

      expectResultOk(result);
      expect(result.value).toBe("Choice: option_a");
    });

    it("should handle placeholder with backslash (\\)", () => {
      service.loadTranslations({
        "MODULE.PATH": "Path: {path\\to\\file}",
      });

      const result = service.format("MODULE.PATH", { "path\\to\\file": "C:\\Users\\Alice" });

      expectResultOk(result);
      expect(result.value).toBe("Path: C:\\Users\\Alice");
    });

    it("should handle placeholder with multiple special characters combined", () => {
      service.loadTranslations({
        "MODULE.COMPLEX": "Complex: {user.items[0].$price}",
      });

      const result = service.format("MODULE.COMPLEX", { "user.items[0].$price": "49.99" });

      expectResultOk(result);
      expect(result.value).toBe("Complex: 49.99");
    });

    it("should handle multiple placeholders with special characters in same template", () => {
      service.loadTranslations({
        "MODULE.MULTIPLE": "User: {user.name}, Price: {item.$price}, Count: {items[0]}",
      });

      const result = service.format("MODULE.MULTIPLE", {
        "user.name": "Bob",
        "item.$price": "29.99",
        "items[0]": "5",
      });

      expectResultOk(result);
      expect(result.value).toBe("User: Bob, Price: 29.99, Count: 5");
    });

    it("should not replace partial matches when placeholder has special characters", () => {
      service.loadTranslations({
        "MODULE.PARTIAL": "Value: {a.b} and {a.bc}",
      });

      const result = service.format("MODULE.PARTIAL", {
        "a.b": "first",
        "a.bc": "second",
      });

      expectResultOk(result);
      expect(result.value).toBe("Value: first and second");
    });

    it("should handle placeholder that looks like a regex pattern", () => {
      service.loadTranslations({
        "MODULE.REGEX": "Pattern: {[a-z]+}",
      });

      const result = service.format("MODULE.REGEX", { "[a-z]+": "matched" });

      expectResultOk(result);
      expect(result.value).toBe("Pattern: matched");
    });

    it("should handle empty placeholder with special characters", () => {
      service.loadTranslations({
        "MODULE.EMPTY": "Before {.} After",
      });

      const result = service.format("MODULE.EMPTY", { ".": "middle" });

      expectResultOk(result);
      expect(result.value).toBe("Before middle After");
    });
  });

  describe("Edge Cases with Normal Placeholders", () => {
    it("should still work with normal alphanumeric placeholders", () => {
      service.loadTranslations({
        "MODULE.NORMAL": "Hello, {name}! You have {count} messages.",
      });

      const result = service.format("MODULE.NORMAL", {
        name: "Charlie",
        count: 3,
      });

      expectResultOk(result);
      expect(result.value).toBe("Hello, Charlie! You have 3 messages.");
    });

    it("should handle mix of normal and special character placeholders", () => {
      service.loadTranslations({
        "MODULE.MIXED": "User {name} has {user.email} with {items[0]} items",
      });

      const result = service.format("MODULE.MIXED", {
        name: "Dave",
        "user.email": "dave@example.com",
        "items[0]": "10",
      });

      expectResultOk(result);
      expect(result.value).toBe("User Dave has dave@example.com with 10 items");
    });
  });
});
