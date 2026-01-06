import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FlagsPersistAdapter } from "../flags-persist-adapter";
import type { PersistConfig } from "@/domain/windows/types/persist-config.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";

describe("FlagsPersistAdapter", () => {
  let adapter: FlagsPersistAdapter;
  let mockCollection: Map<string, unknown>;
  let mockDocument: {
    id: string;
    update: (changes: unknown, options?: unknown) => Promise<unknown>;
    getFlag?: (scope: string, key: string) => unknown;
    setFlag?: (scope: string, key: string, value: unknown) => Promise<unknown>;
    flags?: Record<string, Record<string, unknown>>;
  };

  beforeEach(() => {
    adapter = new FlagsPersistAdapter();
    mockCollection = new Map();
    mockDocument = {
      id: "Actor.123",
      update: vi.fn().mockResolvedValue(undefined),
      getFlag: vi.fn().mockReturnValue({ value: "test" }),
      setFlag: vi.fn().mockResolvedValue(undefined),
      flags: {
        testNamespace: {
          testKey: { value: "test" },
        },
      },
    };
    mockCollection.set("Actor.123", mockDocument);

    // Mock game global
    (globalThis as { game?: unknown }).game = {
      collections: {
        get: vi.fn().mockReturnValue(mockCollection),
      },
    };
  });

  afterEach(() => {
    delete (globalThis as { game?: unknown }).game;
  });

  describe("save", () => {
    it("should save flag successfully", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultOk(result);
      expect(mockDocument.update).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { "flags.testNamespace.testKey": data },
        expect.objectContaining({
          render: false,
        })
      );
    });

    it("should save with render option from meta", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };
      const data = { value: "test" };
      const meta = {
        originClientId: "client-1",
        originWindowInstanceId: "instance-1",
        render: true,
      };

      const result = await adapter.save(config, data, meta);

      expectResultOk(result);
      expect(mockDocument.update).toHaveBeenCalledWith(
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { "flags.testNamespace.testKey": data },
        expect.objectContaining({
          render: true,
        })
      );
    });

    it("should return error for non-flag config type", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "testNamespace",
        key: "testKey",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidType");
      expect(result.error.message).toBe("Not a flag persist config");
    });

    it("should return error if documentId is missing", async () => {
      const config: PersistConfig = {
        type: "flag",
        namespace: "testNamespace",
        key: "testKey",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
      expect(result.error.message).toBe("Flag config requires documentId, namespace, and key");
    });

    it("should return error if namespace is missing", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        key: "test-key",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
    });

    it("should return error if key is missing", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        // @ts-expect-error - Testing missing key
        key: undefined,
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
    });

    it("should return error if game is not available", async () => {
      delete (globalThis as { game?: unknown }).game;

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("GameNotAvailable");
    });

    it("should return error if document collection not found", async () => {
      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(undefined),
        },
      };

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("DocumentNotFound");
    });

    it("should return error if document does not support update", async () => {
      // Create a document without update method
      const documentWithoutUpdate = {
        id: "Actor.123",
        getFlag: vi.fn().mockReturnValue({ value: "test" }),
        setFlag: vi.fn().mockResolvedValue(undefined),
      };
      const collectionWithoutUpdate = new Map();
      collectionWithoutUpdate.set("Actor.123", documentWithoutUpdate);
      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(collectionWithoutUpdate),
        },
      };

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Document does not support update");
    });

    it("should return error if document not found in collection", async () => {
      const emptyCollection = new Map();
      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(emptyCollection),
        },
      };

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.999",
        namespace: "testNamespace",
        key: "testKey",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("DocumentNotFound");
    });

    it("should return error if update fails", async () => {
      mockDocument.update = vi.fn().mockRejectedValue(new Error("Update failed"));

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("SaveFailed");
    });
  });

  describe("load", () => {
    it("should load flag successfully using getFlag", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultOk(result);
      expect(result.value).toEqual({ value: "test" });
      expect(mockDocument.getFlag).toHaveBeenCalledWith("testNamespace", "testKey");
    });

    it("should load flag using flags property as fallback", async () => {
      delete mockDocument.getFlag;

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultOk(result);
      expect(result.value).toEqual({ value: "test" });
    });

    it("should return empty object if flag not found", async () => {
      mockDocument.getFlag = vi.fn().mockReturnValue(undefined);
      mockDocument.flags = {};

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultOk(result);
      expect(result.value).toEqual({});
    });

    it("should skip flag value that is not a Record (coverage for line 162 else branch)", async () => {
      // Mock flag value as primitive (not a Record)
      mockDocument.getFlag = vi.fn().mockReturnValue(undefined);
      mockDocument.flags = {
        testNamespace: {
          testKey: "primitive-string-value", // Not a Record
        },
      };

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      // Should return empty object because flagValue is not a Record (else branch at line 162)
      expectResultOk(result);
      expect(result.value).toEqual({});
    });

    it("should return error for non-flag config type", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidType");
    });

    it("should return error if documentId is missing in load", async () => {
      const config: PersistConfig = {
        type: "flag",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
      expect(result.error.message).toBe("Flag config requires documentId, namespace, and key");
    });

    it("should return error if namespace is missing in load", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
      expect(result.error.message).toBe("Flag config requires documentId, namespace, and key");
    });

    it("should return error if key is missing in load", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        // @ts-expect-error - Testing missing key
        key: undefined,
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
      expect(result.error.message).toBe("Flag config requires documentId, namespace, and key");
    });

    it("should return error if document collection not found in load", async () => {
      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(undefined),
        },
      };

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("DocumentNotFound");
      expect(result.error.message).toContain("Document collection not found");
    });

    it("should return error if game is not available", async () => {
      delete (globalThis as { game?: unknown }).game;

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("GameNotAvailable");
    });

    it("should return error if document not found", async () => {
      const emptyCollection = new Map();
      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(emptyCollection),
        },
      };

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.999",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("DocumentNotFound");
    });

    it("should return error if load fails", async () => {
      mockDocument.getFlag = vi.fn().mockImplementation(() => {
        throw new Error("Load failed");
      });
      delete mockDocument.flags;

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultOk(result); // Should return empty object as fallback
      expect(result.value).toEqual({});
    });

    it("should return error if document ID format is invalid in save", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: ".123", // Invalid format - no type prefix
        namespace: "testNamespace",
        key: "testKey",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
      expect(result.error.message).toBe("Invalid document ID format");
    });

    it("should return error if document ID format is invalid in load", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: ".123", // Invalid format - no type prefix
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
      expect(result.error.message).toBe("Invalid document ID format");
    });

    it("should return error if load throws exception", async () => {
      // Mock getFlag to throw and flags to be undefined
      mockDocument.getFlag = vi.fn().mockImplementation(() => {
        throw new Error("Unexpected error");
      });
      delete mockDocument.flags;

      // Mock collection.get to throw instead
      const throwingCollection = new Map();
      throwingCollection.get = vi.fn().mockImplementation(() => {
        throw new Error("Collection error");
      });

      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(throwingCollection),
        },
      };

      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "testNamespace",
        key: "testKey",
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("LoadFailed");

      // Restore
      (globalThis as { game?: unknown }).game = {
        collections: {
          get: vi.fn().mockReturnValue(mockCollection),
        },
      };
    });
  });
});
