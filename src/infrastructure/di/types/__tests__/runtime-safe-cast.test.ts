import { describe, it, expect } from "vitest";
import {
  getRegistrationStatus,
  castCachedServiceInstanceForResult,
} from "@/infrastructure/di/types";
import { ok, err } from "@/domain/utils/result";
import type { ContainerError } from "@/infrastructure/di/interfaces";
import { expectResultOk, expectResultErr } from "@/test/utils/test-helpers";
import type { Logger } from "@/infrastructure/logging/logger.interface";

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

describe("castCachedServiceInstanceForResult", () => {
  it("should return ok with instance when instance is defined", () => {
    // Use Logger as a ServiceType for testing
    const instance: Logger = {
      log: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
    };
    const result = castCachedServiceInstanceForResult<Logger>(instance);

    expectResultOk(result);
    expect(result.value).toBe(instance);
  });

  it("should return err with ContainerError when instance is undefined", () => {
    const result = castCachedServiceInstanceForResult(undefined);

    expectResultErr(result);
    expect(result.error.code).toBe("TokenNotRegistered");
    expect(result.error.message).toContain("instance must not be undefined");
  });

  it("should preserve instance type when casting", () => {
    const instance: Logger = {
      log: () => {},
      error: () => {},
      warn: () => {},
      info: () => {},
      debug: () => {},
    };
    const result = castCachedServiceInstanceForResult<Logger>(instance);

    expectResultOk(result);
    expect(result.value).toBe(instance);
    expect(typeof result.value.log).toBe("function");
  });
});
