import { describe, it, expect, beforeEach, vi } from "vitest";
import { SettingsPersistAdapter } from "../settings-persist-adapter";
import type { PlatformSettingsPort } from "@/domain/ports/platform-settings-port.interface";
import type { PersistConfig } from "@/domain/windows/types/persist-config.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import { ok, err } from "@/domain/utils/result";

describe("SettingsPersistAdapter", () => {
  let adapter: SettingsPersistAdapter;
  let mockSettingsPort: PlatformSettingsPort;

  beforeEach(() => {
    mockSettingsPort = {
      get: vi.fn(),
      set: vi.fn(),
      register: vi.fn(),
    } as unknown as PlatformSettingsPort;

    adapter = new SettingsPersistAdapter(mockSettingsPort);
  });

  describe("save", () => {
    it("should save setting successfully", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
        key: "test-key",
      };
      const data = { value: "test" };

      vi.mocked(mockSettingsPort.set).mockResolvedValue(ok(undefined));

      const result = await adapter.save(config, data);

      expectResultOk(result);
      expect(mockSettingsPort.set).toHaveBeenCalledWith("test-namespace", "test-key", data);
    });

    it("should return error for non-setting config type", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "test-namespace",
        key: "test-key",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidType");
      expect(result.error.message).toBe("Not a setting persist config");
    });

    it("should return error if namespace is missing", async () => {
      const config: PersistConfig = {
        type: "setting",
        key: "test-key",
      };
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
      expect(result.error.message).toBe("Setting config requires namespace and key");
    });

    it("should return error if key is missing", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
      } as PersistConfig;
      const data = { value: "test" };

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
      expect(result.error.message).toBe("Setting config requires namespace and key");
    });

    it("should return error if settings port set fails", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
        key: "test-key",
      };
      const data = { value: "test" };

      vi.mocked(mockSettingsPort.set).mockResolvedValue(
        err({
          code: "SETTING_VALIDATION_FAILED",
          message: "Setting not found",
        })
      );

      const result = await adapter.save(config, data);

      expectResultErr(result);
      expect(result.error.code).toBe("SaveFailed");
      expect(result.error.message).toBe("Setting not found");
    });
  });

  describe("load", () => {
    it("should load setting successfully", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
        key: "test-key",
      };
      const loadedData = { value: "test" };

      vi.mocked(mockSettingsPort.get).mockReturnValue(ok(loadedData));

      const result = await adapter.load(config);

      expectResultOk(result);
      expect(result.value).toEqual(loadedData);
      expect(mockSettingsPort.get).toHaveBeenCalledWith(
        "test-namespace",
        "test-key",
        expect.any(Object)
      );
    });

    it("should return empty object if setting is null", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
        key: "test-key",
      };

      vi.mocked(mockSettingsPort.get).mockReturnValue(
        ok(null as unknown as Record<string, unknown>)
      );

      const result = await adapter.load(config);

      expectResultOk(result);
      expect(result.value).toEqual({});
    });

    it("should test recordSchema validation with invalid values", async () => {
      // Test that recordSchema.validate is called via settingsPort.get
      // This tests the validation logic in recordSchema (lines 16-20)
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
        key: "test-key",
      };

      // Mock get to call the validation schema with invalid values
      // The schema should reject arrays, primitives, and null
      vi.mocked(mockSettingsPort.get).mockImplementation((_namespace, _key, schema) => {
        // Test array rejection
        const arrayResult = schema.validate([]);
        expect(arrayResult.ok).toBe(false);

        // Test string rejection
        const stringResult = schema.validate("string");
        expect(stringResult.ok).toBe(false);

        // Test number rejection
        const numberResult = schema.validate(123);
        expect(numberResult.ok).toBe(false);

        // Test null rejection
        const nullResult = schema.validate(null);
        expect(nullResult.ok).toBe(false);

        // Test valid object acceptance
        const validResult = schema.validate({ value: "test" });
        expect(validResult.ok).toBe(true);

        return ok({ value: "test" });
      });

      const result = await adapter.load(config);

      expectResultOk(result);
      expect(mockSettingsPort.get).toHaveBeenCalled();
    });

    it("should return error if settings port get returns validation error for invalid type", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
        key: "test-key",
      };

      // Mock get to return validation error (schema rejects invalid type)
      vi.mocked(mockSettingsPort.get).mockReturnValue(
        err({
          code: "SETTING_VALIDATION_FAILED",
          message: "Value is not a valid object",
        })
      );

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("LoadFailed");
    });

    it("should return error for non-setting config type", async () => {
      const config: PersistConfig = {
        type: "flag",
        documentId: "Actor.123",
        namespace: "test-namespace",
        key: "test-key",
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidType");
      expect(result.error.message).toBe("Not a setting persist config");
    });

    it("should return error if namespace is missing", async () => {
      const config: PersistConfig = {
        type: "setting",
        key: "test-key",
      };

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
      expect(result.error.message).toBe("Setting config requires namespace and key");
    });

    it("should return error if key is missing", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
      } as PersistConfig;

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("InvalidConfig");
      expect(result.error.message).toBe("Setting config requires namespace and key");
    });

    it("should return error if settings port get fails", async () => {
      const config: PersistConfig = {
        type: "setting",
        namespace: "test-namespace",
        key: "test-key",
      };

      vi.mocked(mockSettingsPort.get).mockReturnValue(
        err({
          code: "SETTING_VALIDATION_FAILED",
          message: "Setting not found",
        })
      );

      const result = await adapter.load(config);

      expectResultErr(result);
      expect(result.error.code).toBe("LoadFailed");
      expect(result.error.message).toBe("Setting not found");
    });
  });
});
