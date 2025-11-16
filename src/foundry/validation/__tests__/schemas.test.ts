/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for testing invalid journal entry types

import { describe, it, expect } from "vitest";
import {
  validateJournalEntries,
  sanitizeId,
  sanitizeHtml,
  validateSettingValue,
  validateSettingConfig,
  validateHookApp,
} from "../schemas";
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

describe("validateHookApp", () => {
  it("should reject null or undefined app", () => {
    const nullResult = validateHookApp(null);
    expectResultErr(nullResult);
    expect(nullResult.error.code).toBe("VALIDATION_FAILED");
    expect(nullResult.error.message).toContain("null or undefined");

    const undefinedResult = validateHookApp(undefined);
    expectResultErr(undefinedResult);
    expect(undefinedResult.error.code).toBe("VALIDATION_FAILED");
    expect(undefinedResult.error.message).toContain("null or undefined");
  });

  it("should accept valid app object", () => {
    const app = {
      id: "journal-directory",
      object: { foo: "bar" },
      options: { some: "option" },
    };

    const result = validateHookApp(app);
    expectResultOk(result);
    expect(result.value.id).toBe("journal-directory");
  });

  it("should reject app object with invalid shape", () => {
    const result = validateHookApp({ invalid: true } as any);
    expectResultErr(result);
    expect(result.error.code).toBe("VALIDATION_FAILED");
    expect(result.error.message).toContain("validation failed");
  });
});

describe("Setting Validation", () => {
  describe("validateSettingValue", () => {
    describe("string type", () => {
      it("should accept valid string", () => {
        const result = validateSettingValue("testKey", "value", "string");
        expectResultOk(result);
        expect(result.value).toBe("value");
      });

      it("should reject non-string when expecting string", () => {
        const result = validateSettingValue("testKey", 123, "string");
        expectResultErr(result);
        expect(result.error.code).toBe("VALIDATION_FAILED");
        expect(result.error.message).toContain("Expected string");
      });

      it("should validate choices for string", () => {
        const result = validateSettingValue("testKey", "option1", "string", ["option1", "option2"]);
        expectResultOk(result);
      });

      it("should reject invalid choice", () => {
        const result = validateSettingValue("testKey", "option3", "string", ["option1", "option2"]);
        expectResultErr(result);
        expect(result.error.message).toContain("Invalid value");
        expect(result.error.message).toContain("option1, option2");
      });
    });

    describe("number type", () => {
      it("should accept valid number", () => {
        const result = validateSettingValue("testKey", 42, "number");
        expectResultOk(result);
        expect(result.value).toBe(42);
      });

      it("should reject non-number when expecting number", () => {
        const result = validateSettingValue("testKey", "not a number", "number");
        expectResultErr(result);
        expect(result.error.code).toBe("VALIDATION_FAILED");
        expect(result.error.message).toContain("Expected number");
      });
    });

    describe("boolean type", () => {
      it("should accept valid boolean true", () => {
        const result = validateSettingValue("testKey", true, "boolean");
        expectResultOk(result);
        expect(result.value).toBe(true);
      });

      it("should accept valid boolean false", () => {
        const result = validateSettingValue("testKey", false, "boolean");
        expectResultOk(result);
        expect(result.value).toBe(false);
      });

      it("should reject non-boolean when expecting boolean", () => {
        const result = validateSettingValue("testKey", "true", "boolean");
        expectResultErr(result);
        expect(result.error.code).toBe("VALIDATION_FAILED");
        expect(result.error.message).toContain("Expected boolean");
      });
    });
  });

  describe("validateSettingConfig", () => {
    it("should accept valid config", () => {
      const config = { scope: "world" as const, default: "value" };
      const result = validateSettingConfig("myModule", "myKey", config);
      expectResultOk(result);
      expect(result.value).toEqual(config);
    });

    it("should reject empty namespace", () => {
      const config = { scope: "world" as const };
      const result = validateSettingConfig("", "myKey", config);
      expectResultErr(result);
      expect(result.error.message).toContain("Invalid setting namespace");
    });

    it("should reject non-string namespace", () => {
      const config = { scope: "world" as const };
      const result = validateSettingConfig(123 as any, "myKey", config);
      expectResultErr(result);
      expect(result.error.message).toContain("Invalid setting namespace");
    });

    it("should reject empty key", () => {
      const config = { scope: "world" as const };
      const result = validateSettingConfig("myModule", "", config);
      expectResultErr(result);
      expect(result.error.message).toContain("Invalid setting key");
    });

    it("should reject non-string key", () => {
      const config = { scope: "world" as const };
      const result = validateSettingConfig("myModule", 123 as any, config);
      expectResultErr(result);
      expect(result.error.message).toContain("Invalid setting key");
    });

    it("should reject non-object config", () => {
      const result = validateSettingConfig("myModule", "myKey", "not an object" as any);
      expectResultErr(result);
      expect(result.error.message).toContain("Invalid setting config");
    });

    it("should reject null config", () => {
      const result = validateSettingConfig("myModule", "myKey", null as any);
      expectResultErr(result);
      expect(result.error.message).toContain("Invalid setting config");
    });

    it("should accept valid scope: world", () => {
      const config = { scope: "world" as const };
      const result = validateSettingConfig("myModule", "myKey", config);
      expectResultOk(result);
    });

    it("should accept valid scope: client", () => {
      const config = { scope: "client" as const };
      const result = validateSettingConfig("myModule", "myKey", config);
      expectResultOk(result);
    });

    it("should accept valid scope: user", () => {
      const config = { scope: "user" as const };
      const result = validateSettingConfig("myModule", "myKey", config);
      expectResultOk(result);
    });

    it("should reject invalid scope", () => {
      const config = { scope: "invalid" as any };
      const result = validateSettingConfig("myModule", "myKey", config);
      expectResultErr(result);
      expect(result.error.message).toContain("Setting config validation failed");
      expect(result.error.message).toContain("world");
      expect(result.error.message).toContain("client");
      expect(result.error.message).toContain("user");
    });

    it("should accept config without scope", () => {
      const config = { default: "value" };
      const result = validateSettingConfig("myModule", "myKey", config);
      expectResultOk(result);
    });
  });
});
