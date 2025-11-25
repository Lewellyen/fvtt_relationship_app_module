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
  type: Boolean,
  choices: { on: "On", off: "Off" },
  default: true,
  onChange: vi.fn(),
};

describe("FoundrySettingsRegistrationAdapter", () => {
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
