import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FoundryV13SettingsPort } from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13SettingsPort";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { SettingConfig } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import * as v from "valibot";

describe("FoundryV13SettingsPort", () => {
  let port: FoundryV13SettingsPort;

  beforeEach(() => {
    port = new FoundryV13SettingsPort();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("register()", () => {
    it("should register setting successfully", () => {
      const mockRegister = vi.fn();
      vi.stubGlobal("game", {
        settings: {
          register: mockRegister,
          get: vi.fn(),
          set: vi.fn(),
        },
      });

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
      expect(mockRegister).toHaveBeenCalledWith("test-module", "testKey", config);
    });

    it("should handle onChange callback", () => {
      const mockRegister = vi.fn();
      const onChangeSpy = vi.fn();

      vi.stubGlobal("game", {
        settings: {
          register: mockRegister,
          get: vi.fn(),
          set: vi.fn(),
        },
      });

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
      expect(mockRegister).toHaveBeenCalledWith("test-module", "testKey", config);
    });

    it("should return error when game.settings not available", () => {
      vi.stubGlobal("game", undefined);

      const config: SettingConfig<boolean> = {
        name: "Test",
        scope: "world",
        config: true,
        type: Boolean,
        default: false,
      };

      const result = port.register("test-module", "testKey", config);

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("settings API not available");
    });

    it("should handle registration errors", () => {
      const mockRegister = vi.fn(() => {
        throw new Error("Registration failed");
      });

      vi.stubGlobal("game", {
        settings: {
          register: mockRegister,
          get: vi.fn(),
          set: vi.fn(),
        },
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
      vi.stubGlobal("game", {
        settings: {
          register: vi.fn(),
          get: vi.fn(),
          set: vi.fn(),
        },
      });

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

    it("should propagate errors from castFoundrySettingsApi when settings object is invalid", () => {
      // game.settings exists but doesn't have required methods
      vi.stubGlobal("game", {
        settings: {
          // Missing register, get, set methods
        },
      });

      const config: SettingConfig<number> = {
        name: "Test",
        scope: "world",
        config: true,
        type: Number,
        default: 0,
      };

      const result = port.register("test-module", "testKey", config);

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("required methods");
    });
  });

  describe("get()", () => {
    it("should get setting value successfully with schema validation", () => {
      const mockGet = vi.fn().mockReturnValue(123);
      vi.stubGlobal("game", {
        settings: {
          register: vi.fn(),
          get: mockGet,
          set: vi.fn(),
        },
      });

      const result = port.get("test-module", "testKey", v.number());

      expectResultOk(result);
      expect(result.value).toBe(123);
      expect(mockGet).toHaveBeenCalledWith("test-module", "testKey");
    });

    it("should return error when game.settings not available", () => {
      vi.stubGlobal("game", undefined);

      const result = port.get("test-module", "testKey", v.number());

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
    });

    it("should handle get errors", () => {
      const mockGet = vi.fn(() => {
        throw new Error("Get failed");
      });

      vi.stubGlobal("game", {
        settings: {
          register: vi.fn(),
          get: mockGet,
          set: vi.fn(),
        },
      });

      const result = port.get("test-module", "testKey", v.string());

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get setting");
    });

    it("should validate setting value and return error if validation fails", () => {
      const mockGet = vi.fn(() => "invalid");
      vi.stubGlobal("game", {
        settings: {
          register: vi.fn(),
          get: mockGet,
          set: vi.fn(),
        },
      });

      const result = port.get("test-module", "testKey", v.number());

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
      expect(result.error.message).toContain("failed validation");
    });

    it("should accept valid enum values", () => {
      const mockGet = vi.fn(() => 1);
      vi.stubGlobal("game", {
        settings: {
          register: vi.fn(),
          get: mockGet,
          set: vi.fn(),
        },
      });

      const result = port.get("test-module", "logLevel", v.picklist([0, 1, 2, 3]));

      expectResultOk(result);
      expect(result.value).toBe(1);
    });

    it("should reject invalid enum values", () => {
      const mockGet = vi.fn(() => 999);
      vi.stubGlobal("game", {
        settings: {
          register: vi.fn(),
          get: mockGet,
          set: vi.fn(),
        },
      });

      const result = port.get("test-module", "logLevel", v.picklist([0, 1, 2, 3]));

      expectResultErr(result);
      expect(result.error.code).toBe("VALIDATION_FAILED");
    });

    it("should propagate errors from castFoundrySettingsApi when settings object is invalid", () => {
      // game.settings exists but doesn't have required methods
      vi.stubGlobal("game", {
        settings: {
          // Missing register, get, set methods
        },
      });

      const result = port.get("test-module", "testKey", v.number());

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("required methods");
    });
  });

  describe("set()", () => {
    it("should set setting value successfully", async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("game", {
        settings: {
          register: vi.fn(),
          get: vi.fn(),
          set: mockSet,
        },
      });

      const result = await port.set("test-module", "testKey", 456);

      expectResultOk(result);
      expect(mockSet).toHaveBeenCalledWith("test-module", "testKey", 456);
    });

    it("should return error when game.settings not available", async () => {
      vi.stubGlobal("game", undefined);

      const result = await port.set("test-module", "testKey", "value");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
    });

    it("should handle set errors", async () => {
      const mockSet = vi.fn().mockRejectedValue(new Error("Set failed"));

      vi.stubGlobal("game", {
        settings: {
          register: vi.fn(),
          get: vi.fn(),
          set: mockSet,
        },
      });

      const result = await port.set("test-module", "testKey", true);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to set setting");
    });

    it("should propagate errors from castFoundrySettingsApi when settings object is invalid", async () => {
      // game.settings exists but doesn't have required methods
      vi.stubGlobal("game", {
        settings: {
          // Missing register, get, set methods
        },
      });

      const result = await port.set("test-module", "testKey", "value");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
      expect(result.error.message).toContain("required methods");
    });
  });

  describe("Scope Support", () => {
    it("should support world scope", () => {
      const mockRegister = vi.fn();
      vi.stubGlobal("game", {
        settings: {
          register: mockRegister,
          get: vi.fn(),
          set: vi.fn(),
        },
      });

      const config: SettingConfig<number> = {
        name: "World Setting",
        scope: "world",
        config: true,
        type: Number,
        default: 1,
      };

      port.register("mod", "key", config);
      expect(mockRegister).toHaveBeenCalled();
    });

    it("should support client scope", () => {
      const mockRegister = vi.fn();
      vi.stubGlobal("game", {
        settings: {
          register: mockRegister,
          get: vi.fn(),
          set: vi.fn(),
        },
      });

      const config: SettingConfig<number> = {
        name: "Client Setting",
        scope: "client",
        config: true,
        type: Number,
        default: 1,
      };

      port.register("mod", "key", config);
      expect(mockRegister).toHaveBeenCalled();
    });

    it("should support user scope (v13+)", () => {
      const mockRegister = vi.fn();
      vi.stubGlobal("game", {
        settings: {
          register: mockRegister,
          get: vi.fn(),
          set: vi.fn(),
        },
      });

      const config: SettingConfig<number> = {
        name: "User Setting",
        scope: "user",
        config: true,
        type: Number,
        default: 1,
      };

      port.register("mod", "key", config);
      expect(mockRegister).toHaveBeenCalled();
    });
  });

  describe("disposed state guards", () => {
    beforeEach(() => {
      vi.stubGlobal("game", {
        settings: {
          register: vi.fn(),
          get: vi.fn().mockReturnValue("value"),
          set: vi.fn().mockResolvedValue("value"),
        },
      });
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
