import { describe, it, expect } from "vitest";
import {
  sanitizeErrorForProduction,
  sanitizeMessageForProduction,
} from "@/infrastructure/shared/utils/error-sanitizer";
import type { ContainerError } from "@/infrastructure/di/interfaces";
import { LogLevel } from "@/domain/types/log-level";
import { createMockRuntimeConfig } from "@/test/utils/test-helpers";

describe("Error Sanitizer", () => {
  describe("sanitizeErrorForProduction", () => {
    it("should return full error in development mode", () => {
      const devConfig = createMockRuntimeConfig({
        enablePerformanceTracking: false,
      });

      const error: ContainerError = {
        code: "TokenNotRegistered",
        message: "Service not found: UserService",
        tokenDescription: "Symbol(UserService)",
        cause: new Error("Root cause"),
      };

      const sanitized = sanitizeErrorForProduction(devConfig, error);

      expect(sanitized).toEqual(error);
      expect(sanitized.tokenDescription).toBe("Symbol(UserService)");
      expect(sanitized.cause).toBeInstanceOf(Error);
    });

    it("should strip sensitive info in production mode", () => {
      const prodConfig = createMockRuntimeConfig({
        isDevelopment: false,
        isProduction: true,
        logLevel: LogLevel.INFO,
        enablePerformanceTracking: false,
        performanceSamplingRate: 0.01,
      });

      const error: ContainerError = {
        code: "TokenNotRegistered",
        message: "Service not found: UserService",
        tokenDescription: "Symbol(UserService)",
        cause: new Error("Root cause"),
      };

      const sanitized = sanitizeErrorForProduction(prodConfig, error);

      expect(sanitized.code).toBe("TokenNotRegistered");
      expect(sanitized.message).toBe(
        "An internal error occurred. Please contact support if this persists."
      );
      expect(sanitized.tokenDescription).toBeUndefined();
      expect(sanitized.cause).toBeUndefined();
    });

    it("should preserve error code in production", () => {
      const prodConfig = createMockRuntimeConfig({
        isDevelopment: false,
        isProduction: true,
        logLevel: LogLevel.INFO,
        enablePerformanceTracking: false,
        performanceSamplingRate: 0.01,
      });

      const error: ContainerError = {
        code: "CircularDependency",
        message: "A depends on B depends on A",
      };

      const sanitized = sanitizeErrorForProduction(prodConfig, error);

      expect(sanitized.code).toBe("CircularDependency");
    });
  });

  describe("sanitizeMessageForProduction", () => {
    it("should return full message in development", () => {
      const devConfig = createMockRuntimeConfig({
        enablePerformanceTracking: false,
      });

      const message = "Detailed error: Failed to connect to database at localhost:5432";
      const sanitized = sanitizeMessageForProduction(devConfig, message);

      expect(sanitized).toBe(message);
    });

    it("should return generic message in production", () => {
      const prodConfig = createMockRuntimeConfig({
        isDevelopment: false,
        isProduction: true,
        logLevel: LogLevel.INFO,
        enablePerformanceTracking: false,
        performanceSamplingRate: 0.01,
      });

      const message = "Sensitive internal error with stack trace...";
      const sanitized = sanitizeMessageForProduction(prodConfig, message);

      expect(sanitized).toBe("An error occurred");
    });
  });
});
