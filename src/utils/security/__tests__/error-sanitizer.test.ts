import { describe, it, expect } from "vitest";
import {
  sanitizeErrorForProduction,
  sanitizeMessageForProduction,
} from "@/utils/security/error-sanitizer";
import type { ContainerError } from "@/di_infrastructure/interfaces/containererror";
import type { EnvironmentConfig } from "@/config/environment";
import { LogLevel } from "@/config/environment";

describe("Error Sanitizer", () => {
  describe("sanitizeErrorForProduction", () => {
    it("should return full error in development mode", () => {
      const devEnv: EnvironmentConfig = {
        isDevelopment: true,
        isProduction: false,
        logLevel: LogLevel.DEBUG,
        enablePerformanceTracking: false,
        enableDebugMode: true,
        enableMetricsPersistence: false,
        metricsPersistenceKey: "test.metrics",
        performanceSamplingRate: 1.0,
      };

      const error: ContainerError = {
        code: "TokenNotRegistered",
        message: "Service not found: UserService",
        tokenDescription: "Symbol(UserService)",
        cause: new Error("Root cause"),
      };

      const sanitized = sanitizeErrorForProduction(devEnv, error);

      expect(sanitized).toEqual(error);
      expect(sanitized.tokenDescription).toBe("Symbol(UserService)");
      expect(sanitized.cause).toBeInstanceOf(Error);
    });

    it("should strip sensitive info in production mode", () => {
      const prodEnv: EnvironmentConfig = {
        isDevelopment: false,
        isProduction: true,
        logLevel: LogLevel.INFO,
        enablePerformanceTracking: false,
        enableDebugMode: false,
        enableMetricsPersistence: false,
        metricsPersistenceKey: "test.metrics",
        performanceSamplingRate: 0.01,
      };

      const error: ContainerError = {
        code: "TokenNotRegistered",
        message: "Service not found: UserService",
        tokenDescription: "Symbol(UserService)",
        cause: new Error("Root cause"),
      };

      const sanitized = sanitizeErrorForProduction(prodEnv, error);

      expect(sanitized.code).toBe("TokenNotRegistered");
      expect(sanitized.message).toBe(
        "An internal error occurred. Please contact support if this persists."
      );
      expect(sanitized.tokenDescription).toBeUndefined();
      expect(sanitized.cause).toBeUndefined();
    });

    it("should preserve error code in production", () => {
      const prodEnv: EnvironmentConfig = {
        isDevelopment: false,
        isProduction: true,
        logLevel: LogLevel.INFO,
        enablePerformanceTracking: false,
        enableDebugMode: false,
        enableMetricsPersistence: false,
        metricsPersistenceKey: "test.metrics",
        performanceSamplingRate: 0.01,
      };

      const error: ContainerError = {
        code: "CircularDependency",
        message: "A depends on B depends on A",
      };

      const sanitized = sanitizeErrorForProduction(prodEnv, error);

      expect(sanitized.code).toBe("CircularDependency");
    });
  });

  describe("sanitizeMessageForProduction", () => {
    it("should return full message in development", () => {
      const devEnv: EnvironmentConfig = {
        isDevelopment: true,
        isProduction: false,
        logLevel: LogLevel.DEBUG,
        enablePerformanceTracking: false,
        enableDebugMode: true,
        enableMetricsPersistence: false,
        metricsPersistenceKey: "test.metrics",
        performanceSamplingRate: 1.0,
      };

      const message = "Detailed error: Failed to connect to database at localhost:5432";
      const sanitized = sanitizeMessageForProduction(devEnv, message);

      expect(sanitized).toBe(message);
    });

    it("should return generic message in production", () => {
      const prodEnv: EnvironmentConfig = {
        isDevelopment: false,
        isProduction: true,
        logLevel: LogLevel.INFO,
        enablePerformanceTracking: false,
        enableDebugMode: false,
        enableMetricsPersistence: false,
        metricsPersistenceKey: "test.metrics",
        performanceSamplingRate: 0.01,
      };

      const message = "Sensitive internal error with stack trace...";
      const sanitized = sanitizeMessageForProduction(prodEnv, message);

      expect(sanitized).toBe("An error occurred");
    });
  });
});
