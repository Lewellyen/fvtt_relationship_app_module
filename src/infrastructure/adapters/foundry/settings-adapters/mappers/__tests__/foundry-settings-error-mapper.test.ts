import { describe, it, expect, beforeEach } from "vitest";
import { FoundrySettingsErrorMapper } from "../foundry-settings-error-mapper";
import { createFoundryError } from "@/infrastructure/adapters/foundry/errors/FoundryErrors";

describe("FoundrySettingsErrorMapper", () => {
  let mapper: FoundrySettingsErrorMapper;

  beforeEach(() => {
    mapper = new FoundrySettingsErrorMapper();
  });

  describe("map", () => {
    it("should map API_NOT_AVAILABLE to PLATFORM_NOT_AVAILABLE", () => {
      const foundryError = createFoundryError("API_NOT_AVAILABLE", "API not available");
      const result = mapper.map(foundryError, {
        operation: "register",
        namespace: "my-module",
        key: "enabled",
      });

      expect(result.code).toBe("PLATFORM_NOT_AVAILABLE");
      expect(result.message).toContain("Failed to register setting");
      expect(result.message).toContain("my-module.enabled");
      expect(result.details).toBe(foundryError);
    });

    it("should map VALIDATION_FAILED to INVALID_SETTING_VALUE", () => {
      const foundryError = createFoundryError("VALIDATION_FAILED", "Validation failed");
      const result = mapper.map(foundryError, {
        operation: "get",
        namespace: "my-module",
        key: "value",
      });

      expect(result.code).toBe("INVALID_SETTING_VALUE");
      expect(result.message).toContain("Failed to get setting");
    });

    it("should map OPERATION_FAILED to SETTING_REGISTRATION_FAILED for register operation", () => {
      const foundryError = createFoundryError("OPERATION_FAILED", "Operation failed");
      const result = mapper.map(foundryError, {
        operation: "register",
        namespace: "my-module",
        key: "enabled",
      });

      expect(result.code).toBe("SETTING_REGISTRATION_FAILED");
    });

    it("should map OPERATION_FAILED with 'not registered' message to SETTING_NOT_FOUND for get", () => {
      const foundryError = createFoundryError("OPERATION_FAILED", "Setting is not registered");
      const result = mapper.map(foundryError, {
        operation: "get",
        namespace: "my-module",
        key: "enabled",
      });

      expect(result.code).toBe("SETTING_NOT_FOUND");
    });

    it("should map OPERATION_FAILED with lowercase 'not registered' to SETTING_NOT_FOUND", () => {
      const foundryError = createFoundryError("OPERATION_FAILED", "not registered");
      const result = mapper.map(foundryError, {
        operation: "get",
        namespace: "my-module",
        key: "enabled",
      });

      expect(result.code).toBe("SETTING_NOT_FOUND");
    });

    it("should map OPERATION_FAILED with 'not found' message to SETTING_NOT_FOUND", () => {
      const foundryError = createFoundryError("OPERATION_FAILED", "Setting not found");
      const result = mapper.map(foundryError, {
        operation: "set",
        namespace: "my-module",
        key: "enabled",
      });

      expect(result.code).toBe("SETTING_NOT_FOUND");
    });

    it("should map OPERATION_FAILED without 'not registered' message to SETTING_READ_FAILED for get", () => {
      const foundryError = createFoundryError("OPERATION_FAILED", "Some other error");
      const result = mapper.map(foundryError, {
        operation: "get",
        namespace: "my-module",
        key: "enabled",
      });

      expect(result.code).toBe("SETTING_READ_FAILED");
    });

    it("should map OPERATION_FAILED without 'not registered' message to SETTING_WRITE_FAILED for set", () => {
      const foundryError = createFoundryError("OPERATION_FAILED", "Some other error");
      const result = mapper.map(foundryError, {
        operation: "set",
        namespace: "my-module",
        key: "enabled",
      });

      expect(result.code).toBe("SETTING_WRITE_FAILED");
    });

    it("should map unknown error code to SETTING_REGISTRATION_FAILED for register", () => {
      const foundryError = { code: "UNKNOWN_ERROR" as any, message: "Unknown error" };
      const result = mapper.map(foundryError, {
        operation: "register",
        namespace: "my-module",
        key: "enabled",
      });

      expect(result.code).toBe("SETTING_REGISTRATION_FAILED");
    });

    it("should map unknown error code to SETTING_READ_FAILED for get", () => {
      const foundryError = { code: "UNKNOWN_ERROR" as any, message: "Unknown error" };
      const result = mapper.map(foundryError, {
        operation: "get",
        namespace: "my-module",
        key: "enabled",
      });

      expect(result.code).toBe("SETTING_READ_FAILED");
    });

    it("should map unknown error code to SETTING_WRITE_FAILED for set", () => {
      const foundryError = { code: "UNKNOWN_ERROR" as any, message: "Unknown error" };
      const result = mapper.map(foundryError, {
        operation: "set",
        namespace: "my-module",
        key: "enabled",
      });

      expect(result.code).toBe("SETTING_WRITE_FAILED");
    });

    it("should include namespace and key in error message", () => {
      const foundryError = createFoundryError("OPERATION_FAILED", "Test error");
      const result = mapper.map(foundryError, {
        operation: "register",
        namespace: "test-namespace",
        key: "test-key",
      });

      expect(result.message).toContain("test-namespace.test-key");
      expect(result.message).toContain("Test error");
    });
  });
});
