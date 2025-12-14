import { describe, it, expect, beforeEach, vi } from "vitest";
import { FoundryV13SettingsPort } from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13SettingsPort";
import type { IFoundrySettingsAPI } from "@/infrastructure/adapters/foundry/api/foundry-api.interface";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { SettingConfig } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import * as v from "valibot";

describe("FoundryV13SettingsPort", () => {
  let port: FoundryV13SettingsPort;
  let mockAPI: IFoundrySettingsAPI;

  beforeEach(() => {
    mockAPI = {
      register: vi.fn(),
      get: vi.fn() as <T>(namespace: string, key: string) => T | undefined,
      set: vi.fn().mockResolvedValue(undefined),
    };
    port = new FoundryV13SettingsPort(mockAPI);
  });

  describe("register()", () => {
    it("should register setting successfully", () => {
      const config: SettingConfig<number> = {
        name: "Test Setting",
        hint: "A test setting",
        scope: "world",
        config: true,
        type: Number,
        default: 42,
      };

      const result = port.register("test-module", "testKey", config);

      expectResultOk(result);
      expect(mockAPI.register).toHaveBeenCalledWith("test-module", "testKey", config);
    });

    it("should handle onChange callback", () => {
      const onChangeSpy = vi.fn();

      const config: SettingConfig<string> = {
        name: "Test",
        scope: "client",
        config: true,
        type: String,
        default: "default",
        onChange: onChangeSpy,
      };

      const result = port.register("test-module", "testKey", config);

      expectResultOk(result);
      expect(mockAPI.register).toHaveBeenCalledWith("test-module", "testKey", config);
    });

    it("should return error when game.settings not available", () => {
      const portWithoutAPI = new FoundryV13SettingsPort(null as unknown as IFoundrySettingsAPI);

      const config: SettingConfig<boolean> = {
        name: "Test",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
      };

      const result = portWithoutAPI.register("test-module", "testKey", config);

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("settings API not available");
    });

    it("should handle registration errors", () => {
      mockAPI.register = vi.fn(() => {
        throw new Error("Registration failed");
      });

      const config: SettingConfig<number> = {
        name: "Test",
        scope: "user",
        config: true,
        type: Number,
        default: 0,
      };

      const result = port.register("test-module", "testKey", config);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to register setting");
    });

    it("should propagate validation errors from validateSettingConfig", () => {
      // Invalid config: empty namespace
      const config: SettingConfig<number> = {
        name: "Test",
        scope: "world",
        config: true,
        type: Number,
        default: 0,
      };

      const result = port.register("", "testKey", config);

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.message).toContain("Invalid setting namespace");
    });
  });

  describe("get()", () => {
    it("should get setting value successfully with schema validation", () => {
      mockAPI.get = vi.fn().mockReturnValue(123);

      const result = port.get("test-module", "testKey", v.number());

      expectResultOk(result);
      expect(result.value).toBe(123);
      expect(mockAPI.get).toHaveBeenCalledWith("test-module", "testKey");
    });

    it("should return error when game.settings not available", () => {
      const portWithoutAPI = new FoundryV13SettingsPort(null as unknown as IFoundrySettingsAPI);

      const result = portWithoutAPI.get("test-module", "testKey", v.number());

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
    });

    it("should handle get errors", () => {
      mockAPI.get = vi.fn(() => {
        throw new Error("Get failed");
      });

      const result = port.get("test-module", "testKey", v.string());

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get setting");
    });

    it("should validate setting value and return error if validation fails", () => {
      mockAPI.get = vi.fn(() => "invalid") as <T>(namespace: string, key: string) => T | undefined;

      const result = port.get("test-module", "testKey", v.number());

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.message).toContain("failed validation");
    });

    it("should accept valid enum values", () => {
      mockAPI.get = vi.fn(() => 1) as <T>(namespace: string, key: string) => T | undefined;

      const result = port.get("test-module", "logLevel", v.picklist([0, 1, 2, 3]));

      expectResultOk(result);
      expect(result.value).toBe(1);
    });

    it("should reject invalid enum values", () => {
      mockAPI.get = vi.fn(() => 999) as <T>(namespace: string, key: string) => T | undefined;

      const result = port.get("test-module", "logLevel", v.picklist([0, 1, 2, 3]));

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
    });
  });

  describe("set()", () => {
    it("should set setting value successfully", async () => {
      mockAPI.set = vi.fn().mockResolvedValue(undefined);

      const result = await port.set("test-module", "testKey", 456);

      expectResultOk(result);
      expect(mockAPI.set).toHaveBeenCalledWith("test-module", "testKey", 456);
    });

    it("should return error when game.settings not available", async () => {
      const portWithoutAPI = new FoundryV13SettingsPort(null as unknown as IFoundrySettingsAPI);

      const result = await portWithoutAPI.set("test-module", "testKey", "value");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
    });

    it("should handle set errors", async () => {
      mockAPI.set = vi.fn().mockRejectedValue(new Error("Set failed"));

      const result = await port.set("test-module", "testKey", true);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to set setting");
    });

    it("should propagate errors from castFoundrySettingsApi when settings object is invalid", async () => {
      // Port without API
      const portWithoutAPI = new FoundryV13SettingsPort(null as unknown as IFoundrySettingsAPI);

      const result = await portWithoutAPI.set("test-module", "testKey", "value");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("Foundry settings API not available");
    });
  });

  describe("Scope Support", () => {
    it("should support world scope", () => {
      const config: SettingConfig<number> = {
        name: "World Setting",
        scope: "world",
        config: true,
        type: Number,
        default: 1,
      };

      port.register("mod", "key", config);
      expect(mockAPI.register).toHaveBeenCalled();
    });

    it("should support client scope", () => {
      const config: SettingConfig<number> = {
        name: "Client Setting",
        scope: "client",
        config: true,
        type: Number,
        default: 1,
      };

      port.register("mod", "key", config);
      expect(mockAPI.register).toHaveBeenCalled();
    });

    it("should support user scope (v13+)", () => {
      const config: SettingConfig<number> = {
        name: "User Setting",
        scope: "user",
        config: true,
        type: Number,
        default: 1,
      };

      port.register("mod", "key", config);
      expect(mockAPI.register).toHaveBeenCalled();
    });
  });

  describe("disposed state guards", () => {
    beforeEach(() => {
      // Reset mockAPI for disposed state tests
      mockAPI.get = vi.fn().mockReturnValue("value");
      mockAPI.set = vi.fn().mockResolvedValue(undefined);
    });

    it("should prevent register after disposal", () => {
      port.dispose();

      const result = port.register("test", "key", {
        name: "Test",
        scope: "world",
        config: false,
        type: String,
        default: "",
      });

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent get after disposal", () => {
      port.dispose();

      const result = port.get("test", "key", v.string());

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should prevent set after disposal", async () => {
      port.dispose();

      const result = await port.set("test", "key", "value");

      expectResultErr(result);
      expect(result.error.code).toBe("DISPOSED");
    });

    it("should be idempotent", () => {
      port.dispose();
      port.dispose();
      port.dispose();

      const result = port.get("test", "key", v.string());
      expectResultErr(result);
    });
  });
});
