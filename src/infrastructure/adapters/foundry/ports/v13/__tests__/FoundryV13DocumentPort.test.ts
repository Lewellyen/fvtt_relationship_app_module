// Test file: `any` needed for mocking Foundry document objects

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundryV13DocumentPort } from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13DocumentPort";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import * as v from "valibot";

describe("FoundryV13DocumentPort", () => {
  let port: FoundryV13DocumentPort;

  beforeEach(() => {
    port = new FoundryV13DocumentPort();
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

  describe("create", () => {
    it("should create document successfully", async () => {
      const documentClass = {
        create: vi.fn(async () => ({ id: "new-id", name: "New Journal" })),
      };

      const result = await port.create(documentClass, { name: "New Journal" });

      expectResultOk(result);
      expect(result.value.id).toBe("new-id");
      expect(documentClass.create).toHaveBeenCalledWith({ name: "New Journal" });
    });

    it("should handle create errors", async () => {
      const documentClass = {
        create: vi.fn(async () => {
          throw new Error("Create failed");
        }),
      };

      const result = await port.create(documentClass, { name: "New Journal" });

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to create document");
    });

    it("should prevent create after disposal", async () => {
      const port = new FoundryV13DocumentPort();
      port.dispose();
      const documentClass = { create: vi.fn() };

      const result = await port.create(documentClass, {});

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });
  });

  describe("update", () => {
    it("should update document successfully", async () => {
      const document = {
        update: vi.fn(async () => ({ id: "journal-1", name: "Updated Name" })),
      };

      const result = await port.update(document, { name: "Updated Name" });

      expectResultOk(result);
      expect(result.value.name).toBe("Updated Name");
      expect(document.update).toHaveBeenCalledWith({ name: "Updated Name" });
    });

    it("should handle update errors", async () => {
      const document = {
        update: vi.fn(async () => {
          throw new Error("Update failed");
        }),
      };

      const result = await port.update(document, { name: "Updated Name" });

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to update document");
    });

    it("should prevent update after disposal", async () => {
      const port = new FoundryV13DocumentPort();
      port.dispose();
      const document = { update: vi.fn() };

      const result = await port.update(document, {});

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });
  });

  describe("delete", () => {
    it("should delete document successfully", async () => {
      const document = {
        delete: vi.fn(async () => undefined),
      };

      const result = await port.delete(document);

      expectResultOk(result);
      expect(document.delete).toHaveBeenCalled();
    });

    it("should handle delete errors", async () => {
      const document = {
        delete: vi.fn(async () => {
          throw new Error("Delete failed");
        }),
      };

      const result = await port.delete(document);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to delete document");
    });

    it("should prevent delete after disposal", async () => {
      const port = new FoundryV13DocumentPort();
      port.dispose();
      const document = { delete: vi.fn() };

      const result = await port.delete(document);

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });
  });

  describe("unsetFlag", () => {
    it("should unset flag successfully using unsetFlag method", async () => {
      const document = {
        unsetFlag: vi.fn(async () => undefined),
        setFlag: vi.fn(),
      };

      const result = await port.unsetFlag(document, "scope", "key");

      expectResultOk(result);
      expect(document.unsetFlag).toHaveBeenCalledWith("scope", "key");
      expect(document.setFlag).not.toHaveBeenCalled();
    });

    it("should fallback to update with -= syntax if unsetFlag not available", async () => {
      const document = {
        update: vi.fn(async () => undefined),
        setFlag: vi.fn(),
      };

      const result = await port.unsetFlag(document, "scope", "key");

      expectResultOk(result);
      expect(document.update).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "flags.scope.-=key": null,
      });
    });

    it("should throw error if neither unsetFlag nor update is available", async () => {
      const document = {
        setFlag: vi.fn(),
      };

      const result = await port.unsetFlag(document, "scope", "key");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to unset flag");
      // The original error message is in the error object, but wrapped by fromPromise
      // Check that the error occurred (the message indicates the operation failed)
      expect(result.error.message).toBe("Failed to unset flag scope.key");
    });

    it("should handle unsetFlag errors", async () => {
      const document = {
        unsetFlag: vi.fn(async () => {
          throw new Error("Unset failed");
        }),
        setFlag: vi.fn(),
      };

      const result = await port.unsetFlag(document, "scope", "key");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to unset flag");
    });

    it("should prevent unsetFlag after disposal", async () => {
      const port = new FoundryV13DocumentPort();
      port.dispose();
      const document = { unsetFlag: vi.fn(), setFlag: vi.fn() };

      const result = await port.unsetFlag(document, "scope", "key");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });
  });

  describe("disposed state guards", () => {
    it("should prevent getFlag after disposal", () => {
      const port = new FoundryV13DocumentPort();
      port.dispose();
      const doc = { getFlag: vi.fn() };

      const result = port.getFlag(doc, "test", "key", v.string());

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent setFlag after disposal", async () => {
      const port = new FoundryV13DocumentPort();
      port.dispose();
      const doc = { setFlag: vi.fn().mockResolvedValue(undefined) };

      const result = await port.setFlag(doc, "test", "key", "value");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should be idempotent", () => {
      const port = new FoundryV13DocumentPort();
      port.dispose();
      port.dispose();
      port.dispose();

      const doc = { getFlag: vi.fn() };
      const result = port.getFlag(doc, "test", "key", v.string());
      expectResultErr(result);
    });
  });
});
