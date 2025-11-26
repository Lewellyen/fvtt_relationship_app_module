import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeId } from "../sanitize";

describe("sanitize utilities", () => {
  describe("sanitizeHtml", () => {
    it("should escape HTML entities", () => {
      expect(sanitizeHtml("<script>alert('xss')</script>")).toBe(
        "&lt;script&gt;alert('xss')&lt;/script&gt;"
      );
    });

    it("should escape ampersands", () => {
      expect(sanitizeHtml("foo & bar")).toBe("foo &amp; bar");
    });

    it("should preserve quotes (DOM-based sanitization)", () => {
      // DOM textContent/innerHTML does not escape quotes as they are safe in text context
      expect(sanitizeHtml('"test"')).toBe('"test"');
    });

    it("should return normal text unchanged", () => {
      expect(sanitizeHtml("Normal text")).toBe("Normal text");
    });
  });

  describe("sanitizeId", () => {
    it("should keep alphanumeric characters", () => {
      expect(sanitizeId("journal-123")).toBe("journal-123");
    });

    it("should remove path traversal characters", () => {
      expect(sanitizeId("../../../etc/passwd")).toBe("etcpasswd");
    });

    it("should remove HTML tags", () => {
      expect(sanitizeId("<script>alert('xss')</script>")).toBe("scriptalertxssscript");
    });

    it("should keep underscores", () => {
      expect(sanitizeId("my_journal_entry")).toBe("my_journal_entry");
    });
  });
});
