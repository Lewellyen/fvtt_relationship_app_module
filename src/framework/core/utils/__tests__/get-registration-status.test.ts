import { describe, it, expect } from "vitest";
import { getRegistrationStatus } from "../get-registration-status";
import { ok, err } from "@/domain/utils/result";

describe("getRegistrationStatus", () => {
  it("should return true when ok(true)", () => {
    expect(getRegistrationStatus(ok(true))).toBe(true);
  });

  it("should return false when ok(false)", () => {
    expect(getRegistrationStatus(ok(false))).toBe(false);
  });

  it("should return false on error", () => {
    expect(getRegistrationStatus(err({ code: "TokenNotRegistered", message: "nope" }))).toBe(false);
  });
});
