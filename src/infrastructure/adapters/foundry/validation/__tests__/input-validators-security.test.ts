import { describe, it, expect } from "vitest";
import {
  validateJournalId,
  validateJournalName,
  validateFlagKey,
} from "@/infrastructure/adapters/foundry/validation/input-validators";

describe("Input Validators - Security", () => {
  describe("validateJournalId", () => {
    it("should reject SQL injection attempts", () => {
      const result = validateJournalId("'; DROP TABLE journals; --");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("VALIDATION_FAILED");
      }
    });

    it("should reject path traversal attempts", () => {
      const result = validateJournalId("../../../etc/passwd");
      expect(result.ok).toBe(false);
    });

    it("should reject XSS script tags", () => {
      const result = validateJournalId("<script>alert('xss')</script>");
      expect(result.ok).toBe(false);
    });

    it("should reject HTML injection", () => {
      const result = validateJournalId("<img src=x onerror=alert(1)>");
      expect(result.ok).toBe(false);
    });

    it("should reject null bytes", () => {
      const result = validateJournalId("test\x00malicious");
      expect(result.ok).toBe(false);
    });

    it("should reject special shell characters", () => {
      const specialChars = ["|", "&", ";", "$", "`", "(", ")", "{", "}", "[", "]"];

      for (const char of specialChars) {
        const result = validateJournalId(`test${char}malicious`);
        expect(result.ok).toBe(false);
      }
    });

    it("should accept valid IDs with allowed characters", () => {
      const validIds = [
        "journal-entry-123",
        "test_entry",
        "ABC-123-XYZ",
        "a",
        "12345",
        "test-123_abc",
      ];

      for (const id of validIds) {
        const result = validateJournalId(id);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value).toBe(id);
        }
      }
    });

    it("should reject empty string", () => {
      const result = validateJournalId("");
      expect(result.ok).toBe(false);
    });

    it("should reject too long IDs", () => {
      const longId = "a".repeat(101);
      const result = validateJournalId(longId);
      expect(result.ok).toBe(false);
    });
  });

  describe("validateJournalName", () => {
    it("should reject empty names", () => {
      const result = validateJournalName("");
      expect(result.ok).toBe(false);
    });

    it("should reject names exceeding max length", () => {
      const longName = "a".repeat(256);
      const result = validateJournalName(longName);
      expect(result.ok).toBe(false);
    });

    it("should accept valid names with special characters", () => {
      // Names can contain more characters than IDs
      const validNames = [
        "My Journal Entry",
        "Test (with parentheses)",
        "Entry #123",
        "Abenteuer: Die verlorene Stadt",
        "Test & Development",
      ];

      for (const name of validNames) {
        const result = validateJournalName(name);
        expect(result.ok).toBe(true);
      }
    });

    it("should accept names with umlauts", () => {
      const result = validateJournalName("Tagebuch: Müller's Abenteuer");
      expect(result.ok).toBe(true);
    });
  });

  describe("validateFlagKey", () => {
    it("should reject special characters in flag keys", () => {
      const invalidKeys = [
        "test-key", // Hyphen not allowed
        "test.key", // Dot not allowed
        "test key", // Space not allowed
        "test/key", // Slash not allowed
      ];

      for (const key of invalidKeys) {
        const result = validateFlagKey(key);
        expect(result.ok).toBe(false);
      }
    });

    it("should accept valid flag keys", () => {
      const validKeys = ["hidden", "test_flag", "myFlag123", "FLAG_NAME"];

      for (const key of validKeys) {
        const result = validateFlagKey(key);
        expect(result.ok).toBe(true);
      }
    });

    it("should reject empty flag keys", () => {
      const result = validateFlagKey("");
      expect(result.ok).toBe(false);
    });

    it("should reject too long flag keys", () => {
      const longKey = "a".repeat(101);
      const result = validateFlagKey(longKey);
      expect(result.ok).toBe(false);
    });
  });
});
