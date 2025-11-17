import { describe, it, expect } from "vitest";
import { getRegistrationStatus } from "../runtime-safe-cast";
import { ok, err } from "@/utils/functional/result";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";

describe("getRegistrationStatus", () => {
  it("should return true when result is ok with value true", () => {
    const result = ok(true);
    expect(getRegistrationStatus(result)).toBe(true);
  });

  it("should return false when result is ok with value false", () => {
    const result = ok(false);
    expect(getRegistrationStatus(result)).toBe(false);
  });

  it("should return false when result is error", () => {
    const error: ContainerError = {
      code: "TokenNotRegistered",
      message: "Token not found",
      tokenDescription: "testToken",
    };
    const result = err(error);
    expect(getRegistrationStatus(result)).toBe(false);
  });
});
