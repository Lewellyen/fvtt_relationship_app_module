import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FoundrySettingsPortV13 } from "../FoundrySettingsPort";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { SettingConfig } from "@/foundry/interfaces/FoundrySettings";

describe("FoundrySettingsPortV13", () => {
  let port: FoundrySettingsPortV13;

  beforeEach(() => {
    port = new FoundrySettingsPortV13();
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
  });

  describe("get()", () => {
    it("should get setting value successfully", () => {
      const mockGet = vi.fn().mockReturnValue(123);
      vi.stubGlobal("game", {
        settings: {
          get: mockGet,
        },
      });

      const result = port.get<number>("test-module", "testKey");

      expectResultOk(result);
      expect(result.value).toBe(123);
      expect(mockGet).toHaveBeenCalledWith("test-module", "testKey");
    });

    it("should return error when game.settings not available", () => {
      vi.stubGlobal("game", undefined);

      const result = port.get<number>("test-module", "testKey");

      expectResultErr(result);
      expect(result.error.code).toBe("API_NOT_AVAILABLE");
    });

    it("should handle get errors", () => {
      const mockGet = vi.fn(() => {
        throw new Error("Get failed");
      });

      vi.stubGlobal("game", {
        settings: {
          get: mockGet,
        },
      });

      const result = port.get<string>("test-module", "testKey");

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to get setting");
    });
  });

  describe("set()", () => {
    it("should set setting value successfully", async () => {
      const mockSet = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal("game", {
        settings: {
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
          set: mockSet,
        },
      });

      const result = await port.set("test-module", "testKey", true);

      expectResultErr(result);
      expect(result.error.code).toBe("OPERATION_FAILED");
      expect(result.error.message).toContain("Failed to set setting");
    });
  });

  describe("Scope Support", () => {
    it("should support world scope", () => {
      const mockRegister = vi.fn();
      vi.stubGlobal("game", { settings: { register: mockRegister } });

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
      vi.stubGlobal("game", { settings: { register: mockRegister } });

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
      vi.stubGlobal("game", { settings: { register: mockRegister } });

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
});
