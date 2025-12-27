// Test file: `any` needed for mocking FoundrySettings

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FoundrySettingsAdapter, DIFoundrySettingsAdapter } from "../foundry-settings-adapter";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import * as v from "valibot";
import { toValidationSchema } from "@/infrastructure/validation/valibot-schema-adapter";
import type { ValidationSchema } from "@/domain/types/validation-schema.interface";
import { err } from "@/domain/utils/result";
import { FoundrySettingTypeMapper } from "../mappers/foundry-setting-type-mapper";
import { FoundrySettingsErrorMapper } from "../mappers/foundry-settings-error-mapper";

describe("FoundrySettingsAdapter", () => {
  let mockFoundrySettings: FoundrySettings;
  let typeMapper: FoundrySettingTypeMapper;
  let errorMapper: FoundrySettingsErrorMapper;
  let adapter: FoundrySettingsAdapter;

  beforeEach(() => {
    mockFoundrySettings = {
      register: vi.fn().mockReturnValue({ ok: true, value: undefined }),
      get: vi.fn(),
      set: vi.fn(),
      dispose: vi.fn(),
    } as unknown as FoundrySettings;

    typeMapper = new FoundrySettingTypeMapper();
    errorMapper = new FoundrySettingsErrorMapper();
    adapter = new FoundrySettingsAdapter(mockFoundrySettings, typeMapper, errorMapper);
  });

  describe("register", () => {
    it("should register setting in Foundry", () => {
      const result = adapter.register("my-module", "enabled", {
        name: "Enabled",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      });

      expect(result.ok).toBe(true);
      expect(mockFoundrySettings.register).toHaveBeenCalledWith(
        "my-module",
        "enabled",
        expect.objectContaining({
          name: "Enabled",
          scope: "world",
          type: Boolean,
        })
      );
    });

    it("should forward optional config props (hint, choices, onChange)", () => {
      const onChange = vi.fn();

      adapter.register("my-module", "level", {
        name: "Level",
        hint: "Pick level",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
        choices: { on: "On", off: "Off" },
        onChange,
      });

      expect(mockFoundrySettings.register).toHaveBeenCalledWith(
        "my-module",
        "level",
        expect.objectContaining({
          hint: "Pick level",
          choices: { on: "On", off: "Off" },
          onChange,
        })
      );
    });

    it("should map string type to constructor", () => {
      adapter.register("my-module", "name", {
        name: "Name",
        scope: "world",
        config: true,
        type: "String",
        default: "",
      });

      expect(mockFoundrySettings.register).toHaveBeenCalledWith(
        "my-module",
        "name",
        expect.objectContaining({
          type: String,
        })
      );
    });

    it("should map number type from string", () => {
      adapter.register("my-module", "count", {
        name: "Count",
        scope: "world",
        config: true,
        type: "Number",
        default: 0,
      });

      expect(mockFoundrySettings.register).toHaveBeenCalledWith(
        "my-module",
        "count",
        expect.objectContaining({
          type: Number,
        })
      );
    });

    it("should map boolean type from string", () => {
      adapter.register("my-module", "flag", {
        name: "Flag",
        scope: "world",
        config: true,
        type: "Boolean",
        default: false,
      });

      expect(mockFoundrySettings.register).toHaveBeenCalledWith(
        "my-module",
        "flag",
        expect.objectContaining({
          type: Boolean,
        })
      );
    });

    it("should return registration error", () => {
      const foundryError: FoundryError = createFoundryError(
        "OPERATION_FAILED",
        "Registration failed"
      );
      vi.mocked(mockFoundrySettings.register).mockReturnValue(err(foundryError));

      const result = adapter.register("my-module", "enabled", {
        name: "Enabled",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_REGISTRATION_FAILED");
        expect(result.error.message).toContain("Failed to register setting");
      }
    });

    it("should map API_NOT_AVAILABLE to PLATFORM_NOT_AVAILABLE", () => {
      const foundryError: FoundryError = createFoundryError(
        "API_NOT_AVAILABLE",
        "API not available"
      );
      vi.mocked(mockFoundrySettings.register).mockReturnValue(err(foundryError));

      const result = adapter.register("my-module", "enabled", {
        name: "Enabled",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PLATFORM_NOT_AVAILABLE");
      }
    });

    it("should map unknown error code to SETTING_REGISTRATION_FAILED for register", () => {
      const foundryError: FoundryError = {
        code: "UNKNOWN_ERROR" as any,
        message: "Unknown error",
      };
      vi.mocked(mockFoundrySettings.register).mockReturnValue(err(foundryError));

      const result = adapter.register("my-module", "enabled", {
        name: "Enabled",
        scope: "world",
        config: true,
        type: Boolean,
        default: true,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_REGISTRATION_FAILED");
      }
    });

    it("should return error for unknown setting type", () => {
      const result = adapter.register("my-module", "unknown", {
        name: "Unknown",
        scope: "world",
        config: true,
        type: "Unknown" as any,
        default: null,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_REGISTRATION_FAILED");
        expect(result.error.message).toContain("Unknown setting type");
        expect(result.error.message).toContain("Unknown");
      }
    });

    it("should return error for unknown setting type with constructor", () => {
      const result = adapter.register("my-module", "unknown", {
        name: "Unknown",
        scope: "world",
        config: true,
        type: Object as any,
        default: null,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_REGISTRATION_FAILED");
        expect(result.error.message).toMatch(/Unknown setting type/);
      }
    });
  });

  describe("get", () => {
    it("should get setting value from Foundry", () => {
      vi.mocked(mockFoundrySettings.get).mockReturnValue({
        ok: true,
        value: true,
      });

      const result = adapter.get("my-module", "enabled", toValidationSchema(v.boolean()));

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should return validation error", () => {
      const foundryError: FoundryError = createFoundryError(
        "VALIDATION_FAILED",
        "Validation failed"
      );
      vi.mocked(mockFoundrySettings.get).mockReturnValue(err(foundryError));

      const result = adapter.get("my-module", "enabled", toValidationSchema(v.boolean()));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_VALIDATION_FAILED");
      }
    });

    it("should map API_NOT_AVAILABLE to PLATFORM_NOT_AVAILABLE", () => {
      const foundryError: FoundryError = createFoundryError(
        "API_NOT_AVAILABLE",
        "API not available"
      );
      vi.mocked(mockFoundrySettings.get).mockReturnValue(err(foundryError));

      const result = adapter.get("my-module", "enabled", toValidationSchema(v.boolean()));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PLATFORM_NOT_AVAILABLE");
      }
    });

    it("should map OPERATION_FAILED with 'not registered' message to SETTING_NOT_REGISTERED", () => {
      const foundryError: FoundryError = createFoundryError(
        "OPERATION_FAILED",
        "Setting is not registered"
      );
      vi.mocked(mockFoundrySettings.get).mockReturnValue(err(foundryError));

      const result = adapter.get("my-module", "enabled", toValidationSchema(v.boolean()));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_NOT_REGISTERED");
      }
    });

    it("should map OPERATION_FAILED with lowercase 'not registered' message to SETTING_NOT_REGISTERED", () => {
      const foundryError: FoundryError = createFoundryError("OPERATION_FAILED", "not registered");
      vi.mocked(mockFoundrySettings.get).mockReturnValue(err(foundryError));

      const result = adapter.get("my-module", "enabled", toValidationSchema(v.boolean()));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_NOT_REGISTERED");
      }
    });

    it("should map OPERATION_FAILED with 'not found' message to SETTING_NOT_REGISTERED", () => {
      const foundryError: FoundryError = createFoundryError(
        "OPERATION_FAILED",
        "Setting not found"
      );
      vi.mocked(mockFoundrySettings.get).mockReturnValue(err(foundryError));

      const result = adapter.get("my-module", "enabled", toValidationSchema(v.boolean()));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_NOT_REGISTERED");
      }
    });

    it("should map OPERATION_FAILED with lowercase 'not found' message to SETTING_NOT_REGISTERED", () => {
      const foundryError: FoundryError = createFoundryError("OPERATION_FAILED", "not found");
      vi.mocked(mockFoundrySettings.get).mockReturnValue(err(foundryError));

      const result = adapter.get("my-module", "enabled", toValidationSchema(v.boolean()));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_NOT_REGISTERED");
      }
    });

    it("should map OPERATION_FAILED without 'not registered' message to SETTING_VALIDATION_FAILED", () => {
      const foundryError: FoundryError = createFoundryError(
        "OPERATION_FAILED",
        "Some other error occurred"
      );
      vi.mocked(mockFoundrySettings.get).mockReturnValue(err(foundryError));

      const result = adapter.get("my-module", "enabled", toValidationSchema(v.boolean()));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_VALIDATION_FAILED");
      }
    });

    it("should map unknown error code to SETTING_VALIDATION_FAILED for get", () => {
      const foundryError: FoundryError = {
        code: "NOT_FOUND" as any,
        message: "Unknown error",
      };
      vi.mocked(mockFoundrySettings.get).mockReturnValue(err(foundryError));

      const result = adapter.get("my-module", "enabled", toValidationSchema(v.boolean()));

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_VALIDATION_FAILED");
      }
    });

    it("should accept any ValidationSchema implementation (LSP compliance)", () => {
      const customSchema: ValidationSchema<boolean> = {
        validate: (value: unknown) => {
          if (typeof value === "boolean") {
            return { ok: true, value };
          }
          return {
            ok: false,
            error: {
              code: "SETTING_VALIDATION_FAILED",
              message: "Value is not a boolean",
            },
          };
        },
      };

      // Mock FoundrySettings to return a boolean value
      vi.mocked(mockFoundrySettings.get).mockReturnValue({
        ok: true,
        value: true,
      });

      const result = adapter.get("my-module", "enabled", customSchema);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should return validation error from custom ValidationSchema", () => {
      const customSchema: ValidationSchema<boolean> = {
        validate: (value: unknown) => {
          if (typeof value === "boolean") {
            return { ok: true, value };
          }
          return {
            ok: false,
            error: {
              code: "SETTING_VALIDATION_FAILED",
              message: "Value is not a boolean",
            },
          };
        },
      };

      // Mock FoundrySettings to return a non-boolean value
      vi.mocked(mockFoundrySettings.get).mockReturnValue({
        ok: true,
        value: "not a boolean",
      });

      const result = adapter.get("my-module", "enabled", customSchema);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_VALIDATION_FAILED");
        expect(result.error.message).toBe("Value is not a boolean");
      }
    });
  });

  describe("set", () => {
    it("should set setting value in Foundry", async () => {
      vi.mocked(mockFoundrySettings.set).mockResolvedValue({
        ok: true,
        value: undefined,
      });

      const result = await adapter.set("my-module", "enabled", false);

      expect(result.ok).toBe(true);
      expect(mockFoundrySettings.set).toHaveBeenCalledWith("my-module", "enabled", false);
    });

    it("should return error on failure", async () => {
      const foundryError: FoundryError = createFoundryError("OPERATION_FAILED", "Set failed");
      vi.mocked(mockFoundrySettings.set).mockResolvedValue(err(foundryError));

      const result = await adapter.set("my-module", "enabled", false);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain("Failed to set setting");
      }
    });

    it("should map API_NOT_AVAILABLE to PLATFORM_NOT_AVAILABLE", async () => {
      const foundryError: FoundryError = createFoundryError(
        "API_NOT_AVAILABLE",
        "API not available"
      );
      vi.mocked(mockFoundrySettings.set).mockResolvedValue(err(foundryError));

      const result = await adapter.set("my-module", "enabled", false);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("PLATFORM_NOT_AVAILABLE");
      }
    });

    it("should map OPERATION_FAILED with 'not registered' message to SETTING_NOT_REGISTERED", async () => {
      const foundryError: FoundryError = createFoundryError(
        "OPERATION_FAILED",
        "Setting is not registered"
      );
      vi.mocked(mockFoundrySettings.set).mockResolvedValue(err(foundryError));

      const result = await adapter.set("my-module", "enabled", false);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_NOT_REGISTERED");
      }
    });

    it("should map OPERATION_FAILED with lowercase 'not registered' message to SETTING_NOT_REGISTERED for set", async () => {
      const foundryError: FoundryError = createFoundryError("OPERATION_FAILED", "not registered");
      vi.mocked(mockFoundrySettings.set).mockResolvedValue(err(foundryError));

      const result = await adapter.set("my-module", "enabled", false);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_NOT_REGISTERED");
      }
    });

    it("should map OPERATION_FAILED with 'not found' message to SETTING_NOT_REGISTERED", async () => {
      const foundryError: FoundryError = createFoundryError(
        "OPERATION_FAILED",
        "Setting not found"
      );
      vi.mocked(mockFoundrySettings.set).mockResolvedValue(err(foundryError));

      const result = await adapter.set("my-module", "enabled", false);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_NOT_REGISTERED");
      }
    });

    it("should map OPERATION_FAILED with lowercase 'not found' message to SETTING_NOT_REGISTERED for set", async () => {
      const foundryError: FoundryError = createFoundryError("OPERATION_FAILED", "not found");
      vi.mocked(mockFoundrySettings.set).mockResolvedValue(err(foundryError));

      const result = await adapter.set("my-module", "enabled", false);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_NOT_REGISTERED");
      }
    });

    it("should map OPERATION_FAILED without 'not registered' message to SETTING_VALIDATION_FAILED", async () => {
      const foundryError: FoundryError = createFoundryError(
        "OPERATION_FAILED",
        "Some other error occurred"
      );
      vi.mocked(mockFoundrySettings.set).mockResolvedValue(err(foundryError));

      const result = await adapter.set("my-module", "enabled", false);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_VALIDATION_FAILED");
      }
    });

    it("should map unknown error code to SETTING_VALIDATION_FAILED for set", async () => {
      const foundryError: FoundryError = {
        code: "NOT_FOUND" as any,
        message: "Unknown error",
      };
      vi.mocked(mockFoundrySettings.set).mockResolvedValue(err(foundryError));

      const result = await adapter.set("my-module", "enabled", false);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("SETTING_VALIDATION_FAILED");
      }
    });
  });

  describe("DIFoundrySettingsAdapter", () => {
    it("should extend FoundrySettingsAdapter and initialize correctly", () => {
      const mockFoundrySettings: FoundrySettings = {
        register: vi.fn().mockReturnValue({ ok: true, value: undefined }),
        get: vi.fn().mockReturnValue({ ok: true, value: true }),
        set: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
        dispose: vi.fn(),
      } as unknown as FoundrySettings;

      const typeMapper = new FoundrySettingTypeMapper();
      const errorMapper = new FoundrySettingsErrorMapper();
      const diAdapter = new DIFoundrySettingsAdapter(mockFoundrySettings, typeMapper, errorMapper);

      expect(diAdapter).toBeInstanceOf(FoundrySettingsAdapter);
      expect(DIFoundrySettingsAdapter.dependencies).toHaveLength(3);
    });

    it("should work like FoundrySettingsAdapter", async () => {
      const mockFoundrySettings: FoundrySettings = {
        register: vi.fn().mockReturnValue({ ok: true, value: undefined }),
        get: vi.fn().mockReturnValue({ ok: true, value: "test" }),
        set: vi.fn().mockResolvedValue({ ok: true, value: undefined }),
        dispose: vi.fn(),
      } as unknown as FoundrySettings;

      const typeMapper = new FoundrySettingTypeMapper();
      const errorMapper = new FoundrySettingsErrorMapper();
      const diAdapter = new DIFoundrySettingsAdapter(mockFoundrySettings, typeMapper, errorMapper);

      const registerResult = diAdapter.register("test", "key", {
        name: "Test",
        scope: "world",
        config: true,
        type: String,
        default: "",
      });

      expect(registerResult.ok).toBe(true);

      const getResult = diAdapter.get("test", "key", toValidationSchema(v.string()));
      expect(getResult.ok).toBe(true);

      const setResult = await diAdapter.set("test", "key", "new value");
      expect(setResult.ok).toBe(true);
    });
  });
});
