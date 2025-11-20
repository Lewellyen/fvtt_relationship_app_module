import { describe, it, expect } from "vitest";
import { getRegistrationStatus } from "@/infrastructure/di/types";
import { ok, err } from "@/infrastructure/shared/utils/result";
import type { ContainerError } from "@/infrastructure/di/interfaces";

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
