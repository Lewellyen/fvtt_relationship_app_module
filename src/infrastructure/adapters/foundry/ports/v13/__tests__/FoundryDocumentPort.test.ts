/* eslint-disable @typescript-eslint/no-explicit-any */
// Test file: `any` needed for mocking Foundry document objects

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryDocumentPortV13 } from "@/infrastructure/adapters/foundry/ports/v13/FoundryDocumentPort";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import * as v from "valibot";

describe("FoundryDocumentPortV13", () => {
  let port: FoundryDocumentPortV13;

  beforeEach(() => {
    port = new FoundryDocumentPortV13();
  });

  describe("getFlag", () => {
    it("should get flag value successfully with schema validation", () => {
      const document = {
        getFlag: vi.fn(() => "flag-value"),
      };

      const result = port.getFlag(document, "scope", "key", v.string());
      expectResultOk(result);
      expect(result.value).toBe("flag-value");
      expect(document.getFlag).toHaveBeenCalledWith("scope", "key");
    });

    it("should return null for undefined flag", () => {
      const document = {
        getFlag: vi.fn(() => undefined),
      };

      const result = port.getFlag(document, "scope", "key", v.string());
      expectResultOk(result);
      expect(result.value).toBeNull();
    });

    it("should return null for null flag", () => {
      const document = {
        getFlag: vi.fn(() => null),
      };

      const result = port.getFlag(document, "scope", "key", v.boolean());
      expectResultOk(result);
      expect(result.value).toBeNull();
    });

    it("should validate flag value and return error if validation fails", () => {
      const document = {
        getFlag: vi.fn(() => "not-a-number"),
      };

      const result = port.getFlag(document, "scope", "key", v.number());
      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.message).toContain("failed validation");
    });

    it("should accept valid boolean flags", () => {
      const document = {
        getFlag: vi.fn(() => true),
      };

      const result = port.getFlag(document, "scope", "hidden", v.boolean());
      expectResultOk(result);
      expect(result.value).toBe(true);
    });

    it("should reject invalid boolean flags", () => {
      const document = {
        getFlag: vi.fn(() => "yes"),
      };

      const result = port.getFlag(document, "scope", "hidden", v.boolean());
      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
    });

    it("should handle missing getFlag method", () => {
      const document = {} as any;

      const result = port.getFlag(document, "scope", "key", v.string());
      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get flag");
    });

    it("should wrap exceptions in error result", () => {
      const document = {
        getFlag: vi.fn(() => {
          throw new Error("Internal error");
        }),
      };

      const result = port.getFlag(document, "scope", "key", v.string());
      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get flag");
    });
  });

  describe("setFlag", () => {
    it("should set flag successfully", async () => {
      const document = {
        setFlag: vi.fn(async () => {
          return Promise.resolve(undefined);
        }),
      };

      const result = await port.setFlag(document, "scope", "key", "value");
      expectResultOk(result);
      expect(document.setFlag).toHaveBeenCalledWith("scope", "key", "value");
    });

    it("should handle async errors", async () => {
      const document = {
        setFlag: vi.fn(async () => {
          throw new Error("Async error");
        }),
      };

      const result = await port.setFlag(document, "scope", "key", "value");
      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to set flag");
    });

    it("should handle missing setFlag method", async () => {
      const document = {} as any;

      const result = await port.setFlag(document, "scope", "key", "value");
      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to set flag");
    });

    it("should handle promise rejection", async () => {
      const document = {
        setFlag: vi.fn(() => Promise.reject(new Error("Rejection"))),
      };

      const result = await port.setFlag(document, "scope", "key", "value");
      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to set flag");
    });
  });

  describe("disposed state guards", () => {
    it("should prevent getFlag after disposal", () => {
      const port = new FoundryDocumentPortV13();
      port.dispose();
      const doc = { getFlag: vi.fn() };

      const result = port.getFlag(doc, "test", "key", v.string());

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent setFlag after disposal", async () => {
      const port = new FoundryDocumentPortV13();
      port.dispose();
      const doc = { setFlag: vi.fn().mockResolvedValue(undefined) };

      const result = await port.setFlag(doc, "test", "key", "value");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should be idempotent", () => {
      const port = new FoundryDocumentPortV13();
      port.dispose();
      port.dispose();
      port.dispose();

      const doc = { getFlag: vi.fn() };
      const result = port.getFlag(doc, "test", "key", v.string());
      expectResultErr(result);
    });
  });
});
