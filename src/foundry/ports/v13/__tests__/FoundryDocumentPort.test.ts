import { describe, it, expect, vi } from "vitest";
import { FoundryDocumentPortV13 } from "../FoundryDocumentPort";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FoundryDocumentPortV13", () => {
  let port: FoundryDocumentPortV13;

  beforeEach(() => {
    port = new FoundryDocumentPortV13();
  });

  describe("getFlag", () => {
    it("should get flag value successfully", () => {
      const document = {
        getFlag: vi.fn((scope: string, key: string) => "flag-value"),
      };

      const result = port.getFlag(document, "scope", "key");
      expectResultOk(result);
      expect(result.value).toBe("flag-value");
      expect(document.getFlag).toHaveBeenCalledWith("scope", "key");
    });

    it("should return null for undefined flag", () => {
      const document = {
        getFlag: vi.fn(() => undefined),
      };

      const result = port.getFlag(document, "scope", "key");
      expectResultOk(result);
      expect(result.value).toBeNull();
    });

    it("should handle missing getFlag method", () => {
      const document = {} as any;

      const result = port.getFlag(document, "scope", "key");
      expectResultErr(result);
      expect(result.error).toContain("getFlag method");
    });

    it("should wrap exceptions in error result", () => {
      const document = {
        getFlag: vi.fn(() => {
          throw new Error("Internal error");
        }),
      };

      const result = port.getFlag(document, "scope", "key");
      expectResultErr(result);
      expect(result.error).toContain("Failed to get flag");
      expect(result.error).toContain("Internal error");
    });
  });

  describe("setFlag", () => {
    it("should set flag successfully", async () => {
      const document = {
        setFlag: vi.fn(async (scope: string, key: string, value: unknown) => {
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
      expect(result.error).toContain("Failed to set flag");
      expect(result.error).toContain("Async error");
    });

    it("should handle missing setFlag method", async () => {
      const document = {} as any;

      const result = await port.setFlag(document, "scope", "key", "value");
      expectResultErr(result);
      expect(result.error).toContain("setFlag method");
    });

    it("should handle promise rejection", async () => {
      const document = {
        setFlag: vi.fn(() => Promise.reject(new Error("Rejection"))),
      };

      const result = await port.setFlag(document, "scope", "key", "value");
      expectResultErr(result);
      expect(result.error).toContain("Failed to set flag");
    });
  });
});

