/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for testing invalid journal entry types

import { describe, it, expect } from "vitest";
import { validateJournalEntries, sanitizeId, sanitizeHtml } from "../schemas";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("Journal Entry Validation", () => {
  it("should validate valid journal entries", () => {
    const entries = [
      { id: "journal-1", name: "Test", getFlag: () => {} },
      { id: "journal-2", flags: {} },
    ];

    const result = validateJournalEntries(entries);
    expectResultOk(result);
    expect(result.value).toHaveLength(2);
    expect(result.value[0]?.id).toBe("journal-1");
    expect(result.value[1]?.id).toBe("journal-2");
  });

  it("should reject entries without id", () => {
    const entries = [{ name: "Test" }];

    const result = validateJournalEntries(entries);
    expectResultErr(result);
    expect(result.error.code).toBe("VALIDATION_FAILED");
    expect(result.error.message).toContain("validation failed");
  });

  it("should reject non-array input", () => {
    const result = validateJournalEntries("not an array" as any);
    expectResultErr(result);
    expect(result.error.code).toBe("VALIDATION_FAILED");
  });

  it("should accept entries with optional fields", () => {
    const entries = [
      { id: "journal-1" }, // Minimales Entry
      { id: "journal-2", name: "With name", flags: { test: true } },
    ];

    const result = validateJournalEntries(entries);
    expectResultOk(result);
    expect(result.value).toHaveLength(2);
  });

  it("should reject entries with invalid id type", () => {
    const entries = [{ id: 123, name: "Invalid" }]; // id muss string sein

    const result = validateJournalEntries(entries);
    expectResultErr(result);
    expect(result.error.code).toBe("VALIDATION_FAILED");
  });
});

describe("Sanitization", () => {
  describe("sanitizeId", () => {
    it("should preserve valid IDs", () => {
      expect(sanitizeId("valid-id_123")).toBe("valid-id_123");
      expect(sanitizeId("journal-abc-def")).toBe("journal-abc-def");
      expect(sanitizeId("ID_WITH_UNDERSCORE")).toBe("ID_WITH_UNDERSCORE");
    });

    it("should remove special characters", () => {
      expect(sanitizeId("../../../etc/passwd")).toBe("etcpasswd");
      expect(sanitizeId("journal@#$%^&*()!")).toBe("journal");
      expect(sanitizeId("test<>?/\\|")).toBe("test");
    });

    it("should prevent XSS attacks", () => {
      expect(sanitizeId("<script>alert('xss')</script>")).toBe("scriptalertxssscript");
      expect(sanitizeId("'; DROP TABLE users; --")).toBe("DROPTABLEusers--"); // Hyphens are allowed
    });

    it("should handle empty strings", () => {
      expect(sanitizeId("")).toBe("");
    });

    it("should handle strings with only special chars", () => {
      expect(sanitizeId("@#$%^&*()")).toBe("");
    });
  });

  describe("sanitizeHtml", () => {
    it("should preserve normal text", () => {
      expect(sanitizeHtml("Normal text")).toBe("Normal text");
      expect(sanitizeHtml("Text with spaces")).toBe("Text with spaces");
    });

    it("should escape HTML tags", () => {
      expect(sanitizeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert('xss')&lt;/script&gt;"
      );
      expect(sanitizeHtml("<div>content</div>")).toBe("&lt;div&gt;content&lt;/div&gt;");
    });

    it("should escape special HTML entities", () => {
      expect(sanitizeHtml("&")).toBe("&amp;");
      expect(sanitizeHtml("<")).toBe("&lt;");
      expect(sanitizeHtml(">")).toBe("&gt;");
    });

    it("should handle empty strings", () => {
      expect(sanitizeHtml("")).toBe("");
    });

    it("should prevent event handler injection", () => {
      expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).toContain("&lt;img");
      expect(sanitizeHtml('<a href="javascript:alert(1)">click</a>')).toContain("&lt;a");
    });
  });
});
