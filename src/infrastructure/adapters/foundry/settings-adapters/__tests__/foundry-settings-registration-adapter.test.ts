import { describe, it, expect, vi } from "vitest";
import { FoundrySettingsRegistrationAdapter } from "@/infrastructure/adapters/foundry/settings-adapters/foundry-settings-registration-adapter";
import type { FoundrySettings } from "@/infrastructure/adapters/foundry/interfaces/FoundrySettings";
import type { FoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";

function createFoundrySettingsMock(overrides: Partial<FoundrySettings> = {}): {
  mock: FoundrySettings;
  adapter: FoundrySettingsRegistrationAdapter;
} {
  const base = {
    dispose: vi.fn(),
    register: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  } satisfies Partial<Record<keyof FoundrySettings, unknown>>;

  const mock = { ...base, ...overrides } as FoundrySettings;
  return { mock, adapter: new FoundrySettingsRegistrationAdapter(mock) };
}

function createError(code: FoundryError["code"], message = "error"): FoundryError {
  return { code, message };
}

const baseConfig = {
  name: "Test Setting",
  hint: "Demo",
  scope: "world" as const,
  config: true,
  type: "boolean" as const,
  choices: { on: "On", off: "Off" },
  default: true,
  onChange: vi.fn(),
};

describe("FoundrySettingsRegistrationAdapter", () => {
  it("maps all domain setting types correctly", () => {
    const register = vi.fn().mockReturnValue({ ok: true, value: undefined });
    const { adapter } = createFoundrySettingsMock({ register });

    // Test all three domain types
    adapter.registerSetting("module", "string-setting", {
      ...baseConfig,
      type: "string" as const,
      default: "test",
    });
    adapter.registerSetting("module", "number-setting", {
      ...baseConfig,
      type: "number" as const,
      default: 42,
    });
    adapter.registerSetting("module", "boolean-setting", {
      ...baseConfig,
      type: "boolean" as const,
    });

    expect(register).toHaveBeenCalledTimes(3);

    const call1 = register.mock.calls[0]!;
    const call2 = register.mock.calls[1]!;
    const call3 = register.mock.calls[2]!;

    expect((call1[2] as { type: typeof String }).type).toBe(String);
    expect((call2[2] as { type: typeof Number }).type).toBe(Number);
    expect((call3[2] as { type: typeof Boolean }).type).toBe(Boolean);
  });

  it("throws error for invalid domain setting type (exhaustive check)", () => {
    const register = vi.fn().mockReturnValue({ ok: true, value: undefined });
    const { adapter } = createFoundrySettingsMock({ register });

    // Use type assertion to bypass TypeScript's type checking and test the exhaustive check
    const invalidConfig = {
      ...baseConfig,
      type: "invalid" as any, // Type assertion to test defensive code path
    };

    expect(() => adapter.registerSetting("module", "invalid-setting", invalidConfig)).toThrow(
      "Unknown domain setting type: invalid"
    );
  });
  it("registers settings via Foundry API and maps config fields", () => {
    const register = vi.fn().mockReturnValue({ ok: true, value: undefined });
    const { adapter, mock } = createFoundrySettingsMock({ register });

    const result = adapter.registerSetting("module", "flag", baseConfig);

    expect(result.ok).toBe(true);
    expect(mock.register).toHaveBeenCalledWith("module", "flag", {
      name: "Test Setting",
      hint: "Demo",
      scope: "world",
      config: true,
      type: Boolean,
      choices: { on: "On", off: "Off" },
      default: true,
      onChange: expect.any(Function),
    });
  });

  it("maps register failures to domain errors", () => {
    const register = vi.fn().mockReturnValue({
      ok: false,
      error: createError("OPERATION_FAILED", "db locked"),
    });
    const { adapter } = createFoundrySettingsMock({ register });

    const result = adapter.registerSetting("module", "flag", baseConfig);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SETTING_REGISTRATION_FAILED");
      expect(result.error.message).toContain("flag");
    }
  });

  it("returns setting values when validation succeeds", () => {
    const get = vi.fn().mockReturnValue({ ok: true, value: "info" });
    const { adapter } = createFoundrySettingsMock({ get });

    const result = adapter.getSettingValue(
      "module",
      "level",
      (value): value is string => typeof value === "string"
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("info");
    }
  });

  it("rejects invalid values via validator", () => {
    const get = vi.fn().mockReturnValue({ ok: true, value: 42 });
    const { adapter } = createFoundrySettingsMock({ get });

    const result = adapter.getSettingValue(
      "module",
      "level",
      (value): value is string => typeof value === "string"
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_SETTING_VALUE");
  });

  it("maps read errors from Foundry", () => {
    const get = vi.fn().mockReturnValue({
      ok: false,
      error: createError("OPERATION_FAILED", "not readable"),
    });
    const { adapter } = createFoundrySettingsMock({ get });

    const result = adapter.getSettingValue(
      "module",
      "level",
      (value): value is number => typeof value === "number"
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("SETTING_READ_FAILED");
  });

  it("maps validation failures from Foundry to invalid value errors", () => {
    const get = vi.fn().mockReturnValue({
      ok: false,
      error: createError("VALIDATION_FAILED", "schema mismatch"),
    });
    const { adapter } = createFoundrySettingsMock({ get });

    const result = adapter.getSettingValue(
      "module",
      "level",
      (value): value is number => typeof value === "number"
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("INVALID_SETTING_VALUE");
  });

  it("writes values via Foundry settings API", async () => {
    const set = vi.fn().mockResolvedValue({ ok: true, value: undefined });
    const { adapter } = createFoundrySettingsMock({ set });

    const result = await adapter.setSettingValue("module", "level", 5);

    expect(result.ok).toBe(true);
    expect(set).toHaveBeenCalledWith("module", "level", 5);
  });

  it("maps write failures from Foundry", async () => {
    const set = vi.fn().mockResolvedValue({
      ok: false,
      error: createError("OPERATION_FAILED", "write failed"),
    });
    const { adapter } = createFoundrySettingsMock({ set });

    const result = await adapter.setSettingValue("module", "level", 5);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("SETTING_WRITE_FAILED");
  });

  it("falls back to generic mapping when Foundry error code is unknown", async () => {
    const register = vi.fn().mockReturnValue({
      ok: false,
      error: createError("NOT_FOUND", "missing"),
    });
    const get = vi.fn().mockReturnValue({
      ok: false,
      error: createError("NOT_FOUND", "missing"),
    });
    const set = vi.fn().mockResolvedValue({
      ok: false,
      error: createError("NOT_FOUND", "missing"),
    });
    const { adapter } = createFoundrySettingsMock({ register, get, set });

    const registerResult = adapter.registerSetting("module", "flag", baseConfig);
    const getResult = adapter.getSettingValue(
      "module",
      "flag",
      (value): value is string => typeof value === "string"
    );
    const setResult = await adapter.setSettingValue("module", "flag", "value");

    expect(registerResult.ok).toBe(false);
    if (!registerResult.ok) expect(registerResult.error.code).toBe("SETTING_REGISTRATION_FAILED");
    expect(getResult.ok).toBe(false);
    if (!getResult.ok) expect(getResult.error.code).toBe("SETTING_READ_FAILED");
    expect(setResult.ok).toBe(false);
    if (!setResult.ok) expect(setResult.error.code).toBe("SETTING_WRITE_FAILED");
  });
});
