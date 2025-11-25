import { describe, it, expect } from "vitest";
import { SettingValidators } from "@/domain/types/settings";

describe("SettingValidators", () => {
  it("validates boolean values", () => {
    expect(SettingValidators.boolean(true)).toBe(true);
    expect(SettingValidators.boolean("true")).toBe(false);
  });

  it("validates numbers and rejects NaN", () => {
    expect(SettingValidators.number(5)).toBe(true);
    expect(SettingValidators.number(Number.NaN)).toBe(false);
    expect(SettingValidators.number("5")).toBe(false);
  });

  it("validates non-negative numbers", () => {
    expect(SettingValidators.nonNegativeNumber(0)).toBe(true);
    expect(SettingValidators.nonNegativeNumber(-1)).toBe(false);
  });

  it("validates non-negative integers", () => {
    expect(SettingValidators.nonNegativeInteger(10)).toBe(true);
    expect(SettingValidators.nonNegativeInteger(1.5)).toBe(false);
    expect(SettingValidators.nonNegativeInteger(-2)).toBe(false);
  });

  it("validates string variants", () => {
    expect(SettingValidators.string("demo")).toBe(true);
    expect(SettingValidators.string(42)).toBe(false);

    expect(SettingValidators.nonEmptyString("x")).toBe(true);
    expect(SettingValidators.nonEmptyString("")).toBe(false);
  });

  it("validates sampling rate range", () => {
    expect(SettingValidators.samplingRate(0)).toBe(true);
    expect(SettingValidators.samplingRate(1)).toBe(true);
    expect(SettingValidators.samplingRate(1.1)).toBe(false);
  });

  it("validates enum values via oneOf", () => {
    const validator = SettingValidators.oneOf(["a", "b"] as const);
    expect(validator("a")).toBe(true);
    expect(validator("c")).toBe(false);
    // Test non-string/non-number values
    expect(validator(null)).toBe(false);
    expect(validator({})).toBe(false);
  });
});
