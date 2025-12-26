import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  FoundryV13SettingsPort,
  createFoundryV13SettingsPort,
} from "@/infrastructure/adapters/foundry/ports/v13/FoundryV13SettingsPort";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { SettingConfig } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";
import * as v from "valibot";

describe("createFoundryV13SettingsPort factory", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should create port with error-throwing API when game is undefined", () => {
    // @ts-expect-error - intentionally undefined for test
    global.game = undefined;

    const port = createFoundryV13SettingsPort();
    expect(port).toBeInstanceOf(FoundryV13SettingsPort);

    // Should return API_NOT_AVAILABLE error
    const result = port.register("test", "key", {
      name: "Test",
      scope: "world",
      config: true,
      type: String,
      default: "",
    });
    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should create port with error-throwing API when game is null", () => {
    // Test the second condition in the OR (game === null without typeof game === "undefined")
    // @ts-expect-error - intentionally null for test
    global.game = null;

    const port = createFoundryV13SettingsPort();
    expect(port).toBeInstanceOf(FoundryV13SettingsPort);

    // Should return API_NOT_AVAILABLE error
    const result = port.register("test", "key", {
      name: "Test",
      scope: "world",
      config: true,
      type: String,
      default: "",
    });
    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should create port with error-throwing API when game.settings is missing", () => {
    // @ts-expect-error - intentionally missing settings for test
    global.game = {};

    const port = createFoundryV13SettingsPort();
    const result = port.register("test", "key", {
      name: "Test",
      scope: "world",
      config: true,
      type: String,
      default: "",
    });

    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should create port with error-throwing API when game.settings is explicitly undefined", () => {
    // Test the third condition in the OR (game.settings === undefined without game === null)
    // @ts-expect-error - intentionally undefined settings for test
    global.game = {
      settings: undefined,
    };

    const port = createFoundryV13SettingsPort();
    const result = port.register("test", "key", {
      name: "Test",
      scope: "world",
      config: true,
      type: String,
      default: "",
    });

    expectResultErr(result);
    expect(result.error.code).toBe("API_NOT_AVAILABLE");
  });

  it("should create port with error-throwing API when castFoundrySettingsApi fails", () => {
    // Mock game.settings with invalid structure that will fail castFoundrySettingsApi
    // Using an object missing required methods instead of null to avoid the undefined check
    // @ts-expect-error - intentionally invalid structure for test
    global.game = {
      settings: {
        // Missing register, get, and set methods - will fail castFoundrySettingsApi
      },
    };

    const port = createFoundryV13SettingsPort();
    expect(port).toBeInstanceOf(FoundryV13SettingsPort);

    // The port should propagate the cast error when register is called
    const registerResult = port.register("test", "key", {
      name: "Test",
      scope: "world",
      config: true,
      type: String,
      default: "",
    });

    // Should return OPERATION_FAILED because the API throws the cast error
    expectResultErr(registerResult);
    expect(registerResult.error.code).toBe("OPERATION_FAILED");

    // Test that get also propagates the cast error
    const getResult = port.get("test", "key", v.string());
    expectResultErr(getResult);
    expect(getResult.error.code).toBe("OPERATION_FAILED");

    // Test that set also propagates the cast error
    return port.set("test", "key", "value").then((setResult) => {
      expectResultErr(setResult);
      expect(setResult.error.code).toBe("OPERATION_FAILED");
    });
  });

  it("should propagate cast error in get when castFoundrySettingsApi fails", () => {
    // Create a port with error-throwing API directly to test get method
    const castError = createFoundryError(
      "API_NOT_AVAILABLE",
      "game.settings does not have required methods (register, get, set)",
      { missingMethods: ["register", "get", "set"] }
    );

    const port = new FoundryV13SettingsPort({
      register: () => {
        throw castError;
      },
      get: () => {
        throw castError;
      },
      set: async () => {
        throw castError;
      },
    });

    const getResult = port.get("test", "key", v.string());
    expectResultErr(getResult);
    expect(getResult.error.code).toBe("OPERATION_FAILED");
  });

  it("should propagate cast error in set when castFoundrySettingsApi fails", async () => {
    // Create a port with error-throwing API directly to test set method
    const castError = createFoundryError(
      "API_NOT_AVAILABLE",
      "game.settings does not have required methods (register, get, set)",
      { missingMethods: ["register", "get", "set"] }
    );

    const port = new FoundryV13SettingsPort({
      register: () => {
        throw castError;
      },
      get: () => {
        throw castError;
      },
      set: async () => {
        throw castError;
      },
    });

    const setResult = await port.set("test", "key", "value");
    expectResultErr(setResult);
    expect(setResult.error.code).toBe("OPERATION_FAILED");
  });

  it("should create port successfully when game.settings is valid", () => {
    const mockRegister = vi.fn();
    const mockGet = vi.fn().mockReturnValue("value");
    const mockSet = vi.fn().mockResolvedValue(undefined);

    // @ts-expect-error - intentionally typed for test
    global.game = {
      settings: {
        register: mockRegister,
        get: mockGet,
        set: mockSet,
      },
    };

    const port = createFoundryV13SettingsPort();
    expect(port).toBeInstanceOf(FoundryV13SettingsPort);

    // Test that the port uses the real game.settings API
    const config: SettingConfig<string> = {
      name: "Test",
      scope: "world",
      config: true,
      type: String,
      default: "",
    };

    const result = port.register("test", "key", config);
    expectResultOk(result);
    expect(mockRegister).toHaveBeenCalledWith("test", "key", config);
  });

  it("should use game.settings.set through factory-created port", async () => {
    const mockSet = vi.fn().mockResolvedValue(undefined);

    // @ts-expect-error - intentionally typed for test
    global.game = {
      settings: {
        register: vi.fn(),
        get: vi.fn().mockReturnValue("value"),
        set: mockSet,
      },
    };

    const port = createFoundryV13SettingsPort();
    const result = await port.set("test", "key", "newValue");

    expectResultOk(result);
    expect(mockSet).toHaveBeenCalledWith("test", "key", "newValue");
  });

  it("should use game.settings.get through factory-created port", () => {
    const mockGet = vi.fn().mockReturnValue(42);

    // @ts-expect-error - intentionally typed for test
    global.game = {
      settings: {
        register: vi.fn(),
        get: mockGet,
        set: vi.fn().mockResolvedValue(undefined),
      },
    };

    const port = createFoundryV13SettingsPort();
    const result = port.get("test", "key", v.number());

    expectResultOk(result);
    expect(result.value).toBe(42);
    expect(mockGet).toHaveBeenCalledWith("test", "key");
  });
});
